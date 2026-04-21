import { getServiceSupabase } from "@/lib/supabase";
import { structurizeReport } from "@/lib/structurize";
import { validateReport } from "@/lib/validate-report";
import { scrapeBoat, type ScrapedArticle } from "@/scrapers/index";
import type { Boat } from "@/types";

const MAX_CONCURRENT = 3;

interface BoatScrapeResult {
  boatName: string;
  newReports: number;
  errors: string[];
}

/**
 * 1隻の船に対してスクレイプ→構造化→バリデーション→DB保存を実行する
 */
export async function runScrapeForBoat(
  boat: Boat
): Promise<{ newReports: number; errors: string[] }> {
  const errors: string[] = [];
  let newReports = 0;
  const supabase = getServiceSupabase();

  // スクレイプログ開始
  const logId = await startScrapeLog(supabase, boat.id);

  try {
    console.log(`[pipeline] Scraping ${boat.name} (${boat.source_type})...`);

    // 1. スクレイプ
    const articles = await scrapeBoat(boat);
    console.log(`[pipeline] ${boat.name}: ${articles.length} articles found`);

    if (articles.length === 0) {
      await finishScrapeLog(supabase, logId, "success", 0, 0, null);
      return { newReports: 0, errors };
    }

    // 2. 各記事を処理
    for (const article of articles) {
      try {
        const result = await processArticle(supabase, boat, article);
        if (result === "new") {
          newReports++;
        } else if (result === "skipped") {
          // already exists
        } else if (result === "invalid") {
          errors.push(`${article.url}: validation failed`);
        } else if (result === "not_report") {
          // expected, not an error
        }
      } catch (err) {
        const msg = `${article.url}: ${err instanceof Error ? err.message : String(err)}`;
        console.error(`[pipeline] Error processing article: ${msg}`);
        errors.push(msg);
      }
    }

    await finishScrapeLog(
      supabase,
      logId,
      errors.length > 0 ? "error" : "success",
      articles.length,
      newReports,
      errors.length > 0 ? errors.join("; ") : null
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[pipeline] Fatal error for ${boat.name}: ${msg}`);
    errors.push(msg);
    await finishScrapeLog(supabase, logId, "error", 0, 0, msg);
  }

  return { newReports, errors };
}

/**
 * 1記事を処理する
 * @returns "new" | "skipped" | "invalid" | "not_report"
 */
async function processArticle(
  supabase: ReturnType<typeof getServiceSupabase>,
  boat: Boat,
  article: ScrapedArticle
): Promise<"new" | "skipped" | "invalid" | "not_report"> {
  // 重複チェック
  const { data: existing } = await supabase
    .from("reports")
    .select("id")
    .eq("source_url", article.url)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log(`[pipeline] Skipping duplicate: ${article.url}`);
    return "skipped";
  }

  // テキストが短すぎる場合はスキップ
  if (article.text.length < 20) {
    console.log(`[pipeline] Skipping short article: ${article.url}`);
    return "not_report";
  }

  // Claude API で構造化
  console.log(`[pipeline] Structurizing: ${article.url}`);
  const structured = await structurizeReport(article.text);
  console.log(`[pipeline] Structured result: status=${structured.status}, confidence=${structured.confidence}`);

  // キャンセルや非レポートはスキップ
  if (structured.status === "cancelled" || structured.status === "not_report") {
    console.log(`[pipeline] Skipping ${structured.status}: ${article.url}`);
    return "not_report";
  }

  // バリデーション
  const validation = validateReport(structured);
  if (!validation.valid) {
    console.log(
      `[pipeline] Validation failed for ${article.url}: ${validation.errors.join(", ")}`
    );
    return "invalid";
  }

  // 日付: 構造化結果 > 記事日付 > 今日
  const publishedAt =
    structured.date || article.date || new Date().toISOString().slice(0, 10);

  // DB保存
  const { error: insertError } = await supabase.from("reports").insert({
    boat_id: boat.id,
    source_url: article.url,
    source_type: boat.source_type,
    published_at: publishedAt,
    scraped_at: new Date().toISOString(),
    method: structured.method,
    fish: structured.fish,
    summary: structured.summary,
    raw_text: article.text,
    weather: structured.weather,
    sea_condition: structured.sea_condition,
    photos: article.images,
    photo_count: article.images.length,
    ai_confidence: structured.confidence,
    is_published: true,
  });

  if (insertError) {
    throw new Error(`DB insert failed: ${insertError.message}`);
  }

  console.log(`[pipeline] Inserted new report: ${article.url}`);
  return "new";
}

/**
 * 全アクティブ船をスクレイプする
 */
export async function runFullScrape(): Promise<{
  total: number;
  results: BoatScrapeResult[];
  errors: string[];
}> {
  const supabase = getServiceSupabase();

  // アクティブな船を全取得
  const { data: boats, error } = await supabase
    .from("boats")
    .select("*")
    .eq("is_active", true);

  if (error) {
    throw new Error(`Failed to fetch boats: ${error.message}`);
  }

  if (!boats || boats.length === 0) {
    return { total: 0, results: [], errors: ["No active boats found"] };
  }

  console.log(`[pipeline] Starting full scrape for ${boats.length} boats`);

  const results: BoatScrapeResult[] = [];
  const allErrors: string[] = [];
  let totalNew = 0;

  // 最大3並列でスクレイプ
  const chunks = chunkArray(boats as Boat[], MAX_CONCURRENT);

  for (const chunk of chunks) {
    const settled = await Promise.allSettled(
      chunk.map(async (boat) => {
        const result = await runScrapeForBoat(boat);
        return { boatName: boat.name, ...result };
      })
    );

    for (const result of settled) {
      if (result.status === "fulfilled") {
        results.push(result.value);
        totalNew += result.value.newReports;
        allErrors.push(...result.value.errors);
      } else {
        const errMsg = result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
        allErrors.push(errMsg);
        results.push({ boatName: "unknown", newReports: 0, errors: [errMsg] });
      }
    }
  }

  console.log(
    `[pipeline] Full scrape complete: ${totalNew} new reports, ${allErrors.length} errors`
  );

  return { total: totalNew, results, errors: allErrors };
}

// --- Helper functions ---

async function startScrapeLog(
  supabase: ReturnType<typeof getServiceSupabase>,
  boatId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("scrape_logs")
      .insert({
        boat_id: boatId,
        started_at: new Date().toISOString(),
        status: "running",
        reports_found: 0,
        reports_new: 0,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`[pipeline] Failed to create scrape log: ${error.message}`);
      return null;
    }
    return data?.id || null;
  } catch (err) {
    console.error(`[pipeline] Failed to create scrape log: ${err}`);
    return null;
  }
}

async function finishScrapeLog(
  supabase: ReturnType<typeof getServiceSupabase>,
  logId: string | null,
  status: "success" | "error",
  reportsFound: number,
  reportsNew: number,
  errorMessage: string | null
): Promise<void> {
  if (!logId) return;
  try {
    await supabase
      .from("scrape_logs")
      .update({
        finished_at: new Date().toISOString(),
        status,
        reports_found: reportsFound,
        reports_new: reportsNew,
        error_message: errorMessage,
      })
      .eq("id", logId);
  } catch (err) {
    console.error(`[pipeline] Failed to update scrape log: ${err}`);
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

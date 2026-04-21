import { type NextRequest } from "next/server";
import { runFullScrape } from "@/lib/scrape-pipeline";

/**
 * POST /api/cron/scrape
 * Vercel Cron または手動呼び出し用。
 * 全アクティブ船のスクレイプを実行する。
 */
export async function POST(request: NextRequest) {
  // 認証: CRON_SECRET ヘッダーまたは Vercel cron ヘッダーを確認
  const cronSecret = request.headers.get("x-cron-secret");
  const vercelCron = request.headers.get("x-vercel-cron");

  if (!vercelCron && (!cronSecret || cronSecret !== process.env.CRON_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[cron/scrape] Starting full scrape...");
    const result = await runFullScrape();
    console.log(
      `[cron/scrape] Complete: ${result.total} new reports, ${result.errors.length} errors`
    );

    return Response.json({
      success: true,
      total_new_reports: result.total,
      boats_processed: result.results.length,
      results: result.results.map((r) => ({
        boat: r.boatName,
        new_reports: r.newReports,
        errors: r.errors,
      })),
      errors: result.errors,
    });
  } catch (err) {
    console.error("[cron/scrape] Fatal error:", err);
    return Response.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/scrape
 * ブラウザからのテスト用。同じ認証チェックを行う。
 */
export async function GET(request: NextRequest) {
  const cronSecret = request.nextUrl.searchParams.get("secret");

  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized — pass ?secret=YOUR_CRON_SECRET" }, { status: 401 });
  }

  try {
    console.log("[cron/scrape] Starting full scrape (GET)...");
    const result = await runFullScrape();

    return Response.json({
      success: true,
      total_new_reports: result.total,
      boats_processed: result.results.length,
      results: result.results.map((r) => ({
        boat: r.boatName,
        new_reports: r.newReports,
        errors: r.errors,
      })),
      errors: result.errors,
    });
  } catch (err) {
    console.error("[cron/scrape] Fatal error:", err);
    return Response.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

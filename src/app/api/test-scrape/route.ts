import { type NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { runScrapeForBoat } from "@/lib/scrape-pipeline";
import { scrapeBoat } from "@/scrapers/index";
import type { Boat } from "@/types";

/**
 * GET /api/test-scrape?boat_name=美丸
 * GET /api/test-scrape?boat_id=xxx
 *
 * 1隻だけテストスクレイプする。
 * スクレイプ結果の記事データと、パイプラインの結果を返す。
 */
export async function GET(request: NextRequest) {
  const boatName = request.nextUrl.searchParams.get("boat_name");
  const boatId = request.nextUrl.searchParams.get("boat_id");
  const scrapeOnly = request.nextUrl.searchParams.get("scrape_only") === "true";

  if (!boatName && !boatId) {
    return Response.json(
      { error: "Query param 'boat_name' or 'boat_id' is required" },
      { status: 400 }
    );
  }

  try {
    const supabase = getServiceSupabase();

    // 船を取得
    let query = supabase.from("boats").select("*");
    if (boatId) {
      query = query.eq("id", boatId);
    } else if (boatName) {
      query = query.eq("name", boatName);
    }

    const { data: boats, error } = await query.limit(1);

    if (error) {
      return Response.json({ error: `DB error: ${error.message}` }, { status: 500 });
    }

    if (!boats || boats.length === 0) {
      return Response.json(
        { error: `Boat not found: ${boatName || boatId}` },
        { status: 404 }
      );
    }

    const boat = boats[0] as Boat;
    console.log(`[test-scrape] Testing: ${boat.name} (${boat.source_type})`);

    // スクレイプのみモード: DB保存なし、スクレイプ結果を返す
    if (scrapeOnly) {
      const articles = await scrapeBoat(boat);
      return Response.json({
        boat: { name: boat.name, source_type: boat.source_type, blog_url: boat.blog_url },
        articles_count: articles.length,
        articles: articles.map((a) => ({
          url: a.url,
          title: a.title,
          text_preview: a.text.slice(0, 200) + (a.text.length > 200 ? "..." : ""),
          text_length: a.text.length,
          images: a.images,
          date: a.date,
        })),
      });
    }

    // フルパイプライン実行（DB保存あり）
    const result = await runScrapeForBoat(boat);

    return Response.json({
      boat: { name: boat.name, source_type: boat.source_type, blog_url: boat.blog_url },
      new_reports: result.newReports,
      errors: result.errors,
    });
  } catch (err) {
    console.error("[test-scrape] Error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

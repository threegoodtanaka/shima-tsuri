import { type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");

  if (!secret || secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: 実際のスクレイピング処理を実装
  // 1. boats テーブルから is_active=true の船を取得
  // 2. 各船のブログをスクレイプ
  // 3. Claude API で構造化
  // 4. バリデーション後に reports テーブルへ INSERT

  return Response.json({ message: "Scrape started" });
}

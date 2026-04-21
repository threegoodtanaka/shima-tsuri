import Anthropic from "@anthropic-ai/sdk";
import type { StructuredReport } from "@/types";

const SYSTEM_PROMPT = `あなたは三重県志摩・南伊勢エリアの遊漁船の釣果ブログを構造化するアシスタントです。
与えられたブログ本文から以下の JSON を返してください。余計なテキストは出力しないでください。

{
  "status": "ok" | "cancelled" | "not_report",
  "date": "YYYY-MM-DD",
  "method": "タイラバ" | "ジギング" | "SLJ" | "ティップラン" | "トンジギ" | "キャスティング" | "イカメタル" | "中深海" | "バチコン" | "ロックフィッシュ",
  "fish": [
    { "name": "マダイ", "count": 12, "max_size": "65cm" }
  ],
  "summary": "1行の要約（40文字以内）",
  "weather": "晴れ / 曇り / 雨 など",
  "sea_condition": "凪 / やや波 / 波高い など",
  "photo_count": 3,
  "confidence": 0.95
}

ルール:
- status が "cancelled"（出船中止）や "not_report"（釣果と無関係）の場合、他フィールドは null / 空配列でよい
- date が不明なら null
- fish 配列の count は船全体の合計匹数。不明なら 0
- max_size が不明なら ""
- confidence は 0〜1 で、情報の確からしさを自己評価
- JSON のみ出力。マークダウンやコードブロックで囲まないこと`;

const client = new Anthropic();

/**
 * ブログ生テキストを Claude API で構造化する
 */
export async function structurizeReport(
  rawText: string
): Promise<StructuredReport> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    temperature: 0,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: rawText }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude API");
  }

  const parsed: StructuredReport = JSON.parse(content.text);
  return parsed;
}

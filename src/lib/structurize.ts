import Anthropic from "@anthropic-ai/sdk";
import type { StructuredReport } from "@/types";

const SYSTEM_PROMPT = `あなたは三重県志摩・南伊勢エリアの遊漁船の釣果ブログを構造化する専門家です。
与えられたブログ本文から以下の JSON を返してください。余計なテキストは出力しないでください。

{
  "status": "ok" | "cancelled" | "not_report",
  "date": "YYYY-MM-DD",
  "method": "メイン釣法",
  "fish": [
    { "name": "マダイ", "count": 12, "max_size": "65cm" }
  ],
  "summary": "1行の要約（40文字以内）",
  "weather": "晴れ / 曇り / 雨 など",
  "sea_condition": "凪 / やや波 / 波高い など",
  "photo_count": 3,
  "confidence": 0.95
}

## 釣法の分類ルール（重要）
以下から最も適切なものを選ぶこと。ブログ本文に書かれている釣法をそのまま使う。推測しない。
- タイラバ: 鯛ラバ、タイラバ
- ジギング: 青物ジギング、近海ジギング
- SLJ: スーパーライトジギング
- ティップラン: エギング、ティップラン
- トンジギ: トンボ（ビンチョウマグロ）狙いのジギング
- キャスティング: トップウォーター、誘い出し
- イカメタル: イカメタル、オモリグ
- 中深海: アカムツ、キンメダイなど深場狙い
- バチコン: バチコンアジング
- ロックフィッシュ: 根魚、アコウ、ハタ系
- トラフグ: トラジギ、フグジギング、トラフグ狙い。「ヤリトラ便」「トラフグリミット」等はこれ
- プラスク: プラズノスクイッドゲーム、ヤリイカ+スルメイカ狙い。「プラスク便」「ヤリング」等
- その他: 上記に当てはまらない場合

## その他のルール
- status が "cancelled"（出船中止）や "not_report"（釣果と無関係）の場合、他フィールドは null / 空配列でよい
- date は釣行日（投稿日ではない）。タイトルやURLに日付があればそれを使う（例: "2026-04-14 トンジギ" → "2026-04-14", "4月14日" → "2026-04-14"）。本文中に日付が明記されていない場合はnull
- fish 配列の count は船全体の合計匹数。不明なら 0
- max_size が不明なら ""
- confidence は 0〜1 で、情報の確からしさを自己評価。釣法が本文に明記されていれば0.9以上
- 複数の釣法が混在する場合（リレー便等）、メインの釣法を選ぶ
- JSON のみ出力。マークダウンやコードブロックで囲まないこと`;

const client = new Anthropic();

/**
 * ブログ生テキストを Claude API で構造化する
 */
export async function structurizeReport(
  rawText: string,
  meta?: { title?: string; url?: string; date?: string }
): Promise<StructuredReport> {
  // タイトル・URL・日付のメタ情報をテキストの先頭に付加
  let input = rawText;
  if (meta) {
    const parts: string[] = [];
    if (meta.title) parts.push(`記事タイトル: ${meta.title}`);
    if (meta.url) parts.push(`記事URL: ${meta.url}`);
    if (meta.date) parts.push(`投稿日: ${meta.date}`);
    if (parts.length > 0) {
      input = parts.join("\n") + "\n\n" + rawText;
    }
  }

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    temperature: 0,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: input }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude API");
  }

  // マークダウンコードブロックを除去
  let jsonText = content.text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  const parsed: StructuredReport = JSON.parse(jsonText);
  return parsed;
}

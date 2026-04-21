import type { StructuredReport } from "@/types";

const ALLOWED_METHODS = [
  "タイラバ",
  "ジギング",
  "SLJ",
  "ティップラン",
  "トンジギ",
  "キャスティング",
  "イカメタル",
  "中深海",
  "バチコン",
  "ロックフィッシュ",
] as const;

/**
 * 構造化レポートのバリデーション
 */
export function validateReport(report: StructuredReport): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // status が ok 以外はバリデーション不要
  if (report.status !== "ok") {
    return { valid: true, errors: [] };
  }

  // 日付チェック: 30日以内
  if (report.date) {
    const reportDate = new Date(report.date);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (isNaN(reportDate.getTime())) {
      errors.push("date が不正なフォーマットです");
    } else if (reportDate < thirtyDaysAgo) {
      errors.push("date が30日以上前です");
    } else if (reportDate > new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
      errors.push("date が未来の日付です");
    }
  }

  // 釣法チェック
  if (report.method) {
    if (!(ALLOWED_METHODS as readonly string[]).includes(report.method)) {
      errors.push(`method "${report.method}" は許可リストに含まれていません`);
    }
  }

  // fish 配列チェック
  if (!report.fish || report.fish.length === 0) {
    errors.push("fish 配列が空です");
  } else {
    for (const f of report.fish) {
      if (f.count < 0 || f.count > 9999) {
        errors.push(`fish "${f.name}" の count(${f.count}) が範囲外です (0-9999)`);
      }
    }
  }

  // confidence チェック
  if (report.confidence < 0.5) {
    errors.push(
      `confidence(${report.confidence}) が閾値 0.5 未満です`
    );
  }

  return { valid: errors.length === 0, errors };
}

import * as cheerio from "cheerio";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

/**
 * HTMLを取得する。タイムアウト10秒、リトライ1回。
 */
export async function fetchHTML(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  const doFetch = async (): Promise<string> => {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return await res.text();
    } finally {
      clearTimeout(timeout);
    }
  };

  try {
    return await doFetch();
  } catch (err) {
    console.log(`[fetchHTML] First attempt failed for ${url}: ${err}`);
    // Retry once with a fresh timeout
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 10_000);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: controller2.signal,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return await res.text();
    } finally {
      clearTimeout(timeout2);
    }
  }
}

/**
 * HTMLからセレクタに一致するテキストを抽出する。
 */
export function extractText(html: string, selector: string): string {
  const $ = cheerio.load(html);
  return cleanText($(selector).text());
}

/**
 * HTMLから画像URLを抽出する。相対URLはbaseUrlで解決する。
 */
export function extractImages(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const images: string[] = [];

  $("img").each((_i, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src");
    if (!src) return;
    // Skip tiny icons, emojis, tracking pixels
    if (
      src.includes("emoji") ||
      src.includes("pixel") ||
      src.includes("spacer") ||
      src.includes("icon") ||
      src.endsWith(".gif")
    ) {
      return;
    }
    try {
      const resolved = new URL(src, baseUrl).href;
      if (!images.includes(resolved)) {
        images.push(resolved);
      }
    } catch {
      // skip invalid URLs
    }
  });

  return images.slice(0, 5);
}

/**
 * 余分な空白を除去し、trimする。
 */
export function cleanText(text: string): string {
  return text
    .replace(/[\r\n]+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n /g, "\n")
    .replace(/ \n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * 日本語の日付文字列をISO形式 (YYYY-MM-DD) に変換する。
 * 対応パターン: 2026年4月17日, 2026/4/17, 4/17, 4月17日 etc.
 */
export function parseJapaneseDate(dateStr: string): string | null {
  if (!dateStr) return null;

  const cleaned = dateStr.trim();

  // YYYY年M月D日 or YYYY年MM月DD日
  const fullJp = cleaned.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (fullJp) {
    return formatDate(parseInt(fullJp[1]), parseInt(fullJp[2]), parseInt(fullJp[3]));
  }

  // YYYY/M/D or YYYY-M-D
  const fullSlash = cleaned.match(/(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/);
  if (fullSlash) {
    return formatDate(parseInt(fullSlash[1]), parseInt(fullSlash[2]), parseInt(fullSlash[3]));
  }

  // M月D日 (assume current year)
  const monthDay = cleaned.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (monthDay) {
    const year = new Date().getFullYear();
    return formatDate(year, parseInt(monthDay[1]), parseInt(monthDay[2]));
  }

  // M/D (assume current year)
  const shortSlash = cleaned.match(/^(\d{1,2})[/](\d{1,2})$/);
  if (shortSlash) {
    const year = new Date().getFullYear();
    return formatDate(year, parseInt(shortSlash[1]), parseInt(shortSlash[2]));
  }

  // Already ISO format
  const iso = cleaned.match(/^\d{4}-\d{2}-\d{2}$/);
  if (iso) return cleaned;

  return null;
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

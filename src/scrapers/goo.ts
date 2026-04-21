import * as cheerio from "cheerio";
import type { ScrapedArticle } from "./index";
import { fetchHTML, extractImages, cleanText, parseJapaneseDate } from "./utils";

const MAX_ARTICLES = 5;

/**
 * Goo ブログをスクレイプする。
 * @param blogId - ブログID (e.g. "heymitsumaru")
 */
export async function scrapeGoo(blogId: string): Promise<ScrapedArticle[]> {
  const blogUrl = `https://blog.goo.ne.jp/${blogId}`;
  console.log(`[goo] Fetching blog: ${blogUrl}`);

  const html = await fetchHTML(blogUrl);
  const $ = cheerio.load(html);

  // エントリリンクを探す
  const entryLinks: string[] = [];
  const selectors = [
    ".entry-title a",
    "h3.entry-title a",
    ".entry-header a",
    "h2 a[href*='/e/']",
    "a[href*='/e/']",
    ".article-title a",
  ];

  for (const sel of selectors) {
    $(sel).each((_i, el) => {
      const href = $(el).attr("href");
      if (href && isGooEntryUrl(href, blogId)) {
        const resolved = resolveGooUrl(href);
        if (resolved && !entryLinks.includes(resolved)) {
          entryLinks.push(resolved);
        }
      }
    });
    if (entryLinks.length >= MAX_ARTICLES) break;
  }

  // Fallback: any link that looks like a goo blog entry
  if (entryLinks.length === 0) {
    $("a[href]").each((_i, el) => {
      const href = $(el).attr("href");
      if (href && href.includes(`/${blogId}/e/`)) {
        const resolved = resolveGooUrl(href);
        if (resolved && !entryLinks.includes(resolved)) {
          entryLinks.push(resolved);
        }
      }
    });
  }

  const uniqueLinks = entryLinks.slice(0, MAX_ARTICLES);
  console.log(`[goo] Found ${uniqueLinks.length} entry links`);

  const articles: ScrapedArticle[] = [];

  for (const link of uniqueLinks) {
    try {
      const article = await scrapeGooEntry(link);
      if (article) {
        articles.push(article);
      }
    } catch (err) {
      console.log(`[goo] Failed to scrape entry ${link}: ${err}`);
    }
  }

  return articles;
}

async function scrapeGooEntry(url: string): Promise<ScrapedArticle | null> {
  console.log(`[goo] Scraping entry: ${url}`);
  const html = await fetchHTML(url);
  const $ = cheerio.load(html);

  // タイトル
  const title =
    cleanText($(".entry-title").first().text()) ||
    cleanText($("h1").first().text()) ||
    cleanText($("title").text()) ||
    "";

  // 本文
  const bodySelectors = [
    ".entry-body",
    ".entry-text",
    ".entry-content",
    ".article-body",
    "#entry-body",
  ];

  let bodyText = "";
  let bodyHtml = "";
  for (const sel of bodySelectors) {
    const el = $(sel).first();
    const text = cleanText(el.text());
    if (text && text.length > 30) {
      bodyText = text;
      bodyHtml = el.html() || "";
      break;
    }
  }

  if (!bodyText) {
    console.log(`[goo] No body text found for ${url}`);
    return null;
  }

  // 画像
  const images = extractImages(bodyHtml || html, url);

  // 日付
  const dateStr =
    $("time[datetime]").first().attr("datetime") ||
    $(".entry-date").first().text() ||
    $(".date").first().text() ||
    "";
  const date = parseJapaneseDate(dateStr) || "";

  return {
    url,
    title,
    text: bodyText.slice(0, 5000),
    images,
    date,
  };
}

function isGooEntryUrl(href: string, blogId: string): boolean {
  if (!href) return false;
  // Goo blog entries typically have pattern: /blogId/e/xxxxx
  if (href.includes(`/${blogId}/e/`)) return true;
  // Or just /e/ pattern for relative URLs
  if (href.startsWith("/e/") || href.match(/\/e\/[a-f0-9]+/)) return true;
  return false;
}

function resolveGooUrl(href: string): string | null {
  try {
    if (href.startsWith("http")) return href;
    return new URL(href, "https://blog.goo.ne.jp").href;
  } catch {
    return null;
  }
}

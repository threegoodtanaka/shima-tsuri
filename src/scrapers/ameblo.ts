import * as cheerio from "cheerio";
import type { ScrapedArticle } from "./index";
import { fetchHTML, extractImages, cleanText, parseJapaneseDate } from "./utils";

const MAX_ARTICLES = 5;

/**
 * Ameblo ブログをスクレイプする。
 * @param amebloId - ブログID (e.g. "musashimaru-6")
 */
export async function scrapeAmeblo(amebloId: string): Promise<ScrapedArticle[]> {
  const listUrl = `https://ameblo.jp/${amebloId}/entrylist.html`;
  console.log(`[ameblo] Fetching entry list: ${listUrl}`);

  const html = await fetchHTML(listUrl);
  const $ = cheerio.load(html);

  // エントリリンクを探す
  const entryLinks: string[] = [];
  const selectors = [
    ".skin-entryTitle a",
    "a.skin-entryTitle",
    ".articleTitle a",
    "h2 a[href*='/entry-']",
    "a[href*='/entry-']",
  ];

  for (const sel of selectors) {
    $(sel).each((_i, el) => {
      const href = $(el).attr("href");
      if (href && href.includes("/entry-")) {
        const resolved = resolveAmebloUrl(href);
        if (resolved && !entryLinks.includes(resolved)) {
          entryLinks.push(resolved);
        }
      }
    });
    if (entryLinks.length >= MAX_ARTICLES) break;
  }

  // Fallback: any link with /entry- pattern
  if (entryLinks.length === 0) {
    $("a[href]").each((_i, el) => {
      const href = $(el).attr("href");
      if (href && href.includes(`/${amebloId}/entry-`)) {
        const resolved = resolveAmebloUrl(href);
        if (resolved && !entryLinks.includes(resolved)) {
          entryLinks.push(resolved);
        }
      }
    });
  }

  const uniqueLinks = entryLinks.slice(0, MAX_ARTICLES);
  console.log(`[ameblo] Found ${uniqueLinks.length} entry links`);

  const articles: ScrapedArticle[] = [];

  for (const link of uniqueLinks) {
    try {
      const article = await scrapeAmebloEntry(link);
      if (article) {
        articles.push(article);
      }
    } catch (err) {
      console.log(`[ameblo] Failed to scrape entry ${link}: ${err}`);
    }
  }

  return articles;
}

async function scrapeAmebloEntry(url: string): Promise<ScrapedArticle | null> {
  console.log(`[ameblo] Scraping entry: ${url}`);
  const html = await fetchHTML(url);
  const $ = cheerio.load(html);

  // タイトル
  const title =
    cleanText($(".skin-entryTitle").first().text()) ||
    cleanText($(".articleTitle").first().text()) ||
    cleanText($("h1").first().text()) ||
    cleanText($("title").text()) ||
    "";

  // 本文
  const bodySelectors = [
    ".skin-entryBody",
    ".articleText",
    ".entry-content",
    "#entryBody",
    "[data-uranus-component='entryBody']",
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
    console.log(`[ameblo] No body text found for ${url}`);
    return null;
  }

  // 画像
  const images = extractImages(bodyHtml || html, url);

  // 日付
  const dateStr =
    $("time[datetime]").first().attr("datetime") ||
    $(".skin-entryPubdate").first().text() ||
    $(".articleDate").first().text() ||
    $(".entry-date").first().text() ||
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

function resolveAmebloUrl(href: string): string | null {
  try {
    if (href.startsWith("http")) return href;
    return new URL(href, "https://ameblo.jp").href;
  } catch {
    return null;
  }
}

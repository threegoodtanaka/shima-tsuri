import * as cheerio from "cheerio";
import type { ScrapedArticle } from "./index";
import { fetchHTML, extractImages, cleanText, parseJapaneseDate } from "./utils";

const MAX_ARTICLES = 5;

/**
 * WordPress ベースのブログをスクレイプする。
 * 一般的なWPテーマのHTML構造に対応。
 */
export async function scrapeWordpress(blogUrl: string): Promise<ScrapedArticle[]> {
  console.log(`[wordpress] Fetching: ${blogUrl}`);
  const html = await fetchHTML(blogUrl);
  const $ = cheerio.load(html);
  const baseUrl = new URL(blogUrl).origin;

  // 記事リンクを探す（WP共通パターン）
  const articleLinks: string[] = [];
  const selectors = [
    ".entry-title a",
    "h2.post-title a",
    "h2 a",
    "article a[href]",
    ".post-title a",
    ".blog-entry-title a",
    ".article-title a",
    "h3.entry-title a",
    ".skin-entryTitle a",
    ".entry-card-title a",
    ".post a[href]",
  ];

  for (const sel of selectors) {
    $(sel).each((_i, el) => {
      const href = $(el).attr("href");
      if (href && isArticleUrl(href, baseUrl)) {
        const resolved = resolveUrl(href, baseUrl);
        if (resolved && !articleLinks.includes(resolved)) {
          articleLinks.push(resolved);
        }
      }
    });
    if (articleLinks.length >= MAX_ARTICLES) break;
  }

  // セレクタで見つからなかった場合、<a>タグから記事っぽいURLを拾う
  if (articleLinks.length === 0) {
    $("a[href]").each((_i, el) => {
      const href = $(el).attr("href");
      if (href && isArticleUrl(href, baseUrl)) {
        const resolved = resolveUrl(href, baseUrl);
        if (resolved && !articleLinks.includes(resolved)) {
          articleLinks.push(resolved);
        }
      }
    });
  }

  const uniqueLinks = articleLinks.slice(0, MAX_ARTICLES);
  console.log(`[wordpress] Found ${uniqueLinks.length} article links`);

  const articles: ScrapedArticle[] = [];

  for (const link of uniqueLinks) {
    try {
      const article = await scrapeWpArticle(link);
      if (article) {
        articles.push(article);
      }
    } catch (err) {
      console.log(`[wordpress] Failed to scrape article ${link}: ${err}`);
    }
  }

  return articles;
}

async function scrapeWpArticle(url: string): Promise<ScrapedArticle | null> {
  console.log(`[wordpress] Scraping article: ${url}`);
  const html = await fetchHTML(url);
  const $ = cheerio.load(html);

  // タイトル抽出
  const title =
    cleanText($(".entry-title").first().text()) ||
    cleanText($("h1.post-title").first().text()) ||
    cleanText($("h1").first().text()) ||
    cleanText($("title").text()) ||
    "";

  // 本文抽出
  const bodySelectors = [
    ".entry-content",
    ".post-content",
    ".article-content",
    ".blog-entry-content",
    "article .content",
    "article",
    ".post-body",
    ".the-content",
    "#content",
  ];

  let bodyText = "";
  for (const sel of bodySelectors) {
    const text = cleanText($(sel).first().text());
    if (text && text.length > 50) {
      bodyText = text;
      break;
    }
  }

  if (!bodyText) {
    console.log(`[wordpress] No body text found for ${url}`);
    return null;
  }

  // 画像抽出
  let imagesHtml = "";
  for (const sel of bodySelectors) {
    const el = $(sel).first();
    if (el.length) {
      imagesHtml = el.html() || "";
      break;
    }
  }
  const images = extractImages(imagesHtml || html, url);

  // 日付抽出
  const dateStr =
    $("time[datetime]").first().attr("datetime") ||
    $(".entry-date").first().text() ||
    $(".post-date").first().text() ||
    $('meta[property="article:published_time"]').attr("content") ||
    "";
  const date = parseJapaneseDate(dateStr) || extractDateFromUrl(url) || "";

  return {
    url,
    title,
    text: bodyText.slice(0, 5000), // Limit text length for Claude API
    images,
    date,
  };
}

/**
 * URLが記事リンクかどうか判定する
 */
function isArticleUrl(href: string, baseUrl: string): boolean {
  // Skip common non-article links
  if (!href || href === "#" || href.startsWith("javascript:")) return false;
  if (href.includes("/category/") || href.includes("/tag/") || href.includes("/page/"))
    return false;
  if (href.includes("/wp-content/") || href.includes("/wp-admin/")) return false;
  if (href.endsWith(".jpg") || href.endsWith(".png") || href.endsWith(".pdf")) return false;

  // Must be same origin or relative
  try {
    const resolved = new URL(href, baseUrl);
    const base = new URL(baseUrl);
    if (resolved.hostname !== base.hostname) return false;
  } catch {
    return false;
  }

  // Looks like a blog post URL (has date, or has a slug)
  if (/\/\d{4}\/\d{2}\//.test(href)) return true;
  if (/\/archives\/\d+/.test(href)) return true;
  if (/\/blog\//.test(href) && href.split("/").filter(Boolean).length > 2) return true;
  if (/\?p=\d+/.test(href)) return true;
  if (/\/entry-\d+/.test(href)) return true;
  if (/\/post-\d+/.test(href)) return true;

  // Path has more than just / — could be a post slug
  try {
    const pathname = new URL(href, baseUrl).pathname;
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length >= 1 && !["blog", "about", "contact", "privacy"].includes(segments[0])) {
      return true;
    }
  } catch {
    // skip
  }

  return false;
}

function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

function extractDateFromUrl(url: string): string | null {
  const match = url.match(/(\d{4})\/(\d{2})\/(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return null;
}

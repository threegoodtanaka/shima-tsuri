import * as cheerio from "cheerio";
import type { ScrapedArticle } from "./index";
import { fetchHTML, extractImages, cleanText, parseJapaneseDate } from "./utils";

const MAX_ARTICLES = 5;

/**
 * WordPress ベースのブログをスクレイプする。
 * 優先順: RSS feed → HTML fallback
 */
export async function scrapeWordpress(blogUrl: string): Promise<ScrapedArticle[]> {
  const baseUrl = new URL(blogUrl).origin;

  // 1. RSS feedを試みる（WordPress標準: /feed/）
  const rssUrls = [
    `${baseUrl}/feed/`,
    `${blogUrl.replace(/\/$/, "")}/feed/`,
  ];

  for (const rssUrl of rssUrls) {
    try {
      console.log(`[wordpress] Trying RSS: ${rssUrl}`);
      const articles = await scrapeFromRss(rssUrl, baseUrl);
      if (articles.length > 0) {
        console.log(`[wordpress] RSS success: ${articles.length} articles`);
        return articles;
      }
    } catch (err) {
      console.log(`[wordpress] RSS failed: ${err}`);
    }
  }

  // 2. HTML fallback
  console.log(`[wordpress] Falling back to HTML scraping: ${blogUrl}`);
  return scrapeFromHtml(blogUrl, baseUrl);
}

/**
 * RSS feedからスクレイプ
 */
async function scrapeFromRss(rssUrl: string, baseUrl: string): Promise<ScrapedArticle[]> {
  const response = await fetch(rssUrl, {
    headers: { "User-Agent": "ShimaTsuriBot/1.0" },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) throw new Error(`RSS fetch failed: ${response.status}`);

  const xml = await response.text();
  const articles: ScrapedArticle[] = [];

  // XMLをRegexで簡易パース（サロゲート文字などでXMLパーサーが落ちるため）
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

  for (const item of items.slice(0, MAX_ARTICLES)) {
    const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                       item.match(/<title>(.*?)<\/title>/);
    const linkMatch = item.match(/<link>(.*?)<\/link>/);
    const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);

    // description（要約）またはcontent:encoded（全文）
    const contentMatch = item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
    const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
                      item.match(/<description>([\s\S]*?)<\/description>/);

    const title = titleMatch ? cleanHtmlEntities(titleMatch[1]) : "";
    const link = linkMatch ? linkMatch[1].trim() : "";
    const rawHtml = contentMatch ? contentMatch[1] : (descMatch ? descMatch[1] : "");

    // HTMLタグを除去してテキスト化
    const text = cleanText(rawHtml.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#\d+;/g, ""));

    // 画像URL抽出
    const images = extractImagesFromHtml(rawHtml, baseUrl);

    // 日付パース
    let date = "";
    if (pubDateMatch) {
      try {
        const d = new Date(pubDateMatch[1]);
        if (!isNaN(d.getTime())) {
          date = d.toISOString().slice(0, 10);
        }
      } catch { /* ignore */ }
    }
    if (!date) date = extractDateFromUrl(link) || "";

    if (link && text.length > 10) {
      articles.push({ url: link, title, text: text.slice(0, 5000), images, date });
    }
  }

  return articles;
}

/**
 * HTML fallback（RSS が無いサイト用）
 */
async function scrapeFromHtml(blogUrl: string, baseUrl: string): Promise<ScrapedArticle[]> {
  const html = await fetchHTML(blogUrl);
  const $ = cheerio.load(html);

  const articleLinks: string[] = [];
  const selectors = [
    "a.p-postList__link",
    ".p-postList__title a",
    ".entry-title a",
    "h2.post-title a",
    "h2 a",
    "article a[href]",
    ".post-title a",
    ".blog-entry-title a",
    ".article-title a",
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

  const articles: ScrapedArticle[] = [];
  for (const link of articleLinks.slice(0, MAX_ARTICLES)) {
    try {
      const article = await scrapeWpArticle(link, baseUrl);
      if (article) articles.push(article);
    } catch (err) {
      console.log(`[wordpress] Failed to scrape ${link}: ${err}`);
    }
  }

  return articles;
}

async function scrapeWpArticle(url: string, baseUrl: string): Promise<ScrapedArticle | null> {
  const html = await fetchHTML(url);
  const $ = cheerio.load(html);

  const title =
    cleanText($(".entry-title").first().text()) ||
    cleanText($("h1").first().text()) ||
    cleanText($("title").text()) || "";

  const bodySelectors = [
    ".post_content", ".e-content", ".entry-content", ".post-content",
    ".article-content", "article", ".post-body", ".the-content",
  ];

  let bodyText = "";
  for (const sel of bodySelectors) {
    const text = cleanText($(sel).first().text());
    if (text && text.length > 50) { bodyText = text; break; }
  }

  if (!bodyText) return null;

  const images = extractImages(html, url);
  const dateStr =
    $("time[datetime]").first().attr("datetime") ||
    $('meta[property="article:published_time"]').attr("content") || "";
  const date = parseJapaneseDate(dateStr) || extractDateFromUrl(url) || "";

  return { url, title, text: bodyText.slice(0, 5000), images, date };
}

function isArticleUrl(href: string, baseUrl: string): boolean {
  if (!href || href === "#" || href.startsWith("javascript:")) return false;
  if (/\/(category|tag|page|wp-content|wp-admin)\//.test(href)) return false;
  if (/\.(jpg|png|pdf)$/.test(href)) return false;
  try {
    const resolved = new URL(href, baseUrl);
    if (resolved.hostname !== new URL(baseUrl).hostname) return false;
  } catch { return false; }
  if (/\/\d{4}[\/-]\d{2}[\/-]\d{2}/.test(href)) return true;
  if (/\/archives\/\d+/.test(href)) return true;
  if (/\?p=\d+/.test(href)) return true;
  return false;
}

function resolveUrl(href: string, baseUrl: string): string | null {
  try { return new URL(href, baseUrl).href; } catch { return null; }
}

function extractDateFromUrl(url: string): string | null {
  const m1 = url.match(/(\d{4})\/(\d{2})\/(\d{2})/);
  if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`;
  const m2 = url.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return null;
}

function extractImagesFromHtml(html: string, baseUrl: string): string[] {
  const imgs: string[] = [];
  const matches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/g);
  for (const m of matches) {
    const src = m[1];
    if (src.startsWith("data:") || src.includes("gravatar") || src.includes("emoji")) continue;
    try {
      imgs.push(new URL(src, baseUrl).href);
    } catch { /* skip */ }
    if (imgs.length >= 5) break;
  }
  return imgs;
}

function cleanHtmlEntities(text: string): string {
  return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

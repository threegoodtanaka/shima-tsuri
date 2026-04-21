import * as cheerio from "cheerio";
import type { ScrapedArticle } from "./index";
import { fetchHTML, extractImages, cleanText, parseJapaneseDate } from "./utils";

const MAX_ARTICLES = 5;

/**
 * zekkouchou.com のブログをスクレイプする。
 * 絆 KIZUNA, 大東丸, 智栄丸, 海桜丸 等が利用。
 * @param boatPath - ボートのパス (e.g. "kizuna", "daitomaru")
 */
export async function scrapeZekkouchou(boatPath: string): Promise<ScrapedArticle[]> {
  const blogUrl = `https://zekkouchou.com/${boatPath}`;
  console.log(`[zekkouchou] Fetching blog: ${blogUrl}`);

  const html = await fetchHTML(blogUrl);
  const $ = cheerio.load(html);
  const baseUrl = "https://zekkouchou.com";

  // エントリリンクを探す
  const entryLinks: string[] = [];
  const selectors = [
    ".entry-title a",
    "h2 a",
    "h3 a",
    ".post-title a",
    ".article-title a",
    "article a",
    ".blog-post a",
    ".report-title a",
    ".report-item a",
    "a[href*='/blog/']",
    "a[href*='/report/']",
    "a[href*='/entry']",
  ];

  for (const sel of selectors) {
    $(sel).each((_i, el) => {
      const href = $(el).attr("href");
      if (href && isZekkouchouEntryUrl(href, boatPath)) {
        const resolved = resolveZekkouchouUrl(href, baseUrl);
        if (resolved && !entryLinks.includes(resolved)) {
          entryLinks.push(resolved);
        }
      }
    });
    if (entryLinks.length >= MAX_ARTICLES) break;
  }

  // Fallback: 全リンクをスキャンして記事っぽいURLを拾う
  if (entryLinks.length === 0) {
    $("a[href]").each((_i, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      if (
        href.includes(boatPath) &&
        (href.includes("/blog/") ||
          href.includes("/report/") ||
          href.includes("/entry") ||
          /\/\d{4}\/\d{2}\//.test(href) ||
          /\/\d+\.html/.test(href))
      ) {
        const resolved = resolveZekkouchouUrl(href, baseUrl);
        if (resolved && !entryLinks.includes(resolved)) {
          entryLinks.push(resolved);
        }
      }
    });
  }

  // If still no links, the top page itself may contain inline reports
  if (entryLinks.length === 0) {
    console.log(`[zekkouchou] No entry links found, trying to parse inline reports`);
    return parseInlineReports($, blogUrl);
  }

  const uniqueLinks = entryLinks.slice(0, MAX_ARTICLES);
  console.log(`[zekkouchou] Found ${uniqueLinks.length} entry links`);

  const articles: ScrapedArticle[] = [];

  for (const link of uniqueLinks) {
    try {
      const article = await scrapeZekkouchouEntry(link);
      if (article) {
        articles.push(article);
      }
    } catch (err) {
      console.log(`[zekkouchou] Failed to scrape entry ${link}: ${err}`);
    }
  }

  return articles;
}

async function scrapeZekkouchouEntry(url: string): Promise<ScrapedArticle | null> {
  console.log(`[zekkouchou] Scraping entry: ${url}`);
  const html = await fetchHTML(url);
  const $ = cheerio.load(html);

  // タイトル
  const title =
    cleanText($(".entry-title").first().text()) ||
    cleanText($("h1").first().text()) ||
    cleanText($("h2").first().text()) ||
    cleanText($("title").text()) ||
    "";

  // 本文
  const bodySelectors = [
    ".entry-content",
    ".post-content",
    ".article-content",
    ".blog-post-content",
    ".report-content",
    "article",
    ".content",
    "#content",
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
    console.log(`[zekkouchou] No body text found for ${url}`);
    return null;
  }

  // 画像
  const images = extractImages(bodyHtml || html, url);

  // 日付
  const dateStr =
    $("time[datetime]").first().attr("datetime") ||
    $(".entry-date").first().text() ||
    $(".post-date").first().text() ||
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

/**
 * インライン形式のレポート（1ページに複数レポートが並んでいる場合）をパースする
 */
function parseInlineReports(
  $: cheerio.CheerioAPI,
  pageUrl: string
): ScrapedArticle[] {
  const articles: ScrapedArticle[] = [];

  // Try to find report sections by headings or date patterns
  const reportSections = $("article, .post, .entry, .report-item, .blog-item");

  if (reportSections.length > 0) {
    reportSections.each((i, el) => {
      if (i >= MAX_ARTICLES) return;
      const section = $(el);
      const title = cleanText(
        section.find("h2, h3, .title, .entry-title").first().text()
      );
      const text = cleanText(section.text());
      if (text.length < 30) return;

      const sectionHtml = section.html() || "";
      const images = extractImages(sectionHtml, pageUrl);
      const dateStr =
        section.find("time[datetime]").first().attr("datetime") ||
        section.find(".date, .entry-date").first().text() ||
        "";
      const date = parseJapaneseDate(dateStr) || "";

      articles.push({
        url: pageUrl,
        title: title || `レポート ${i + 1}`,
        text: text.slice(0, 5000),
        images,
        date,
      });
    });
  } else {
    // As a last resort, treat the whole page as a single article
    const bodyText = cleanText($("body").text());
    if (bodyText.length > 100) {
      const images = extractImages($("body").html() || "", pageUrl);
      articles.push({
        url: pageUrl,
        title: cleanText($("title").text()) || "レポート",
        text: bodyText.slice(0, 5000),
        images,
        date: "",
      });
    }
  }

  return articles.slice(0, MAX_ARTICLES);
}

function isZekkouchouEntryUrl(href: string, boatPath: string): boolean {
  if (!href || href === "#" || href.startsWith("javascript:")) return false;
  // Accept URLs that reference this boat's path and look like articles
  if (href.includes(boatPath) && href !== `/${boatPath}` && href !== `/${boatPath}/`) {
    return true;
  }
  // Accept common blog entry patterns
  if (/\/\d{4}\/\d{2}\//.test(href)) return true;
  if (/\/entry/.test(href)) return true;
  if (/\/\d+\.html/.test(href)) return true;
  return false;
}

function resolveZekkouchouUrl(href: string, baseUrl: string): string | null {
  try {
    if (href.startsWith("http")) return href;
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

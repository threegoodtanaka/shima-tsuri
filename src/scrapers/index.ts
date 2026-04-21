import type { Boat } from "@/types";
import { scrapeWordpress } from "./wordpress";
import { scrapeAmeblo } from "./ameblo";
import { scrapeGoo } from "./goo";
import { scrapeZekkouchou } from "./zekkouchou";

/**
 * スクレイプした記事
 */
export interface ScrapedArticle {
  url: string;
  title: string;
  text: string;
  images: string[];
  date: string; // ISO date string (YYYY-MM-DD) or empty
}

/**
 * 船の source_type に応じて適切なスクレイパーにルーティングする
 */
export async function scrapeBoat(boat: Boat): Promise<ScrapedArticle[]> {
  const blogUrl = boat.blog_url;

  if (!blogUrl) {
    console.log(`[scrapeBoat] ${boat.name}: blog_url がありません, skipping`);
    return [];
  }

  try {
    switch (boat.source_type) {
      case "blog_wp": {
        console.log(`[scrapeBoat] ${boat.name}: WordPress scraper`);
        return await scrapeWordpress(blogUrl);
      }

      case "blog_ameblo": {
        console.log(`[scrapeBoat] ${boat.name}: Ameblo scraper`);
        // Extract ameblo ID from URL: https://ameblo.jp/{id}
        const amebloId = extractPathSegment(blogUrl, "ameblo.jp");
        if (!amebloId) {
          console.log(`[scrapeBoat] ${boat.name}: Ameblo ID を抽出できません: ${blogUrl}`);
          return [];
        }
        return await scrapeAmeblo(amebloId);
      }

      case "blog_goo": {
        console.log(`[scrapeBoat] ${boat.name}: Goo blog scraper`);
        // Extract goo blog ID from URL: https://blog.goo.ne.jp/{id}
        const gooId = extractPathSegment(blogUrl, "blog.goo.ne.jp");
        if (!gooId) {
          console.log(`[scrapeBoat] ${boat.name}: Goo blog ID を抽出できません: ${blogUrl}`);
          return [];
        }
        return await scrapeGoo(gooId);
      }

      case "blog_zekkouchou": {
        console.log(`[scrapeBoat] ${boat.name}: Zekkouchou scraper`);
        // Extract boat path from URL: https://zekkouchou.com/{path}
        const boatPath = extractPathSegment(blogUrl, "zekkouchou.com");
        if (!boatPath) {
          console.log(`[scrapeBoat] ${boat.name}: Zekkouchou path を抽出できません: ${blogUrl}`);
          return [];
        }
        return await scrapeZekkouchou(boatPath);
      }

      case "blog_wix":
      case "blog_other": {
        // Wix and other blog types — try the WordPress scraper as a generic fallback
        // since it uses common patterns that work for many blog engines
        console.log(`[scrapeBoat] ${boat.name}: Generic scraper (${boat.source_type})`);
        return await scrapeWordpress(blogUrl);
      }

      case "instagram":
      case "unknown":
      default: {
        console.log(
          `[scrapeBoat] ${boat.name}: source_type="${boat.source_type}" は未対応、スキップ`
        );
        return [];
      }
    }
  } catch (err) {
    console.error(`[scrapeBoat] ${boat.name}: エラー`, err);
    return [];
  }
}

/**
 * URLからホスト以降の最初のパスセグメントを抽出する。
 * e.g. "https://ameblo.jp/musashimaru-6/entrylist.html" => "musashimaru-6"
 */
function extractPathSegment(url: string, host: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes(host.replace(/^www\./, ""))) {
      // URL doesn't match expected host — just use the pathname anyway
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[0] || null;
  } catch {
    return null;
  }
}

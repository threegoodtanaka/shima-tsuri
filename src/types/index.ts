/** 魚情報 */
export interface Fish {
  name: string;
  count: number;
  max_size: string;
}

/** 遊漁船 */
export interface Boat {
  id: string;
  name: string;
  name_kana: string;
  port: string;
  area: string;
  methods: string[];
  site_url: string | null;
  blog_url: string | null;
  ig_handle: string | null;
  source_type: string;
  scrape_config: Record<string, unknown> | null;
  is_active: boolean;
}

/** 釣果レポート */
export interface Report {
  id: string;
  boat_id: string;
  source_url: string;
  source_type: string;
  published_at: string;
  scraped_at: string;
  method: string;
  fish: Fish[];
  summary: string;
  raw_text: string;
  weather: string | null;
  sea_condition: string | null;
  photos: string[];
  photo_count: number;
  ai_confidence: number;
  is_published: boolean;
  /** JOIN で取得する船名 */
  boat_name?: string;
}

/** スクレイプログ */
export interface ScrapeLog {
  id: string;
  boat_id: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "success" | "error";
  reports_found: number;
  reports_new: number;
  error_message: string | null;
}

/** Claude API で構造化した釣果レポート */
export interface StructuredReport {
  /** "cancelled" のとき未出船 / "not_report" のとき釣果以外 */
  status: "ok" | "cancelled" | "not_report";
  date: string | null;
  method: string | null;
  fish: Fish[];
  summary: string | null;
  weather: string | null;
  sea_condition: string | null;
  photo_count: number;
  confidence: number;
}

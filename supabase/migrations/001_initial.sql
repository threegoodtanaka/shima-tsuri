-- ============================================================
-- 志摩つり速報 — 初期スキーマ
-- ============================================================

-- 拡張
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- boats: 遊漁船マスタ
-- ------------------------------------------------------------
CREATE TABLE boats (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  name_kana   TEXT NOT NULL DEFAULT '',
  port        TEXT NOT NULL,
  area        TEXT NOT NULL,
  methods     TEXT[] NOT NULL DEFAULT '{}',
  site_url    TEXT,
  blog_url    TEXT,
  ig_handle   TEXT,
  source_type TEXT NOT NULL DEFAULT 'blog',
  scrape_config JSONB,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_boats_area    ON boats (area);
CREATE INDEX idx_boats_active  ON boats (is_active);

-- ------------------------------------------------------------
-- reports: 釣果レポート
-- ------------------------------------------------------------
CREATE TABLE reports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boat_id       UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  source_url    TEXT NOT NULL,
  source_type   TEXT NOT NULL DEFAULT 'blog',
  published_at  TIMESTAMPTZ NOT NULL,
  scraped_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  method        TEXT NOT NULL,
  fish          JSONB NOT NULL DEFAULT '[]',
  summary       TEXT NOT NULL DEFAULT '',
  raw_text      TEXT NOT NULL DEFAULT '',
  weather       TEXT,
  sea_condition TEXT,
  photos        TEXT[] NOT NULL DEFAULT '{}',
  photo_count   INT NOT NULL DEFAULT 0,
  ai_confidence REAL NOT NULL DEFAULT 0,
  is_published  BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_boat        ON reports (boat_id);
CREATE INDEX idx_reports_published   ON reports (published_at DESC);
CREATE INDEX idx_reports_method      ON reports (method);
CREATE INDEX idx_reports_is_pub      ON reports (is_published);
CREATE UNIQUE INDEX idx_reports_url  ON reports (source_url);

-- ------------------------------------------------------------
-- scrape_logs: スクレイプ実行ログ
-- ------------------------------------------------------------
CREATE TABLE scrape_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boat_id        UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at    TIMESTAMPTZ,
  status         TEXT NOT NULL DEFAULT 'running',
  reports_found  INT NOT NULL DEFAULT 0,
  reports_new    INT NOT NULL DEFAULT 0,
  error_message  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scrape_logs_boat   ON scrape_logs (boat_id);
CREATE INDEX idx_scrape_logs_status ON scrape_logs (status);

-- ============================================================
-- 志摩つり速報 — シードデータ: 遊漁船 24 隻
-- ============================================================

INSERT INTO boats (name, name_kana, port, area, methods, blog_url, ig_handle, source_type) VALUES
  ('魚英丸',      'うおえいまる',      '御座',   '志摩沖',     ARRAY['タイラバ','ジギング','SLJ'],                    'https://ameblo.jp/uoei-maru/',           'uoeimaru',           'blog'),
  ('勝丸',        'かつまる',          '御座',   '志摩沖',     ARRAY['タイラバ','ジギング'],                           'https://ameblo.jp/katsu-maru/',          'katsumaru_goza',     'blog'),
  ('よしむら丸',  'よしむらまる',      '御座',   '志摩沖',     ARRAY['タイラバ','SLJ','ティップラン'],                  'https://ameblo.jp/yoshimuramaru/',       'yoshimuramaru',      'blog'),
  ('佐助丸',      'さすけまる',        '浜島',   '志摩沖',     ARRAY['タイラバ','ジギング','SLJ'],                    'https://ameblo.jp/sasukemaru/',          'sasukemaru_hamajima','blog'),
  ('大祐丸',      'だいすけまる',      '浜島',   '志摩沖',     ARRAY['タイラバ','ジギング','SLJ','ティップラン'],       'https://ameblo.jp/daisukemaru-hamajima/','daisukemaru',        'blog'),
  ('マリントップ','まりんとっぷ',      '浜島',   '志摩沖',     ARRAY['タイラバ','ジギング'],                           'https://ameblo.jp/marine-top/',          'marinetop_hamajima', 'blog'),
  ('かさご丸',    'かさごまる',        '和具',   '志摩沖',     ARRAY['タイラバ','ジギング','SLJ'],                    'https://ameblo.jp/kasagomaru/',          'kasagomaru',         'blog'),
  ('つばさ丸',    'つばさまる',        '和具',   '志摩沖',     ARRAY['タイラバ','ジギング','キャスティング'],            'https://ameblo.jp/tubasamaru/',          'tubasamaru_wagu',    'blog'),
  ('誠久丸',      'せいきゅうまる',    '越賀',   '志摩沖',     ARRAY['タイラバ','ジギング','SLJ'],                    'https://ameblo.jp/seikyumaru/',          'seikyumaru',         'blog'),
  ('パールシップ','ぱーるしっぷ',      '英虞湾', '英虞湾',     ARRAY['ティップラン','イカメタル','ロックフィッシュ'],     'https://ameblo.jp/pearlship/',           'pearlship_ago',      'blog'),
  ('シーファイター','しーふぁいたー',   '五ケ所', '南伊勢沖',   ARRAY['ジギング','キャスティング','トンジギ'],            'https://ameblo.jp/seafighter-gokasho/',  'seafighter_gokasho', 'blog'),
  ('アルフレッド', 'あるふれっど',      '五ケ所', '南伊勢沖',   ARRAY['ジギング','トンジギ','キャスティング'],            'https://ameblo.jp/alfred-fishing/',      'alfred_fishing',     'blog'),
  ('フィッシュキング','ふぃっしゅきんぐ','五ケ所','南伊勢沖',   ARRAY['ジギング','トンジギ','SLJ'],                    'https://ameblo.jp/fishking-gokasho/',    'fishking_gokasho',   'blog'),
  ('サーティーフォー','さーてぃーふぉー','五ケ所','南伊勢沖',   ARRAY['ジギング','キャスティング'],                      'https://ameblo.jp/thirtyfour-fishing/',  'thirtyfour_fishing', 'blog'),
  ('エルクルーズ','えるくるーず',      '五ケ所', '南伊勢沖',   ARRAY['ジギング','トンジギ','SLJ'],                    'https://ameblo.jp/el-cruise/',           'elcruise_fishing',   'blog'),
  ('メイクス',    'めいくす',          '五ケ所', '南伊勢沖',   ARRAY['ジギング','SLJ','バチコン'],                     'https://ameblo.jp/makes-fishing/',       'makes_fishing',      'blog'),
  ('宏昌丸',      'こうしょうまる',    '五ケ所', '南伊勢沖',   ARRAY['ジギング','中深海'],                              'https://ameblo.jp/koushoumaru/',         'koushoumaru',        'blog'),
  ('ブルーフィン','ぶるーふぃん',      '五ケ所', '南伊勢沖',   ARRAY['ジギング','キャスティング','トンジギ'],            'https://ameblo.jp/bluefin-gokasho/',     'bluefin_gokasho',    'blog'),
  ('トロ丸',      'とろまる',          '迫間浦', '南伊勢沖',   ARRAY['タイラバ','SLJ','バチコン'],                     'https://ameblo.jp/toromaru/',            'toromaru_fishing',   'blog'),
  ('智明丸',      'ちめいまる',        '迫間浦', '南伊勢沖',   ARRAY['タイラバ','ジギング'],                           'https://ameblo.jp/chimeimaru/',          'chimeimaru',         'blog'),
  ('日章丸',      'にっしょうまる',    '田曽浦', '南伊勢沖',   ARRAY['タイラバ','ジギング','SLJ'],                    'https://ameblo.jp/nisshoumaru/',         'nisshoumaru',        'blog'),
  ('フィッシングボートケイズ','ふぃっしんぐぼーときーず','鳥羽','鳥羽〜志摩沖',ARRAY['タイラバ','ジギング','SLJ'],  'https://ameblo.jp/fb-ks/',               'fb_ks_toba',         'blog'),
  ('ファイター中佐丸','ふぁいたーちゅうさまる','鳥羽','鳥羽〜志摩沖',ARRAY['タイラバ','ジギング','SLJ'],           'https://ameblo.jp/fighter-chusa/',       'fighter_chusa',      'blog'),
  ('鯛國丸',      'たいこくまる',      '安乗',   '志摩沖',     ARRAY['タイラバ','SLJ','ティップラン'],                  'https://ameblo.jp/taikokumaru/',         'taikokumaru',        'blog');

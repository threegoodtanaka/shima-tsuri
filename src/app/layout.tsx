import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "志摩つり速報 | 志摩・南伊勢の遊漁船釣果ポータル",
  description:
    "三重県志摩・南伊勢エリアの遊漁船釣果情報をリアルタイムで集約。タイラバ・ジギング・SLJなど各釣法の最新釣果をチェック。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {/* ヘッダー */}
        <header className="sticky top-0 z-50 border-b border-blue-900/20 bg-[#1a365d] shadow-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold text-white"
            >
              <span className="text-2xl" role="img" aria-label="魚">
                🐟
              </span>
              志摩つり速報
            </Link>

            <nav className="flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-medium text-blue-100 transition-colors hover:text-white"
              >
                トップ
              </Link>
              <Link
                href="/boats"
                className="text-sm font-medium text-blue-100 transition-colors hover:text-white"
              >
                登録船一覧
              </Link>
            </nav>
          </div>
        </header>

        {/* メイン */}
        <main className="flex-1">{children}</main>

        {/* フッター */}
        <footer className="border-t border-gray-200 bg-white py-6">
          <div className="mx-auto max-w-6xl px-4 text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} 志摩つり速報 — 志摩・南伊勢エリアの遊漁船釣果ポータル
          </div>
        </footer>
      </body>
    </html>
  );
}

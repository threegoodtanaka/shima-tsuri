import type { Boat } from "@/types";

const METHOD_COLORS: Record<string, string> = {
  タイラバ: "bg-red-100 text-red-700",
  ジギング: "bg-blue-100 text-blue-700",
  SLJ: "bg-sky-100 text-sky-700",
  ティップラン: "bg-purple-100 text-purple-700",
  トンジギ: "bg-orange-100 text-orange-700",
  キャスティング: "bg-green-100 text-green-700",
  イカメタル: "bg-pink-100 text-pink-700",
  中深海: "bg-indigo-100 text-indigo-700",
  バチコン: "bg-yellow-100 text-yellow-700",
  ロックフィッシュ: "bg-emerald-100 text-emerald-700",
};

interface BoatCardProps {
  boat: Boat;
}

export default function BoatCard({ boat }: BoatCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* 船名 & エリア */}
      <div className="mb-1 flex items-start justify-between">
        <h3 className="text-lg font-bold text-gray-900">{boat.name}</h3>
        <span className="shrink-0 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
          {boat.area}
        </span>
      </div>

      {/* 港 */}
      <p className="mb-3 text-sm text-gray-500">{boat.port}港</p>

      {/* 釣法タグ */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {boat.methods.map((m) => (
          <span
            key={m}
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              METHOD_COLORS[m] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {m}
          </span>
        ))}
      </div>

      {/* リンク */}
      <div className="flex flex-wrap gap-3 text-xs">
        {boat.blog_url && (
          <a
            href={boat.blog_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            ブログ
          </a>
        )}
        {boat.ig_handle && (
          <a
            href={`https://instagram.com/${boat.ig_handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-pink-600 hover:text-pink-700"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            @{boat.ig_handle}
          </a>
        )}
        {boat.site_url && (
          <a
            href={boat.site_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-700"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
            公式サイト
          </a>
        )}
      </div>
    </div>
  );
}

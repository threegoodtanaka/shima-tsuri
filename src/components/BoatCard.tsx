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
      <div className="flex flex-wrap gap-3 text-sm">
        {boat.blog_url && (
          <a
            href={boat.blog_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 font-medium text-blue-600 hover:bg-blue-100 transition-colors"
          >
            ブログ &rarr;
          </a>
        )}
        {boat.ig_handle && (
          <a
            href={`https://instagram.com/${boat.ig_handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-pink-50 px-3 py-1.5 font-medium text-pink-600 hover:bg-pink-100 transition-colors"
          >
            Instagram &rarr;
          </a>
        )}
        {boat.site_url && (
          <a
            href={boat.site_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            公式サイト &rarr;
          </a>
        )}
      </div>
    </div>
  );
}

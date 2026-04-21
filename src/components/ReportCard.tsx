import type { Fish } from "@/types";

/** 釣法ごとの色 */
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

interface ReportCardProps {
  boatName: string;
  publishedAt: string;
  method: string;
  fish: Fish[];
  summary: string;
  sourceUrl: string;
  photos: string[];
  photoCount: number;
}

export default function ReportCard({
  boatName,
  publishedAt,
  method,
  fish,
  summary,
  sourceUrl,
  photos,
  photoCount,
}: ReportCardProps) {
  const date = new Date(publishedAt);
  const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
  const methodColor =
    METHOD_COLORS[method] ?? "bg-gray-100 text-gray-700";

  return (
    <div className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* サムネイル */}
      {photos.length > 0 && (
        <div className="relative h-32 w-full overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[0]}
            alt={`${boatName}の釣果`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          {photoCount > 1 && (
            <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">
              +{photoCount - 1}枚
            </span>
          )}
        </div>
      )}

      <div className="p-4">
        {/* ヘッダー */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">
            {boatName}
          </span>
          <span className="text-xs text-gray-500">{dateStr}</span>
        </div>

        {/* 釣法タグ */}
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${methodColor}`}
        >
          {method}
        </span>

        {/* 魚リスト */}
        {fish.length > 0 && (
          <ul className="mt-3 space-y-1">
            {fish.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-baseline justify-between text-sm"
              >
                <span className="font-medium text-gray-800">{f.name}</span>
                <span className="text-gray-500">
                  {f.count > 0 && `${f.count}匹`}
                  {f.count > 0 && f.max_size && " / "}
                  {f.max_size && `最大${f.max_size}`}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* サマリー */}
        {summary && (
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            {summary}
          </p>
        )}

        {/* ソースリンク */}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          元の記事を見る
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}

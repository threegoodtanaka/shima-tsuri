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
  トラフグ: "bg-amber-100 text-amber-700",
  プラスク: "bg-cyan-100 text-cyan-700",
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
  const hasPhoto = photos.length > 0;

  return (
    <div className="group flex overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* サムネイル（左側・小さめ） */}
      {hasPhoto && (
        <div className="relative w-24 flex-shrink-0 overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[0]}
            alt={`${boatName}の釣果`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          {photoCount > 1 && (
            <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">
              +{photoCount - 1}
            </span>
          )}
        </div>
      )}

      <div className="flex-1 p-3">
        {/* ヘッダー */}
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">
            {boatName}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${methodColor}`}
          >
            {method}
          </span>
          <span className="ml-auto text-xs text-gray-400">{dateStr}</span>
        </div>

        {/* 魚リスト */}
        {fish.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
            {fish.map((f, i) => (
              <span key={`${f.name}-${i}`} className="text-gray-700">
                <span className="font-medium">{f.name}</span>
                {f.count > 0 && <span className="text-gray-400"> {f.count}匹</span>}
                {f.max_size && <span className="text-gray-400"> {f.max_size}</span>}
              </span>
            ))}
          </div>
        )}

        {/* サマリー */}
        {summary && (
          <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
            {summary}
          </p>
        )}

        {/* ソースリンク */}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-block text-[10px] text-blue-500 hover:text-blue-600"
        >
          元の記事 →
        </a>
      </div>
    </div>
  );
}

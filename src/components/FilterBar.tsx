"use client";

import { useCallback, useState } from "react";

const METHODS = [
  "タイラバ",
  "ジギング",
  "SLJ",
  "ティップラン",
  "トンジギ",
  "キャスティング",
  "イカメタル",
  "中深海",
  "バチコン",
  "ロックフィッシュ",
  "トラフグ",
  "プラスク",
] as const;

const AREAS = [
  "志摩沖",
  "南伊勢沖",
  "英虞湾",
  "鳥羽〜志摩沖",
] as const;

interface FilterBarProps {
  onFilterChange: (filters: {
    method: string;
    area: string;
    q: string;
  }) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [method, setMethod] = useState("");
  const [area, setArea] = useState("");
  const [q, setQ] = useState("");

  const handleChange = useCallback(
    (newMethod?: string, newArea?: string, newQ?: string) => {
      const m = newMethod ?? method;
      const a = newArea ?? area;
      const query = newQ ?? q;
      onFilterChange({ method: m, area: a, q: query });
    },
    [method, area, q, onFilterChange]
  );

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
      {/* 釣法フィルタ */}
      <select
        value={method}
        onChange={(e) => {
          setMethod(e.target.value);
          handleChange(e.target.value, undefined, undefined);
        }}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        <option value="">すべての釣法</option>
        {METHODS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      {/* エリアフィルタ */}
      <select
        value={area}
        onChange={(e) => {
          setArea(e.target.value);
          handleChange(undefined, e.target.value, undefined);
        }}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        <option value="">すべてのエリア</option>
        {AREAS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      {/* キーワード検索 */}
      <div className="relative flex-1 min-w-[200px]">
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleChange(undefined, undefined, q);
            }
          }}
          placeholder="キーワード検索（魚種・船名など）"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-9 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <svg
          className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* 検索ボタン */}
      <button
        onClick={() => handleChange(undefined, undefined, q)}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
      >
        検索
      </button>
    </div>
  );
}

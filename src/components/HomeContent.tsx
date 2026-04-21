"use client";

import { useCallback, useEffect, useState } from "react";
import FilterBar from "@/components/FilterBar";
import ReportCard from "@/components/ReportCard";
import type { Fish } from "@/types";

interface ReportRow {
  id: string;
  boat_name: string;
  published_at: string;
  method: string;
  fish: Fish[];
  summary: string;
  source_url: string;
  photos: string[];
  photo_count: number;
}

export default function HomeContent() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ method: "", area: "", q: "" });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.method) params.set("method", filters.method);
    if (filters.area) params.set("area", filters.area);
    if (filters.q) params.set("q", filters.q);
    params.set("limit", "20");

    try {
      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      setReports(data.reports ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setReports([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleFilterChange = useCallback(
    (newFilters: { method: string; area: string; q: string }) => {
      setFilters(newFilters);
    },
    []
  );

  return (
    <>
      <FilterBar onFilterChange={handleFilterChange} />

      {/* 件数表示 */}
      <div className="mt-4 mb-2 text-sm text-gray-500">
        {loading ? (
          "読み込み中..."
        ) : (
          <>
            {total > 0
              ? `${total} 件の釣果レポート`
              : ""}
          </>
        )}
      </div>

      {/* レポートグリッド */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white py-20 text-center shadow-sm">
          <p className="text-lg font-semibold text-gray-400">
            釣果レポートがまだありません
          </p>
          <p className="mt-1 text-sm text-gray-400">
            データ収集が始まるとここに表示されます
          </p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {reports.map((r) => (
            <ReportCard
              key={r.id}
              boatName={r.boat_name}
              publishedAt={r.published_at}
              method={r.method}
              fish={r.fish}
              summary={r.summary}
              sourceUrl={r.source_url}
              photos={r.photos}
              photoCount={r.photo_count}
            />
          ))}
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import BoatCard from "@/components/BoatCard";
import type { Boat } from "@/types";

export default function BoatListContent() {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBoats() {
      try {
        const res = await fetch("/api/boats");
        const data = await res.json();
        setBoats(data.boats ?? []);
      } catch {
        setBoats([]);
      } finally {
        setLoading(false);
      }
    }
    fetchBoats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (boats.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white py-20 text-center shadow-sm">
        <p className="text-lg font-semibold text-gray-400">
          登録船がまだありません
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {boats.map((boat) => (
        <BoatCard key={boat.id} boat={boat} />
      ))}
    </div>
  );
}

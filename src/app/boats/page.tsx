import BoatListContent from "@/components/BoatListContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "登録船一覧 | 志摩つり速報",
  description: "志摩・南伊勢エリアの登録遊漁船一覧。各船の対応釣法やブログ、Instagram リンクを確認できます。",
};

export default function BoatsPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-gray-900">
        登録船一覧
      </h1>
      <BoatListContent />
    </section>
  );
}

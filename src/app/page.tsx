import HomeContent from "@/components/HomeContent";

export default function HomePage() {
  return (
    <>
      {/* ヒーローセクション */}
      <section className="bg-gradient-to-b from-[#1a365d] to-[#2a4a7f] py-12 text-center text-white">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            志摩・南伊勢エリアの釣果速報
          </h1>
          <p className="mt-3 text-base leading-relaxed text-blue-100 sm:text-lg">
            遊漁船 24 隻の最新釣果を毎日自動収集。
            <br className="hidden sm:block" />
            タイラバ・ジギング・SLJ などお好みの釣法で絞り込めます。
          </p>
        </div>
      </section>

      {/* フィルタ + レポート一覧 */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <HomeContent />
      </section>
    </>
  );
}

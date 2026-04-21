import { type NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const { searchParams } = request.nextUrl;

  const method = searchParams.get("method");
  const area = searchParams.get("area");
  const boatId = searchParams.get("boat_id");
  const q = searchParams.get("q");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = Math.min(Number(searchParams.get("limit") || "20"), 100);
  const offset = Number(searchParams.get("offset") || "0");

  // ベースクエリ: reports + boats を JOIN して boat_name を取得
  let query = supabase
    .from("reports")
    .select("*, boats!inner(name)", { count: "exact" })
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // フィルタ
  if (method) {
    query = query.eq("method", method);
  }
  if (area) {
    query = query.eq("boats.area", area);
  }
  if (boatId) {
    query = query.eq("boat_id", boatId);
  }
  if (q) {
    query = query.or(`summary.ilike.%${q}%,raw_text.ilike.%${q}%`);
  }
  if (from) {
    query = query.gte("published_at", from);
  }
  if (to) {
    query = query.lte("published_at", to);
  }

  const { data, error, count } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // boats の JOIN 結果を boat_name としてフラット化
  const reports = (data ?? []).map((row) => {
    const { boats, ...rest } = row as Record<string, unknown>;
    return {
      ...rest,
      boat_name: (boats as { name: string } | null)?.name ?? "",
    };
  });

  return Response.json({ reports, total: count ?? 0 });
}

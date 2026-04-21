import { type NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");

  let query = supabase
    .from("boats")
    .select("*")
    .eq("is_active", true)
    .order("area")
    .order("port")
    .order("name");

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,name_kana.ilike.%${q}%,port.ilike.%${q}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ boats: data ?? [] });
}

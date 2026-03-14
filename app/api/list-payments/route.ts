import { supabase } from "@/lib/supabase"

export async function GET() {

  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("settled", false)
    .order("date", { ascending: false })

  return Response.json(data)
}
import { supabase } from "@/lib/supabase"

export async function POST() {

  await supabase
    .from("payments")
    .update({ settled: true })
    .eq("settled", false)

  return Response.json({ success: true })
}
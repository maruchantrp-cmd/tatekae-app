import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {

  const body = await req.json()

  const { id } = body

  await supabase
    .from("payments")
    .delete()
    .eq("id", id)

  return Response.json({ success: true })
}
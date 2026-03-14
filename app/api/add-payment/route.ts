import { supabase } from "@/lib/supabase"

export async function POST(req: Request) { try { const { date, category,
payer, amount, split_type } = await req.json()

    const { data, error } = await supabase
      .from("payments")
      .insert([
        {
          date: date,
          category: category,
          payer: payer,
          amount: amount,
          split_type: split_type ?? "half",
          settled: false
        }
      ])
      .select()

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return Response.json(data)

} catch (e) { return Response.json( { error: "Invalid request" }, {
status: 400 } ) } }

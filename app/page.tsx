"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function Page(){

  const [date,setDate] = useState(
    new Date().toISOString().slice(0,10)
  )
  const [amount,setAmount] = useState("")
  const [category,setCategory] = useState("")
  const [payer,setPayer] = useState("husband")
  const [payments,setPayments] = useState([])
  const [settledPayments,setSettledPayments] = useState([])
  const [splitType,setSplitType] = useState("half")
  const router = useRouter()

  useEffect(()=>{

    const checkUser = async ()=>{

      const { data } = await supabase.auth.getUser()

      if(!data.user){
        router.push("/login")
      }

    }

    checkUser()

  },[router])

  async function addPayment(){

    const res = await fetch("/api/add-payment",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        date,
        category,
        payer,
        amount: Number(amount),  // ←ここ重要
        split_type: splitType
      })
    })

    const data = await res.json()

    if(!res.ok){
      alert("登録失敗: " + data.error)
      return
    }

    await loadPayments()

    alert("登録しました")

    setAmount("")
    setCategory("")
  }

async function loadPayments(){

  const res = await fetch("/api/list-payments")

  const data = await res.json()

  setPayments(data)

}

async function loadSettledPayments(){

  const res = await fetch("/api/list-settled-payments")

  const data = await res.json()

  setSettledPayments(data)

}

async function settlePayments(){

  if(!confirm("未清算データを精算済みにしますか？")){
    return
  }

  await fetch("/api/settle-payments",{
    method:"POST"
  })

  await loadPayments()
  await loadSettledPayments()

}

function calculateSettlement(){

  let wifeToHusband = 0
  let husbandToWife = 0

  payments.forEach((p:any)=>{

    const amount = Number(p.amount)

    let claim = amount / 2

    if(p.split_type === "full"){
      claim = amount
    }

    if(p.payer === "husband"){
      wifeToHusband += claim
    }

    if(p.payer === "wife"){
      husbandToWife += claim
    }

  })

  const settlement = wifeToHusband - husbandToWife

  return {
    wifeToHusband,
    husbandToWife,
    settlement
  }

}

async function deletePayment(id:number){

  await fetch("/api/delete-payment",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify({ id })
  })

  await loadPayments()

}

async function logout(){

  await supabase.auth.signOut()

  router.push("/login")

}

useEffect(() => {
  loadPayments()
  loadSettledPayments()
}, [])

  const result = calculateSettlement()

  return(

    <div>

      <h1>立て替え登録</h1>

      日付
      <input
        type="date"
        value={date}
        onChange={(e)=>setDate(e.target.value)}
      />

      金額
      <input
        type="number"
        value={amount}
        onChange={(e)=>setAmount(e.target.value)}
      />

      カテゴリ
      <input
        value={category}
        onChange={(e)=>setCategory(e.target.value)}
      />

      支払者
      <select
        value={payer}
        onChange={(e)=>setPayer(e.target.value)}
      >
        <option value="husband">翔太郎</option>
        <option value="wife">絢菜</option>
      </select>

      <select
        value={splitType}
        onChange={(e)=>setSplitType(e.target.value)}
      >
        <option value="half">半額請求</option>
        <option value="full">指定金額請求</option>
      </select>

      <button onClick={addPayment}>
        登録
      </button>

      <button onClick={logout}>
      ログアウト
      </button>

      <h2>立て替え一覧</h2>

      <table border={1}>
        <thead>
          <tr>
            <th>日付</th>
            <th>カテゴリ</th>
            <th>支払者</th>
            <th>金額</th>
            <th>請求方法</th>
            <th>削除</th>
          </tr>
        </thead>

        <tbody>
          {payments.map((p:any) => (
            <tr key={p.id}>
              <td>{new Date(p.date).toLocaleDateString()}</td>
              <td>{p.category}</td>
              <td>{p.payer}</td>
              <td>{p.amount}円</td>
              <td>
                {p.split_type === "full" ? "全額" : "半額"}
              </td>

              <td>
                <button
                  onClick={()=>{
                    if(confirm("削除しますか？")){
                      deletePayment(p.id)
                    }
                  }}
                >
                削除
                </button>
              </td>

            </tr>
          ))}
        </tbody>
      </table>



      <h2>精算結果</h2>

        <p>翔太郎への請求額合計：{result.husbandToWife}円</p>
        <p>絢菜への請求額合計：{result.wifeToHusband}円</p>

        <p>
        精算額：
        {
          result.settlement > 0
          ? `絢菜 → 翔太郎 に ${result.settlement}円`
          : `翔太郎 → 絢菜 に ${Math.abs(result.settlement)}円`
        }
        </p>

        <button onClick={settlePayments}>
          精算する
        </button>

        <h2>清算履歴</h2>

        <table border={1}>
          <thead>
            <tr>
              <th>日付</th>
              <th>カテゴリ</th>
              <th>支払者</th>
              <th>金額</th>
              <th>請求方法</th>
            </tr>
          </thead>

          <tbody>
            {settledPayments.map((p:any)=>(
              <tr key={p.id}>
                <td>{new Date(p.date).toLocaleDateString()}</td>
                <td>{p.category}</td>
                <td>{p.payer}</td>
                <td>{p.amount}円</td>
                <td>
                  {p.split_type === "full" ? "全額" : "半額"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

    </div>
  )
}
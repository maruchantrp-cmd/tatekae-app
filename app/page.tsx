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
  const [payer,setPayer] = useState("翔太郎")
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

    if(p.payer === "翔太郎"){
      wifeToHusband += claim
    }

    if(p.payer === "絢菜"){
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

    <div className="max-w-4xl mx-auto p-6 space-y-8">

      {/* タイトル */} 
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold"> 立て替え管理 </h1>
        <button onClick={logout} className="text-sm bg-gray-200 px-3 py-1 rounded" > ログアウト </button>
      </div>

      {/* 入力フォーム */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="font-bold mb-4">立て替え登録</h2>
        <div className="grid grid-cols-2 gap-4">
          <div> <label className="text-sm">日付</label> <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="border rounded w-full p-2" /> </div>
          <div> <label className="text-sm">金額</label> <input type="number" value={amount} onChange={(e)=>setAmount(e.target.value)} className="border rounded w-full p-2" /> </div>
          <div> <label className="text-sm">内容</label> <input value={category} onChange={(e)=>setCategory(e.target.value)} className="border rounded w-full p-2" /> </div>
          <div> <label className="text-sm">支払者</label> <select value={payer} onChange={(e)=>setPayer(e.target.value)} className="border rounded w-full p-2" > <option value="翔太郎">翔太郎</option> <option value="絢菜">絢菜</option> </select> </div>
          <div> <label className="text-sm">請求方法</label> <select value={splitType} onChange={(e)=>setSplitType(e.target.value)} className="border rounded w-full p-2" > <option value="half">半額</option> <option value="full">全額</option> </select> </div>
        </div>
        <button onClick={addPayment} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded" > 登録 </button>
      </div>



      {/* 一覧 */}
      <div className="bg-white shadow rounded-lg p-6">
      
        <h2 className="font-bold mb-4">立て替え一覧</h2>

        <table className="w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">日付</th>
              <th className="p-2">内容</th>
              <th className="p-2">支払者</th>
              <th className="p-2">金額</th>
              <th className="p-2">請求方法</th>
              <th className="p-2">削除</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((p:any) => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{new Date(p.date).toLocaleDateString()}</td>
                <td className="p-2">{p.category}</td>
                <td className="p-2">{p.payer}</td>
                <td className="p-2">{p.amount}円</td>
                <td className="p-2">
                  {p.split_type === "full" ? "全額" : "半額"}
                </td>

                <td className="p-2">
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
      </div>

      {/* 精算結果 */}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="font-bold mb-4">精算結果</h2>

        <p>翔太郎への請求額：{result.husbandToWife}円</p>
        <p>絢菜への請求額：{result.wifeToHusband}円</p>

        <p className="mt-2 font-bold text-lg">
        
        {
          result.settlement > 0
          ? `絢菜 → 翔太郎 に ${result.settlement}円`
          : `翔太郎 → 絢菜 に ${Math.abs(result.settlement)}円`
        }
        </p>

        <button onClick={settlePayments} className="mt-4 bg-green-500 text-white px-4 py-2 rounded" >
          精算する
        </button>
      </div>

      {/* 履歴 */}

      <div className="bg-white shadow rounded-lg p-6">

        <h2 className="font-bold mb-4">清算履歴</h2>

        <table className="w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">日付</th>
              <th className="p-2">カテゴリ</th>
              <th className="p-2">支払者</th>
              <th className="p-2">金額</th>
              <th className="p-2">請求方法</th>
            </tr>
          </thead>

          <tbody>
            {settledPayments.map((p:any)=>(
              <tr key={p.id} className="border-t">
                <td className="p-2">{new Date(p.date).toLocaleDateString()}</td>
                <td className="p-2">{p.category}</td>
                <td className="p-2">{p.payer}</td>
                <td className="p-2">{p.amount}円</td>
                <td className="p-2">
                  {p.split_type === "full" ? "全額" : "半額"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
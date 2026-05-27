// サンプルデータ（実際は Gmail API / Sheets API から取得）
const SAMPLE_DATA = {
  "2026-05-27": [
    {
      id: 1,
      gmail: { time: "09:15", name: "田中 花子", menu: "フェイシャル 60分", amount: 8800, payment: "PayPay" },
      nippo: { name: "田中 花子", menu: "フェイシャル 60分", checked: true },
      uriage: { amount: 8800, payment: "PayPay" },
      status: "ok"
    },
    {
      id: 2,
      gmail: { time: "10:30", name: "鈴木 美咲", menu: "全身マッサージ 90分", amount: 13200, payment: "楽天ペイ" },
      nippo: { name: "鈴木 美咲", menu: "全身マッサージ 90分", checked: true },
      uriage: { amount: 12000, payment: "楽天ペイ" },
      status: "diff",
      diffDetail: "売上金額が異なります（Gmail: ¥13,200 / 売上集計: ¥12,000）",
      checkService: ["楽天ペイ"]
    },
    {
      id: 3,
      gmail: { time: "12:00", name: "佐藤 陽子", menu: "ヘッドスパ 45分", amount: 6600, payment: "Airレジ" },
      nippo: null,
      uriage: { amount: 6600, payment: "Airレジ" },
      status: "miss",
      diffDetail: "日報にチェックがありません",
      checkService: ["Airレジ"]
    },
    {
      id: 4,
      gmail: { time: "13:30", name: "山田 真由", menu: "フェイシャル 90分", amount: 15400, payment: "PayPay" },
      nippo: { name: "山田 真由", menu: "フェイシャル 90分", checked: true },
      uriage: { amount: 15400, payment: "PayPay" },
      status: "ok"
    },
    {
      id: 5,
      gmail: { time: "15:00", name: "伊藤 さくら", menu: "ボディケア 60分", amount: 9900, payment: "Airレジ" },
      nippo: { name: "伊藤 さくら", menu: "ボディケア 60分", checked: false },
      uriage: null,
      status: "miss",
      diffDetail: "売上集計に記録がありません",
      checkService: ["Airレジ"]
    },
    {
      id: 6,
      gmail: { time: "16:30", name: "中村 恵", menu: "フェイシャル 60分", amount: 8800, payment: "楽天ペイ" },
      nippo: { name: "中村 恵", menu: "フェイシャル 60分", checked: true },
      uriage: { amount: 8800, payment: "Airレジ" },
      status: "diff",
      diffDetail: "決済方法が異なります（Gmail: 楽天ペイ / 売上集計: Airレジ）",
      checkService: ["楽天ペイ", "Airレジ"]
    },
    {
      id: 7,
      gmail: { time: "18:00", name: "小林 ゆり", menu: "全身マッサージ 60分", amount: 9900, payment: "PayPay" },
      nippo: { name: "小林 ゆり", menu: "全身マッサージ 60分", checked: true },
      uriage: { amount: 9900, payment: "PayPay" },
      status: "ok"
    }
  ]
};

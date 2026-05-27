-- =============================================
-- 売上集計テーブル
-- Supabase の SQL Editor に貼り付けて実行してください
-- =============================================

CREATE TABLE uriage (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  date           DATE        NOT NULL,               -- 施術日
  customer_name  TEXT        NOT NULL,               -- 顧客名
  menu           TEXT,                               -- メニュー名
  amount         INTEGER     NOT NULL,               -- 金額（円）
  payment_method TEXT        NOT NULL,               -- 決済方法: 'Airレジ' | 'PayPay' | '楽天ペイ'
  status         TEXT        DEFAULT 'unverified',   -- 'ok' | 'diff' | 'miss' | 'unverified'
  notes          TEXT,                               -- 備考・メモ
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 日付での絞り込みを高速化
CREATE INDEX idx_uriage_date ON uriage (date);

-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON uriage
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security（認証前の開発用：全操作を許可）
ALTER TABLE uriage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev_allow_all" ON uriage FOR ALL USING (true) WITH CHECK (true);

-- サンプルデータ（動作確認用）
INSERT INTO uriage (date, customer_name, menu, amount, payment_method, status) VALUES
  ('2026-05-27', '田中 花子',   'フェイシャル 60分',   8800,  'PayPay',  'ok'),
  ('2026-05-27', '鈴木 美咲',   '全身マッサージ 90分', 13200, '楽天ペイ', 'diff'),
  ('2026-05-27', '佐藤 陽子',   'ヘッドスパ 45分',     6600,  'Airレジ', 'miss'),
  ('2026-05-27', '山田 真由',   'フェイシャル 90分',   15400, 'PayPay',  'ok'),
  ('2026-05-27', '伊藤 さくら', 'ボディケア 60分',     9900,  'Airレジ', 'miss'),
  ('2026-05-27', '中村 恵',     'フェイシャル 60分',   8800,  '楽天ペイ', 'diff'),
  ('2026-05-27', '小林 ゆり',   '全身マッサージ 60分', 9900,  'PayPay',  'ok');

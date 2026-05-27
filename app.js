// ── モックデータ（バックエンド接続後に差し替え） ──────────────────

const MOCK_GMAIL = [
  { date: '2026-05-26', therapist: '田中　みく', treatment: 'フェイシャル 60分', amount: 8800, payment: 'PayPay' },
  { date: '2026-05-26', therapist: '佐藤　はるか', treatment: 'ボディケア 90分', amount: 12100, payment: '楽天ペイ' },
  { date: '2026-05-26', therapist: '鈴木　あい', treatment: 'ヘッドスパ 45分', amount: 5500, payment: 'Airレジ' },
  { date: '2026-05-26', therapist: '田中　みく', treatment: 'まつ毛パーマ', amount: 7700, payment: 'PayPay' },
  { date: '2026-05-27', therapist: '佐藤　はるか', treatment: 'フェイシャル 60分', amount: 8800, payment: '楽天ペイ' },
  { date: '2026-05-27', therapist: '田中　みく', treatment: 'ボディケア 60分', amount: 9900, payment: 'PayPay' },
  { date: '2026-05-27', therapist: '山田　りな', treatment: 'ネイル', amount: 6600, payment: 'Airレジ' },
  { date: '2026-05-27', therapist: '鈴木　あい', treatment: 'ヘッドスパ 60分', amount: 7150, payment: 'PayPay' },
];

const MOCK_DAILY = [
  { date: '2026-05-26', therapist: '田中　みく', treatment: 'フェイシャル 60分' },
  { date: '2026-05-26', therapist: '佐藤　はるか', treatment: 'ボディケア 90分' },
  // 鈴木 2026-05-26 は日報なし（→差異）
  { date: '2026-05-26', therapist: '田中　みく', treatment: 'まつ毛パーマ' },
  { date: '2026-05-27', therapist: '佐藤　はるか', treatment: 'フェイシャル 60分' },
  { date: '2026-05-27', therapist: '田中　みく', treatment: 'ボディケア 60分' },
  { date: '2026-05-27', therapist: '山田　りな', treatment: 'ネイル' },
  { date: '2026-05-27', therapist: '鈴木　あい', treatment: 'ヘッドスパ 60分' },
  // 日報のみ存在（Gmailにない施術）→差異
  { date: '2026-05-27', therapist: '伊藤　えり', treatment: 'アイブロウ' },
];

const MOCK_SALES = [
  { date: '2026-05-26', therapist: '田中　みく', treatment: 'フェイシャル 60分', amount: 8800 },
  { date: '2026-05-26', therapist: '佐藤　はるか', treatment: 'ボディケア 90分', amount: 12100 },
  { date: '2026-05-26', therapist: '鈴木　あい', treatment: 'ヘッドスパ 45分', amount: 5000 }, // 金額ズレ（差異）
  { date: '2026-05-26', therapist: '田中　みく', treatment: 'まつ毛パーマ', amount: 7700 },
  { date: '2026-05-27', therapist: '佐藤　はるか', treatment: 'フェイシャル 60分', amount: 8800 },
  { date: '2026-05-27', therapist: '田中　みく', treatment: 'ボディケア 60分', amount: 9900 },
  { date: '2026-05-27', therapist: '山田　りな', treatment: 'ネイル', amount: 6600 },
  { date: '2026-05-27', therapist: '鈴木　あい', treatment: 'ヘッドスパ 60分', amount: 7150 },
  // 売上集計のみ（Gmail・日報にない）→差異
  { date: '2026-05-27', therapist: '伊藤　えり', treatment: 'アイブロウ', amount: 4400 },
];

// ── 照合ロジック ───────────────────────────────────────────────

function key(date, therapist, treatment) {
  return `${date}__${therapist}__${treatment}`;
}

function reconcile(from, to) {
  const fromDate = from || '1900-01-01';
  const toDate   = to   || '9999-12-31';

  const gmailMap = new Map();
  const dailyMap = new Map();
  const salesMap = new Map();

  for (const r of MOCK_GMAIL) {
    if (r.date >= fromDate && r.date <= toDate)
      gmailMap.set(key(r.date, r.therapist, r.treatment), r);
  }
  for (const r of MOCK_DAILY) {
    if (r.date >= fromDate && r.date <= toDate)
      dailyMap.set(key(r.date, r.therapist, r.treatment), r);
  }
  for (const r of MOCK_SALES) {
    if (r.date >= fromDate && r.date <= toDate)
      salesMap.set(key(r.date, r.therapist, r.treatment), r);
  }

  const allKeys = new Set([...gmailMap.keys(), ...dailyMap.keys(), ...salesMap.keys()]);
  const rows = [];

  for (const k of allKeys) {
    const g = gmailMap.get(k) || null;
    const d = dailyMap.get(k) || null;
    const s = salesMap.get(k) || null;

    const ref = g || d || s;
    const gmailAmount = g ? g.amount : null;
    const salesAmount = s ? s.amount : null;
    const diff = (gmailAmount !== null && salesAmount !== null)
      ? salesAmount - gmailAmount
      : null;

    let dailyStatus, salesStatus, overallStatus;

    if (g && d)       dailyStatus = '一致';
    else if (g && !d) dailyStatus = 'Gmail のみ';
    else if (!g && d) dailyStatus = '日報のみ';
    else              dailyStatus = '―';

    if (diff === null)    salesStatus = g ? '売上なし' : 'Gmail なし';
    else if (diff === 0)  salesStatus = '一致';
    else                  salesStatus = `¥${Math.abs(diff).toLocaleString()} ズレ`;

    const hasDiff = dailyStatus !== '一致' || diff !== 0;
    if (!hasDiff)                                   overallStatus = 'ok';
    else if (diff !== null && diff !== 0)            overallStatus = 'error';
    else                                             overallStatus = 'warn';

    const checkServices = [];
    if (hasDiff && g) {
      if (g.payment) checkServices.push(g.payment);
    }
    if (!checkServices.length && hasDiff) {
      checkServices.push('Airレジ', 'PayPay', '楽天ペイ');
    }

    rows.push({
      date: ref.date,
      therapist: ref.therapist,
      treatment: ref.treatment,
      hasGmail: !!g,
      hasDaily: !!d,
      hasSales: !!s,
      dailyStatus,
      salesStatus,
      gmailAmount,
      salesAmount,
      diff,
      payment: g ? g.payment : null,
      checkServices: hasDiff ? checkServices : [],
      overallStatus,
    });
  }

  rows.sort((a, b) => a.date.localeCompare(b.date) || a.therapist.localeCompare(b.therapist));
  return rows;
}

// ── 描画 ──────────────────────────────────────────────────────

function fmt(amount) {
  if (amount === null || amount === undefined) return '<span style="color:#cbd5e1">―</span>';
  return '¥' + amount.toLocaleString();
}

function diffCell(diff) {
  if (diff === null) return '<span style="color:#cbd5e1">―</span>';
  if (diff === 0)    return '<span class="amount-diff zero">±0</span>';
  const sign = diff > 0 ? '+' : '';
  const cls  = diff > 0 ? 'positive' : 'negative';
  return `<span class="amount-diff ${cls}">${sign}¥${Math.abs(diff).toLocaleString()}</span>`;
}

function statusBadge(status, label) {
  const map = { ok: 'badge-ok', warn: 'badge-warn', error: 'badge-error', none: 'badge-none' };
  const cls = map[status] || 'badge-none';
  return `<span class="badge ${cls}">${label}</span>`;
}

function dailyBadge(status) {
  if (status === '一致')       return statusBadge('ok', status);
  if (status === 'Gmail のみ') return statusBadge('warn', status);
  if (status === '日報のみ')   return statusBadge('warn', status);
  return `<span style="color:#cbd5e1">―</span>`;
}

function overallBadge(status) {
  if (status === 'ok')    return statusBadge('ok', '一致');
  if (status === 'warn')  return statusBadge('warn', '要確認');
  if (status === 'error') return statusBadge('error', '差異あり');
  return '';
}

function renderTable(rows, filter) {
  const body = document.getElementById('result-body');
  const displayRows = filter === 'diff' ? rows.filter(r => r.overallStatus !== 'ok') : rows;

  if (displayRows.length === 0) {
    body.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:40px;color:#94a3b8;">
      ${filter === 'diff' ? '差異はありません ✅' : 'データがありません'}
    </td></tr>`;
    document.getElementById('result-count').textContent = '0 件';
    return;
  }

  document.getElementById('result-count').textContent = `${displayRows.length} 件`;

  body.innerHTML = displayRows.map(r => {
    const checkHtml = r.checkServices.length
      ? r.checkServices.map(s => `<span class="check-tag">${s}</span>`).join('')
      : '<span style="color:#cbd5e1">―</span>';
    const paymentHtml = r.payment
      ? `<span class="payment-tag">${r.payment}</span>`
      : '<span style="color:#cbd5e1">―</span>';

    return `<tr class="row-${r.overallStatus}">
      <td>${r.date}</td>
      <td>${r.therapist}</td>
      <td>${r.hasGmail ? r.treatment : '<span style="color:#cbd5e1">記録なし</span>'}</td>
      <td>${r.hasDaily ? r.treatment : '<span style="color:#cbd5e1">記録なし</span>'}</td>
      <td>${dailyBadge(r.dailyStatus)}</td>
      <td class="amount">${fmt(r.gmailAmount)}</td>
      <td class="amount">${fmt(r.salesAmount)}</td>
      <td>${diffCell(r.diff)}</td>
      <td>${paymentHtml}</td>
      <td><div class="check-list">${checkHtml}</div></td>
      <td>${overallBadge(r.overallStatus)}</td>
    </tr>`;
  }).join('');
}

// ── 初期化 ────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  document.getElementById('date-from').value = weekAgo;
  document.getElementById('date-to').value   = today;

  let currentRows = [];
  let currentFilter = 'all';

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      if (currentRows.length) renderTable(currentRows, currentFilter);
    });
  });

  document.getElementById('run-btn').addEventListener('click', () => {
    const from = document.getElementById('date-from').value;
    const to   = document.getElementById('date-to').value;

    document.getElementById('empty-state').style.display   = 'none';
    document.getElementById('result-section').style.display = 'none';
    document.getElementById('summary-row').style.display   = 'none';
    document.getElementById('loading').style.display       = 'flex';
    document.getElementById('run-btn').classList.add('loading');

    setTimeout(() => {
      currentRows = reconcile(from, to);
      const diffCount = currentRows.filter(r => r.overallStatus !== 'ok').length;

      document.getElementById('s-gmail').textContent  = MOCK_GMAIL.filter(r => r.date >= from && r.date <= to).length;
      document.getElementById('s-report').textContent = MOCK_DAILY.filter(r => r.date >= from && r.date <= to).length;
      document.getElementById('s-sales').textContent  = MOCK_SALES.filter(r => r.date >= from && r.date <= to).length;
      document.getElementById('s-diff').textContent   = diffCount;

      renderTable(currentRows, currentFilter);

      document.getElementById('loading').style.display        = 'none';
      document.getElementById('summary-row').style.display    = 'grid';
      document.getElementById('result-section').style.display = 'block';
      document.getElementById('run-btn').classList.remove('loading');

      // 凡例を差し込む（1回だけ）
      if (!document.querySelector('.legend')) {
        document.querySelector('.result-section').insertAdjacentHTML('beforeend', `
          <div class="legend">
            <span class="legend-item"><span class="legend-dot dot-ok"></span>一致</span>
            <span class="legend-item"><span class="legend-dot dot-warn"></span>要確認（片方のみ）</span>
            <span class="legend-item"><span class="legend-dot dot-error"></span>差異あり（金額ズレ）</span>
          </div>
        `);
      }
    }, 800);
  });
});

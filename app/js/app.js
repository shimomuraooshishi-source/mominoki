// ===== Supabase 接続チェック =====
function isSupabaseReady() {
  return (
    typeof supabase !== 'undefined' &&
    SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
    SUPABASE_KEY !== 'YOUR_SUPABASE_ANON_KEY'
  );
}

// ===== Supabase: 売上集計を取得 =====
async function fetchUriageFromSupabase(date) {
  const { data, error } = await supabase
    .from('uriage')
    .select('*')
    .eq('date', date)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// ===== Supabase: 売上集計を保存（upsert）=====
async function saveUriageToSupabase(record) {
  const { data, error } = await supabase
    .from('uriage')
    .upsert(record, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===== Supabase の売上データをサンプル形式に変換 =====
function convertSupabaseToRows(uriageList, sampleRows) {
  // Gmail と日報はサンプルデータを維持しつつ、売上部分を Supabase データで差し替える
  return sampleRows.map((row, i) => {
    const uriage = uriageList[i] ?? null;
    if (!uriage) return { ...row, uriage: null, status: 'miss', diffDetail: '売上集計に記録がありません', checkService: ['Airレジ', 'PayPay', '楽天ペイ'] };

    const amountDiff   = uriage.amount        !== row.gmail.amount;
    const paymentDiff  = uriage.payment_method !== row.gmail.payment;
    const status       = (amountDiff || paymentDiff) ? 'diff' : uriage.status === 'ok' ? 'ok' : row.status;
    const diffDetail   = amountDiff
      ? `売上金額が異なります（Gmail: ¥${row.gmail.amount.toLocaleString()} / 売上集計: ¥${uriage.amount.toLocaleString()}）`
      : paymentDiff
      ? `決済方法が異なります（Gmail: ${row.gmail.payment} / 売上集計: ${uriage.payment_method}）`
      : '';

    const checkService = [];
    if (amountDiff || paymentDiff) {
      if (uriage.payment_method === 'Airレジ' || row.gmail.payment === 'Airレジ') checkService.push('Airレジ');
      if (uriage.payment_method === 'PayPay'  || row.gmail.payment === 'PayPay')  checkService.push('PayPay');
      if (uriage.payment_method === '楽天ペイ' || row.gmail.payment === '楽天ペイ') checkService.push('楽天ペイ');
    }

    return {
      ...row,
      uriage: { amount: uriage.amount, payment: uriage.payment_method, id: uriage.id },
      status,
      diffDetail: diffDetail || undefined,
      checkService: checkService.length ? checkService : undefined
    };
  });
}

// ===== ログイン =====
document.getElementById('btn-login').addEventListener('click', () => {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'block';
  loadData();
});

// ===== 照合実行 =====
document.getElementById('btn-sync').addEventListener('click', loadData);

// ===== フィルター =====
let currentFilter = 'all';
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTable(currentRows);
  });
});

// ===== データ読み込み・描画 =====
let currentRows = [];

async function loadData() {
  const date = document.getElementById('date-picker').value;
  const sampleRows = SAMPLE_DATA[date] || [];

  setLoading(true);

  try {
    let rows = sampleRows;

    if (isSupabaseReady()) {
      const uriageList = await fetchUriageFromSupabase(date);
      rows = convertSupabaseToRows(uriageList, sampleRows);
      updateTimestamp();
    } else {
      showConnectionBanner();
    }

    currentRows = rows;
    renderSummary(rows);
    renderAlert(rows);
    renderTable(rows);
  } catch (err) {
    showError('Supabase からのデータ取得に失敗しました: ' + err.message);
  } finally {
    setLoading(false);
  }
}

// ===== ローディング状態 =====
function setLoading(on) {
  const btn = document.getElementById('btn-sync');
  btn.textContent = on ? '読み込み中…' : '照合を実行';
  btn.disabled    = on;
}

function updateTimestamp() {
  const now = new Date();
  const ts  = now.toLocaleDateString('ja-JP') + ' ' + now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  document.querySelector('.sync-timestamp').textContent = '最終取得: ' + ts;
}

function showConnectionBanner() {
  const existing = document.getElementById('connection-banner');
  if (existing) return;
  const banner = document.createElement('div');
  banner.id = 'connection-banner';
  banner.style.cssText = 'background:#eff6ff;border:1.5px solid #3b82f6;border-radius:10px;padding:12px 16px;font-size:13px;color:#1e40af;margin-bottom:16px;';
  banner.innerHTML = '⚡ Supabase 未接続のためサンプルデータを表示中です。<strong>js/supabase-config.js</strong> に URL と Key を設定してください。';
  document.querySelector('.main-content').insertBefore(banner, document.querySelector('.summary-grid'));
}

function showError(msg) {
  const banner = document.getElementById('alert-banner');
  banner.querySelector('strong').textContent = msg;
  banner.classList.add('show');
}

// ===== サマリー描画 =====
function renderSummary(data) {
  const gmailCount = data.length;
  const nippoCount = data.filter(r => r.nippo && r.nippo.checked).length;
  const totalSales = data.reduce((s, r) => s + (r.uriage ? r.uriage.amount : 0), 0);
  const diffCount  = data.filter(r => r.status !== 'ok').length;

  document.getElementById('val-gmail').innerHTML  = `${gmailCount}<span class="card-unit">件</span>`;
  document.getElementById('val-nippo').innerHTML  = `${nippoCount}<span class="card-unit">件</span>`;
  document.getElementById('val-uriage').textContent = '¥' + totalSales.toLocaleString();
  document.getElementById('val-diff').innerHTML   = `${diffCount}<span class="card-unit">件</span>`;
  document.getElementById('val-diff').style.color = diffCount > 0 ? 'var(--color-danger)' : '#22c55e';
}

// ===== アラートバナー描画 =====
function renderAlert(data) {
  const diffRows = data.filter(r => r.status !== 'ok');
  const banner   = document.getElementById('alert-banner');
  const links    = document.getElementById('alert-links');

  if (diffRows.length === 0) {
    banner.classList.remove('show');
    return;
  }

  const services = [...new Set(diffRows.flatMap(r => r.checkService || []))];
  links.innerHTML = services.map(s => `<button class="alert-link">${s} を確認</button>`).join('');
  document.getElementById('alert-count').textContent = diffRows.length;
  banner.querySelector('strong').textContent = `${diffRows.length} 件の差異が見つかりました。`;
  banner.classList.add('show');
}

// ===== テーブル描画 =====
function renderTable(data) {
  const tbody    = document.getElementById('table-body');
  const filtered = currentFilter === 'all' ? data : data.filter(r => r.status === currentFilter);

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="9">
        <div class="empty-state">
          <div class="empty-icon">${currentFilter === 'all' ? '📅' : '✅'}</div>
          <p>${currentFilter === 'all' ? '選択した日付のデータがありません' : '該当する差異はありません'}</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((row, i) => {
    const statusBadge = {
      ok:   '<span class="badge badge-ok">一致</span>',
      diff: '<span class="badge badge-diff">差異あり</span>',
      miss: '<span class="badge badge-miss">記録なし</span>'
    }[row.status] ?? '';

    const rowClass = { ok: 'row-ok', diff: 'row-diff', miss: 'row-miss' }[row.status] ?? '';

    const nippoCheck = row.nippo
      ? (row.nippo.checked ? '✅ チェック済み' : '⬜ 未チェック')
      : '<span class="cell-miss">―</span>';

    const nippoName = row.nippo
      ? row.nippo.name
      : '<span class="cell-miss">―</span>';

    const uriageAmt = row.uriage
      ? `<span class="${row.status === 'diff' && row.uriage.amount !== row.gmail.amount ? 'cell-diff' : ''}">¥${row.uriage.amount.toLocaleString()}</span>`
      : '<span class="cell-miss">―</span>';

    const uriagePay = row.uriage
      ? `<span class="${row.status === 'diff' && row.uriage.payment !== row.gmail.payment ? 'cell-diff' : ''}">${row.uriage.payment}</span>`
      : '<span class="cell-miss">―</span>';

    const checkBadges = (row.checkService || []).map(s => {
      const cls = s === 'Airレジ' ? 'airegi' : s === 'PayPay' ? 'paypay' : 'rakuten';
      return `<span class="check-badge ${cls}">⚠ ${s}</span>`;
    }).join(' ');

    return `
      <tr class="${rowClass}" style="animation-delay:${i * 0.04}s">
        <td>${statusBadge}</td>
        <td>${row.gmail.time}</td>
        <td>${row.gmail.name}</td>
        <td>¥${row.gmail.amount.toLocaleString()}<span class="sub-label">${row.gmail.payment}</span></td>
        <td>${nippoName}</td>
        <td>${nippoCheck}</td>
        <td class="allow-wrap">${uriageAmt}<span class="sub-label">${uriagePay}</span></td>
        <td class="allow-wrap">${row.diffDetail ? `<span class="diff-text">${row.diffDetail}</span>` : ''}</td>
        <td>${checkBadges}</td>
      </tr>`;
  }).join('');
}

// 初期日付を今日にセット
document.getElementById('date-picker').value = '2026-05-27';

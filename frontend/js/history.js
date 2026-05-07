const API = "http://localhost:3000";
let currentPage = 1;

async function loadHistory(page = 1) {
  currentPage = page;
  const label     = document.getElementById("filter-label").value;
  const riskLevel = document.getElementById("filter-risk").value;

  const params = new URLSearchParams({ page, limit: 20 });
  if (label)     params.set("label", label);
  if (riskLevel) params.set("riskLevel", riskLevel);

  document.getElementById("history-body").innerHTML =
    `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:2rem">Loading...</td></tr>`;

  try {
    const res  = await fetch(`${API}/transactions?${params}`);
    const data = await res.json();
    renderTable(data.transactions);
    renderPagination(data.pages, page, data.total);
  } catch (err) {
    document.getElementById("history-body").innerHTML =
      `<tr><td colspan="7" style="color:var(--danger);padding:1rem;text-align:center">⚠️ Cannot connect. Is Node running on port 3000?</td></tr>`;
  }
}

function renderTable(rows) {
  const tbody = document.getElementById("history-body");
  if (!rows || !rows.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p>No transactions found. <a href="predict.html" style="color:var(--primary)">Analyze one →</a></p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(tx => `
    <tr>
      <td><span style="font-family:monospace;font-size:.8rem;color:var(--muted)" title="${tx.transactionId}">${tx.transactionId.slice(0,8)}…</span></td>
      <td><strong>$${tx.amount.toFixed(2)}</strong></td>
      <td><span style="color:${tx.prediction ? "var(--danger)" : "var(--success)"};font-weight:500">${tx.prediction ? "🚨 Fraud" : "✅ Legit"}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="background:#e2e8f0;border-radius:999px;height:6px;width:60px;overflow:hidden">
            <div style="height:100%;width:${(tx.riskScore*100).toFixed(1)}%;background:${riskColor(tx.riskLevel)};border-radius:999px"></div>
          </div>
          <span>${(tx.riskScore*100).toFixed(1)}%</span>
        </div>
      </td>
      <td><span class="risk-badge risk-${tx.riskLevel}">${tx.riskLevel}</span></td>
      <td>${tx.alertSent ? `<span style="color:var(--warning)">⚠️ Yes</span>` : `<span style="color:var(--muted)">—</span>`}</td>
      <td style="color:var(--muted);font-size:.82rem;white-space:nowrap">${new Date(tx.createdAt).toLocaleString()}</td>
    </tr>`).join("");
}

function renderPagination(totalPages, current, total) {
  const container = document.getElementById("pagination");
  if (totalPages <= 1) { container.innerHTML = ""; return; }

  let btns = `<button class="page-btn" onclick="loadHistory(${current-1})" ${current===1?"disabled":""}>‹</button>`;
  for (let p = 1; p <= totalPages; p++) {
    btns += `<button class="page-btn ${p===current?"active":""}" onclick="loadHistory(${p})">${p}</button>`;
  }
  btns += `<button class="page-btn" onclick="loadHistory(${current+1})" ${current===totalPages?"disabled":""}>›</button>`;
  btns += `<span style="font-size:.8rem;color:var(--muted);margin-left:.5rem;align-self:center">${total} total</span>`;
  container.innerHTML = btns;
}

function riskColor(level) {
  return { LOW:"#16a34a", MEDIUM:"#d97706", HIGH:"#ea580c", CRITICAL:"#7c3aed" }[level] || "#64748b";
}

loadHistory(1);
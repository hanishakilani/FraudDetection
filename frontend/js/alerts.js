const API = "http://localhost:3000";
Chart.defaults.color       = "#94a3b8";
Chart.defaults.font.family = "'Space Grotesk', sans-serif";

const liveAlerts  = [];
const aiActivity  = [];

// WebSocket for live alerts
const socket = io(API);
socket.on("fraud-alert", tx => {
  liveAlerts.unshift({ ...tx, time: new Date() });
  if (liveAlerts.length > 15) liveAlerts.pop();
  renderLiveAlerts();
});
socket.on("new-transaction", tx => {
  if (tx.prediction === 0) {
    aiActivity.unshift({
      type:    "success",
      icon:    "✅",
      label:   "Transaction Cleared",
      message: `$${parseFloat(tx.amount).toFixed(2)} — No fraud detected`,
      time:    new Date()
    });
    if (aiActivity.length > 20) aiActivity.pop();
    renderAIActivity();
  }
});
socket.on("fraud-alert", tx => {
  const types = [
    { icon:"🚨", label:"Unusual Transaction Alert" },
    { icon:"🔐", label:"Security Breach Detected" },
    { icon:"⚠️", label:"Fraudulent Login Alert" },
    { icon:"🛡", label:"Security Detect Alert" },
    { icon:"🔍", label:"Annual Transaction Alert" }
  ];
  const t = types[Math.floor(Math.random() * types.length)];
  aiActivity.unshift({
    type:    "danger",
    icon:    t.icon,
    label:   t.label,
    message: `$${parseFloat(tx.amount).toFixed(2)} — Risk ${tx.riskLevel}`,
    time:    new Date()
  });
  if (aiActivity.length > 20) aiActivity.pop();
  renderAIActivity();
});

function renderLiveAlerts() {
  const el = document.getElementById("live-alerts-feed");
  if (!liveAlerts.length) {
    el.innerHTML = `<div class="empty-state"><div class="icon">🔔</div><p style="font-size:.85rem">Waiting for alerts...</p></div>`;
    return;
  }
  el.innerHTML = liveAlerts.map(a => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:.75rem 0;border-bottom:1px solid var(--border)">
      <span class="glow-dot red" style="margin-top:4px;flex-shrink:0"></span>
      <div style="flex:1">
        <div style="font-weight:600;font-size:.85rem;color:var(--red-lt)">
          🚨 Fraud — $${parseFloat(a.amount).toFixed(2)}
        </div>
        <div style="font-size:.75rem;color:var(--text2);margin-top:2px">
          Risk: <span class="risk-badge risk-${a.riskLevel}" style="font-size:.65rem">${a.riskLevel}</span>
          Score: ${(a.riskScore*100).toFixed(1)}%
        </div>
      </div>
      <div style="font-size:.7rem;color:var(--text3);white-space:nowrap">${a.time.toLocaleTimeString()}</div>
    </div>`).join("");
}

function renderAIActivity() {
  const el = document.getElementById("ai-activity-feed");
  const colors = { danger:"var(--red-lt)", success:"var(--green-lt)", info:"var(--cyan-lt)", warning:"var(--amber-lt)" };
  if (!aiActivity.length) {
    el.innerHTML = `<div class="empty-state"><div class="icon">🤖</div><p style="font-size:.85rem">No activity yet</p></div>`;
    return;
  }
  el.innerHTML = aiActivity.map(a => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:.75rem 0;border-bottom:1px solid var(--border)">
      <span style="font-size:1rem;flex-shrink:0">${a.icon}</span>
      <div style="flex:1">
        <div style="font-weight:600;font-size:.84rem;color:${colors[a.type]||"var(--text)"}">${a.label}</div>
        <div style="font-size:.76rem;color:var(--text2);margin-top:2px">${a.message}</div>
      </div>
      <div style="font-size:.7rem;color:var(--text3);white-space:nowrap">${a.time.toLocaleTimeString()}</div>
    </div>`).join("");
}

async function loadAlertsData() {
  try {
    const [statsRes, txRes] = await Promise.all([
      fetch(`${API}/dashboard/stats`),
      fetch(`${API}/transactions?limit=50`)
    ]);
    const stats = await statsRes.json();
    const txs   = await txRes.json();

    renderGauge(stats.stats);
    renderAuditTracker(stats.stats);
    seedAIActivity(txs.transactions || []);

  } catch (err) {
    console.error("Alerts page error:", err);
  }
}

function renderGauge(stats) {
  const fraudRate = parseFloat(stats.fraudRate || 0);
  const score     = (fraudRate * 10).toFixed(1); // scale to 0-10
  const label     = fraudRate < 2 ? "Low Risk" : fraudRate < 5 ? "Medium Risk" : "High Risk";
  const color     = fraudRate < 2 ? "#10b981" : fraudRate < 5 ? "#f59e0b" : "#ef4444";

  document.getElementById("gauge-value").textContent = score;
  document.getElementById("gauge-value").style.color = color;
  document.getElementById("gauge-label").textContent = label;

  // Draw gauge using Chart.js doughnut
  const remaining = 10 - parseFloat(score);
  new Chart(document.getElementById("gaugeChart"), {
    type: "doughnut",
    data: {
      datasets: [{
        data: [parseFloat(score), remaining],
        backgroundColor: [color, "rgba(255,255,255,0.05)"],
        borderColor: [color, "rgba(255,255,255,0.08)"],
        borderWidth: 1,
        circumference: 270,
        rotation: 225
      }]
    },
    options: {
      cutout: "75%",
      plugins: { legend: { display:false }, tooltip: { enabled:false } },
      animation: { animateRotate: true, duration: 1200 }
    }
  });

  // Country/category breakdown (simulated from real stats)
  const categories = [
    { name: "Critical transactions", score: (fraudRate * 1.8).toFixed(1), color: "#ef4444" },
    { name: "High-risk transactions", score: (fraudRate * 1.4).toFixed(1), color: "#f59e0b" },
    { name: "Medium-risk transactions", score: (fraudRate * 0.9).toFixed(1), color: "#06b6d4" },
    { name: "Low-risk transactions",  score: (fraudRate * 0.4).toFixed(1), color: "#10b981" },
    { name: "Cleared transactions",   score: "0.0",                         color: "#6ee7b7" },
  ];

  const maxScore = Math.max(...categories.map(c => parseFloat(c.score)), 1);
  document.getElementById("score-breakdown-list").innerHTML = categories.map(c => `
    <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.6rem;font-size:.78rem">
      <div style="width:8px;height:8px;border-radius:50%;background:${c.color};flex-shrink:0"></div>
      <div style="flex:1;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.name}</div>
      <div style="min-width:80px">
        <div style="background:rgba(255,255,255,.06);border-radius:99px;height:4px;overflow:hidden">
          <div style="height:100%;width:${(parseFloat(c.score)/maxScore*100).toFixed(0)}%;background:${c.color};border-radius:99px"></div>
        </div>
      </div>
      <div style="min-width:28px;text-align:right;font-family:var(--mono);color:var(--text)">${c.score}</div>
    </div>`).join("");
}

function renderAuditTracker(stats) {
  const total    = stats.total    || 0;
  const fraudPct = parseFloat(stats.fraudRate || 0);
  const legitPct = (100 - fraudPct).toFixed(1);
  const audits   = Math.max(1, Math.floor(total / 20));

  document.getElementById("audit-count").textContent = audits;

  document.getElementById("audit-metrics").innerHTML = [
    { label:"Legitimate rate", value: legitPct + "%", color:"var(--green-lt)" },
    { label:"Fraud rate",      value: fraudPct.toFixed(1) + "%", color:"var(--red-lt)" },
    { label:"Total reviewed",  value: total.toLocaleString(),  color:"var(--purple-lt)" },
  ].map(m => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem .75rem;background:rgba(255,255,255,.03);border-radius:8px;font-size:.83rem">
      <span style="color:var(--text2)">${m.label}</span>
      <span style="font-weight:600;font-family:var(--mono);color:${m.color}">${m.value}</span>
    </div>`).join("");

  document.getElementById("audit-insights").innerHTML = [
    { icon:"📊", text: `${total} total transactions analyzed across all sessions` },
    { icon:"🚨", text: `${stats.fraud || 0} fraud cases detected and logged` },
    { icon:"🤖", text: `Combined RF + Isolation Forest model active` },
    { icon:"📧", text: `Email alerts configured for HIGH/CRITICAL risk` },
  ].map(i => `
    <div style="display:flex;align-items:flex-start;gap:8px;font-size:.8rem;color:var(--text2);padding:.3rem 0">
      <span style="font-size:.9rem;flex-shrink:0">${i.icon}</span>
      <span>${i.text}</span>
    </div>`).join("");
}

function seedAIActivity(transactions) {
  if (!transactions.length) return;
  const actions = [
    { icon:"🔍", label:"Unusual Transaction Alert",  type:"warning" },
    { icon:"🛡",  label:"Annual Transactions Alert",  type:"info"    },
    { icon:"🔐", label:"Security Breach Analysis",   type:"danger"  },
    { icon:"⚠️", label:"Fraudulent Pattern Alert",   type:"danger"  },
    { icon:"🤖", label:"ML Model Prediction Run",    type:"info"    },
    { icon:"✅", label:"Transaction Cleared",        type:"success" },
  ];

  transactions.slice(0, 10).forEach((tx, i) => {
    const a = actions[i % actions.length];
    aiActivity.push({
      ...a,
      message: `$${tx.amount.toFixed(2)} — ${tx.label} (${(tx.riskScore*100).toFixed(1)}% risk)`,
      time:    new Date(tx.createdAt)
    });
  });
  renderAIActivity();
}

loadAlertsData();
renderLiveAlerts();
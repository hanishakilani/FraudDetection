const API = "http://localhost:3000";

async function loadAnalytics() {
  try {
    const res  = await fetch(`${API}/analytics/overview`);
    const data = await res.json();
    renderHourly(data.hourlyFraud);
    renderAmount(data.amountBuckets);
    renderTrend(data.weeklyTrend);
    renderTop10(data.top10Risky);
    renderRiskMatrix(data.riskDistribution);
  } catch (err) {
    console.error("Analytics error:", err);
  }
}

function renderHourly(hourly) {
  const hours  = Array.from({length:24}, (_,i) => `${i}:00`);
  const counts = Array(24).fill(0);
  hourly.forEach(h => { counts[h._id] = h.count; });

  new Chart(document.getElementById("hourChart"), {
    type: "bar",
    data: {
      labels: hours,
      datasets: [{
        label: "Fraud count",
        data: counts,
        backgroundColor: counts.map(c =>
          c > 10 ? "#dc2626" : c > 5 ? "#ea580c" : "#d97706"
        ),
        borderRadius: 4
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } }
    }
  });
}

function renderAmount(buckets) {
  const labels = ["$0-10","$10-50","$50-100","$100-500","$500-1k","$1k-5k","$5k+"];
  const fraud  = buckets.slice(0, labels.length).map(b => b.fraud  || 0);
  const total  = buckets.slice(0, labels.length).map(b => b.total  || 0);

  new Chart(document.getElementById("amountChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Fraud",  data: fraud, backgroundColor: "#dc2626", borderRadius: 4 },
        { label: "Legit",  data: total.map((t,i) => t - fraud[i]), backgroundColor: "#e2e8f0", borderRadius: 4 }
      ]
    },
    options: {
      plugins: { legend: { position: "bottom" } },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

function renderTrend(trend) {
  new Chart(document.getElementById("trendChart"), {
    type: "line",
    data: {
      labels: trend.map(d => d._id),
      datasets: [
        { label: "Total",  data: trend.map(d => d.total),      borderColor: "#2563eb", tension: 0.35, fill: false, pointRadius: 3 },
        { label: "Fraud",  data: trend.map(d => d.fraudCount), borderColor: "#dc2626", tension: 0.35, fill: false, pointRadius: 3 },
        { label: "Avg Risk %", data: trend.map(d => +(d.avgRisk*100).toFixed(1)), borderColor: "#d97706", tension: 0.35, fill: false, pointRadius: 3, yAxisID: "y2" }
      ]
    },
    options: {
      scales: {
        y:  { beginAtZero: true, position: "left",  ticks: { precision: 0 } },
        y2: { beginAtZero: true, position: "right", ticks: { callback: v => v+"%" }, grid: { drawOnChartArea: false } }
      },
      plugins: { legend: { position: "bottom", labels: { usePointStyle: true } } }
    }
  });
}

function renderTop10(rows) {
  const tbody = document.getElementById("top10-body");
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted)">No fraud detected yet</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(tx => {
    const reason = tx.explanation?.[0]
      ? `${tx.explanation[0].feature} (${tx.explanation[0].direction})`
      : "—";
    return `
      <tr>
        <td style="font-family:monospace;font-size:.8rem;color:var(--muted)">${tx.transactionId.slice(0,8)}…</td>
        <td><strong>$${tx.amount.toFixed(2)}</strong></td>
        <td><strong style="color:var(--danger)">${(tx.riskScore*100).toFixed(1)}%</strong></td>
        <td><span class="risk-badge risk-${tx.riskLevel}">${tx.riskLevel}</span></td>
        <td style="font-size:.82rem;color:var(--muted)">${reason}</td>
        <td style="font-size:.82rem;color:var(--muted)">${new Date(tx.createdAt).toLocaleDateString()}</td>
      </tr>`;
  }).join("");
}
function renderRiskMatrix(distribution) {
  const categories = [
    "Transaction Amount",
    "Transaction Frequency",
    "Geolocation Risk",
    "Time-of-Day Pattern",
    "Device Fingerprint",
    "Account Age Risk",
    "Velocity Check",
  ];

  const riskMap = { LOW:0, MEDIUM:0, HIGH:0, CRITICAL:0 };
  (distribution || []).forEach(d => { if(d._id) riskMap[d._id] = d.count; });
  const total = Object.values(riskMap).reduce((a,b) => a+b, 0) || 1;

  const cellColors = [
    ["rgba(16,185,129,.55)","rgba(16,185,129,.4)","rgba(245,158,11,.45)","rgba(239,68,68,.35)","rgba(239,68,68,.5)"],
    ["rgba(16,185,129,.4)","rgba(245,158,11,.4)","rgba(245,158,11,.55)","rgba(239,68,68,.45)","rgba(124,58,237,.4)"],
    ["rgba(245,158,11,.35)","rgba(245,158,11,.5)","rgba(239,68,68,.4)","rgba(124,58,237,.45)","rgba(124,58,237,.6)"],
    ["rgba(16,185,129,.45)","rgba(16,185,129,.35)","rgba(245,158,11,.4)","rgba(239,68,68,.4)","rgba(239,68,68,.55)"],
    ["rgba(245,158,11,.4)","rgba(239,68,68,.35)","rgba(239,68,68,.5)","rgba(124,58,237,.4)","rgba(124,58,237,.65)"],
    ["rgba(16,185,129,.5)","rgba(16,185,129,.4)","rgba(245,158,11,.35)","rgba(245,158,11,.5)","rgba(239,68,68,.4)"],
    ["rgba(239,68,68,.35)","rgba(239,68,68,.5)","rgba(124,58,237,.4)","rgba(124,58,237,.55)","rgba(124,58,237,.7)"],
  ];

  const scores = [
    [2,4,6,8,10],[3,5,7,9,10],[4,6,8,10,10],
    [2,4,6,8,9], [4,7,8,10,10],[2,3,5,7,9],[5,7,9,10,10]
  ];

  const tbody = document.getElementById("risk-matrix-body");
  if (!tbody) return;

  tbody.innerHTML = categories.map((cat, ri) => `
    <tr>
      <td style="font-size:.78rem;color:var(--text2);padding:.4rem .6rem;white-space:nowrap">${cat}</td>
      ${scores[ri].map((score, ci) => `
        <td style="padding:2px">
          <div style="background:${cellColors[ri][ci]};border-radius:6px;padding:.55rem .4rem;text-align:center;font-size:.72rem;font-weight:700;font-family:var(--mono);color:white;cursor:default;transition:transform .15s"
               onmouseover="this.style.transform='scale(1.08)'"
               onmouseout="this.style.transform='scale(1)'"
               title="${cat} × Severity ${ci+1}: Score ${score}">
            ${score}
          </div>
        </td>`).join("")}
    </tr>`).join("");
}

loadAnalytics();

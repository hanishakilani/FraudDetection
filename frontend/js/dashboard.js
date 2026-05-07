const API = "http://localhost:3000";
let donutChart, riskChart, trendChart;

async function loadDashboard() {
  try {
    const res  = await fetch(`${API}/dashboard/stats`);
    const data = await res.json();
    const { stats, riskBreakdown, recentAlerts, dailyTrend } = data;

    document.getElementById("stat-total").textContent = stats.total.toLocaleString();
    document.getElementById("stat-fraud").textContent = stats.fraud.toLocaleString();
    document.getElementById("stat-legit").textContent = stats.legit.toLocaleString();
    document.getElementById("stat-rate").textContent  = `${stats.fraudRate}%`;

    const donutCtx = document.getElementById("donutChart");
    if (donutChart) donutChart.destroy();
    donutChart = new Chart(donutCtx, {
      type: "doughnut",
      data: {
        labels: ["Legitimate", "Fraud"],
        datasets: [{ data: [stats.legit, stats.fraud], backgroundColor: ["#16a34a","#dc2626"], borderColor: ["#fff","#fff"], borderWidth: 3 }]
      },
      options: { cutout: "65%", plugins: { legend: { position: "bottom", labels: { padding: 16, usePointStyle: true } } } }
    });

    const riskMap = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    riskBreakdown.forEach(r => { if (r._id) riskMap[r._id] = r.count; });

    const riskCtx = document.getElementById("riskChart");
    if (riskChart) riskChart.destroy();
    riskChart = new Chart(riskCtx, {
      type: "bar",
      data: {
        labels: ["LOW","MEDIUM","HIGH","CRITICAL"],
        datasets: [{ label: "Transactions", data: [riskMap.LOW, riskMap.MEDIUM, riskMap.HIGH, riskMap.CRITICAL], backgroundColor: ["#16a34a","#d97706","#ea580c","#7c3aed"], borderRadius: 6 }]
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } }
    });

    const trendCtx = document.getElementById("trendChart");
    if (trendChart) trendChart.destroy();
    trendChart = new Chart(trendCtx, {
      type: "line",
      data: {
        labels: dailyTrend.map(d => d._id),
        datasets: [
          { label: "Total", data: dailyTrend.map(d => d.total), borderColor: "#2563eb", backgroundColor: "rgba(37,99,235,.08)", tension: 0.35, fill: true, pointRadius: 4 },
          { label: "Fraud", data: dailyTrend.map(d => d.fraudCount), borderColor: "#dc2626", backgroundColor: "rgba(220,38,38,.06)", tension: 0.35, fill: true, pointRadius: 4 }
        ]
      },
      options: { scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } }, plugins: { legend: { position: "bottom", labels: { usePointStyle: true } } } }
    });

    const alertList = document.getElementById("alert-list");
    if (!recentAlerts.length) {
      alertList.innerHTML = `<div class="empty-state"><div style="font-size:1.5rem">✅</div><p>No high-risk alerts yet</p></div>`;
    } else {
      alertList.innerHTML = recentAlerts.map(a => `
        <div class="alert-item">
          <div>
            <strong>$${a.amount.toFixed(2)}</strong>
            <span class="risk-badge risk-${a.riskLevel}" style="margin-left:.5rem">${a.riskLevel}</span>
            <div style="font-size:.78rem;color:var(--muted);margin-top:2px">${a.transactionId.slice(0,12)}…</div>
          </div>
          <div style="font-size:.78rem;color:var(--muted)">${new Date(a.createdAt).toLocaleString()}</div>
        </div>`).join("");
    }

  } catch (err) {
    console.error("Dashboard error:", err);
    document.querySelector(".container").insertAdjacentHTML("beforeend",
      `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:1rem;margin-top:1rem;color:#dc2626;font-size:.9rem">
        ⚠️ Cannot connect to backend. Make sure Node.js is running on port 3000.
      </div>`);
  }
}

loadDashboard();
setInterval(loadDashboard, 30000);
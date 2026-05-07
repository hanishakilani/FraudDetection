const API = "http://localhost:3000";
Chart.defaults.color       = "#94a3b8";
Chart.defaults.borderColor = "rgba(255,255,255,0.06)";
Chart.defaults.font.family = "'Space Grotesk', sans-serif";

async function loadModelPerformance() {
  try {
    const [metricsRes, txRes] = await Promise.all([
      fetch(`${API}/model/metrics`),
      fetch(`${API}/transactions?limit=20&page=1`)
    ]);

    const metrics = await metricsRes.json();
    const txData  = await txRes.json();

    renderMetricCards(metrics);
    renderROCCurve(metrics);
    renderPRCurve(metrics);
    renderConfusionMatrix(metrics);
    renderFraudTable(txData.transactions || []);
    renderModelInfo(metrics);

  } catch (err) {
    console.error("Model page error:", err);
  }
}

function renderMetricCards(m) {
  document.getElementById("roc-auc-val").textContent  = m.roc_auc  ? m.roc_auc.toFixed(3)  : "N/A";
  document.getElementById("pr-auc-val").textContent   = m.pr_auc   ? m.pr_auc.toFixed(3)   : "N/A";
  document.getElementById("precision-val").textContent= m.fraud_precision ? (m.fraud_precision*100).toFixed(1)+"%" : "N/A";
  document.getElementById("recall-val").textContent   = m.fraud_recall    ? (m.fraud_recall*100).toFixed(1)+"%"    : "N/A";
  document.getElementById("fraud-table-auc").textContent = `ROC-AUC ${m.roc_auc?.toFixed(4) || "—"}`;
  document.getElementById("roc-badge").textContent = `AUC = ${m.roc_auc?.toFixed(4) || "—"}`;
  document.getElementById("pr-badge").textContent  = `AUC = ${m.pr_auc?.toFixed(4)  || "—"}`;
}

function renderROCCurve(m) {
  if (!m.roc_curve) return;
  const { fpr, tpr } = m.roc_curve;

  new Chart(document.getElementById("rocChart"), {
    type: "line",
    data: {
      labels: fpr,
      datasets: [
        {
          label: `ROC Curve (AUC=${m.roc_auc})`,
          data: tpr,
          borderColor: "rgba(167,139,250,1)",
          backgroundColor: "rgba(124,58,237,0.1)",
          tension: 0.4, fill: true,
          pointRadius: 0, borderWidth: 2
        },
        {
          label: "Random (baseline)",
          data: fpr,
          borderColor: "rgba(255,255,255,0.15)",
          borderDash: [5,5], tension: 0,
          pointRadius: 0, borderWidth: 1,
          fill: false
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display:true, text:"FPR", font:{size:10} }, min:0, max:1, ticks:{maxTicksLimit:5,font:{size:10}}, grid:{color:"rgba(255,255,255,.04)"} },
        y: { title: { display:true, text:"TPR", font:{size:10} }, min:0, max:1, ticks:{maxTicksLimit:5,font:{size:10}}, grid:{color:"rgba(255,255,255,.04)"} }
      }
    }
  });
}

function renderPRCurve(m) {
  if (!m.pr_curve) return;
  const { precision, recall } = m.pr_curve;

  new Chart(document.getElementById("prChart"), {
    type: "line",
    data: {
      labels: recall,
      datasets: [{
        label: `PR Curve (AUC=${m.pr_auc})`,
        data: precision,
        borderColor: "rgba(103,232,249,1)",
        backgroundColor: "rgba(6,182,212,0.1)",
        tension: 0.4, fill: true,
        pointRadius: 0, borderWidth: 2
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { title:{display:true,text:"Recall",font:{size:10}}, min:0, max:1, ticks:{maxTicksLimit:5,font:{size:10}}, grid:{color:"rgba(255,255,255,.04)"} },
        y: { title:{display:true,text:"Precision",font:{size:10}}, min:0, max:1, ticks:{maxTicksLimit:5,font:{size:10}}, grid:{color:"rgba(255,255,255,.04)"} }
      }
    }
  });
}

function renderConfusionMatrix(m) {
  if (!m.confusion_matrix) return;
  const cm = m.confusion_matrix;
  document.getElementById("cm-tn").textContent = cm[0][0].toLocaleString();
  document.getElementById("cm-fp").textContent = cm[0][1].toLocaleString();
  document.getElementById("cm-fn").textContent = cm[1][0].toLocaleString();
  document.getElementById("cm-tp").textContent = cm[1][1].toLocaleString();
}

function renderFraudTable(transactions) {
  const tbody = document.getElementById("fraud-table-body");
  if (!transactions.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text3);padding:2rem">No transactions yet</td></tr>`;
    return;
  }

  tbody.innerHTML = transactions.map(tx => {
    const isFraud = tx.prediction === 1;
    const score   = (tx.riskScore * 100).toFixed(1);
    const shortId = tx.transactionId.replace(/-/g,"").slice(0,9).toUpperCase();

    return `<tr>
      <td class="mono" style="font-size:.78rem;color:var(--text2)">${shortId}</td>
      <td style="font-weight:600">${tx.amount.toFixed(3)}</td>
      <td class="mono" style="font-size:.78rem;color:${isFraud?"var(--red-lt)":"var(--text2)"}">${score}%</td>
      <td style="text-align:center">
        ${isFraud
          ? `<span style="color:var(--amber-lt);font-size:1rem" title="Fraud flagged">⚠️</span>`
          : `<span style="color:var(--green-lt);font-size:.85rem">✅</span>`}
      </td>
    </tr>`;
  }).join("");
}

function renderModelInfo(m) {
  document.getElementById("inf-estimators").textContent = m.n_estimators    || 100;
  document.getElementById("inf-smote").textContent      = m.smote_applied   ? "✅ Enabled" : "❌ Disabled";
  document.getElementById("inf-testsize").textContent   = m.total_test      ? m.total_test.toLocaleString() : "—";
  document.getElementById("inf-fraudtest").textContent  = m.total_fraud_test ? m.total_fraud_test + " fraud rows" : "—";
}

loadModelPerformance();
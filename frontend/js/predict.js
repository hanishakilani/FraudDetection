const API = "http://localhost:3000";

const FRAUD_SAMPLES = [
  { time:406,   amount:0.0,    v1:-2.3122,v2:1.9519,  v3:-1.6099,v4:3.9979,  v5:-0.5222,v6:-1.4265,v7:-2.5374,v8:1.3917,  v9:-2.7701,v10:-2.7723,v11:3.2020, v12:-2.8994,v13:-0.5950,v14:-4.2895,v15:0.3898, v16:-1.1407,v17:-2.8304,v18:-0.0168,v19:0.4165, v20:0.4127, v21:0.2112, v22:0.2758, v23:0.6710, v24:0.2451, v25:-0.3430,v26:0.1598, v27:0.0677, v28:0.1285 },
  { time:472,   amount:239.93, v1:-3.0435,v2:-3.1575, v3:1.0886, v4:2.2886,  v5:1.3598, v6:-1.0670, v7:-0.3677,v8:-0.2707,v9:-0.8381,v10:-0.4147,v11:-1.3922,v12:-1.1473,v13:0.4293, v14:-2.4941,v15:0.6520, v16:-1.5704,v17:-0.4869,v18:-0.6033,v19:0.1091, v20:0.1992, v21:0.3139, v22:0.2770, v23:-0.1100,v24:0.0745, v25:0.1285, v26:0.0654, v27:0.2494, v28:0.0788 },
  { time:15817, amount:11.39,  v1:-4.6419,v2:2.9021,  v3:-1.5729,v4:2.5073,  v5:-0.8718,v6:-1.0409, v7:-1.5939,v8:-3.2549,v9:1.9090, v10:1.0774, v11:3.3385, v12:-6.5426,v13:1.0995, v14:-3.2665,v15:1.0147, v16:-4.8424,v17:-5.2699,v18:-2.3447,v19:1.9592, v20:-0.4657,v21:1.9636, v22:-0.2174,v23:-0.5493,v24:0.6455, v25:-0.3546,v26:-0.6118,v27:-3.9081,v28:-0.6712 },
];

let sampleIdx = 0;
const LEGIT_SAMPLES = [
  { time:0,     amount:149.62, v1:-1.3598,v2:-0.0728,v3:2.5363, v4:1.3782,  v5:-0.3383,v6:0.4624,  v7:0.2396, v8:0.0987, v9:0.3638, v10:0.0908, v11:-0.5516,v12:-0.6178,v13:-0.9914,v14:-0.3112,v15:1.4682, v16:-0.4704,v17:0.2080, v18:0.0258, v19:0.4040, v20:0.2514, v21:-0.0183,v22:0.2778, v23:-0.1105,v24:0.0669, v25:0.1285, v26:-0.1891,v27:0.1336, v28:-0.0211 },
  { time:1,     amount:2.69,   v1:1.1919, v2:0.2662, v3:0.1669, v4:0.4484,  v5:-0.1000,v6:-0.8110, v7:-0.7819,v8:0.4640, v9:-0.4512,v10:-0.1835,v11:-1.9615,v12:1.3587, v13:0.3086, v14:-1.9578,v15:1.1152, v16:-0.9718,v17:-1.1500,v18:-0.2618,v19:1.0949, v20:0.2532, v21:-0.4617,v22:-0.4268,v23:-0.1701,v24:0.5178, v25:-0.2000,v26:0.2823, v27:-0.1115,v28:-0.0453 },
  { time:2,     amount:378.66, v1:-0.9661,v2:-0.1852,v3:1.7928, v4:-0.8637, v5:-0.0103,v6:0.0842,  v7:-0.0608,v8:0.0849, v9:-0.2554,v10:-0.1687,v11:1.6126, v12:1.1552, v13:0.4908, v14:-0.1436,v15:0.6355, v16:0.4638, v17:-0.1148,v18:-0.1835,v19:-0.1456,v20:0.0756, v21:0.0129, v22:0.1474, v23:-0.0492,v24:0.2116, v25:0.0770, v26:0.2619, v27:0.0399, v28:0.0442 },
  { time:10,    amount:123.50, v1:1.2296, v2:0.1410, v3:0.0454, v4:0.7392,  v5:-0.0491,v6:-0.3963, v7:0.1212, v8:0.0373, v9:0.4089, v10:-0.0627,v11:-0.5407,v12:0.8764, v13:-0.6950,v14:0.3010, v15:0.4353, v16:-0.2066,v17:-0.3000,v18:0.0919, v19:0.2480, v20:0.0669, v21:-0.0591,v22:-0.0722,v23:0.0218, v24:0.1278, v25:-0.0708,v26:0.1286, v27:-0.0210,v28:0.0218 },
  { time:100,   amount:27.50,  v1:-0.2162,v2:0.5022, v3:0.2517, v4:0.2712,  v5:-0.0494,v6:-0.3636, v7:0.0680, v8:-0.0133,v9:-0.1208,v10:-0.3571,v11:0.2834, v12:0.5013, v13:-0.2234,v14:-0.2200,v15:0.0524, v16:0.0811, v17:-0.0459,v18:0.0236, v19:0.0473, v20:0.0117, v21:0.0099, v22:0.0277, v23:-0.0147,v24:0.0504, v25:-0.0235,v26:0.0418, v27:-0.0094,v28:0.0108 },
];

let legitSampleIdx = 0;

// Connect to WebSocket for real-time alerts
const socket = io(API);
socket.on("fraud-alert", data => {
  showToast(`🚨 Fraud detected! $${data.amount} — ${data.riskLevel}`, "danger");
});
socket.on("new-transaction", data => {
  if (data.prediction === 0)
    showToast(`✅ Legit transaction: $${data.amount}`, "success");
});

function showToast(message, type) {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    padding:.75rem 1.25rem;border-radius:8px;font-size:.88rem;font-weight:500;
    color:white;background:${type==="danger"?"#dc2626":"#16a34a"};
    box-shadow:0 4px 12px rgba(0,0,0,.15);animation:fadeIn .3s ease;
    max-width:300px;`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

(function buildVFields() {
  const container = document.getElementById("v-fields");
  for (let i = 1; i <= 28; i++) {
    container.innerHTML += `<div class="form-group"><label>V${i}</label><input type="number" id="v${i}" value="0" step="0.0001"></div>`;
  }
})();

function fillForm(sample) {
  document.getElementById("time").value   = sample.time;
  document.getElementById("amount").value = sample.amount;
  for (let i = 1; i <= 28; i++) {
    const el = document.getElementById(`v${i}`);
    if (el) el.value = sample[`v${i}`] !== undefined ? sample[`v${i}`] : 0;
  }
  document.querySelector("details").open = true;
}

function loadSampleFraud() {
  fillForm(FRAUD_SAMPLES[sampleIdx % FRAUD_SAMPLES.length]);
  sampleIdx++;
}
function loadSampleLegit() {
  fillForm(LEGIT_SAMPLES[legitSampleIdx % LEGIT_SAMPLES.length]);
  legitSampleIdx++;
}

function resetForm() {
  document.getElementById("time").value   = "10000";
  document.getElementById("amount").value = "149.62";
  for (let i = 1; i <= 28; i++) {
    const el = document.getElementById(`v${i}`);
    if (el) el.value = "0";
  }
  document.getElementById("result-box").style.display = "none";
}

async function submitTransaction() {
  const btn = document.getElementById("submit-btn");
  btn.disabled  = true;
  btn.innerHTML = `<span class="spinner"></span> Analyzing...`;

  const payload = {
    time:   parseFloat(document.getElementById("time").value)   || 0,
    amount: parseFloat(document.getElementById("amount").value) || 0
  };
  for (let i = 1; i <= 28; i++) {
    payload[`v${i}`] = parseFloat(document.getElementById(`v${i}`).value) || 0;
  }

  try {
    const res  = await fetch(`${API}/predict`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    showResult(data);
  } catch (err) {
    alert(`❌ Error: ${err.message}`);
  } finally {
    btn.disabled  = false;
    btn.innerHTML = "🔍 Analyze for Fraud";
  }
}

function showResult(data) {
  const box     = document.getElementById("result-box");
  const isFraud = data.prediction === 1;

  box.className     = `result-box ${isFraud ? "fraud" : "not-fraud"}`;
  box.style.display = "block";

  document.getElementById("result-label").textContent =
    isFraud ? "🚨 FRAUD DETECTED" : "✅ Legitimate Transaction";
  document.getElementById("result-tid").textContent =
    `Transaction ID: ${data.transactionId}`;

  const badge      = document.getElementById("result-badge");
  badge.textContent = data.riskLevel;
  badge.className   = `risk-badge risk-${data.riskLevel}`;

  const pct = (data.riskScore * 100).toFixed(1);
  document.getElementById("result-score").textContent = `${pct}%`;
  document.getElementById("result-fill").style.width      = `${pct}%`;
  document.getElementById("result-fill").style.background = riskColor(data.riskLevel);
  document.getElementById("result-amount").textContent    = `$${parseFloat(data.amount).toFixed(2)}`;

  const alertEl       = document.getElementById("result-alert-status");
  alertEl.textContent = data.alertSent ? "⚠️ Alert fired" : "No alert triggered";
  alertEl.style.color = data.alertSent ? "var(--warning)" : "var(--muted)";

  // Score breakdown
  if (data.rfScore !== undefined) {
    document.getElementById("score-breakdown").style.display = "block";
    document.getElementById("rf-score").textContent  = (data.rfScore  * 100).toFixed(1) + "%";
    document.getElementById("iso-score").textContent = (data.isoScore * 100).toFixed(1) + "%";
  }

  // SHAP explanation
  const expEl = document.getElementById("explanation-box");
  if (data.explanation && data.explanation.length > 0) {
    expEl.style.display = "block";
    expEl.innerHTML = `
      <div style="font-weight:500;font-size:.9rem;margin-bottom:.75rem">
        Why flagged — top contributing features:
      </div>
      ${data.explanation.map(e => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:.4rem 0;border-bottom:1px solid rgba(0,0,0,.06);font-size:.85rem">
          <div>
            <strong>${e.feature}</strong> = ${e.value}
            <span style="color:var(--muted);margin-left:.5rem">${e.direction}</span>
          </div>
          <div style="font-weight:500;color:${e.impact>0?"var(--danger)":"var(--success)"}">
            ${e.impact > 0 ? "+" : ""}${(e.impact*100).toFixed(1)}%
          </div>
        </div>`).join("")}`;
  } else {
    expEl.style.display = "none";
  }

  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  // Show success overlay for legitimate transactions
if (!isFraud) {
  const ov = document.getElementById("success-overlay");
  if (ov) {
    document.getElementById("success-status").textContent = "Legitimate ✅";
    document.getElementById("success-amount").textContent = `$${parseFloat(data.amount).toFixed(2)}`;
    document.getElementById("success-score").textContent  = `${(data.riskScore*100).toFixed(1)}% risk`;
    ov.style.display = "flex";
    setTimeout(() => { ov.style.display = "none"; }, 3500);
  }
}
}

function riskColor(level) {
  return { LOW:"#16a34a", MEDIUM:"#d97706", HIGH:"#ea580c", CRITICAL:"#7c3aed" }[level] || "#64748b";
}
const API = "http://localhost:3000";
let selectedFile = null;

function handleDrop(e) {
  e.preventDefault();
  document.getElementById("drop-zone").style.borderColor = "var(--border)";
  const file = e.dataTransfer.files[0];
  if (file && file.name.endsWith(".csv")) handleFile(file);
  else alert("Please drop a .csv file");
}

function handleFile(file) {
  if (!file) return;
  selectedFile = file;
  document.getElementById("file-info").style.display = "block";
  document.getElementById("file-name").textContent   = file.name;
  document.getElementById("file-size").textContent   = (file.size / 1024).toFixed(1) + " KB";
  document.getElementById("upload-btn").style.display = "inline-flex";
}

async function uploadFile() {
  if (!selectedFile) return;
  const btn = document.getElementById("upload-btn");
  btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Analyzing...`;

  document.getElementById("progress").style.display = "block";
  document.getElementById("progress-bar").style.width = "30%";
  document.getElementById("progress-text").textContent = "Uploading...";

  const formData = new FormData();
  formData.append("file", selectedFile);

  try {
    document.getElementById("progress-bar").style.width = "60%";
    document.getElementById("progress-text").textContent = "Running ML predictions...";

    const res  = await fetch(`${API}/bulk/upload`, { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    document.getElementById("progress-bar").style.width = "100%";
    document.getElementById("progress-text").textContent = "Done!";

    renderResults(data);
  } catch (err) {
    alert(`Error: ${err.message}`);
  } finally {
    btn.disabled = false; btn.innerHTML = "🚀 Analyze All Transactions";
  }
}

function renderResults(data) {
  const fraudPct = ((data.fraudFound / data.total) * 100).toFixed(1);
  document.getElementById("results-summary").style.display = "block";
  document.getElementById("results-summary").innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1rem">
      <div class="stat-card primary"><div class="label">Total</div><div class="value">${data.total}</div></div>
      <div class="stat-card danger"> <div class="label">Fraud</div><div class="value">${data.fraudFound}</div></div>
      <div class="stat-card success"><div class="label">Legit</div><div class="value">${data.legitFound}</div></div>
    </div>
    <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:.75rem 1rem;font-size:.88rem;color:#854d0e">
      Fraud rate: <strong>${fraudPct}%</strong> of uploaded transactions flagged
    </div>`;

  document.getElementById("results-table").style.display = "block";
  document.getElementById("bulk-tbody").innerHTML = data.results.map(r => `
    <tr>
      <td style="color:var(--muted);font-size:.82rem">${r.row}</td>
      <td><strong>$${r.amount.toFixed(2)}</strong></td>
      <td style="color:${r.label==="Fraud"?"var(--danger)":"var(--success)"};font-weight:500">
        ${r.label==="Fraud" ? "🚨 Fraud" : "✅ Legit"}
      </td>
      <td>${(r.riskScore*100).toFixed(1)}%</td>
      <td><span class="risk-badge risk-${r.riskLevel}">${r.riskLevel}</span></td>
    </tr>`).join("");
}
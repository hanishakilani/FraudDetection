const nodemailer = require("nodemailer");

const ALERT_THRESHOLD = parseFloat(process.env.ALERT_THRESHOLD || "0.30");

// Create transporter once
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS   // use Gmail App Password, not your real password
  }
});

async function sendEmailAlert(transaction) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email not configured — skipping email alert");
    return;
  }
  try {
    await transporter.sendMail({
      from:    `"FraudGuard Alerts" <${process.env.EMAIL_USER}>`,
      to:      process.env.ALERT_EMAIL || process.env.EMAIL_USER,
      subject: `🚨 Fraud Alert — $${transaction.amount.toFixed(2)} — ${transaction.riskLevel}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#dc2626;color:white;padding:20px;border-radius:8px 8px 0 0">
            <h1 style="margin:0">🚨 High-Risk Transaction Detected</h1>
          </div>
          <div style="background:#fef2f2;padding:24px;border:1px solid #fca5a5;border-radius:0 0 8px 8px">
            <table style="width:100%;font-size:15px">
              <tr><td style="color:#666;padding:6px 0">Transaction ID</td>
                  <td><strong>${transaction.transactionId}</strong></td></tr>
              <tr><td style="color:#666;padding:6px 0">Amount</td>
                  <td><strong>$${transaction.amount.toFixed(2)}</strong></td></tr>
              <tr><td style="color:#666;padding:6px 0">Risk Score</td>
                  <td><strong style="color:#dc2626">${(transaction.riskScore*100).toFixed(1)}%</strong></td></tr>
              <tr><td style="color:#666;padding:6px 0">Risk Level</td>
                  <td><strong>${transaction.riskLevel}</strong></td></tr>
              <tr><td style="color:#666;padding:6px 0">Detected At</td>
                  <td>${new Date(transaction.createdAt).toLocaleString()}</td></tr>
            </table>
            ${transaction.explanation && transaction.explanation.length > 0 ? `
            <div style="margin-top:16px">
              <strong>Why flagged:</strong>
              <ul style="margin:8px 0">
                ${transaction.explanation.slice(0,3).map(e =>
                  `<li>${e.feature} = ${e.value} → ${e.direction}</li>`
                ).join("")}
              </ul>
            </div>` : ""}
            <div style="margin-top:20px;text-align:center">
              <a href="http://localhost:3000/history.html"
                 style="background:#dc2626;color:white;padding:10px 24px;border-radius:6px;text-decoration:none">
                Review Transaction
              </a>
            </div>
          </div>
        </div>
      `
    });
    console.log(`📧 Alert email sent for transaction ${transaction.transactionId}`);
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
}

async function checkAlert(transaction) {
  if (transaction.riskScore >= ALERT_THRESHOLD && transaction.prediction === 1) {
    console.warn(`🚨 ALERT: ${transaction.transactionId} | Score: ${(transaction.riskScore*100).toFixed(1)}% | $${transaction.amount}`);
    await sendEmailAlert(transaction);
    return true;
  }
  return false;
}

module.exports = { checkAlert };
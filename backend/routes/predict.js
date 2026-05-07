const express = require("express");
const router  = express.Router();
const axios   = require("axios");
const { v4: uuidv4 } = require("uuid");
const Transaction    = require("../models/Transaction");
const { checkAlert } = require("../middleware/alert");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

// io is attached to app in server.js
function getIO(req) {
  return req.app.get("io");
}

router.post("/", async (req, res) => {
  try {
    const body = req.body;

    if (body.time === undefined || body.amount === undefined)
      return res.status(400).json({ error: "Missing time or amount" });

    const mlPayload = {
      Time:   parseFloat(body.time),
      Amount: parseFloat(body.amount)
    };
    for (let i = 1; i <= 28; i++) {
      mlPayload[`V${i}`] = parseFloat(body[`v${i}`] || 0);
    }

    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/ml-predict`, mlPayload, { timeout: 30000 }
    );

    const { prediction, label, risk_score, rf_score,
            iso_score, risk_level, explanation } = mlResponse.data;

    const vFields = {};
    for (let i = 1; i <= 28; i++) {
      vFields[`v${i}`] = parseFloat(body[`v${i}`] || 0);
    }

    const transaction = new Transaction({
      transactionId: uuidv4(),
      userId:        req.user?._id,
      time:          parseFloat(body.time),
      amount:        parseFloat(body.amount),
      ...vFields,
      prediction,
      label,
      riskScore:   risk_score,
      rfScore:     rf_score,
      isoScore:    iso_score,
      riskLevel:   risk_level,
      explanation: explanation || []
    });

    await transaction.save();

    const alertFired = await checkAlert(transaction);
    if (alertFired) {
      transaction.alertSent = true;
      await transaction.save();
    }

    // Emit WebSocket event to all connected clients
    const io = getIO(req);
    if (io) {
      io.emit("new-transaction", {
        transactionId: transaction.transactionId,
        amount:        transaction.amount,
        label,
        riskScore:     risk_score,
        riskLevel:     risk_level,
        prediction,
        alertSent:     alertFired,
        createdAt:     transaction.createdAt
      });

      if (prediction === 1) {
        io.emit("fraud-alert", {
          transactionId: transaction.transactionId,
          amount:        transaction.amount,
          riskScore:     risk_score,
          riskLevel:     risk_level
        });
      }
    }

    return res.json({
      success:       true,
      transactionId: transaction.transactionId,
      prediction,
      label,
      riskScore:     risk_score,
      rfScore:       rf_score,
      isoScore:      iso_score,
      riskLevel:     risk_level,
      alertSent:     alertFired,
      explanation:   explanation || [],
      amount:        body.amount,
      time:          body.time
    });

  } catch (err) {
    if (err.code === "ECONNREFUSED")
      return res.status(503).json({ error: "ML service is down. Start Flask on port 5001." });
    console.error("Predict error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
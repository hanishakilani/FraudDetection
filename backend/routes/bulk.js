const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const { parse } = require("csv-parse/sync");
const axios    = require("axios");
const { v4: uuidv4 } = require("uuid");
const Transaction    = require("../models/Transaction");
const { checkAlert } = require("../middleware/alert");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /bulk/upload  — upload CSV and get predictions for all rows
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const content = req.file.buffer.toString("utf-8");
    const records = parse(content, { columns: true, skip_empty_lines: true });

    if (!records.length) return res.status(400).json({ error: "CSV is empty" });
    if (records.length > 1000) return res.status(400).json({ error: "Max 1000 rows per upload" });

    // Build payloads for Flask bulk endpoint
    const transactions = records.map(row => ({
      Time:   parseFloat(row.Time   || row.time   || 0),
      Amount: parseFloat(row.Amount || row.amount || 0),
      ...Object.fromEntries(
        Array.from({ length: 28 }, (_, i) => [
          `V${i+1}`,
          parseFloat(row[`V${i+1}`] || row[`v${i+1}`] || 0)
        ])
      )
    }));

    // Call Flask bulk endpoint
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/ml-bulk`,
      { transactions },
      { timeout: 60000 }
    );

    const mlResults = mlResponse.data.results;

    // Save all to MongoDB and check alerts
    const saved    = [];
    let fraudCount = 0;

    for (let i = 0; i < records.length; i++) {
      const row    = records[i];
      const result = mlResults[i];

      const vFields = {};
      for (let j = 1; j <= 28; j++) {
        vFields[`v${j}`] = parseFloat(row[`V${j}`] || row[`v${j}`] || 0);
      }

      const tx = new Transaction({
        transactionId: uuidv4(),
        time:          parseFloat(row.Time || row.time || 0),
        amount:        parseFloat(row.Amount || row.amount || 0),
        ...vFields,
        prediction: result.prediction,
        label:      result.label,
        riskScore:  result.risk_score,
        riskLevel:  result.risk_level
      });

      await tx.save();

      const alertFired = await checkAlert(tx);
      if (alertFired) { tx.alertSent = true; await tx.save(); }

      if (result.prediction === 1) fraudCount++;

      saved.push({
        row:           i + 1,
        transactionId: tx.transactionId,
        amount:        tx.amount,
        label:         result.label,
        riskScore:     result.risk_score,
        riskLevel:     result.risk_level,
        alertSent:     alertFired
      });
    }

    return res.json({
      success:    true,
      total:      records.length,
      fraudFound: fraudCount,
      legitFound: records.length - fraudCount,
      results:    saved
    });

  } catch (err) {
    console.error("Bulk upload error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
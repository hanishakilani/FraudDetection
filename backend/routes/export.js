const express = require("express");
const router  = express.Router();
const PDFDocument = require("pdfkit");
const { Parser }  = require("json2csv");
const Transaction = require("../models/Transaction");

// GET /export/csv
router.get("/csv", async (req, res) => {
  try {
    const filter = {};
    if (req.query.label)     filter.label     = req.query.label;
    if (req.query.riskLevel) filter.riskLevel = req.query.riskLevel;

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    const fields = ["transactionId","amount","time","label","riskScore",
                    "riskLevel","alertSent","createdAt"];
    const parser = new Parser({ fields });
    const csv    = parser.parse(transactions);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
    return res.send(csv);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /export/pdf
router.get("/pdf", async (req, res) => {
  try {
    const transactions = await Transaction.find({ prediction: 1 })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=fraud-report.pdf");
    doc.pipe(res);

    // Header
    doc.fontSize(22).font("Helvetica-Bold").text("FraudGuard — Fraud Report", { align: "center" });
    doc.fontSize(11).font("Helvetica").fillColor("gray")
       .text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1.5);

    // Summary box
    doc.fontSize(13).fillColor("black").font("Helvetica-Bold").text("Summary");
    doc.font("Helvetica").fontSize(11)
       .text(`Total fraud transactions shown: ${transactions.length}`)
       .text(`Report covers: last 50 fraud detections`);
    doc.moveDown(1);

    // Table header
    doc.font("Helvetica-Bold").fontSize(10);
    const cols = { id: 40, amount: 230, score: 310, level: 390, date: 460 };
    doc.text("ID",         cols.id);
    doc.moveUp();
    doc.text("Amount",     cols.amount);
    doc.moveUp();
    doc.text("Risk Score", cols.score);
    doc.moveUp();
    doc.text("Level",      cols.level);
    doc.moveUp();
    doc.text("Date",       cols.date);
    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(560, doc.y).strokeColor("#e2e8f0").stroke();
    doc.moveDown(0.3);

    // Table rows
    doc.font("Helvetica").fontSize(9).fillColor("black");
    transactions.forEach(tx => {
      if (doc.y > 720) doc.addPage();
      const y = doc.y;
      doc.text(tx.transactionId.slice(0, 8) + "…", cols.id, y, { width: 180 });
      doc.text(`$${tx.amount.toFixed(2)}`, cols.amount, y);
      doc.text(`${(tx.riskScore * 100).toFixed(1)}%`, cols.score, y);
      doc.fillColor(tx.riskLevel === "CRITICAL" ? "#7c3aed" : tx.riskLevel === "HIGH" ? "#ea580c" : "#d97706")
         .text(tx.riskLevel, cols.level, y);
      doc.fillColor("black")
         .text(new Date(tx.createdAt).toLocaleDateString(), cols.date, y);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
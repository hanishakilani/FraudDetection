const express = require("express");
const router  = express.Router();
const Transaction = require("../models/Transaction");

router.get("/", async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const filter = {};

    if (req.query.label)     filter.label     = req.query.label;
    if (req.query.riskLevel) filter.riskLevel = req.query.riskLevel;

    const [docs, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    return res.json({
      transactions: docs,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const tx = await Transaction.findOne({ transactionId: req.params.id });
    if (!tx) return res.status(404).json({ error: "Not found" });
    return res.json(tx);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
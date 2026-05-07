const express = require("express");
const router  = express.Router();
const Transaction = require("../models/Transaction");

router.get("/stats", async (req, res) => {
  try {
    const [totals, riskBreakdown, recentAlerts, dailyTrend] = await Promise.all([
      Transaction.aggregate([
        { $group: { _id: "$label", count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } }
      ]),
      Transaction.aggregate([
        { $group: { _id: "$riskLevel", count: { $sum: 1 } } }
      ]),
      Transaction.find({ riskLevel: { $in: ["HIGH", "CRITICAL"] } })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("transactionId amount riskScore riskLevel label createdAt")
        .lean(),
      Transaction.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) } } },
        { $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: 1 },
            fraudCount: { $sum: "$prediction" }
        }},
        { $sort: { _id: 1 } }
      ]),
    ]);

    const stats = { fraud: 0, legit: 0, fraudAmount: 0, legitAmount: 0 };
    totals.forEach(t => {
      if (t._id === "Fraud") {
        stats.fraud = t.count; stats.fraudAmount = t.totalAmount;
      } else {
        stats.legit = t.count; stats.legitAmount = t.totalAmount;
      }
    });
    stats.total     = stats.fraud + stats.legit;
    stats.fraudRate = stats.total
      ? ((stats.fraud / stats.total) * 100).toFixed(2) : "0.00";

    return res.json({ stats, riskBreakdown, recentAlerts, dailyTrend });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
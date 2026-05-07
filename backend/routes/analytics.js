const express = require("express");
const router  = express.Router();
const Transaction = require("../models/Transaction");

// GET /analytics/overview
router.get("/overview", async (req, res) => {
  try {
    const [
      hourlyFraud, amountBuckets, top10Risky,
      weeklyTrend, riskDistribution
    ] = await Promise.all([

      // Fraud by hour of day
      Transaction.aggregate([
        { $match: { prediction: 1 } },
        { $group: {
            _id:   { $hour: "$createdAt" },
            count: { $sum: 1 },
            avgAmount: { $avg: "$amount" }
        }},
        { $sort: { _id: 1 } }
      ]),

      // Fraud by amount range
      Transaction.aggregate([
        { $bucket: {
            groupBy:    "$amount",
            boundaries: [0, 10, 50, 100, 500, 1000, 5000, 99999],
            default:    "Other",
            output: {
              total: { $sum: 1 },
              fraud: { $sum: "$prediction" }
            }
        }}
      ]),

      // Top 10 riskiest transactions ever
      Transaction.find({ prediction: 1 })
        .sort({ riskScore: -1 })
        .limit(10)
        .select("transactionId amount riskScore riskLevel createdAt explanation")
        .lean(),

      // 30-day daily trend
      Transaction.aggregate([
        { $match: {
            createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) }
        }},
        { $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total:      { $sum: 1 },
            fraudCount: { $sum: "$prediction" },
            avgRisk:    { $avg: "$riskScore" }
        }},
        { $sort: { _id: 1 } }
      ]),

      // Risk level distribution
      Transaction.aggregate([
        { $group: {
            _id:         "$riskLevel",
            count:       { $sum: 1 },
            avgAmount:   { $avg: "$amount" },
            fraudCount:  { $sum: "$prediction" }
        }}
      ])
    ]);

    return res.json({
      hourlyFraud,
      amountBuckets,
      top10Risky,
      weeklyTrend,
      riskDistribution
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
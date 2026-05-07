const express = require("express");
const router  = express.Router();
const path    = require("path");
const fs      = require("fs");

const METRICS_PATH = path.join(__dirname, "../../ml/model_metrics.json");

// GET /model/metrics — serve saved ROC/PR curve data
router.get("/metrics", (req, res) => {
  try {
    if (!fs.existsSync(METRICS_PATH)) {
      return res.status(404).json({ error: "model_metrics.json not found. Run train_model.py first." });
    }
    const metrics = JSON.parse(fs.readFileSync(METRICS_PATH, "utf-8"));
    return res.json(metrics);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
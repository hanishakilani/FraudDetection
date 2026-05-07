const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true, required: true },
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  time:   { type: Number, required: true },
  amount: { type: Number, required: true },

  v1:  Number, v2:  Number, v3:  Number, v4:  Number,
  v5:  Number, v6:  Number, v7:  Number, v8:  Number,
  v9:  Number, v10: Number, v11: Number, v12: Number,
  v13: Number, v14: Number, v15: Number, v16: Number,
  v17: Number, v18: Number, v19: Number, v20: Number,
  v21: Number, v22: Number, v23: Number, v24: Number,
  v25: Number, v26: Number, v27: Number, v28: Number,

  prediction: { type: Number, enum: [0, 1], required: true },
  label:      { type: String, enum: ["Fraud", "Not Fraud"], required: true },
  riskScore:  { type: Number, min: 0, max: 1, required: true },
  rfScore:    { type: Number },
  isoScore:   { type: Number },
  riskLevel:  { type: String, enum: ["LOW","MEDIUM","HIGH","CRITICAL"] },
  explanation: [{ feature: String, value: Number, impact: Number, direction: String }],

  alertSent: { type: Boolean, default: false },
  notes:     { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ prediction: 1 });
transactionSchema.index({ riskLevel: 1 });
transactionSchema.index({ userId: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
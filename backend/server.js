require("dotenv").config();
const express   = require("express");
const http      = require("http");
const { Server } = require("socket.io");
const mongoose  = require("mongoose");
const cors      = require("cors");
const path      = require("path");

const predictRouter      = require("./routes/predict");
const transactionsRouter = require("./routes/transactions");
const dashboardRouter    = require("./routes/dashboard");
const authRouter         = require("./routes/auth");
const bulkRouter         = require("./routes/bulk");
const exportRouter       = require("./routes/export");
const analyticsRouter    = require("./routes/analytics");
const modelRouter = require("./routes/model");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: "*" } });
const PORT   = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "..", "frontend")));

// Attach io to app so routes can use it
app.set("io", io);

// Routes
app.use("/auth",         authRouter);
app.use("/predict",      predictRouter);
app.use("/transactions", transactionsRouter);
app.use("/dashboard",    dashboardRouter);
app.use("/bulk",         bulkRouter);
app.use("/export",       exportRouter);
app.use("/analytics",    analyticsRouter);
app.use("/model", modelRouter);


app.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// WebSocket events
io.on("connection", socket => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.on("disconnect", () =>
    console.log(`🔌 Client disconnected: ${socket.id}`)
  );
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    server.listen(PORT, () =>
      console.log(`✅ Server running → http://localhost:${PORT}`)
    );
  })
  .catch(err => {
    console.error("❌ MongoDB failed:", err.message);
    process.exit(1);
  });
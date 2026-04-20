require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectionsRouter = require("./routes/connections");
const analyzeRouter = require("./routes/analyze");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use("/api/connections", connectionsRouter);
app.use("/api/analyze", analyzeRouter);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
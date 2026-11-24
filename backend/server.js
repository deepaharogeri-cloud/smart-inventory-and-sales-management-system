const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/", (req, res) => res.json({ message: "Smart Inventory API is running" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/sales", require("./routes/sales"));
app.use("/api/dashboard", require("./routes/dashboard"));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error. Check the backend terminal." });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
    app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

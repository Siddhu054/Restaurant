const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- Add this Test Route here ---
app.get("/api/dashboard/test", (req, res) => {
  console.log("DEBUG: Reached /api/dashboard/test route!");
  res.json({ message: "Test route reached!" });
});
// -------------------------------

// Debug: Print MongoDB URI (optional — for troubleshooting on Render logs)
console.log("Connecting to MongoDB URI:", process.env.MONGODB_URI);

// MongoDB Connection (REMOVE fallback to localhost)
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tables", require("./routes/tables"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/menu", require("./routes/menu"));
app.use("/api/chefs", require("./routes/chefs"));
app.use("/api/dashboard", require("./routes/dashboard"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

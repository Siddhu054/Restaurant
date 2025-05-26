const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Get all chefs
router.get("/", async (req, res) => {
  try {
    const chefs = await User.find({ role: "chef" }, { name: 1 });
    res.json(chefs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;

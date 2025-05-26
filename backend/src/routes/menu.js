const express = require("express");
const router = express.Router();
const MenuItem = require("../models/MenuItem"); // Import the MenuItem model

// GET all menu items, optionally filtered by category
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};

    if (category && category !== "All") {
      query.category = category; // Filter by category if provided and not 'All'
    }

    const menuItems = await MenuItem.find(query).sort("_id"); // Fetch items and sort them (optional)
    res.json(menuItems);
  } catch (err) {
    console.error("Error fetching menu items:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;

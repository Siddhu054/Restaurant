const express = require("express");
const router = express.Router();
const MenuItem = require("../models/MenuItem");

router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};

    if (category && category !== "All") {
      query.category = category;
    }

    const menuItems = await MenuItem.find(query).sort("_id");
    res.json(menuItems);
  } catch (err) {
    console.error("Error fetching menu items:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;

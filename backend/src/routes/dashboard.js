const express = require("express");
const router = express.Router();

// Import models
const User = require("../models/User");
const Order = require("../models/Order");
const Table = require("../models/Table");

// --- Debugging imports ---
console.log("DEBUG: Type of User on import in dashboard.js:", typeof User);
console.log(
  "DEBUG: User has countDocuments method?",
  typeof User.countDocuments === "function"
);
// -------------------------

router.get("/summary", async (req, res) => {
  try {
    // --- Debugging inside route ---
    console.log("DEBUG: Inside dashboard route - Attempting to fetch data...");
    console.log("DEBUG: Type of User inside route:", typeof User);
    console.log(
      "DEBUG: User has countDocuments method inside route?",
      typeof User.countDocuments === "function"
    );
    // ------------------------------

    // Total chefs (Simplified query to isolate User model issue)
    // Check if User is valid before calling countDocuments
    let totalChefs = 0;
    if (typeof User.countDocuments === "function") {
      totalChefs = await User.countDocuments({ role: "chef" });
      console.log(
        "DEBUG: User.countDocuments successful, totalChefs:",
        totalChefs
      );
    } else {
      console.error(
        "DEBUG: User.countDocuments is NOT a function right before calling it!"
      );
      // Fallback or indicate error
      return res.status(500).json({
        message:
          "Backend configuration error: User model not correctly loaded.",
      });
    }

    // Total revenue (Aggregation should be fine if Order model is ok)
    const revenueAgg = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Total orders
    const totalOrders = await Order.countDocuments();

    // Total clients (unique phone numbers in orders)
    const clients = await Order.distinct("customer.phone", {
      "customer.phone": { $ne: null },
    });
    const totalClients = clients.length;

    // Order summary (Counts for statuses and types)
    const served = await Order.countDocuments({ status: "served" });
    const dineIn = await Order.countDocuments({ type: "dine_in" });
    const takeAway = await Order.countDocuments({ type: "take_away" });
    const orderSummary = { served, dineIn, takeAway };

    // Tables
    const tables = await Table.find(
      {},
      { tableNumber: 1, status: 1, chairs: 1, _id: 0 }
    ); // Include chairs as per Figma
    // Ensure tableNumber is a string and padded
    const formattedTables = tables.map((table) => ({
      ...table.toObject(), // Convert Mongoose document to plain object
      tableNumber: String(table.tableNumber).padStart(2, "0"),
    }));

    // Daily Revenue (Aggregation to calculate total revenue per day)
    const dailyRevenue = await Order.aggregate([
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" }, // Group by day of the week (1=Sunday, 7=Saturday)
          totalRevenue: { $sum: "$grandTotal" },
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id
          day: { $subtract: ["$_id", 1] }, // Adjust day to be 0=Sunday, 6=Saturday (matches frontend expectation)
          totalRevenue: 1,
        },
      },
      {
        $sort: { day: 1 }, // Sort by day of the week
      },
    ]);

    // Chef order counts (show all chefs, even those with 0 orders)
    let chefOrders = [];
    try {
      const chefs = await User.find({ role: "chef" });
      chefOrders = await Promise.all(
        chefs.map(async (chef) => {
          const count = await Order.countDocuments({ assignedChef: chef._id });
          return { name: chef.name, count };
        })
      );
      console.log("DEBUG: Chef order counts (all chefs):", chefOrders);
    } catch (aggErr) {
      console.error("DEBUG: Chef aggregation failed:", aggErr);
      // Continue without chef data or handle specifically
    }

    res.json({
      totalChefs,
      totalRevenue,
      totalOrders,
      totalClients,
      orderSummary,
      tables: formattedTables, // Use formatted tables
      chefOrders, // Use all chefs with order counts
      dailyRevenue, // Include daily revenue data
    });
  } catch (err) {
    // This catch block should now only be for errors *other* than User.countDocuments not being a function
    console.error("Error in dashboard route processing:", err);
    res.status(500).json({
      message: "Dashboard summary processing error",
      error: err.message,
    });
  }
});

module.exports = router;

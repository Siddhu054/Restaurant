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

    const { range = "daily" } = req.query; // Get range from query params, default to 'daily'
    let startDate = new Date();

    // Calculate start date based on the selected range
    switch (range) {
      case "weekly":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "monthly":
        startDate.setDate(startDate.getDate() - 30); // Approximation for monthly
        break;
      case "daily":
      default:
        startDate.setDate(startDate.getDate() - 1); // Last 24 hours for 'daily'
        break;
    }

    // Match criteria for filtering by date range
    const dateFilter = {
      createdAt: { $gte: startDate },
    };

    // Total chefs (remains overall, as chef count isn't time-bound)
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
      // It's better to continue and let other data load if possible
    }

    // Total revenue within the selected range
    const revenueAgg = await Order.aggregate([
      { $match: dateFilter }, // Filter by date
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Total orders within the selected range
    const totalOrders = await Order.countDocuments(dateFilter);

    // Total clients (unique phone numbers in orders) within the selected range
    const clients = await Order.distinct("customer.phone", {
      "customer.phone": { $ne: null },
      ...dateFilter, // Include date filter
    });
    const totalClients = clients.length;

    // Order summary (Counts for statuses and types) within the selected range
    const served = await Order.countDocuments({
      status: "served",
      ...dateFilter,
    });
    const dineIn = await Order.countDocuments({
      type: "dine_in",
      ...dateFilter,
    });
    const takeAway = await Order.countDocuments({
      type: "take_away",
      ...dateFilter,
    });
    const orderSummary = { served, dineIn, takeAway };

    // Tables (remains overall)
    const tables = await Table.find(
      {},
      { tableNumber: 1, status: 1, chairs: 1, _id: 1 } // Include _id field
    ); // Include chairs as per Figma
    // Ensure tableNumber is a string and padded
    const formattedTables = tables.map((table) => ({
      ...table.toObject(), // Convert Mongoose document to plain object
      tableNumber: String(table.tableNumber).padStart(2, "0"),
    }));
    console.log("DEBUG: Formatted tables:", formattedTables); // Add debug logging

    // Daily Revenue (Aggregation to calculate total revenue per day) within the selected range
    // This aggregation needs to group by actual date, not just day of the week
    const dailyRevenue = await Order.aggregate([
      { $match: dateFilter }, // Filter by date range
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          }, // Group by actual date
          totalRevenue: { $sum: "$grandTotal" },
        },
      },
      {
        $project: {
          _id: 0, // Exclude group _id
          date: {
            // Format date as YYYY-MM-DD for easier sorting/handling in frontend
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $toDate: {
                  $concat: [
                    { $toString: "$_id.year" },
                    "-",
                    { $toString: "$_id.month" },
                    "-",
                    { $toString: "$_id.day" },
                  ],
                },
              },
            },
          },
          totalRevenue: 1,
        },
      },
      { $sort: { date: 1 } }, // Sort by date ascending
    ]);

    // Chef order counts (remains overall)
    let chefOrders = [];
    // Keep the existing chef counts logic, as it's not time-bound
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
      dailyRevenue, // Include daily revenue data filtered by range
    });
  } catch (err) {
    console.error("Error in dashboard route processing:", err);
    res.status(500).json({
      message: "Dashboard summary processing error",
      error: err.message,
    });
  }
});

module.exports = router;

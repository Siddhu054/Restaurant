const express = require("express");
const router = express.Router();

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
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "daily":
      default:
        startDate.setDate(startDate.getDate() - 1);
        break;
    }

    const dateFilter = {
      createdAt: { $gte: startDate },
    };

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
    }
    console.log("DEBUG: totalChefs value:", totalChefs);

    const revenueAgg = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;
    console.log("DEBUG: revenueAgg result:", revenueAgg);
    console.log("DEBUG: totalRevenue value:", totalRevenue);

    const totalOrders = await Order.countDocuments(dateFilter);
    console.log("DEBUG: totalOrders count:", totalOrders);

    const clients = await Order.distinct("customer.phone", {
      "customer.phone": { $ne: null },
      ...dateFilter, // Include date filter
    });
    const totalClients = clients.length;
    console.log("DEBUG: distinct clients result:", clients);
    console.log("DEBUG: totalClients count:", totalClients);

    const served = await Order.countDocuments({
      status: "served",
      ...dateFilter,
    });
    console.log("DEBUG: served count:", served);

    const dineIn = await Order.countDocuments({
      type: "dine_in",
      ...dateFilter,
    });
    console.log("DEBUG: dineIn count:", dineIn);

    const takeAway = await Order.countDocuments({
      type: "take_away",
      ...dateFilter,
    });
    console.log("DEBUG: takeAway count:", takeAway);

    const orderSummary = { served, dineIn, takeAway };
    console.log("DEBUG: orderSummary object:", orderSummary);

    const tables = await Table.find(
      {},
      { tableNumber: 1, status: 1, chairs: 1, _id: 1 }
    );
    console.log("DEBUG: Raw tables fetched from DB:", tables);

    const formattedTables = tables.map((table) => ({
      ...table.toObject(),
      tableNumber: String(table.tableNumber).padStart(2, "0"),
    }));
    console.log("DEBUG: Formatted tables sent to frontend:", formattedTables);

    const dailyRevenue = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalRevenue: { $sum: "$grandTotal" },
        },
      },
      {
        $project: {
          _id: 0,
          date: {
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
      { $sort: { date: 1 } },
    ]);
    console.log("DEBUG: Daily revenue aggregation result:", dailyRevenue);

    // Fetch raw daily order summaries for frontend aggregation
    const rawDailyOrderSummaries = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          served: { $sum: { $cond: [{ $eq: ["$status", "served"] }, 1, 0] } },
          dineIn: { $sum: { $cond: [{ $eq: ["$type", "dine_in"] }, 1, 0] } },
          takeAway: {
            $sum: { $cond: [{ $eq: ["$type", "take_away"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: {
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
          served: 1,
          dineIn: 1,
          takeAway: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);
    console.log("DEBUG: Raw daily order summaries:", rawDailyOrderSummaries);

    let chefOrders = [];

    try {
      const chefs = await User.find({ role: "chef" });
      console.log("DEBUG: Chefs fetched for order count:", chefs);
      chefOrders = await Promise.all(
        chefs.map(async (chef) => {
          const count = await Order.countDocuments({ assignedChef: chef._id });
          console.log(`DEBUG: Orders count for chef ${chef.name}:`, count);
          return { name: chef.name, count };
        })
      );
      console.log("DEBUG: Chef order counts (all chefs):", chefOrders);
    } catch (aggErr) {
      console.error("DEBUG: Chef aggregation failed:", aggErr);
    }

    res.json({
      totalChefs,
      totalRevenue,
      totalOrders,
      totalClients,
      orderSummary,
      tables: formattedTables,
      chefOrders,
      dailyRevenue,
      dailyOrderSummary: rawDailyOrderSummaries,
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

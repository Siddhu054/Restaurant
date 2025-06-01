const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Table = require("../models/Table");
const MenuItem = require("../models/MenuItem");

router.post("/", async (req, res) => {
  console.log("DEBUG: Request body:", req.body);
  try {
    const { table, items, orderType, status, customerDetails, deliveryInfo } =
      req.body;

    console.log("DEBUG: Delivery Info received:", deliveryInfo);

    console.log("DEBUG: orderType from request body:", orderType);
    const orderTypeMapped = (orderType || "dine-in").replace("-", "_");
    console.log("DEBUG: Mapped order type:", orderTypeMapped);

    if (orderTypeMapped === "dine_in" && !table) {
      return res
        .status(400)
        .json({ message: "Table is required for dine-in orders." });
    }

    let itemTotal = 0;
    const orderItems = [];
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        return res
          .status(404)
          .json({ message: `Menu item not found for ID: ${item.menuItem}` });
      }
      const itemCalculatedTotal = menuItem.price * item.quantity;
      itemTotal += itemCalculatedTotal;
      orderItems.push({
        menuItem: item.menuItem,
        quantity: item.quantity,

        price: menuItem.price,
      });
    }

    const deliveryCharge = deliveryInfo?.deliveryCharge || 0;
    const tax = deliveryInfo?.taxes || 0;
    const grandTotal = itemTotal + deliveryCharge + tax;

    const order = new Order({
      table: orderTypeMapped === "dine_in" ? table : null,
      items: orderItems,
      type: orderTypeMapped,
      status: status || "processing",
      totalAmount: itemTotal,
      deliveryCharge: deliveryCharge,
      tax: tax,
      grandTotal: grandTotal,
      customer: customerDetails,
      cookingInstructions: deliveryInfo?.cookingInstructions,
      estimatedTime: deliveryInfo?.estimatedTime,
    });

    const newOrder = await order.save();

    const populatedOrder = await Order.findById(newOrder._id)
      .populate("table", "tableNumber")
      .populate("items.menuItem", "name price")
      .populate("customer");

    res.status(201).json({
      success: true,
      message: "Order successfully submitted",
      order: populatedOrder,
    });
  } catch (err) {
    console.error("Error creating order:", err);

    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("table", "tableNumber")
      .populate("items.menuItem", "name price");
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("table", "tableNumber")
      .populate("items.menuItem", "name price");
    if (order == null) {
      return res.status(404).json({ message: "Cannot find order" });
    }
    res.json(order);
  } catch (err) {
    console.error("Error fetching single order:", err);
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order == null) {
      return res
        .status(404)
        .json({ success: false, message: "Cannot find order" });
    }

    if (req.body.status != null) {
      order.status = req.body.status;
      if (req.body.status === "done" || req.body.status === "served") {
        order.endTime = new Date();
      }
    }

    const updatedOrder = await order.save({ validateBeforeSave: false });
    res.json({ success: true, message: "Order updated", order: updatedOrder });
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put("/:id/assign-chef", async (req, res) => {
  try {
    const { chefId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    order.assignedChef = chefId;
    await order.save();

    res.json({ success: true, message: "Chef assigned successfully", order });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

module.exports = router;

exports.createOrder = async (req, res) => {
  try {
    const { items, customerDetails, orderType, deliveryInfo, table, total } =
      req.body;

    // Create new order
    const newOrder = new Order({
      items,
      customerDetails,
      orderType,
      deliveryInfo,
      table,
      total,
      status: "pending",
      orderTime: new Date(),
    });

    // Save the order
    const savedOrder = await newOrder.save();

    // Populate the menuItem details
    const populatedOrder = await Order.findById(savedOrder._id).populate({
      path: "items.menuItem",
      select: "name price",
    });

    res.status(201).json({
      success: true,
      message: "Order successfully submitted",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

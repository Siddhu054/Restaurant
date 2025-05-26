const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    // required: true, // Temporarily making not required to bypass validation before pre-save hook
    unique: true,
  },
  type: {
    type: String,
    enum: ["dine_in", "take_away"],
    required: true,
  },
  status: {
    type: String,
    enum: ["processing", "done", "served", "not_picked_up"],
    default: "processing",
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Table",
    required: function () {
      return this.type === "dine_in";
    },
  },
  items: [
    {
      menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MenuItem",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  customer: {
    name: String,
    phone: String,
    address: String,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  deliveryCharge: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  grandTotal: {
    type: Number,
    required: true,
  },
  cookingInstructions: String,
  assignedChef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  estimatedTime: {
    type: String, // Or Number, depending on how you store it
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate order number before saving
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD${year}${month}${day}${(count + 1)
      .toString()
      .padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);

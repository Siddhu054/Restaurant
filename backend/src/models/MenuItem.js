const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide item name"],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Please provide item price"],
    min: [0, "Price cannot be negative"],
  },
  category: {
    type: String,
    required: [true, "Please provide item category"],
    enum: ["drink", "burger", "pizza", "french_fries", "veggies"],
  },
  description: {
    type: String,
    trim: true,
  },
  image: {
    type: String,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("MenuItem", menuItemSchema);

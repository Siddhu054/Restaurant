const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: [true, "Please provide a table number"],
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    default: "",
  },
  chairs: {
    type: Number,
    required: [true, "Please provide number of chairs"],
    min: [1, "Table must have at least 1 chair"],
  },
  status: {
    type: String,
    enum: ["available", "reserved", "occupied"],
    default: "available",
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Table", tableSchema);

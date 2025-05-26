const mongoose = require("mongoose");
const User = require("./src/models/User");
const Table = require("./src/models/Table");
const Order = require("./src/models/Order");

async function seed() {
  await mongoose.connect("mongodb://localhost:27017/restaurant-pos");

  // Clear existing data
  await User.deleteMany({});
  await Table.deleteMany({});
  await Order.deleteMany({});

  // Create chefs
  const chefs = await User.insertMany([
    {
      name: "Manesh",
      email: "manesh@example.com",
      password: "test123",
      role: "chef",
    },
    {
      name: "Pritam",
      email: "pritam@example.com",
      password: "test123",
      role: "chef",
    },
    {
      name: "Yash",
      email: "yash@example.com",
      password: "test123",
      role: "chef",
    },
    {
      name: "Tenzen",
      email: "tenzen@example.com",
      password: "test123",
      role: "chef",
    },
  ]);

  // Create tables
  const tables = await Table.insertMany(
    Array.from({ length: 30 }, (_, i) => ({
      tableNumber: (i + 1).toString().padStart(2, "0"),
      chairs: 3 + (i % 3),
      status: i % 2 === 0 ? "available" : "reserved",
    }))
  );

  // Create orders
  await Order.insertMany([
    {
      orderNumber: "ORD2405210001",
      type: "dine_in",
      status: "served",
      table: tables[0]._id,
      items: [],
      customer: { name: "John", phone: "1234567890", address: "Test" },
      totalAmount: 1000,
      deliveryCharge: 0,
      tax: 0,
      grandTotal: 1000,
      assignedChef: chefs[0]._id,
      startTime: new Date(),
      createdAt: new Date(),
    },
    {
      orderNumber: "ORD2405210002",
      type: "take_away",
      status: "served",
      table: null,
      items: [],
      customer: { name: "Jane", phone: "9876543210", address: "Test" },
      totalAmount: 1200,
      deliveryCharge: 0,
      tax: 0,
      grandTotal: 1200,
      assignedChef: chefs[1]._id,
      startTime: new Date(),
      createdAt: new Date(),
    },
    // Add more orders as needed
  ]);

  console.log("Database seeded!");
  mongoose.disconnect();
}

seed();

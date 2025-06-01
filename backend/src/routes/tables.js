const express = require("express");
const router = express.Router();
const Table = require("../models/Table");

router.get("/", async (req, res) => {
  try {
    const tables = await Table.find({});
    res.json(tables);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  const { tableNumber, name, chairs, status } = req.body;

  if (!tableNumber || !chairs) {
    return res
      .status(400)
      .json({ message: "Table number and chairs are required." });
  }

  const newTable = new Table({
    tableNumber,
    name,
    chairs,
    status: status || "available",
  });

  try {
    const savedTable = await newTable.save();
    res.status(201).json(savedTable);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Table number already exists." });
    }
    res.status(400).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: "Table not found." });
    }
    res.json(table);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: "Table not found." });
    }

    if (req.body.tableNumber != null) {
      table.tableNumber = req.body.tableNumber;
    }
    if (req.body.name != null) {
      table.name = req.body.name;
    }
    if (req.body.chairs != null) {
      table.chairs = req.body.chairs;
    }
    if (req.body.status != null) {
      table.status = req.body.status;
    }

    const updatedTable = await table.save();
    res.json(updatedTable);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Table number already exists." });
    }
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: "Table not found." });
    }

    await table.deleteOne();
    res.json({ message: "Table deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

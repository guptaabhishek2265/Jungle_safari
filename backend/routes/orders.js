const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const { protect } = require("../middleware/auth");

// @route   GET api/orders
// @desc    Get all orders
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/orders/summary
// @desc    Get orders summary (total sales, counts, etc.)
// @access  Private
router.get("/summary", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "sales") {
      return res.status(401).json({ msg: "Not authorized" });
    }

    const totalOrders = await Order.countDocuments({ status: "completed" });
    const salesAggregate = await Order.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
          averageOrder: { $avg: "$totalAmount" },
        },
      },
    ]);

    // Get recent orders
    const recentSales = await Order.find({ status: "completed" })
      .sort({ date: -1 })
      .limit(5);

    // Prepare the summary object
    const summary = {
      totalOrders,
      totalSales: salesAggregate.length > 0 ? salesAggregate[0].totalSales : 0,
      averageOrder:
        salesAggregate.length > 0 ? salesAggregate[0].averageOrder : 0,
      recentSales,
    };

    res.json(summary);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/orders/user/:userId
// @desc    Get orders by user ID
// @access  Private
router.get("/user/:userId", protect, async (req, res) => {
  try {
    const requestUserId = String(req.user.id);
    const targetUserId = String(req.params.userId);

    if (requestUserId !== targetUserId && req.user.role !== "admin") {
      return res.status(401).json({ msg: "Not authorized" });
    }

    const orders = await Order.find({ user: req.params.userId }).sort({
      date: -1,
    });
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.error(err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Order not found" });
    }

    res.status(500).send("Server Error");
  }
});

// @route   POST api/orders
// @desc    Create a new order
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { items, customer, subtotal, taxAmount, totalAmount, payment } =
      req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ msg: "Order items are required" });
    }

    for (const item of items) {
      const product = await Product.findById(item._id);
      if (!product) {
        return res.status(404).json({
          msg: `Product not found: ${item.name || item._id}`,
        });
      }

      const inventory = await Inventory.findOne({ product: item._id });
      if (!inventory) {
        return res.status(404).json({
          msg: `Inventory not found for ${product.name}`,
        });
      }

      if (inventory.quantity < item.quantity) {
        return res.status(400).json({
          msg: `Insufficient stock for ${product.name}. Available: ${inventory.quantity}, Requested: ${item.quantity}`,
        });
      }
    }

    const newOrder = new Order({
      items,
      customer,
      subtotal,
      taxAmount,
      totalAmount,
      payment,
      user: req.user.id,
    });

    const order = await newOrder.save();

    for (const item of items) {
      await Inventory.findOneAndUpdate(
        { product: item._id },
        {
          $inc: { quantity: -item.quantity },
          $set: { lastStockUpdate: new Date() },
        }
      );
    }

    res.status(201).json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT api/orders/:id
// @desc    Update order status
// @access  Private
router.put("/:id", protect, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ msg: "Status is required" });
    }

    const validStatuses = ["pending", "processing", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        msg: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    if (status === "cancelled" && order.status === "completed") {
      for (const item of order.items) {
        await Inventory.findOneAndUpdate(
          { product: item._id },
          {
            $inc: { quantity: item.quantity },
            $set: { lastStockUpdate: new Date() },
          }
        );
      }
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (err) {
    console.error(err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Order not found" });
    }

    res.status(500).send("Server Error");
  }
});

module.exports = router;

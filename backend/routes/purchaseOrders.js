const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const PurchaseOrder = require("../models/PurchaseOrder");
const Supplier = require("../models/Supplier");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");

function requireInventoryRole(req, res) {
  if (req.user.role !== "admin" && req.user.role !== "inventory_manager") {
    res.status(403).json({ message: "Not authorized to access purchase orders" });
    return false;
  }
  return true;
}

function formatPurchaseOrder(order) {
  return {
    id: order._id.toString(),
    _id: order._id,
    orderNumber: order.orderNumber,
    supplier: order.supplier?._id?.toString() || order.supplier?.toString() || "",
    supplierName: order.supplier?.name || "",
    orderDate: order.orderDate,
    expectedDeliveryDate: order.expectedDeliveryDate,
    status: order.status,
    totalAmount: order.totalAmount,
    notes: order.notes || "",
    items: (order.items || []).map((item) => ({
      productId: item.product?._id?.toString() || item.product?.toString() || "",
      name: item.product?.name || item.name || "",
      sku: item.product?.sku || item.sku || "",
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

async function populateOrder(orderId) {
  return PurchaseOrder.findById(orderId)
    .populate("supplier")
    .populate("items.product");
}

// @desc    Get low stock products for reordering
// @route   GET /api/purchase-orders/low-stock/products
// @access  Private (inventory manager and admin only)
router.get("/low-stock/products", protect, async (req, res) => {
  if (!requireInventoryRole(req, res)) return;

  try {
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ["$quantity", "$reorderLevel"] },
    }).populate("product");

    const payload = lowStockItems
      .filter((item) => item.product)
      .map((item) => ({
        id: item.product._id.toString(),
        _id: item.product._id,
        name: item.product.name,
        sku: item.product.sku,
        category: item.product.category,
        stock: item.quantity,
        reorderLevel: item.reorderLevel,
      }));

    res.json(payload);
  } catch (error) {
    console.error("Error loading low stock products:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Get all purchase orders
// @route   GET /api/purchase-orders
// @access  Private (inventory manager and admin only)
router.get("/", protect, async (req, res) => {
  if (!requireInventoryRole(req, res)) return;

  try {
    const orders = await PurchaseOrder.find()
      .sort({ orderDate: -1 })
      .populate("supplier")
      .populate("items.product");

    res.json(orders.map(formatPurchaseOrder));
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Get a single purchase order
// @route   GET /api/purchase-orders/:id
// @access  Private (inventory manager and admin only)
router.get("/:id", protect, async (req, res) => {
  if (!requireInventoryRole(req, res)) return;

  try {
    const order = await populateOrder(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    res.json(formatPurchaseOrder(order));
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Create a new purchase order
// @route   POST /api/purchase-orders
// @access  Private (inventory manager and admin only)
router.post("/", protect, async (req, res) => {
  if (!requireInventoryRole(req, res)) return;

  try {
    const { supplier, expectedDeliveryDate, items, notes } = req.body;

    if (!supplier || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide a supplier and at least one item" });
    }

    const supplierDoc = await Supplier.findById(supplier);
    if (!supplierDoc) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const normalizedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const productId = item.productId || item.product;
      const quantity = Number(item.quantity);

      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({ message: "Each item needs a product and quantity" });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${productId}` });
      }

      const price = Number(item.price ?? product.costPrice ?? product.price);
      normalizedItems.push({
        product: product._id,
        quantity,
        price,
      });
      totalAmount += quantity * price;
    }

    const orderCount = await PurchaseOrder.countDocuments();
    const order = await PurchaseOrder.create({
      supplier: supplierDoc._id,
      orderNumber: `PO-${String(orderCount + 1).padStart(5, "0")}`,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      status: "pending",
      items: normalizedItems,
      totalAmount,
      notes,
    });

    const populated = await populateOrder(order._id);
    res.status(201).json(formatPurchaseOrder(populated));
  } catch (error) {
    console.error("Error creating purchase order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Update purchase order status
// @route   PATCH /api/purchase-orders/:id/status
// @access  Private (inventory manager and admin only)
router.patch("/:id/status", protect, async (req, res) => {
  if (!requireInventoryRole(req, res)) return;

  try {
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    if (status === "delivered" && previousStatus !== "delivered") {
      for (const item of order.items) {
        let inventory = await Inventory.findOne({ product: item.product });

        if (!inventory) {
          inventory = await Inventory.create({
            product: item.product,
            quantity: 0,
            reorderLevel: 10,
            location: "Main Warehouse",
            lastStockUpdate: new Date(),
          });
        }

        inventory.quantity += item.quantity;
        inventory.lastStockUpdate = new Date();
        await inventory.save();
      }
    }

    const populated = await populateOrder(order._id);
    res.json(formatPurchaseOrder(populated));
  } catch (error) {
    console.error("Error updating purchase order status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Delete a purchase order
// @route   DELETE /api/purchase-orders/:id
// @access  Private (inventory manager and admin only)
router.delete("/:id", protect, async (req, res) => {
  if (!requireInventoryRole(req, res)) return;

  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    await PurchaseOrder.findByIdAndDelete(req.params.id);
    res.json({ message: "Purchase order removed" });
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

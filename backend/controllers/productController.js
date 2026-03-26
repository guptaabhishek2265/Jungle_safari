const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const mongoose = require("mongoose");

function formatProduct(product, inventory) {
  const stock = inventory ? inventory.quantity : 0;
  const reorderLevel = inventory ? inventory.reorderLevel : 0;

  return {
    id: product._id.toString(),
    _id: product._id,
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    cost: product.costPrice,
    sku: product.sku,
    barcode: product.barcode,
    imageUrl: product.imageUrl,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    stock,
    reorderLevel,
    location: inventory ? inventory.location : "",
    status: stock <= 0 ? "Out of Stock" : stock <= reorderLevel ? "Low Stock" : "In Stock",
  };
}

// @desc    Get all products
// @route   GET /api/products
// @access  Private
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });

    // Get inventory data to include stock information
    const inventoryData = await Inventory.find().populate("product");

    // Map products with their inventory data
    const productsWithStock = products.map((product) => {
      const inventory = inventoryData.find(
        (inv) =>
          inv.product && inv.product._id.toString() === product._id.toString()
      );

      return formatProduct(product, inventory);
    });

    res.json(productsWithStock);
  } catch (error) {
    console.error("Error getting products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get inventory data
    const inventory = await Inventory.findOne({ product: product._id });

    const productWithStock = formatProduct(product, inventory);

    res.json(productWithStock);
  } catch (error) {
    console.error("Error getting product:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Admin, Inventory Manager)
exports.createProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name,
      description,
      category,
      price,
      cost,
      sku,
      barcode,
      stock,
      reorderLevel,
      location = "Main Warehouse",
      supplier,
      imageUrl,
    } = req.body;

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res
        .status(400)
        .json({ message: "A product with this SKU already exists" });
    }

    // Create new product
    const product = new Product({
      name,
      description,
      category,
      price,
      costPrice: cost || price, // Default to price if cost not provided
      sku,
      barcode,
      imageUrl,
      isActive: true,
    });

    const savedProduct = await product.save({ session });

    // Create inventory entry for the product
    const inventory = new Inventory({
      product: savedProduct._id,
      quantity: stock || 0,
      reorderLevel: reorderLevel || 10,
      location,
      lastStockUpdate: new Date(),
    });

    await inventory.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Return the combined product and inventory data
    res.status(201).json(formatProduct(savedProduct, inventory));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error creating product:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Admin, Inventory Manager)
exports.updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      cost,
      barcode,
      reorderLevel,
      isActive,
      imageUrl,
    } = req.body;

    // Find product and update
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update product fields
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (category) product.category = category;
    if (price) product.price = price;
    if (cost) product.costPrice = cost;
    if (barcode !== undefined) product.barcode = barcode;
    if (imageUrl !== undefined) product.imageUrl = imageUrl;
    if (isActive !== undefined) product.isActive = isActive;

    const updatedProduct = await product.save();

    // Update inventory if reorder level is provided
    if (reorderLevel !== undefined) {
      const inventory = await Inventory.findOne({ product: product._id });

      if (inventory) {
        inventory.reorderLevel = reorderLevel;
        await inventory.save();
      }
    }

    // Get updated inventory data
    const inventory = await Inventory.findOne({ product: product._id });

    res.json(formatProduct(updatedProduct, inventory));
  } catch (error) {
    console.error("Error updating product:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin, Inventory Manager)
exports.deleteProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find product
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete related inventory entries
    await Inventory.deleteMany({ product: product._id }, { session });

    // Delete product
    await Product.findByIdAndDelete(req.params.id, { session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: "Product removed" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error deleting product:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private
exports.getLowStockProducts = async (req, res) => {
  try {
    // Find all inventory items where quantity <= reorderLevel
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ["$quantity", "$reorderLevel"] },
    }).populate("product");

    if (!lowStockItems || lowStockItems.length === 0) {
      return res.json([]);
    }

    // Format response
    const formattedItems = lowStockItems.map((item) => {
      return formatProduct(item.product, {
        quantity: item.quantity,
        reorderLevel: item.reorderLevel,
        location: item.location,
      });
    });

    res.json(formattedItems);
  } catch (error) {
    console.error("Error getting low stock products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

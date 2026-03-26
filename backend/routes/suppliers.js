const express = require("express");
const router = express.Router();
const Supplier = require("../models/Supplier");
const { protect } = require("../middleware/auth");

function formatSupplier(supplier) {
  return {
    id: supplier._id.toString(),
    _id: supplier._id,
    name: supplier.name,
    contactPerson: supplier.contactPerson || "",
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address || "",
    categories: supplier.categories || [],
    notes: supplier.notes || "",
    isActive: supplier.isActive,
    status: supplier.isActive ? "Active" : "Inactive",
    createdAt: supplier.createdAt,
    updatedAt: supplier.updatedAt,
  };
}

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json(suppliers.map(formatSupplier));
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Create a new supplier
// @route   POST /api/suppliers
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { name, contactPerson, email, phone, address, categories, notes, isActive } =
      req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        message: "Please provide supplier name, email, and phone",
      });
    }

    const supplier = await Supplier.create({
      name,
      contactPerson,
      email,
      phone,
      address,
      categories: Array.isArray(categories)
        ? categories
        : typeof categories === "string" && categories.trim()
        ? categories.split(",").map((item) => item.trim()).filter(Boolean)
        : [],
      notes,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    res.status(201).json(formatSupplier(supplier));
  } catch (error) {
    console.error("Error creating supplier:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Update a supplier
// @route   PUT /api/suppliers/:id
// @access  Private
router.put("/:id", protect, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const { name, contactPerson, email, phone, address, categories, notes, isActive } =
      req.body;

    if (name !== undefined) supplier.name = name;
    if (contactPerson !== undefined) supplier.contactPerson = contactPerson;
    if (email !== undefined) supplier.email = email;
    if (phone !== undefined) supplier.phone = phone;
    if (address !== undefined) supplier.address = address;
    if (categories !== undefined) {
      supplier.categories = Array.isArray(categories)
        ? categories
        : typeof categories === "string" && categories.trim()
        ? categories.split(",").map((item) => item.trim()).filter(Boolean)
        : [];
    }
    if (notes !== undefined) supplier.notes = notes;
    if (isActive !== undefined) supplier.isActive = Boolean(isActive);

    await supplier.save();

    res.json(formatSupplier(supplier));
  } catch (error) {
    console.error("Error updating supplier:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Delete a supplier
// @route   DELETE /api/suppliers/:id
// @access  Private
router.delete("/:id", protect, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ message: "Supplier removed" });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

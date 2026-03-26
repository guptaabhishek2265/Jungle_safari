const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

// Placeholder - will be implemented later
router.get("/", protect, authorize("admin"), (req, res) => {
  res.json({ message: "Users route - to be implemented" });
});

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error loading current user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/me", protect, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    if (name) {
      user.name = name;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required" });
      }

      const passwordMatches = await user.comparePassword(currentPassword);
      if (!passwordMatches) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      user.password = newPassword;
    }

    await user.save();

    const sanitizedUser = await User.findById(user._id).select("-password");
    res.json(sanitizedUser);
  } catch (error) {
    console.error("Error updating current user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

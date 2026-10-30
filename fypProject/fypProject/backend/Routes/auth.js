const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../Models/user");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Route: Sign Up
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

// Route: Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: "Invalid credentials" });

    // Generate a JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ token, user: { id: user._id, username: user.username, email: user.email, profilePic: user.profilePic } });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

router.post("/change-password", async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await User.findByIdAndUpdate(userId, { password: hashedPassword });

    if (!result) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Something went wrong", error });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Create this folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Route: Upload Profile Picture
router.post("/upload-profile-pic", upload.single("profilePic"), async (req, res) => {
  const { userId } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    // 🔥 Fetch the user first!
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.profilePic = `/uploads/${req.file.filename}`; // Relative path for serving
    await user.save();

    res.status(200).json({ imageUrl: user.profilePic });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Server error while uploading" });
  }
});
module.exports = router;

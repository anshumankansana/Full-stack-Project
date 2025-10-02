const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
require("dotenv").config();

const router = express.Router();

// Register
router.post("/register",
  body("name").notEmpty(),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name,email,password } = req.body;
    try{
      let user = await User.findOne({ email });
      if(user) return res.status(400).json({ msg: "User already exists" });

      user = new User({ name,email,password });
      await user.save();

      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
      res.json({ token });
    } catch(err){ res.status(500).send("Server error"); }
});

// Login
router.post("/login",
  body("email").isEmail(),
  body("password").exists(),
  async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try{
      let user = await User.findOne({ email });
      if(!user) return res.status(400).json({ msg: "Invalid credentials" });

      const isMatch = await user.comparePassword(password);
      if(!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
      res.json({ token });
    } catch(err){ res.status(500).send("Server error"); }
});

// Get logged-in user
router.get("/me", auth, async (req,res)=>{
  try{
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch(err){ res.status(500).send("Server error"); }
});

module.exports = router;

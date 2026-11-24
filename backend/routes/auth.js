const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required." });
    if (password.length < 6) return res.status(400).json({ message: "Password must contain at least 6 characters." });
    if (await User.findOne({ email })) return res.status(409).json({ message: "This email is already registered." });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ message: "Account created. You can now log in.", user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { next(e); }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password || "", user.password))) return res.status(401).json({ message: "Incorrect email or password." });
    const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { next(e); }
});
module.exports = router;

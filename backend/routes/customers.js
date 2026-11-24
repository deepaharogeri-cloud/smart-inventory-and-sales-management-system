const router = require("express").Router();
const auth = require("../middleware/auth");
const Customer = require("../models/Customer");
router.use(auth);
router.get("/", async (req, res, next) => {
  try { res.json(await Customer.find().sort({ createdAt: -1 })); } catch (e) { next(e); }
});
router.post("/", async (req, res, next) => {
  try {
    if (!req.body.name) return res.status(400).json({ message: "Customer name is required." });
    res.status(201).json(await Customer.create(req.body));
  } catch (e) { next(e); }
});
router.put("/:id", async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ message: "Customer not found." });
    res.json(customer);
  } catch (e) { next(e); }
});
router.delete("/:id", async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found." });
    res.json({ message: "Customer deleted." });
  } catch (e) { next(e); }
});
module.exports = router;

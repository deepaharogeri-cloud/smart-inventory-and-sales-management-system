const router = require("express").Router();
const auth = require("../middleware/auth");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
router.use(auth);

router.get("/", async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    const stocks = await Inventory.find().lean();
    const stockMap = new Map(stocks.map(s => [String(s.product), s]));
    res.json(products.map(p => ({ ...p, stock: stockMap.get(String(p._id))?.stockQuantity ?? 0, minimumStock: stockMap.get(String(p._id))?.minimumStock ?? 5 })));
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, category, price, supplier, stockQuantity, minimumStock } = req.body;
    if (!name || price === "" || price === undefined || Number(price) < 0 || Number(stockQuantity) < 0) return res.status(400).json({ message: "Enter a product name and valid price/stock." });
    const product = await Product.create({ name, category, price: Number(price), supplier });
    await Inventory.create({ product: product._id, stockQuantity: Number(stockQuantity || 0), minimumStock: Number(minimumStock || 5) });
    res.status(201).json({ message: "Product added.", product });
  } catch (e) { next(e); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { name, category, price, supplier, minimumStock } = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, { name, category, price: Number(price), supplier }, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: "Product not found." });
    if (minimumStock !== undefined) await Inventory.findOneAndUpdate({ product: product._id }, { minimumStock: Number(minimumStock), lastUpdated: new Date() });
    res.json({ message: "Product updated.", product });
  } catch (e) { next(e); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });
    await Inventory.deleteOne({ product: product._id });
    res.json({ message: "Product deleted." });
  } catch (e) { next(e); }
});
module.exports = router;

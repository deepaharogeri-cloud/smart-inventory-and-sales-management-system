const router = require("express").Router();
const auth = require("../middleware/auth");
const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const Customer = require("../models/Customer");
router.use(auth);

router.get("/", async (req, res, next) => {
  try {
    const sales = await Sale.find().populate("customer", "name").sort({ saleDate: -1 });
    res.json(sales);
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const { customerId, items } = req.body;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: "Add at least one product to the sale." });
    if (customerId && !(await Customer.findById(customerId))) return res.status(400).json({ message: "Select a valid customer." });

    const prepared = [];
    let totalAmount = 0;
    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: "Sale quantity must be a positive whole number." });
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: "A selected product was not found." });
      const inventory = await Inventory.findOne({ product: product._id });
      if (!inventory || inventory.stockQuantity < quantity) return res.status(400).json({ message: `Not enough stock for ${product.name}. Available: ${inventory?.stockQuantity ?? 0}` });
      const lineTotal = product.price * quantity;
      totalAmount += lineTotal;
      prepared.push({ product, inventory, quantity, lineTotal });
    }

    for (const item of prepared) {
      item.inventory.stockQuantity -= item.quantity;
      item.inventory.lastUpdated = new Date();
      await item.inventory.save();
    }
    const sale = await Sale.create({
      customer: customerId || null,
      items: prepared.map(x => ({ product: x.product._id, productName: x.product.name, quantity: x.quantity, unitPrice: x.product.price, lineTotal: x.lineTotal })),
      totalAmount
    });
    res.status(201).json({ message: "Sale recorded and stock updated.", sale });
  } catch (e) { next(e); }
});
module.exports = router;

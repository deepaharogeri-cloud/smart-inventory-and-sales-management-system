const router = require("express").Router();
const auth = require("../middleware/auth");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const Customer = require("../models/Customer");
const Sale = require("../models/Sale");
router.use(auth);
router.get("/", async (req, res, next) => {
  try {
    const [totalProducts, totalCustomers, inventory, sales] = await Promise.all([
      Product.countDocuments(), Customer.countDocuments(), Inventory.find().populate("product", "name"),
      Sale.find().sort({ saleDate: -1 }).limit(7).populate("customer", "name")
    ]);
    const totalStock = inventory.reduce((sum, x) => sum + x.stockQuantity, 0);
    const lowStock = inventory.filter(x => x.stockQuantity <= x.minimumStock);
    const allSales = await Sale.find();
    const totalRevenue = allSales.reduce((sum, x) => sum + x.totalAmount, 0);
    res.json({ totalProducts, totalCustomers, totalStock, totalRevenue, lowStock, recentSales: sales });
  } catch (e) { next(e); }
});
module.exports = router;

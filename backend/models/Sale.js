const mongoose = require("mongoose");
const saleSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: String,
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 }
  }],
  totalAmount: { type: Number, required: true, min: 0 },
  saleDate: { type: Date, default: Date.now }
}, { timestamps: true });
module.exports = mongoose.model("Sale", saleSchema);

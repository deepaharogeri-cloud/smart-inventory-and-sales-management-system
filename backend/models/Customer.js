const mongoose = require("mongoose");
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, default: "" },
  email: { type: String, default: "", lowercase: true, trim: true }
}, { timestamps: true });
module.exports = mongoose.model("Customer", customerSchema);

import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unitPrice: { type: Number, required: true, min: 0, default: 0 },
    warehouse: { type: String, trim: true },
  },
  { timestamps: true },
);

export const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);

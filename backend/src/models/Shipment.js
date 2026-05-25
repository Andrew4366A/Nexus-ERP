import mongoose from "mongoose";

const shipmentSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, trim: true },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    carrier: { type: String, trim: true },
    status: {
      type: String,
      enum: ["planned", "in_transit", "delayed", "delivered"],
      default: "planned",
    },
    expectedDeliveryDate: Date,
  },
  { timestamps: true },
);

export const Shipment = mongoose.model("Shipment", shipmentSchema);

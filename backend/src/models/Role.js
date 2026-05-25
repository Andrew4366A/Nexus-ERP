import mongoose from "mongoose";

const modulePermissionSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: true,
      trim: true,
      enum: ["Dashboard", "Inventory", "Payroll", "Logistics", "Staff", "Settings"],
    },
    actions: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    create: { type: Boolean, default: undefined },
    read: { type: Boolean, default: undefined },
    edit: { type: Boolean, default: undefined },
    delete: { type: Boolean, default: undefined },
  },
  { _id: false },
);

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: {
      type: [modulePermissionSchema],
      default: [],
    },
    isCustom: {
      type: Boolean,
      default: true,
    },
    sidebarSections: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

export const Role = mongoose.model("Role", roleSchema);

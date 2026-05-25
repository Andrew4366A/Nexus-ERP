import mongoose from "mongoose";
import { InventoryItem } from "../models/InventoryItem.js";
import { notifyAdmins } from "../socket.js";

export async function listInventory(_req, res, next) {
  try {
    const items = await InventoryItem.find().sort({ createdAt: -1 });
    res.json({ items });
  } catch (error) {
    next(error);
  }
}

export async function createInventoryItem(req, res, next) {
  try {
    const item = await InventoryItem.create(req.body);

    if (req.user.role === "user") {
      notifyAdmins({
        type: "inventory.created",
        title: "Inventory item added",
        message: `${req.user.name} added ${item.name || item.sku || "an inventory item"}.`,
        actor: {
          id: req.user._id,
          name: req.user.name,
          role: req.user.role,
        },
        resource: {
          id: item._id,
          module: "inventory",
        },
        inventory: {
          name: item.name,
          sku: item.sku,
          category: item.category,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        },
      });
    }

    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
}

export async function updateInventoryItem(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid item id" });
    }

    const item = await InventoryItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    const allowed = ["name", "sku", "category", "description", "quantity", "unitPrice"];
    for (const key of allowed) {
      if (key in req.body) {
        item[key] = req.body[key];
      }
    }

    await item.save();

    if (req.user.role === "user") {
      notifyAdmins({
        type: "inventory.updated",
        title: "Inventory item updated",
        message: `${req.user.name} updated ${item.name || item.sku || "an inventory item"}.`,
        actor: {
          id: req.user._id,
          name: req.user.name,
          role: req.user.role,
        },
        resource: {
          id: item._id,
          module: "inventory",
        },
        inventory: {
          name: item.name,
          sku: item.sku,
          category: item.category,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        },
      });
    }

    res.json({ item });
  } catch (error) {
    next(error);
  }
}

export async function deleteInventoryItem(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid item id" });
    }

    const item = await InventoryItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    await InventoryItem.deleteOne({ _id: id });

    if (req.user.role === "user") {
      notifyAdmins({
        type: "inventory.deleted",
        title: "Inventory item deleted",
        message: `${req.user.name} deleted ${item.name || item.sku || "an inventory item"}.`,
        actor: {
          id: req.user._id,
          name: req.user.name,
          role: req.user.role,
        },
        resource: {
          id: item._id,
          module: "inventory",
        },
      inventory: {
         name: item.name,
         sku: item.sku,
         category: item.category,
         quantity: item.quantity,
         unitPrice: item.unitPrice,
       },
      });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

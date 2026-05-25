import { Router } from "express";

import {
  createInventoryItem,
  deleteInventoryItem,
  listInventory,
  updateInventoryItem,
} from "../controllers/inventoryController.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkPermission } from "../middleware/permissionMiddleware.js";

const router = Router();

router.get("/", protect, checkPermission("Inventory", "read"), listInventory);
router.post("/", protect, checkPermission("Inventory", "create"), createInventoryItem);
router.patch("/:id", protect, checkPermission("Inventory", "edit"), updateInventoryItem);
router.delete("/:id", protect, checkPermission("Inventory", "delete"), deleteInventoryItem);

export default router;

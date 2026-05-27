import { Router } from "express";

import {
  createShipment,
  deleteShipment,
  listShipments,
  updateShipment,
} from "../controllers/logisticsController.js";

import { protect } from "../middleware/authMiddleware.js";
import { checkPermission } from "../middleware/permissionMiddleware.js";

const router = Router();

router.get("/", protect, checkPermission("Logistics", "read"), listShipments);
router.post("/", protect, checkPermission("Logistics", "create"), createShipment);

router.put("/:id", protect, checkPermission("Logistics", "edit"), updateShipment);
router.patch("/:id", protect, checkPermission("Logistics", "edit"), updateShipment);

router.delete("/:id", protect, checkPermission("Logistics", "delete"), deleteShipment);

export default router;

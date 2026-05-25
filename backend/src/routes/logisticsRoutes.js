import { Router } from "express";

import { createShipment, listShipments } from "../controllers/logisticsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkPermission } from "../middleware/permissionMiddleware.js";

const router = Router();

router.get("/", protect, checkPermission("Logistics", "read"), listShipments);
router.post("/", protect, checkPermission("Logistics", "create"), createShipment);

export default router;

import { Router } from "express";

import { createStaffMember, listStaff } from "../controllers/staffController.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkPermission } from "../middleware/permissionMiddleware.js";

const router = Router();

router.get("/", protect, checkPermission("Staff", "read"), listStaff);
router.post("/", protect, checkPermission("Staff", "create"), createStaffMember);

export default router;

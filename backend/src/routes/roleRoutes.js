import { Router } from "express";

import {
  createRole,
  deleteRole,
  getRole,
  listRoles,
  updateRole,
} from "../controllers/rolesController.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();
router.use(protect, adminOnly);

router.get("/", listRoles);
router.get("/:id", getRole);
router.post("/", createRole);
router.put("/:id", updateRole);
router.patch("/:id", updateRole);
router.delete("/:id", deleteRole);

export default router;

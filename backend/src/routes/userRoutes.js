import { Router } from "express";

import {
  createUser,
  deleteUser,
  listUsers,
  resetUserPassword,
  updateSidebarSections,
  updateRoleBasedActions,
  updateUser,
} from "../controllers/usersController.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect, adminOnly);

router.get("/", listUsers);
router.post("/", createUser);
router.post("/create", createUser);
router.patch("/:id", updateUser);
router.patch("/:id/password", resetUserPassword);
router.patch("/:id/sidebar-sections", updateSidebarSections);
router.patch("/:id/role-based-actions", updateRoleBasedActions);
router.delete("/:id", deleteUser);

export default router;

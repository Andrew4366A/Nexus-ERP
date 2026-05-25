import { Router } from "express";

import {
  createSalaryDefinition,
  deleteSalaryDefinition,
  listSalaryDefinitions,
} from "../controllers/payrollController.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkPermission } from "../middleware/permissionMiddleware.js";

const router = Router();

router.get(
  "/salary-definitions",
  protect,
  checkPermission("Payroll", "read"),
  listSalaryDefinitions,
);
router.post(
  "/salary-definitions",
  protect,
  checkPermission("Payroll", "create"),
  createSalaryDefinition,
);
router.delete(
  "/salary-definitions/:id",
  protect,
  checkPermission("Payroll", "delete"),
  deleteSalaryDefinition,
);

export default router;

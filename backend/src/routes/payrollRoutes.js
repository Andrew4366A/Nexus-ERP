import { Router } from "express";

import {
  createSalaryDefinition,
  deleteSalaryDefinition,
  listSalaryDefinitions,
  updateSalaryDefinition,
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

router.put(
  "/salary-definitions/:id",
  protect,
  checkPermission("Payroll", "edit"),
  updateSalaryDefinition,
);

router.patch(
  "/salary-definitions/:id",
  protect,
  checkPermission("Payroll", "edit"),
  updateSalaryDefinition,
);

export default router;

import { SalaryDefinition } from "../models/SalaryDefinition.js";
import { notifyAdmins } from "../socket.js";

export async function listSalaryDefinitions(_req, res, next) {
  try {
    const salaryDefinitions = await SalaryDefinition.find().sort({ createdAt: -1 });
    res.json({ salaryDefinitions });
  } catch (error) {
    next(error);
  }
}

export async function createSalaryDefinition(req, res, next) {
  try {
    const salaryDefinition = await SalaryDefinition.create(req.body);

    if (req.user.role === "user") {
      notifyAdmins({
        type: "payroll.salary_definition_created",
        title: "Salary definition added",
        message: `${req.user.name} added ${salaryDefinition.title || "a salary definition"}.`,
        actor: {
          id: req.user._id,
          name: req.user.name,
          role: req.user.role,
        },
        resource: {
          id: salaryDefinition._id,
          module: "payroll",
        },
      });
    }

    res.status(201).json({ salaryDefinition });
  } catch (error) {
    next(error);
  }
}

export async function deleteSalaryDefinition(req, res, next) {
  try {
    const def = await SalaryDefinition.findByIdAndDelete(req.params.id);
    if (!def) {
      return res.status(404).json({ message: "Salary definition not found" });
    }
    res.json({ message: "Salary definition removed", id: def._id });
  } catch (error) {
    next(error);
  }
}

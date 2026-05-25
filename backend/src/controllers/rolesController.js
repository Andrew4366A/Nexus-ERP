import mongoose from "mongoose";

import { Role } from "../models/Role.js";
import { User } from "../models/User.js";
import { notifyUserWorkspaceAccess } from "../socket.js";

const ALLOWED_SIDEBAR_KEYS = [
  "dashboard",
  "inventory",
  "payroll",
  "logistics",
  "staff",
  "settings",
];

const ALLOWED_ACTIONS = new Set(["create", "read", "edit", "delete"]);

const LABEL_TO_KEY = {
  Dashboard: "dashboard",
  Inventory: "inventory",
  Payroll: "payroll",
  Logistics: "logistics",
  Staff: "staff",
  Settings: "settings",
};

const MODULE_LABELS = new Set(Object.keys(LABEL_TO_KEY));

function normalizeSections(input) {
  if (!Array.isArray(input)) return [];
  const mapped = input.map((value) => {
    const trimmed = String(value).trim();
    if (ALLOWED_SIDEBAR_KEYS.includes(trimmed)) return trimmed;
    return LABEL_TO_KEY[trimmed] ?? null;
  });
  return [...new Set(mapped)].filter(Boolean);
}

function normalizePermissions(input) {
  if (!input || typeof input !== "object") return [];

  const entries = Array.isArray(input)
    ? input.map((permission) => [permission?.module, permission])
    : Object.entries(input);

  return entries.reduce((result, [module, permission]) => {
    if (!module || !permission || typeof permission !== "object") return result;
    const moduleName = String(module).trim();
    if (!MODULE_LABELS.has(moduleName)) return result;

    const sourceActions =
      permission.actions && typeof permission.actions === "object"
        ? permission.actions
        : permission;

    const normalized = { module: moduleName, actions: {} };
    let hasAction = false;

    for (const key of ALLOWED_ACTIONS) {
      if (key in sourceActions) {
        normalized.actions[key] = Boolean(sourceActions[key]);
        hasAction = true;
      }
    }

    if (hasAction) {
      result.push(normalized);
    }
    return result;
  }, []);
}

function rolePayload(role) {
  return {
    _id: String(role._id),
    name: role.name,
    description: role.description,
    isCustom: role.isCustom,
    sidebarSections: Array.isArray(role.sidebarSections) ? role.sidebarSections : [],
    permissions: Array.isArray(role.permissions) ? role.permissions : [],
  };
}

async function notifyAssignedUsers(role) {
  const users = await User.find({ roleId: role._id }).select("_id").lean();
  const payloadRole = rolePayload(role);

  for (const user of users) {
    notifyUserWorkspaceAccess(user._id, {
      roleId: payloadRole,
      roleName: role.name,
      sidebarSections: payloadRole.sidebarSections,
      roleBasedActions: payloadRole.permissions.reduce((acc, permission) => {
        if (!permission?.module) return acc;
        const hasLegacyActions =
          permission.create !== undefined ||
          permission.read !== undefined ||
          permission.edit !== undefined ||
          permission.delete !== undefined;
        const actions = hasLegacyActions ? permission : permission.actions;
        acc[permission.module] = {
          create: Boolean(actions.create),
          read: Boolean(actions.read),
          edit: Boolean(actions.edit),
          delete: Boolean(actions.delete),
        };
        return acc;
      }, {}),
    });
  }
}

export async function listRoles(_req, res, next) {
  try {
    const roles = await Role.find().sort({ name: 1 }).lean();
    res.json({ roles });
  } catch (error) {
    next(error);
  }
}

export async function getRole(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid role id" });
    }

    const role = await Role.findById(id).lean();
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json({ role });
  } catch (error) {
    next(error);
  }
}

export async function createRole(req, res, next) {
  try {
    const name = req.body.name?.trim();
    if (!name) {
      return res.status(400).json({ message: "Role name is required" });
    }

    const existing = await Role.findOne({ name });
    if (existing) {
      return res.status(409).json({ message: "Role name already exists" });
    }

    const role = await Role.create({
      name,
      description: req.body.description?.trim(),
      isCustom: req.body.isCustom !== undefined ? Boolean(req.body.isCustom) : true,
      sidebarSections: normalizeSections(req.body.sidebarSections),
      permissions: normalizePermissions(req.body.permissions),
    });

    res.status(201).json({ role });
  } catch (error) {
    next(error);
  }
}

export async function updateRole(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid role id" });
    }

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    if (req.body.name) {
      const nextName = req.body.name.trim();
      if (nextName && nextName !== role.name) {
        const duplicate = await Role.findOne({ name: nextName, _id: { $ne: role._id } });
        if (duplicate) {
          return res.status(409).json({ message: "Role name already exists" });
        }
        role.name = nextName;
      }
    }

    if (typeof req.body.description === "string") {
      role.description = req.body.description.trim();
    }

    if (req.body.isCustom !== undefined) {
      role.isCustom = Boolean(req.body.isCustom);
    }

    if (req.body.sidebarSections !== undefined) {
      role.sidebarSections = normalizeSections(req.body.sidebarSections);
    }

    if (req.body.permissions !== undefined) {
      role.permissions = normalizePermissions(req.body.permissions);
    }

    await role.save();
    await notifyAssignedUsers(role);
    res.json({ role });
  } catch (error) {
    next(error);
  }
}

export async function deleteRole(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid role id" });
    }

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    const assignedCount = await User.countDocuments({ roleId: role._id });
    if (assignedCount > 0) {
      return res.status(400).json({ message: "Cannot delete role while users are assigned to it" });
    }

    await role.deleteOne();
    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    next(error);
  }
}

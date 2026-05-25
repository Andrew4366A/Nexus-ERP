import { Role } from "../models/Role.js";

const ACTION_KEYS = new Set(["create", "read", "edit", "delete"]);

export function checkPermission(moduleName, action) {
  if (!ACTION_KEYS.has(action)) {
    throw new Error(`Invalid permission action: ${action}`);
  }

  return async function (req, res, next) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Not authorized" });
      }

      if (user.role === "admin") {
        return next();
      }

      let role = user.roleId;
      if (role && role._id && role.permissions) {
        // role already populated by protect middleware
      } else if (user.roleId) {
        role = await Role.findById(user.roleId).lean();
      }

      if (!role) {
        return res.status(403).json({ message: "Role not assigned or not found" });
      }

      const permission = (role.permissions || []).find((perm) => perm.module === moduleName);
      const hasLegacyActions =
        permission?.create !== undefined ||
        permission?.read !== undefined ||
        permission?.edit !== undefined ||
        permission?.delete !== undefined;
      const actions = hasLegacyActions ? permission : permission?.actions;
      if (!actions || actions[action] !== true) {
        return res.status(403).json({ message: "Forbidden: insufficient permissions" });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

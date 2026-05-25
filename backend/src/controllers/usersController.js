import mongoose from "mongoose";

import { userPayload } from "./authController.js";
import { Role } from "../models/Role.js";
import { User } from "../models/User.js";
import { notifyUserWorkspaceAccess } from "../socket.js";
import { generateTemporaryPassword } from "../utils/generatePassword.js";

const ALLOWED_SIDEBAR_KEYS = [
  "dashboard",
  "inventory",
  "payroll",
  "logistics",
  "staff",
  "settings",
];

const ALLOWED = new Set(ALLOWED_SIDEBAR_KEYS);

const LABEL_TO_KEY = {
  Dashboard: "dashboard",
  Inventory: "inventory",
  Payroll: "payroll",
  Logistics: "logistics",
  Staff: "staff",
  Settings: "settings",
};

function normalizeSections(input) {
  if (!Array.isArray(input)) return null;
  return [
    ...new Set(
      input
        .map((value) => {
          const trimmed = String(value).trim();
          const lower = trimmed.toLowerCase();
          if (ALLOWED.has(lower)) return lower;
          return LABEL_TO_KEY[trimmed] ?? null;
        })
        .filter(Boolean),
    ),
  ];
}

async function countAdmins(excludeId = null) {
  const filter = { role: "admin" };
  if (excludeId) filter._id = { $ne: excludeId };
  return User.countDocuments(filter);
}

function matchesConfirmAccount(user, confirm) {
  const value = confirm?.toLowerCase()?.trim();
  if (!value) return false;
  return user.username === value || user.email === value;
}

export async function listUsers(_req, res, next) {
  try {
    const users = await User.find()
      .select("name email username role roleId sidebarSections createdAt")
      .populate("roleId")
      .sort({ role: 1, name: 1 })
      .lean();

    res.json({
      users: users.map((doc) =>
        userPayload({
          ...doc,
          _id: doc._id,
        }),
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req, res, next) {
  try {
    const name = req.body.name?.trim();
    const username = req.body.username?.toLowerCase()?.trim();
    const email = req.body.email?.toLowerCase()?.trim();
    const role = req.body.role === "admin" ? "admin" : "user";
    let password = req.body.password;
    let generatedPassword = false;

    if (!name || !username || !email) {
      return res.status(400).json({ message: "Name, username, and email are required" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({ message: "A user with this email or username already exists" });
    }

    if (!password || String(password).length < 8) {
      password = generateTemporaryPassword();
      generatedPassword = true;
    }

    let roleId = req.body.roleId;
    let roleDoc = null;
    if (roleId) {
      if (!mongoose.Types.ObjectId.isValid(roleId)) {
        return res.status(400).json({ message: "Invalid roleId" });
      }
      roleDoc = await Role.findById(roleId);
      if (!roleDoc) {
        return res.status(400).json({ message: "Role not found" });
      }
    }

    const nextRole = roleDoc
      ? String(roleDoc.name).toLowerCase() === "administrator"
        ? "admin"
        : "user"
      : req.body.role === "admin"
        ? "admin"
        : "user";

    const modules = normalizeSections(req.body.sidebarSections ?? req.body.modules);
    const roleSections = normalizeSections(roleDoc?.sidebarSections);
    const sidebarSections =
      nextRole === "user"
        ? roleSections?.length > 0
          ? roleSections
          : modules && modules.length > 0
            ? modules
            : ["inventory"]
        : undefined;

    const user = await User.create({
      name,
      email,
      username,
      password,
      role: nextRole,
      roleId: roleDoc?._id,
      sidebarSections,
    });

    await user.populate("roleId");

    const response = {
      user: userPayload(user),
      message: generatedPassword
        ? "User created. Copy the temporary password now — it will not be shown again."
        : "User created successfully.",
    };

    if (generatedPassword) {
      response.temporaryPassword = password;
    }

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const confirm = req.body.confirmUsername ?? req.body.confirmEmail ?? req.body.confirmAccount;
    if (!matchesConfirmAccount(user, confirm)) {
      return res.status(400).json({
        message: "Confirmation failed. Enter the exact current username or email for this account.",
      });
    }

    const nextEmail = req.body.email?.toLowerCase()?.trim();
    const nextUsername = req.body.username?.toLowerCase()?.trim();
    const nextRole = req.body.role;

    if (nextEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
        return res.status(400).json({ message: "Enter a valid email address" });
      }
      const emailTaken = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
      if (emailTaken) {
        return res.status(409).json({ message: "Email is already in use" });
      }
      user.email = nextEmail;
    }

    if (nextUsername) {
      if (nextUsername.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters" });
      }
      const usernameTaken = await User.findOne({ username: nextUsername, _id: { $ne: user._id } });
      if (usernameTaken) {
        return res.status(409).json({ message: "Username is already in use" });
      }
      user.username = nextUsername;
    }

    if (req.body.roleId !== undefined || nextRole === "admin" || nextRole === "user") {
      let roleDoc = null;
      if (req.body.roleId !== undefined) {
        if (!mongoose.Types.ObjectId.isValid(req.body.roleId)) {
          return res.status(400).json({ message: "Invalid roleId" });
        }
        roleDoc = await Role.findById(req.body.roleId);
        if (!roleDoc) {
          return res.status(400).json({ message: "Role not found" });
        }
      }

      if (roleDoc) {
        const derivedRole =
          String(roleDoc.name).toLowerCase() === "administrator" ? "admin" : "user";
        if (user.role === "admin" && derivedRole === "user") {
          const admins = await countAdmins();
          if (admins <= 1) {
            return res.status(400).json({
              message: "Cannot downgrade the last administrator. Promote another admin first.",
            });
          }
        }
        user.role = derivedRole;
        user.roleId = roleDoc._id;
        const roleSections = normalizeSections(roleDoc.sidebarSections);
        user.sidebarSections =
          derivedRole === "admin"
            ? undefined
            : roleSections?.length > 0
              ? roleSections
              : user.sidebarSections;
      } else if (nextRole === "admin" || nextRole === "user") {
        if (user.role === "admin" && nextRole === "user") {
          const admins = await countAdmins();
          if (admins <= 1) {
            return res.status(400).json({
              message: "Cannot downgrade the last administrator. Promote another admin first.",
            });
          }
        }
        user.role = nextRole;
        user.roleId = undefined;
        if (nextRole === "admin") {
          user.sidebarSections = undefined;
        } else if (!user.sidebarSections?.length) {
          user.sidebarSections = ["inventory"];
        }
      }
    }

    await user.save();

    res.json({
      user: userPayload(user),
      message: "Account updated successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (String(req.user?._id) === id || String(req.user?.id) === id) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      const admins = await countAdmins(user._id);
      if (admins < 1) {
        return res.status(400).json({
          message: "Cannot delete the last administrator. Promote another admin first.",
        });
      }
    }

    await user.deleteOne();

    res.json({
      deletedUserId: id,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function resetUserPassword(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const confirm = req.body.confirmUsername ?? req.body.confirmEmail ?? req.body.confirmAccount;
    if (!matchesConfirmAccount(user, confirm)) {
      return res.status(400).json({
        message: "Confirmation failed. Enter the exact current username or email for this account.",
      });
    }

    let password = req.body.password;
    let generatedPassword = false;

    if (!password || String(password).length < 8) {
      password = generateTemporaryPassword();
      generatedPassword = true;
    }

    user.password = password;
    await user.save();

    const response = {
      message: generatedPassword
        ? "Password reset. Copy the temporary password now — it will not be shown again."
        : "Password updated successfully.",
    };

    if (generatedPassword) {
      response.temporaryPassword = password;
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function updateSidebarSections(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const nextSections = normalizeSections(req.body.sidebarSections);
    if (nextSections === null) {
      return res.status(400).json({ message: "sidebarSections must be an array" });
    }
    if (nextSections.length === 0) {
      return res.status(400).json({ message: "Select at least one workspace module" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role !== "user") {
      return res.status(400).json({
        message: "Sidebar modules apply to workspace users only. Admins always have full access.",
      });
    }

    user.sidebarSections = nextSections;
    await user.save();

    const payloadSections =
      Array.isArray(user.sidebarSections) && user.sidebarSections.length > 0
        ? user.sidebarSections
        : ["inventory"];

    notifyUserWorkspaceAccess(user._id, {
      sidebarSections: payloadSections,
    });

    res.json({
      user: userPayload(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRoleBasedActions(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(400).json({
      message: "Permissions are managed on the assigned role master. Update the role instead.",
    });
  } catch (error) {
    next(error);
  }
}

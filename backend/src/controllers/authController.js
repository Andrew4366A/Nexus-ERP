import { generateToken } from "../utils/generateToken.js";
import { User } from "../models/User.js";

function buildRoleActions(role) {
  if (!role?.permissions) return undefined;
  return role.permissions.reduce((acc, permission) => {
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
  }, {});
}

function buildRoleSections(role, user) {
  if (Array.isArray(role?.sidebarSections) && role.sidebarSections.length > 0) {
    return role.sidebarSections;
  }
  return Array.isArray(user.sidebarSections) ? user.sidebarSections : [];
}

export function userPayload(user) {
  const roleDoc = user.roleId;
  const roleName = roleDoc?.name || user.role || "user";
  const roleString =
    user.role || (String(roleName).toLowerCase() === "administrator" ? "admin" : "user");

  const populatedRole =
    roleDoc && typeof roleDoc === "object"
      ? {
          _id: String(roleDoc._id),
          name: roleDoc.name,
          description: roleDoc.description,
          isCustom: roleDoc.isCustom,
          sidebarSections: Array.isArray(roleDoc.sidebarSections) ? roleDoc.sidebarSections : [],
          permissions: Array.isArray(roleDoc.permissions) ? roleDoc.permissions : [],
        }
      : undefined;

  const base = {
    id: user._id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: roleString,
    ...(populatedRole ? { roleId: populatedRole } : {}),
    ...(roleDoc?.name ? { roleName: roleDoc.name } : {}),
  };

  if (roleString === "admin") {
    return base;
  }

  const sections = buildRoleSections(roleDoc, user);
  const roleBasedActions = roleDoc ? buildRoleActions(roleDoc) : undefined;

  return {
    ...base,
    sidebarSections: sections.length > 0 ? sections : ["inventory"],
    ...(roleBasedActions ? { roleBasedActions } : {}),
  };
}

export async function register(req, res, next) {
  try {
    const { name, email, username, password } = req.body;
    const userCount = await User.estimatedDocumentCount();
    const role = userCount === 0 ? "admin" : "user";

    const existingUser = await User.findOne({
      $or: [{ email: email?.toLowerCase() }, { username: username?.toLowerCase() }],
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const sidebarSections = role === "user" ? ["inventory"] : undefined;
    const user = await User.create({
      name,
      email,
      username,
      password,
      role,
      sidebarSections,
    });

    res.status(201).json({
      user: userPayload(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { usernameOrEmail, password } = req.body;
    const login = usernameOrEmail?.toLowerCase();

    const user = await User.findOne({
      $or: [{ email: login }, { username: login }],
    })
      .select("+password")
      .populate("roleId");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      user: userPayload(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res) {
  res.json({ user: userPayload(req.user) });
}

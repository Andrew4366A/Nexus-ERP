import { connectDB } from "./config/db.js";
import { Role } from "./models/Role.js";

function permission(module, actions) {
  return {
    module,
    actions: {
      create: Boolean(actions.create),
      read: Boolean(actions.read),
      edit: Boolean(actions.edit),
      delete: Boolean(actions.delete),
    },
  };
}

const roles = [
  {
    name: "Inventory Manager",
    description:
      "Manages inventory and logistics with full create, read, update, and delete access.",
    sidebarSections: ["dashboard", "inventory", "logistics"],
    permissions: [
      permission("Dashboard", { read: true }),
      permission("Inventory", { create: true, read: true, edit: true, delete: true }),
      permission("Logistics", { create: true, read: true, edit: true, delete: true }),
      permission("Payroll", {}),
      permission("Staff", {}),
      permission("Settings", {}),
    ],
  },
  {
    name: "Sales Executive",
    description:
      "Views stock and logistics, and monitors sales activity from the dashboard with no edit or delete privileges.",
    sidebarSections: ["dashboard", "inventory", "logistics"],
    permissions: [
      permission("Dashboard", { create: true, read: true }),
      permission("Inventory", { read: true }),
      permission("Logistics", { read: true }),
      permission("Payroll", {}),
      permission("Staff", {}),
      permission("Settings", {}),
    ],
  },
  {
    name: "Operations Manager",
    description:
      "Oversees operations across inventory, logistics, staff, and payroll with strong edit rights and restricted payroll delete access.",
    sidebarSections: ["dashboard", "inventory", "payroll", "logistics", "staff"],
    permissions: [
      permission("Dashboard", { read: true }),
      permission("Inventory", { create: true, read: true, edit: true, delete: true }),
      permission("Logistics", { create: true, read: true, edit: true, delete: true }),
      permission("Payroll", { read: true, edit: true }),
      permission("Staff", { create: true, read: true, edit: true, delete: true }),
      permission("Settings", {}),
    ],
  },
  {
    name: "Staff Head (HR Lead)",
    description:
      "Manages HR staff and payroll with full personnel and payroll access, while viewing dashboard data only.",
    sidebarSections: ["dashboard", "payroll", "staff"],
    permissions: [
      permission("Dashboard", { read: true }),
      permission("Inventory", {}),
      permission("Logistics", {}),
      permission("Payroll", { create: true, read: true, edit: true, delete: true }),
      permission("Staff", { create: true, read: true, edit: true, delete: true }),
      permission("Settings", {}),
    ],
  },
];

async function seedRoles() {
  await connectDB();

  const roleNames = roles.map((role) => role.name);
  await Role.deleteMany({ name: { $in: roleNames } });

  const insertedRoles = await Role.insertMany(roles);
  console.log(`Inserted ${insertedRoles.length} roles.`);
  process.exit(0);
}

seedRoles().catch((error) => {
  console.error("Role seeding failed:", error);
  process.exit(1);
});

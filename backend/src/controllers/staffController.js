import { StaffMember } from "../models/StaffMember.js";
import { notifyAdmins } from "../socket.js";

export async function listStaff(_req, res, next) {
  try {
    const staff = await StaffMember.find().sort({ createdAt: -1 });
    res.json({ staff });
  } catch (error) {
    next(error);
  }
}

export async function createStaffMember(req, res, next) {
  try {
    const staffMember = await StaffMember.create(req.body);

    if (req.user.role === "user") {
      notifyAdmins({
        type: "staff.created",
        title: "Staff member added",
        message: `${req.user.name} added ${staffMember.name || "a staff member"}.`,
        actor: {
          id: req.user._id,
          name: req.user.name,
          role: req.user.role,
        },
        resource: {
          id: staffMember._id,
          module: "staff",
        },
      });
    }

    res.status(201).json({ staffMember });
  } catch (error) {
    next(error);
  }
}

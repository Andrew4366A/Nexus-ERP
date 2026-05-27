import { Shipment } from "../models/Shipment.js";
import { notifyAdmins } from "../socket.js";

function isMongoId(id) {
  return typeof id === "string" && id.match(/^[a-fA-F0-9]{24}$/);
}

export async function listShipments(_req, res, next) {
  try {
    const shipments = await Shipment.find().sort({ createdAt: -1 });
    res.json({ shipments });
  } catch (error) {
    next(error);
  }
}

export async function createShipment(req, res, next) {
  try {
    const shipment = await Shipment.create(req.body);

    if (req.user.role === "user") {
      notifyAdmins({
        type: "logistics.shipment_created",
        title: "Shipment added",
        message: `${req.user.name} added ${shipment.reference || "a shipment"}.`,
        actor: {
          id: req.user._id,
          name: req.user.name,
          role: req.user.role,
        },
        resource: {
          id: shipment._id,
          module: "logistics",
        },
      });
    }

    res.status(201).json({ shipment });
  } catch (error) {
    next(error);
  }
}

export async function updateShipment(req, res, next) {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ message: "Shipment id is required" });
    }

    if (!isMongoId(id)) {
      return res.status(400).json({ message: `Invalid Shipment id: ${id}` });
    }

    const updated = await Shipment.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    if (req.user.role === "user") {
      notifyAdmins({
        type: "logistics.shipment_updated",
        title: "Shipment updated",
        message: `${req.user.name} updated shipment ${updated.reference || ""}.`,
        actor: {
          id: req.user._id,
          name: req.user.name,
          role: req.user.role,
        },
        resource: {
          id: updated._id,
          module: "logistics",
        },
      });
    }

    res.json({ shipment: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteShipment(req, res, next) {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ message: "Shipment id is required" });
    }

    if (!isMongoId(id)) {
      return res.status(400).json({ message: `Invalid Shipment id: ${id}` });
    }

    const shipment = await Shipment.findByIdAndDelete(id);

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    if (req.user.role === "user") {
      notifyAdmins({
        type: "logistics.shipment_deleted",
        title: "Shipment deleted",
        message: `${req.user.name} deleted shipment ${shipment.reference || ""}.`,
        actor: {
          id: req.user._id,
          name: req.user.name,
          role: req.user.role,
        },
        resource: {
          id: shipment._id,
          module: "logistics",
        },
      });
    }

    res.json({ message: "Shipment removed", id: shipment._id });
  } catch (error) {
    next(error);
  }
}

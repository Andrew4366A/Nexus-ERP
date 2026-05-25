import { Shipment } from "../models/Shipment.js";
import { notifyAdmins } from "../socket.js";

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

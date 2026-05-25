import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import { env } from "./config/env.js";
import { User } from "./models/User.js";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: env.clientOrigin,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.user.role === "admin") {
      socket.join("admins");
    } else {
      socket.join(`user:${socket.user._id.toString()}`);
    }
  });

  return io;
}

export function notifyAdmins(notification) {
  if (!io) return;

  io.to("admins").emit("admin:notification", {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...notification,
  });
}

export function notifyUserWorkspaceAccess(userId, payload) {
  if (!io) return;

  io.to(`user:${userId.toString()}`).emit("user:workspace-access", payload);
}

export function notifyUserSidebarAccess(userId, sidebarSections) {
  notifyUserWorkspaceAccess(userId, { sidebarSections });
}

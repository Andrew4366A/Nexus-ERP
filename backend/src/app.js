import cors from "cors";
import express from "express";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { createUser } from "./controllers/usersController.js";
import authRoutes from "./routes/authRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import logisticsRoutes from "./routes/logisticsRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { adminOnly } from "./middleware/adminMiddleware.js";
import { protect } from "./middleware/authMiddleware.js";

export const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Eethal ERP API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/logistics", logisticsRoutes);
app.use("/api/roles", roleRoutes);
/** Explicit POST so create-user works even if the users router was loaded without POST (restart required after deploy). */
app.post("/api/users", protect, adminOnly, createUser);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

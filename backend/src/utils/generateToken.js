import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export function generateToken(userId) {
  return jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

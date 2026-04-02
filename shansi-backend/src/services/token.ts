import jwt from "jsonwebtoken";
import { getEnv } from "../utils/env.js";

interface TokenPayload {
  userId: string;
  phone: string;
}

export function signToken(payload: TokenPayload): string {
  const env = getEnv();
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): TokenPayload {
  const env = getEnv();
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

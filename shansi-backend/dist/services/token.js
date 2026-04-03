import jwt from "jsonwebtoken";
import { getEnv } from "../utils/env.js";
export function signToken(payload) {
    const env = getEnv();
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "30d" });
}
export function verifyToken(token) {
    const env = getEnv();
    return jwt.verify(token, env.JWT_SECRET);
}
//# sourceMappingURL=token.js.map
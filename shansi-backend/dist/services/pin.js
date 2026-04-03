import bcrypt from "bcryptjs";
const SALT_ROUNDS = 10;
export async function hashPin(pin) {
    return bcrypt.hash(pin, SALT_ROUNDS);
}
export async function verifyPin(pin, hash) {
    return bcrypt.compare(pin, hash);
}
//# sourceMappingURL=pin.js.map
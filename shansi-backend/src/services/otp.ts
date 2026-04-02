import twilio from "twilio";
import { getEnv } from "../utils/env.js";

function getClient() {
  const env = getEnv();
  return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
}

export async function sendOtp(phone: string): Promise<boolean> {
  const env = getEnv();
  const client = getClient();
  try {
    const verification = await client.verify.v2
      .services(env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: phone, channel: "sms" });
    return verification.status === "pending";
  } catch (error) {
    console.error("Twilio send error:", error);
    return false;
  }
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const env = getEnv();
  const client = getClient();
  try {
    const check = await client.verify.v2
      .services(env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phone, code });
    return check.status === "approved";
  } catch (error) {
    console.error("Twilio verify error:", error);
    return false;
  }
}

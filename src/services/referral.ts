import { apiFetch } from "./api";

export interface ReferredUser {
  id: string;
  userName: string | null;
  userPhone: string;
  coinsRewarded: number;
  createdAt: string;
}

export interface ReferralStats {
  referralCode: string | null;
  totalReferrals: number;
  totalCoinsEarned: number;
  referredUsers: ReferredUser[];
}

export interface PublicReferralConfig {
  referrerRewardCoins: number;
  referredRewardCoins: number;
  bonusEveryN?: number;
  bonusRewardCoins?: number;
  signupRewardLari?: number;
  shareMessageTemplate?: string;
  isActive: boolean;
}

// Get the user's own referral code + list of referred users + coins earned
export async function getMyReferral() {
  return apiFetch<{
    success: boolean;
    referralCode: string | null;
    totalReferrals: number;
    totalCoinsEarned: number;
    referredUsers: ReferredUser[];
  }>("/user/referral");
}

// Get current public referral config (coins per referral + bonus rules)
export async function getReferralConfigPublic() {
  return apiFetch<{ success: boolean; config: PublicReferralConfig }>(
    "/user/referral-config"
  );
}

// Update the user's own referral code (if backend allows)
export async function updateMyReferralCode(code: string) {
  return apiFetch("/user/referral-code", {
    method: "PATCH",
    body: JSON.stringify({ code }),
  });
}

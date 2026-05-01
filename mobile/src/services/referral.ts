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

export async function getMyReferral() {
  return apiFetch<{
    success: boolean;
    referralCode: string | null;
    totalReferrals: number;
    totalCoinsEarned: number;
    referredUsers: ReferredUser[];
  }>("/user/referral");
}

export async function getReferralConfigPublic() {
  return apiFetch<{ success: boolean; config: PublicReferralConfig }>(
    "/public/referral-config"
  );
}

export async function updateMyReferralCode(code: string) {
  return apiFetch("/user/referral-code", {
    method: "PATCH",
    body: JSON.stringify({ code }),
  });
}

/**
 * 100 pre-defined stage names auto-assigned to users who don't set a
 * custom username. Picked randomly at signup, and backfilled for
 * existing users on startup.
 *
 * These are display names shown in Live Wins, Air Hockey, tournaments,
 * referral leaderboards, etc. — everywhere a user is publicly visible.
 */
export const STAGE_NAMES = [
  "Blaze Shadow", "Nova Reed", "Chase Raven", "Ace Wild", "Storm Cross",
  "Blaze Monroe", "Nova Carter", "Raven Steele", "Chase Frost", "Ace Viper",
  "Storm Knight", "Blaze Phoenix", "Nova Raven", "Shadow Blaze", "Cross Carter",
  "Raven Wild", "Chase Knight", "Ace Storm", "Nova Cross", "Blaze Frost",
  "Shadow Nova", "Storm Viper", "Raven Phoenix", "Chase Monroe", "Ace Blaze",
  "Nova Knight", "Blaze Raven", "Storm Reed", "Shadow Chase", "Cross Viper",
  "Ace Phoenix", "Nova Frost", "Raven Carter", "Blaze Wild", "Storm Monroe",
  "Shadow Knight", "Chase Viper", "Nova Storm", "Raven Cross", "Ace Reed",
  "Blaze Knight", "Shadow Frost", "Storm Carter", "Nova Wild", "Chase Phoenix",
  "Raven Monroe", "Ace Shadow", "Blaze Cross", "Storm Frost", "Nova Viper",
  "Raven Knight", "Chase Carter", "Ace Frost", "Blaze Storm", "Shadow Monroe",
  "Nova Phoenix", "Raven Wild", "Chase Cross", "Ace Carter", "Storm Phoenix",
  "Shadow Viper", "Blaze Reed", "Nova Monroe", "Raven Frost", "Chase Storm",
  "Ace Knight", "Shadow Carter", "Storm Wild", "Nova Reed", "Raven Viper",
  "Blaze Monroe", "Chase Reed", "Ace Wild", "Shadow Phoenix", "Storm Cross",
  "Nova Carter", "Raven Reed", "Blaze Viper", "Chase Frost", "Ace Monroe",
  "Shadow Storm", "Storm Knight", "Nova Cross", "Raven Blaze", "Chase Wild",
  "Ace Viper", "Shadow Reed", "Storm Phoenix", "Nova Knight", "Raven Carter",
  "Blaze Cross", "Chase Monroe", "Ace Storm", "Shadow Wild", "Storm Reed",
  "Nova Viper", "Raven Knight", "Blaze Frost", "Chase Phoenix", "Ace Cross",
];

/** Pick a random stage name from the pool. */
export function randomStageName(): string {
  return STAGE_NAMES[Math.floor(Math.random() * STAGE_NAMES.length)];
}

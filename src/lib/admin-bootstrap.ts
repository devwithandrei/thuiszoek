export function isConfiguredAdminEmail(
  primaryEmail: string | null | undefined,
  verificationStatus: string | null | undefined,
  configuredEmail = process.env.SEED_ADMIN_EMAIL,
) {
  if (!primaryEmail || verificationStatus !== "verified" || !configuredEmail?.trim()) return false;
  return primaryEmail.trim().toLowerCase() === configuredEmail.trim().toLowerCase();
}

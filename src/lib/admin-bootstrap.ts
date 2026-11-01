export function getConfiguredAdminEmails(configuredEmails = process.env.SEED_ADMIN_EMAIL) {
  return new Set(
    (configuredEmails ?? "")
      .split(/[,\n]/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isConfiguredAdminEmail(
  primaryEmail: string | null | undefined,
  verificationStatus: string | null | undefined,
  configuredEmail = process.env.SEED_ADMIN_EMAIL,
) {
  if (!primaryEmail || verificationStatus !== "verified") return false;
  return getConfiguredAdminEmails(configuredEmail).has(primaryEmail.trim().toLowerCase());
}

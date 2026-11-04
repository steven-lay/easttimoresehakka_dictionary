export const SITE_NAME = "East Timorese Hakka-English word list";

export const SITE_DESCRIPTION =
  "A searchable East Timorese Hakka–English word list with romanisation, Chinese characters, and English definitions from Timor-Leste Hakka.";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    return `https://${production.replace(/^https?:\/\//, "")}`;
  }

  const preview = process.env.VERCEL_URL?.trim();
  if (preview) {
    return `https://${preview.replace(/^https?:\/\//, "")}`;
  }

  return "http://localhost:3000";
}

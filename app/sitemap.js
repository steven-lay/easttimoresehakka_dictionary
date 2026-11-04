import { getSiteUrl } from "../lib/site";

export default function sitemap() {
  const base = getSiteUrl();

  return [
    {
      url: `${base}/`,
      lastModified: new Date("2026-11-04"),
    },
  ];
}

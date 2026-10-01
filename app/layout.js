import { Manrope, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const notoSansSc = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-cjk",
  display: "swap",
});

export const metadata = {
  title: "English–Hakka Dictionary",
  description:
    "Search English, Hakka romanisation, and Chinese entries from the dictionary database.",
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("dictionary-theme");
    var theme = stored === "light" || stored === "dark" ? stored : "auto";
    var resolved =
      theme === "auto"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${notoSansSc.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter, Chakra_Petch, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Display face: squared, instrument-cluster character — on-theme for a diagnostic tool.
const chakra = Chakra_Petch({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-chakra",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GrillSearch — Decades of forum knowledge, seconds of search",
    template: "%s · GrillSearch",
  },
  description:
    "Enter your vehicle and describe the problem. GrillSearch reads real automotive forums and synthesizes a cited, root-cause repair guide — surfacing the hidden-gem fixes most mechanics overlook.",
  applicationName: "GrillSearch",
  keywords: [
    "car repair",
    "automotive forums",
    "diagnostic",
    "OBD",
    "DIY mechanic",
    "repair guide",
  ],
  authors: [{ name: "GrillSearch" }],
  openGraph: {
    title: "GrillSearch",
    description: "Decades of forum knowledge, seconds of search.",
    type: "website",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/logo.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0D0D0F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${chakra.variable} ${jetbrains.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

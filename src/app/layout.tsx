import type { Metadata, Viewport } from "next";
import { Libre_Baskerville, Poppins, Noto_Serif_Devanagari } from "next/font/google";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import "./globals.css";

const baskerville = Libre_Baskerville({
  variable: "--font-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const devanagari = Noto_Serif_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari", "latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Bhakti Challenge · Back Home, Back to Godhead",
  description:
    "A divine Krishna Consciousness spiritual competition platform. Grow in chanting, reading, hearing, and seva — inspired by Goloka Vrindavan.",
  keywords: [
    "Krishna",
    "Bhakti",
    "ISKCON",
    "Japa",
    "Bhagavad Gita",
    "Spiritual Challenge",
    "Hare Krishna",
  ],
  applicationName: "Bhakti Challenge",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bhakti Challenge",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1a4fa3" },
    { media: "(prefers-color-scheme: dark)", color: "#1a4fa3" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${baskerville.variable} ${poppins.variable} ${devanagari.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full font-sans text-[var(--text-primary)]"
        suppressHydrationWarning
      >
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Libre_Baskerville, Poppins, Noto_Serif_Devanagari } from "next/font/google";
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
      </body>
    </html>
  );
}

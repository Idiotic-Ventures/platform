import type { Metadata } from "next";
import { Inter, Reddit_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

// C5 fix: Inter replaces Helvetica Neue as primary font.
// Self-hosted via next/font/google — no FOUT, no external font requests at runtime.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Reddit Mono: technical/numeric accents per PRD
const redditMono = Reddit_Mono({
  subsets: ["latin"],
  variable: "--font-reddit-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Idiotic Ventures Platform",
    template: "%s | IV Platform",
  },
  description: "Manage your Idiotic Ventures subscriptions and account",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${redditMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

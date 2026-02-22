import type { Metadata } from "next";
import AnimatedBackground from "@/components/layout/AnimatedBackground";
import LayoutShell from "@/components/layout/LayoutShell";
import AdProvider from "@/components/ads/AdProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gauntlet \u2014 Daily Games",
  description:
    "Play Wordless, Songless, More/Less, Clueless, and Spelling Bee. Survive the Gauntlet.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body min-h-screen bg-deep text-white">
        <AdProvider />
        <AnimatedBackground />
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}

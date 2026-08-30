import type { Metadata } from "next";
import "./globals.css";
import "./responsive.css";
import "./hero-motion.css";
import "./hero-motion-tuning.css";
import "./home-polish.css";
import "./home-sections.css";
import "./winetime-reference.css";
import SubscriptionLink from "./subscription-link";
import HomeLiveMetrics from "./home-live-metrics";

export const metadata: Metadata = {
  title: "WineTime — Business automation",
  description: "Make your business work together.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        {children}
        <HomeLiveMetrics />
        <SubscriptionLink />
      </body>
    </html>
  );
}

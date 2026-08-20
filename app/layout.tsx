import type { Metadata } from "next";
import "./globals.css";
import "./responsive.css";
import SubscriptionLink from "./subscription-link";

export const metadata: Metadata = {
  title: "WineTime — Business automation",
  description: "Make your business work together.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        {children}
        <SubscriptionLink />
      </body>
    </html>
  );
}

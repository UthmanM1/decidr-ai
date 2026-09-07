import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/nav/top-nav";
import { BottomNav } from "@/components/nav/bottom-nav";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Decidr AI — Make better buying decisions",
    template: "%s · Decidr AI"
  },
  description:
    "Decidr AI turns vague purchasing requirements into personalised, evidence-based product recommendations.",
  openGraph: {
    title: "Decidr AI — Make better buying decisions",
    description:
      "Describe what you want to buy in plain language and get transparent, ranked recommendations backed by real product data.",
    type: "website"
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        <TopNav />
        <main className="pb-20 md:pb-0">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}

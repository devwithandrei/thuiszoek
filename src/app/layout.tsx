import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://thuiszoek.nl"),
  title: { default: "ThuisZoek.nl — vind jouw plek", template: "%s | ThuisZoek.nl" },
  description: "Vind jouw nieuwe thuis. Bekijk woningen en bedrijfspanden te huur en te koop door heel Nederland.",
  openGraph: { siteName: "ThuisZoek.nl", locale: "nl_NL", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider><html lang="nl" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen flex flex-col"><Header /><main className="flex-1">{children}</main><Footer /></body>
    </html></ClerkProvider>
  );
}

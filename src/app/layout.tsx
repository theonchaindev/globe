import type { Metadata } from "next";
import { Inter, Geist_Mono, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Background from "@/components/Background";
import SolanaProvider from "@/components/SolanaProvider";
import Preloader from "@/components/Preloader";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display-cond",
});

export const metadata: Metadata = {
  title: "GLOBAL — Launch Anywhere",
  description:
    "Launch a token on Solana and Robinhood Chain from one briefing. Official pump.fun program, on-chain verified listings, claimable creator fees.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} ${display.variable}`}>
      <body className="min-h-screen">
        <Preloader />
        <SolanaProvider>
          <Background />
          <Header />
          <main className="relative z-10 w-full">{children}</main>
          <Footer />
        </SolanaProvider>
      </body>
    </html>
  );
}

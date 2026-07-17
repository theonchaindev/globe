import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Background from "@/components/Background";
import SolanaProvider from "@/components/SolanaProvider";
import Preloader from "@/components/Preloader";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "GLOBAL — Intelligence For Token Launches",
  description:
    "Launch tokens across multiple blockchains through a secure global deployment network. Intelligence-grade launch infrastructure for Solana and Robinhood Chain.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
      <body className="min-h-screen">
        <Preloader />
        <SolanaProvider>
          <Background />
          <Header />
          <main className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pt-20 sm:px-8 lg:px-12">
            {children}
          </main>
          <Footer />
        </SolanaProvider>
      </body>
    </html>
  );
}

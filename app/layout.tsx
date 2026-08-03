import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { HeaderShell } from "@/components/layout/header-shell";
import { SiteToaster } from "@/components/layout/site-toaster";
import { DashboardTooltipProvider } from "@/app/dashboard/_components/dashboard-tooltip-provider";
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
  title: "Receptoria",
  description: "Сервис по обмену рецептами",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-zinc-50 text-zinc-900"
        suppressHydrationWarning
      >
        <DashboardTooltipProvider>
          <Suspense fallback={<HeaderShell />}>
            <Header />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
          <SiteToaster />
        </DashboardTooltipProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

import { Logo } from "@/components/Logo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CFB Viewing Guide",
    template: "%s · CFB Viewing Guide",
  },
  description:
    "College football TV viewing guide — games by network and kickoff time, powered by College Football Data API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-100 font-sans text-zinc-900">
        <div>
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 pt-3 sm:px-6 lg:px-8">
            <Link href="/" title="Home">
              <Logo />
            </Link>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}

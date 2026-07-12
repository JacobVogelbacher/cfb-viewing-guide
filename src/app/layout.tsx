import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
        <div className="border-b border-zinc-200/80 bg-white">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 font-black tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-sm text-white">
                CFB
              </span>
              <span className="text-zinc-900">Viewing Guide</span>
            </Link>
            <span className="hidden text-xs font-medium text-zinc-400 sm:inline">
              Network × kickoff cheat sheet
            </span>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}

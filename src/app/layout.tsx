import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full max-sm:h-svh antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-100 font-sans text-zinc-900 max-sm:h-full max-sm:min-h-0 max-sm:overflow-hidden sm:min-h-full">
        {children}
      </body>
    </html>
  );
}

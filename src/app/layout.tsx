import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { BASE_PATH } from "@/lib/basePath";
import { CARD_SIZE } from "@/lib/card";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });

const card = {
  url: `https://www.jaredconnolly.com${BASE_PATH}/card/breakthroughs/month`,
  width: CARD_SIZE.width,
  height: CARD_SIZE.height,
  alt: "The Fast Takeoff Index: how often the length of task AI can finish alone doubles",
};

export const metadata: Metadata = {
  title: "Fast Takeoff: how fast is AI moving?",
  description: "How fast AI is improving, from METR's time horizon trend, with every AI breakthrough and frontier release.",
  openGraph: { title: "Fast Takeoff", description: "How fast is AI moving? Tracked daily.", images: [card] },
  twitter: { card: "summary_large_image", site: "@thefasttakeoff", images: [card] },
};

export const viewport: Viewport = {
  themeColor: "#f4f4f2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}

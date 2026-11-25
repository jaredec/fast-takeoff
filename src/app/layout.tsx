import type { Metadata, Viewport } from "next";
import { CARD_SIZE } from "@/lib/card";
import "./globals.css";

const card = {
  url: "https://whataididtoday.com/card/breakthroughs/month",
  width: CARD_SIZE.width,
  height: CARD_SIZE.height,
  alt: "The Singularity Index: how fast AI is moving, out of 100",
};

export const metadata: Metadata = {
  title: "What did AI do today?",
  description: "How fast AI is moving, out of 100, from METR, Epoch AI, Metaculus forecasters and every AI breakthrough and frontier release.",
  openGraph: { title: "The Singularity Index", description: "How fast is AI moving? Tracked daily.", images: [card] },
  twitter: { card: "summary_large_image", images: [card] },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const etBook = localFont({
  variable: "--font-serif",
  src: [
    { path: "../../assets/fonts/et-book-roman.ttf", weight: "400", style: "normal" },
    { path: "../../assets/fonts/et-book-italic.ttf", weight: "400", style: "italic" },
    { path: "../../assets/fonts/et-book-bold.ttf", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.jaredconnolly.com"),
  title: "Fast Takeoff: how fast is AI moving?",
  description: "Every AI breakthrough and model release, and how fast they're arriving now.",
  openGraph: { title: "Fast Takeoff", description: "How fast is AI moving? Tracked daily." },
  twitter: { card: "summary_large_image", site: "@thefasttakeoff" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={etBook.variable}>
      <body>{children}</body>
    </html>
  );
}

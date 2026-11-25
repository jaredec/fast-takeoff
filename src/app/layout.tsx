import type { Metadata, Viewport } from "next";
import { Pages } from "@/components/Pages";
import "./globals.css";

const title = "What did AI do today?";
const description = "New proofs and discoveries from AI, landmark breakthroughs and great open problems in math and science.";

export const metadata: Metadata = {
  metadataBase: new URL("https://whataididtoday.com"),
  title,
  description,
  openGraph: { title, description },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Pages>{children}</Pages>
      </body>
    </html>
  );
}

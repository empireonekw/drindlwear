import "./globals.css";

import { Cormorant_Garamond, Inter } from "next/font/google";
import type { Metadata, Viewport } from "next";

import { StoreProvider } from "@/components/store";

/**
 * Brand type (see the brand guide): a refined serif for editorial headings
 * and a clean sans serif for interface text. next/font serves both from this
 * site, so no request goes to Google at runtime.
 */
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Dirndl Wear | Traditional Dresses",
  description:
    "Premium traditional Bavarian and Alpine fashion. Traditional Dresses. Timeless Elegance.",
  // Favicon and Apple icon come from app/icon.png and app/apple-icon.png (the DW emblem).
};

export const viewport: Viewport = { themeColor: "#781d2d" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} motion-safe:scroll-smooth max-[850px]:overflow-x-clip [&_a:focus-visible]:[outline:2px_solid_#781d2d] [&_a:focus-visible]:[outline-offset:3px] [&_button:focus-visible]:[outline:2px_solid_#781d2d] [&_button:focus-visible]:[outline-offset:3px] [&_input:focus-visible]:[outline:2px_solid_#781d2d] [&_input:focus-visible]:[outline-offset:3px]`}
    >
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}

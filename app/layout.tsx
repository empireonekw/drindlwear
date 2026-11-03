import "./globals.css";

import { StoreProvider } from "@/components/store";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dirndl Wear | Traditional Dresses",
  description: "Premium traditional Bavarian and Alpine fashion storefront",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="motion-safe:scroll-smooth max-[850px]:overflow-x-clip [&_a:focus-visible]:[outline:3px_solid_#d9b6b6] [&_a:focus-visible]:[outline-offset:3px] [&_button:focus-visible]:[outline:3px_solid_#d9b6b6] [&_button:focus-visible]:[outline-offset:3px] [&_input:focus-visible]:[outline:3px_solid_#d9b6b6] [&_input:focus-visible]:[outline-offset:3px]">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
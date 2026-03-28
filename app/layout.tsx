import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "WAAL / WAAS Wall",
  description: "Agent supply chain firewall and watchboard demo"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

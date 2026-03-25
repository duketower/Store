import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Binary Ventures V2",
  description: "V2 implementation workspace for the Binary Ventures website redesign.",
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

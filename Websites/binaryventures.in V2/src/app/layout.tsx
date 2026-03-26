import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Binary Ventures",
    template: "%s | Binary Ventures",
  },
  description:
    "Binary Ventures builds websites, web apps, bots, and automation systems for businesses that need practical digital infrastructure.",
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

import type { Metadata } from "next";
import "./globals.css";
import SmoothScrollProvider from "@/components/layout/SmoothScrollProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Preloader from "@/components/ui/Preloader";
import CustomCursor from "@/components/ui/CustomCursor";
import BackToTop from "@/components/ui/BackToTop";
import SectionIndicator from "@/components/ui/SectionIndicator";

export const metadata: Metadata = {
  title: "Binary Ventures — Websites, Automation & AI Tools",
  description:
    "Binary Ventures builds fast websites, powerful automations, lead generation systems, and AI-powered tools for businesses.",
  keywords: ["web development", "automation", "AI tools", "lead generation", "Binary Ventures"],
  openGraph: {
    title: "Binary Ventures",
    description: "We build your vision — websites, automations, AI tools.",
    url: "https://binaryventures.in",
    siteName: "Binary Ventures",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Preloader />
        <CustomCursor />
        <SmoothScrollProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </SmoothScrollProvider>
        <BackToTop />
        <SectionIndicator />
      </body>
    </html>
  );
}

import type { Metadata } from "next";

import { HomePage } from "@/components/home/home-page";
import { buildMetadata, getBreadcrumbJsonLd, getWebPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Websites, Web Apps, Bots, and Automation for Business",
  description:
    "Binary Ventures builds websites, web apps, bots, and automation systems for businesses that need practical digital infrastructure.",
  path: "/",
  keywords: [
    "website development company",
    "custom web app development",
    "business automation services",
    "AI chatbot development",
    "business systems",
  ],
});

export default function Home() {
  const jsonLd = JSON.stringify([
    getWebPageJsonLd({
      title: "Binary Ventures",
      description:
        "Binary Ventures builds websites, web apps, bots, and automation systems for businesses that need practical digital infrastructure.",
      path: "/",
    }),
    getBreadcrumbJsonLd([{ name: "Home", path: "/" }]),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <HomePage />
    </>
  );
}

import type { Metadata } from "next";

import { ServicesPage } from "@/components/services/services-page";
import {
  buildMetadata,
  getBreadcrumbJsonLd,
  getServicesPageJsonLd,
} from "@/lib/seo";

const description =
  "Services from Binary Ventures across websites, web apps, bots, automation, and post-launch support.";

export const metadata: Metadata = buildMetadata({
  title: "Services",
  description,
  path: "/services",
  keywords: [
    "website development services",
    "custom software services",
    "workflow automation services",
    "AI chatbot services",
  ],
});

export default function Services() {
  const jsonLd = JSON.stringify([
    getServicesPageJsonLd(),
    getBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
    ]),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <ServicesPage />
    </>
  );
}

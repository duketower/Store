import type { Metadata } from "next";

import { WorkPage } from "@/components/work/work-page";
import { buildMetadata, getBreadcrumbJsonLd, getWorkPageJsonLd } from "@/lib/seo";

const description =
  "Case studies from Binary Ventures across websites, web apps, bots, automation, and business systems.";

export const metadata: Metadata = buildMetadata({
  title: "Case Studies",
  description,
  path: "/work",
  keywords: ["software case studies", "website case studies", "automation case studies"],
});

export default function Work() {
  const jsonLd = JSON.stringify([
    getWorkPageJsonLd(),
    getBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Case Studies", path: "/work" },
    ]),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <WorkPage />
    </>
  );
}

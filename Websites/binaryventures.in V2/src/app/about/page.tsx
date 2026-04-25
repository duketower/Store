import type { Metadata } from "next";

import { AboutPage } from "@/components/about/about-page";
import { buildMetadata, getBreadcrumbJsonLd, getWebPageJsonLd } from "@/lib/seo";

const description =
  "Learn about the founder-led model, working style, and operating footprint behind Binary Ventures.";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description,
  path: "/about",
  keywords: ["about Binary Ventures", "founder-led technology studio", "business software partner"],
});

export default function About() {
  const jsonLd = JSON.stringify([
    getWebPageJsonLd({
      title: "About | Binary Ventures",
      description,
      path: "/about",
    }),
    getBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "About", path: "/about" },
    ]),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <AboutPage />
    </>
  );
}

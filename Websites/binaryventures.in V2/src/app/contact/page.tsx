import type { Metadata } from "next";

import { ContactPage } from "@/components/contact/contact-page";
import {
  buildMetadata,
  getBreadcrumbJsonLd,
  getContactPageJsonLd,
} from "@/lib/seo";

const description =
  "Contact Binary Ventures for websites, web apps, bots, automation, and broader business systems work.";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description,
  path: "/contact",
  keywords: ["contact Binary Ventures", "book a call", "website project enquiry"],
});

export default function Contact() {
  const jsonLd = JSON.stringify([
    getContactPageJsonLd(),
    getBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Contact", path: "/contact" },
    ]),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <ContactPage />
    </>
  );
}

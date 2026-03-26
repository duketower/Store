import type { Metadata } from "next";

import { ContactPage } from "@/components/contact/contact-page";

export const metadata: Metadata = {
  title: "Contact | Binary Ventures",
  description:
    "Contact Binary Ventures for websites, web apps, bots, automation, and broader business systems work.",
};

export default function Contact() {
  return <ContactPage />;
}

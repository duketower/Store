import type { Metadata } from "next";

import { ServicesPage } from "@/components/services/services-page";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Services from Binary Ventures across websites, web apps, bots, automation, and post-launch support.",
};

export default function Services() {
  return <ServicesPage />;
}

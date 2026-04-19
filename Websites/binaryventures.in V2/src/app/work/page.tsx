import type { Metadata } from "next";

import { WorkPage } from "@/components/work/work-page";

export const metadata: Metadata = {
  title: "Case Studies",
  description:
    "Case studies from Binary Ventures across websites, web apps, bots, automation, and business systems.",
};

export default function Work() {
  return <WorkPage />;
}

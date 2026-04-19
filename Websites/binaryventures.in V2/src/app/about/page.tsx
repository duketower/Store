import type { Metadata } from "next";

import { AboutPage } from "@/components/about/about-page";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about the founder-led model, working style, and operating footprint behind Binary Ventures.",
};

export default function About() {
  return <AboutPage />;
}

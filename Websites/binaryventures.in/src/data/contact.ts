import type { ContactInfo } from "@/types";

export const contactInfo: ContactInfo[] = [
  { label: "Company",  value: "Binary Ventures Pvt Ltd" },
  { label: "Website",  value: "binaryventures.in", href: "https://binaryventures.in" },
  { label: "Email",    value: "hello@binaryventures.in", href: "mailto:hello@binaryventures.in" },
  { label: "Location", value: "India" },
];

export const contactMeta = {
  heading: "Let's build something",
  subheading: "Tell us what you need — we'll take it from there.",
  ctaLabel: "Send Message",
};

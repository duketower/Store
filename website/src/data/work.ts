import type { WorkItem } from "@/types";

export const workItems: WorkItem[] = [
  {
    id: "pos",
    outcome: "A retail store fully managed by software — no internet required",
    context: "Zero One Convenience Store",
    description:
      "Designed and built a complete point-of-sale system from the ground up. Handles billing, inventory, staff management, shift reports, barcode scanning, and thermal printing — all offline. Firebase syncs when connectivity returns.",
    tags: ["React", "TypeScript", "Dexie.js", "Firebase", "PWA"],
    imageDesktop: "/work/pos-desktop.webp",
    imageMobile: "/work/pos-mobile.webp",
    flip: false,
  },
  {
    id: "agency-site",
    outcome: "A professional web presence — live and driving client enquiries",
    context: "The Digital Experts, Marketing Agency",
    description:
      "Delivered a complete agency website covering services, portfolio, testimonials, and contact. Designed for conversion and brand credibility — deployed to a custom domain and live for clients.",
    tags: ["HTML", "CSS", "JavaScript", "Netlify"],
    imageDesktop: "/work/agency-desktop.webp",
    imageMobile: "/work/agency-mobile.webp",
    liveUrl: "https://the-digital-experts-in.netlify.app",
    flip: true,
  },
  {
    id: "scraping",
    outcome: "Thousands of qualified business contacts — sourced without lifting a finger",
    context: "B2B Lead Generation System",
    description:
      "Built an automated lead sourcing system that extracts targeted business contacts from Google Maps, directories, and LinkedIn. AI-powered enrichment filters and cleans results — delivered as structured data ready to act on.",
    tags: ["Python", "Playwright", "Firecrawl", "FastAPI"],
    imageDesktop: "/work/scraping-desktop.webp",
    imageMobile: "/work/scraping-mobile.webp",
    flip: false,
  },
  {
    id: "automation",
    outcome: "Hours of manual work — automated into a single workflow",
    context: "Business Process Automation",
    description:
      "Built a multi-step automation workflow connecting data sources, AI processing, and output delivery — eliminating a manual daily process entirely. Runs on schedule with zero human input required.",
    tags: ["n8n", "Python", "Claude API", "Webhooks"],
    imageDesktop: "/work/automation-desktop.webp",
    imageMobile: "/work/automation-mobile.webp",
    flip: true,
  },
];

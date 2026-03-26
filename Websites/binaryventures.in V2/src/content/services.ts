import { publicContact } from "@/content/site";

export type ServiceOffer = {
  id: string;
  name: string;
  category: string;
  delivery: string;
  scope: string;
  description: string;
  startingFromUSD?: number;
  supportPlanUSD?: number;
  technicalScope: string[];
  systemElements: string[];
  integrationExamples: string[];
  capabilities: {
    strategy?: boolean;
    build?: boolean;
    support?: boolean;
    automation?: boolean;
    integrations?: boolean;
  };
  tags: string[];
  meta: {
    includes: string;
    bestFor: string;
  };
};

export type PricingMode = "project" | "support";

export type PricingPlan = {
  id: string;
  title: string;
  desc: string;
  price: number;
  unitLabel: string;
  buttonText: string;
  features: string[];
  href: string;
  badge?: string;
};

export const serviceOffers: ServiceOffer[] = [
  {
    id: "websites",
    name: "Websites",
    category: "Presence",
    delivery: "Project-based",
    scope:
      "Positioning-led business websites built to increase trust and support real enquiries.",
    description:
      "High-trust websites for businesses that need stronger positioning, clearer communication, and better-quality enquiries.",
    startingFromUSD: 500,
    supportPlanUSD: 150,
    technicalScope: [
      "site architecture and page hierarchy",
      "content-managed page structures",
      "enquiry flows and contact routing",
      "mobile-first responsive implementation",
    ],
    systemElements: [
      "landing and service pages",
      "contact and enquiry forms",
      "trust sections and proof blocks",
      "ongoing update workflow",
    ],
    integrationExamples: [
      "lead forms and email routing",
      "analytics and reporting",
      "CMS or structured content updates",
      "maintenance and publishing support",
    ],
    capabilities: { strategy: true, build: true, support: true },
    tags: ["trust", "enquiries"],
    meta: {
      includes: "Structure, copy direction, design system, build, launch support",
      bestFor: "Service businesses, operators, professional teams, and local businesses",
    },
  },
  {
    id: "web-apps",
    name: "Web Apps",
    category: "Systems",
    delivery: "Custom build",
    scope:
      "Internal tools, dashboards, portals, and operational systems designed around real workflows.",
    description:
      "Custom software, dashboards, and internal systems built around process, visibility, and operational control.",
    startingFromUSD: 1500,
    supportPlanUSD: 150,
    technicalScope: [
      "role-aware dashboards and portals",
      "custom business logic and workflow rules",
      "reporting, filters, and operational views",
      "data handling for daily business operations",
    ],
    systemElements: [
      "admin and staff panels",
      "reporting and analytics layers",
      "inventory or billing flows",
      "approval and status workflows",
    ],
    integrationExamples: [
      "forms, sheets, and existing internal tools",
      "notification channels and bots",
      "lead and customer data flow",
      "custom export and reporting pipelines",
    ],
    capabilities: { strategy: true, build: true, support: true, integrations: true },
    tags: ["dashboard", "internal"],
    meta: {
      includes: "Workflow mapping, UI, data handling, reporting, and role-aware access",
      bestFor: "Teams that have outgrown spreadsheets and disconnected tools",
    },
  },
  {
    id: "bots",
    name: "Bots",
    category: "Automation",
    delivery: "Custom or scoped package",
    scope: "Bots for notifications, routing, lead flow, and repeated operational tasks.",
    description:
      "Bots for lead capture, notifications, internal operations, workflow support, and repeated task handling.",
    startingFromUSD: 750,
    supportPlanUSD: 150,
    technicalScope: [
      "trigger-based bot logic",
      "message routing and state handling",
      "report delivery and notification flows",
      "task and input collection through chat interfaces",
    ],
    systemElements: [
      "Telegram bot workflows",
      "internal notification logic",
      "report digests and updates",
      "lead qualification or routing steps",
    ],
    integrationExamples: [
      "forms and lead sources",
      "internal systems and dashboards",
      "email and messaging alerts",
      "data collection and handoff flows",
    ],
    capabilities: { build: true, automation: true, support: true, integrations: true },
    tags: ["telegram", "workflow"],
    meta: {
      includes: "Bot logic, trigger handling, integrations, deployment, and maintenance options",
      bestFor: "Businesses that lose time on repeated manual tasks",
    },
  },
  {
    id: "automation",
    name: "Automation",
    category: "Operations",
    delivery: "Scoped workflow system",
    scope:
      "Workflow automation that connects tools, reduces manual handoffs, and keeps the right work moving.",
    description:
      "Automations that connect tools, reduce manual work, and create smoother business operations across the stack.",
    startingFromUSD: 750,
    supportPlanUSD: 150,
    technicalScope: [
      "workflow mapping and automation logic",
      "cross-tool data movement and syncing",
      "scheduled reporting and event triggers",
      "exception handling for real-world operations",
    ],
    systemElements: [
      "lead capture and follow-up sequences",
      "reporting workflows",
      "approval or notification chains",
      "internal status updates and handoffs",
    ],
    integrationExamples: [
      "forms, sheets, and CRMs",
      "email, chat, and notification channels",
      "data collection or scraping workflows",
      "custom business reporting outputs",
    ],
    capabilities: { strategy: true, automation: true, integrations: true, support: true },
    tags: ["ops", "integration"],
    meta: {
      includes: "Workflow mapping, trigger design, app connections, and exception handling",
      bestFor: "Teams running repeated steps across forms, sheets, CRMs, and communication tools",
    },
  },
];

export const engagementModels = [
  {
    title: "Defined service engagements",
    body:
      "For businesses that already know the core problem and want a clear scope, timeline, and implementation path.",
  },
  {
    title: "Custom solutions",
    body:
      "For businesses that need a more tailored system, a broader setup, or a more strategic build that crosses multiple service areas.",
  },
  {
    title: "Ongoing support",
    body:
      "For businesses that want continuity, maintenance, and technical help after launch without turning support into the main offer.",
  },
];

export const pricingAnchors = [
  { label: "Business Websites", value: "From $500" },
  { label: "Custom Web Apps", value: "From $1,500+" },
  { label: "Bots & Automation", value: "From $750+" },
  { label: "Maintenance & Support", value: "From $150/mo" },
];

export const pricingPlans: Record<PricingMode, PricingPlan[]> = {
  project: [
    {
      id: "project-websites",
      title: "Websites",
      desc: "Positioning-led business websites for stronger presentation, trust, and better enquiry quality.",
      price: 500,
      unitLabel: "/project",
      buttonText: "Book a Call",
      href: publicContact.bookingHref,
      features: [
        "structured page architecture",
        "service and offer positioning",
        "responsive implementation",
        "contact and enquiry routing",
      ],
    },
    {
      id: "project-web-apps",
      title: "Web Apps",
      desc: "Custom dashboards, portals, and internal systems built around real business operations.",
      price: 1500,
      unitLabel: "/project",
      buttonText: "Book a Call",
      href: publicContact.bookingHref,
      badge: "Core Systems",
      features: [
        "role-aware dashboards",
        "workflow-specific business logic",
        "reporting and operational views",
        "custom system implementation",
      ],
    },
    {
      id: "project-bots",
      title: "Bots",
      desc: "Practical bots for reporting, notification routing, lead handling, and repeated operational tasks.",
      price: 750,
      unitLabel: "/project",
      buttonText: "Book a Call",
      href: publicContact.bookingHref,
      features: [
        "Telegram or chat workflows",
        "notification and report delivery",
        "lead capture and follow-up logic",
        "integration with existing tools",
      ],
    },
    {
      id: "project-automation",
      title: "Automation",
      desc: "Cross-tool workflows that reduce manual steps and keep reporting, follow-up, and operations moving.",
      price: 750,
      unitLabel: "/project",
      buttonText: "Book a Call",
      href: publicContact.bookingHref,
      features: [
        "workflow mapping and trigger logic",
        "reporting and alert sequences",
        "forms, sheets, and CRM handoffs",
        "exception-aware automation design",
      ],
    },
  ],
  support: [
    {
      id: "support-websites",
      title: "Website Support",
      desc: "Ongoing continuity for updates, fixes, small improvements, and operational website support after launch.",
      price: 150,
      unitLabel: "/mo",
      buttonText: "Email Us",
      href: `mailto:${publicContact.email}`,
      features: [
        "content and page updates",
        "design and layout refinements",
        "technical fixes and continuity",
        "general website upkeep",
      ],
    },
    {
      id: "support-systems",
      title: "System Support",
      desc: "Post-launch support for internal tools, reporting systems, and custom apps that need regular tuning.",
      price: 150,
      unitLabel: "/mo",
      buttonText: "Email Us",
      href: `mailto:${publicContact.email}`,
      badge: "Ongoing",
      features: [
        "small workflow improvements",
        "dashboard and logic adjustments",
        "issue handling and refinements",
        "operational continuity support",
      ],
    },
    {
      id: "support-bots",
      title: "Bot Support",
      desc: "Maintenance for notification bots, report bots, and other business chat workflows after rollout.",
      price: 150,
      unitLabel: "/mo",
      buttonText: "Email Us",
      href: `mailto:${publicContact.email}`,
      features: [
        "bot logic adjustments",
        "message and trigger updates",
        "reporting or alert changes",
        "maintenance after deployment",
      ],
    },
    {
      id: "support-automation",
      title: "Automation Support",
      desc: "Ongoing attention for workflow maintenance, connection changes, and automation refinements as the business evolves.",
      price: 150,
      unitLabel: "/mo",
      buttonText: "Email Us",
      href: `mailto:${publicContact.email}`,
      features: [
        "trigger and routing changes",
        "integration upkeep",
        "reporting flow adjustments",
        "workflow continuity support",
      ],
    },
  ],
};

export const servicesIntro = {
  title: "Services built around complete business tech setup.",
  body:
    "We help businesses put the right digital systems in place, whether that means a website, a web app, a bot, an automation workflow, or a broader combination of these.",
};

export const servicesFraming = {
  title: "What we build depends on what your business actually needs.",
  body:
    "Some businesses need a stronger public-facing presence. Others need better internal systems. Many need both. Our role is to help define the right setup, then build it well.",
};

export const technicalCapabilities = [
  {
    title: "Role-Based Views",
    body:
      "Systems can be shaped around owners, managers, staff, or different workflows so the right people see the right actions and reporting.",
  },
  {
    title: "Reporting Layers",
    body:
      "We build reporting that supports day-to-day visibility, including end-of-day summaries, weekly reviews, operational dashboards, and business analysis.",
  },
  {
    title: "Workflow Logic",
    body:
      "The work is not just screens. It includes the actual logic behind approvals, status changes, routing, follow-up, and repeated tasks.",
  },
  {
    title: "Integrations",
    body:
      "Forms, sheets, CRMs, internal tools, bots, email, and notification channels can be connected so information moves cleanly through the business.",
  },
  {
    title: "Automation and Alerts",
    body:
      "From lead follow-up to internal notifications and scheduled reports, automation is shaped around the process rather than added as a gimmick.",
  },
  {
    title: "Operational Support",
    body:
      "When needed, the work continues after launch through maintenance, updates, refinement, and technical help as the business evolves.",
  },
];

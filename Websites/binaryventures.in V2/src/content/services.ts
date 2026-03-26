export type ServiceOffer = {
  id: string;
  name: string;
  category: string;
  delivery: string;
  scope: string;
  description: string;
  startingFromUSD?: number;
  supportPlanUSD?: number;
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

export type ServiceOffer = {
  id: string;
  groupId: string;
  name: string;
  category: string;
  delivery: string;
  level: "primary" | "supporting";
  scope: string;
  description: string;
  startingFromUSD?: number;
  startingLabel?: string;
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

export type ServiceGroup = {
  id: string;
  name: string;
  eyebrow: string;
  description: string;
  homepageSummary: string;
  serviceIds: string[];
};

export type GroupedServiceOffers = ServiceGroup & {
  offers: ServiceOffer[];
};

export type PricingAnchor = {
  label: string;
  value: string;
  summary: string;
  includes: string[];
};

export const serviceOffers: ServiceOffer[] = [
  {
    id: "websites",
    groupId: "core-builds",
    name: "Websites",
    category: "Core Build",
    delivery: "Project-based",
    level: "primary",
    scope:
      "Positioning-led business websites built to increase trust, clarity, and enquiry quality.",
    description:
      "High-trust business websites that present the company properly, explain the offer clearly, and support serious enquiries.",
    startingFromUSD: 500,
    supportPlanUSD: 150,
    technicalScope: [
      "site architecture and page hierarchy",
      "responsive implementation across devices",
      "forms, routing, and enquiry handling",
      "structured content and update-friendly pages",
    ],
    systemElements: [
      "landing and service pages",
      "contact and enquiry forms",
      "proof, trust, and credibility blocks",
      "launch-ready page and content structure",
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
      bestFor:
        "Service businesses, professional teams, operators, and businesses that need a cleaner public-facing presence",
    },
  },
  {
    id: "web-apps",
    groupId: "core-builds",
    name: "Web Apps",
    category: "Core Build",
    delivery: "Custom build",
    level: "primary",
    scope:
      "Internal tools, dashboards, portals, and operational systems designed around real workflows.",
    description:
      "Custom software, dashboards, and internal systems built around process, visibility, reporting, and operational control.",
    startingFromUSD: 1500,
    supportPlanUSD: 150,
    technicalScope: [
      "role-aware dashboards and portals",
      "custom business logic and workflow rules",
      "reporting, filters, and operational views",
      "data handling for day-to-day business operations",
    ],
    systemElements: [
      "admin and staff panels",
      "reporting and analytics layers",
      "inventory or billing flows",
      "approval and status workflows",
    ],
    integrationExamples: [
      "forms, sheets, and internal tools",
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
    id: "ai-chatbots",
    groupId: "ai-automation",
    name: "AI ChatBots",
    category: "AI & Automation",
    delivery: "Custom or scoped package",
    level: "primary",
    scope:
      "AI chatbots for websites and messaging channels that answer questions, route leads, and keep simple support moving.",
    description:
      "Chatbots for lead capture, customer questions, routing, input collection, and support flows that should not require manual follow-up every time.",
    startingFromUSD: 1000,
    supportPlanUSD: 150,
    technicalScope: [
      "prompt and conversation flow design",
      "lead qualification and response routing",
      "business-specific knowledge and input collection",
      "handoff logic to inboxes, dashboards, or people",
    ],
    systemElements: [
      "website chat interfaces",
      "message routing and follow-up steps",
      "question handling and FAQ flows",
      "business input capture and escalation paths",
    ],
    integrationExamples: [
      "websites and landing pages",
      "email, chat, and lead inboxes",
      "CRMs and internal dashboards",
      "support or qualification workflows",
    ],
    capabilities: {
      strategy: true,
      build: true,
      automation: true,
      support: true,
      integrations: true,
    },
    tags: ["ai", "chatbot"],
    meta: {
      includes: "Conversation design, routing logic, integrations, deployment, and maintenance options",
      bestFor:
        "Businesses that want faster responses, cleaner lead capture, and lighter manual support load",
    },
  },
  {
    id: "workflow-automation",
    groupId: "ai-automation",
    name: "Workflow Automation",
    category: "AI & Automation",
    delivery: "Scoped workflow system",
    level: "primary",
    scope:
      "Workflow automation that connects tools, reduces manual handoffs, and keeps repeated work moving cleanly.",
    description:
      "Automations for follow-up, reporting, notifications, approvals, and repeated business tasks that should not depend on manual coordination.",
    startingFromUSD: 750,
    supportPlanUSD: 150,
    technicalScope: [
      "workflow mapping and trigger design",
      "cross-tool data movement and syncing",
      "scheduled reporting and event automation",
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
      "custom reporting outputs",
    ],
    capabilities: { strategy: true, automation: true, integrations: true, support: true },
    tags: ["automation", "ops"],
    meta: {
      includes: "Workflow mapping, trigger design, app connections, and exception handling",
      bestFor:
        "Teams running repeated steps across forms, sheets, CRMs, dashboards, and communication tools",
    },
  },
  {
    id: "domain-hosting",
    groupId: "launch-infrastructure",
    name: "Domain & Hosting",
    category: "Launch & Infrastructure",
    delivery: "Included with build or scoped separately",
    level: "supporting",
    scope:
      "Domain, DNS, SSL, hosting, and launch setup handled properly from the start.",
    description:
      "Domain, DNS, SSL, hosting, and deployment setup handled properly so the website or system goes live cleanly and stays stable.",
    startingFromUSD: 150,
    technicalScope: [
      "domain and DNS configuration",
      "SSL, verification, and certificate setup",
      "hosting environment and deployment routing",
      "go-live checks and launch troubleshooting",
    ],
    systemElements: [
      "domain records and routing",
      "hosting configuration",
      "SSL and certificate setup",
      "launch and environment checks",
    ],
    integrationExamples: [
      "website and app hosting",
      "custom domains and subdomains",
      "deployment platforms",
      "launch-day routing and validation",
    ],
    capabilities: { build: true, support: true, integrations: true },
    tags: ["domain", "hosting"],
    meta: {
      includes: "Domain setup, DNS, SSL, hosting configuration, and launch checks",
      bestFor:
        "Businesses that want the technical launch layer handled properly instead of pieced together later",
    },
  },
  {
    id: "email-setup-hosting",
    groupId: "launch-infrastructure",
    name: "Email Setup & Hosting",
    category: "Launch & Infrastructure",
    delivery: "Scoped per team or included with setup",
    level: "supporting",
    scope:
      "Professional domain-based email setup with routing, aliases, and the right basic delivery foundations.",
    description:
      "Business email setup tied to your domain, with the inbox structure, aliases, routing, and basic deliverability configuration handled cleanly.",
    startingFromUSD: 150,
    technicalScope: [
      "domain-based mailbox setup",
      "aliases, forwards, and inbox routing",
      "basic SPF, DKIM, and DNS alignment",
      "team account structure and handoff support",
    ],
    systemElements: [
      "mailboxes and aliases",
      "inbox routing rules",
      "domain verification records",
      "team email handoff setup",
    ],
    integrationExamples: [
      "Google Workspace or Microsoft 365",
      "website contact forms",
      "lead and support inboxes",
      "team routing and shared mailboxes",
    ],
    capabilities: { build: true, support: true, integrations: true },
    tags: ["email", "setup"],
    meta: {
      includes: "Mailbox setup, aliases, domain records, and routing guidance",
      bestFor:
        "Businesses that need professional email on their own domain without messy setup later",
    },
  },
  {
    id: "logo-branding",
    groupId: "brand-presence",
    name: "Logo & Branding",
    category: "Brand & Presence",
    delivery: "Light brand package or scoped refinement",
    level: "supporting",
    scope:
      "Logo refinement, visual direction, and the brand basics needed to present the business properly.",
    description:
      "Logo and brand basics for businesses that need a cleaner identity before launch, relaunch, or a broader digital upgrade.",
    startingFromUSD: 250,
    technicalScope: [
      "logo refinement or new logo direction",
      "color and typography system basics",
      "simple visual consistency rules",
      "brand-ready application across digital assets",
    ],
    systemElements: [
      "logo files and variants",
      "visual direction and color decisions",
      "type and spacing basics",
      "brand usage guidance for digital channels",
    ],
    integrationExamples: [
      "website visual system",
      "social profile assets",
      "email signatures",
      "basic launch collateral",
    ],
    capabilities: { strategy: true, build: true, support: true },
    tags: ["branding", "identity"],
    meta: {
      includes: "Logo work, visual direction, asset preparation, and digital brand alignment",
      bestFor:
        "Businesses that need the presentation cleaned up before or during a digital rebuild",
    },
  },
  {
    id: "social-media-management",
    groupId: "brand-presence",
    name: "Social Media Management",
    category: "Brand & Presence",
    delivery: "Scoped support or monthly continuity",
    level: "supporting",
    scope:
      "Practical social media support for profile setup, visual consistency, and ongoing posting where needed.",
    description:
      "Social media support for businesses that need cleaner profiles, more consistent presentation, and practical posting continuity after launch.",
    startingLabel: "From $200/mo",
    technicalScope: [
      "profile and channel setup guidance",
      "basic content direction and posting rhythm",
      "visual consistency across social assets",
      "handoff or continuity support where needed",
    ],
    systemElements: [
      "profile setup and cleanup",
      "content structure and post categories",
      "brand-consistent visuals",
      "posting support and continuity",
    ],
    integrationExamples: [
      "launch campaigns and website rollouts",
      "brand assets and templates",
      "content handoff workflows",
      "lead and enquiry channel alignment",
    ],
    capabilities: { strategy: true, support: true },
    tags: ["social", "presence"],
    meta: {
      includes: "Profile setup, direction, brand consistency, and practical posting support",
      bestFor:
        "Businesses that want their digital presence to stay coherent after the main build goes live",
    },
  },
];

export const serviceGroups: ServiceGroup[] = [
  {
    id: "core-builds",
    name: "Core Builds",
    eyebrow: "Primary Services",
    description:
      "The main build layer for businesses that need a stronger public-facing presence, a stronger internal system, or both.",
    homepageSummary:
      "Websites and web apps that improve how the business presents itself and how it operates behind the scenes.",
    serviceIds: ["websites", "web-apps"],
  },
  {
    id: "ai-automation",
    name: "AI & Automation",
    eyebrow: "Primary Services",
    description:
      "AI chatbots and workflow automation for businesses that need repeated work handled more cleanly and more consistently.",
    homepageSummary:
      "Chatbots, routing, lead handling, notifications, and workflow systems that remove repeated manual handoffs.",
    serviceIds: ["ai-chatbots", "workflow-automation"],
  },
  {
    id: "launch-infrastructure",
    name: "Launch & Infrastructure",
    eyebrow: "Supporting Services",
    description:
      "The domain, hosting, email, and launch-layer setup that helps the main build go live properly and stay stable.",
    homepageSummary:
      "Domain, hosting, SSL, email, and launch setup handled properly instead of left as loose ends.",
    serviceIds: ["domain-hosting", "email-setup-hosting"],
  },
  {
    id: "brand-presence",
    name: "Brand & Presence",
    eyebrow: "Supporting Services",
    description:
      "The brand basics and channel support that help the business look cleaner, more consistent, and more presentable after launch.",
    homepageSummary:
      "Logo refinement, social media support, and brand consistency that strengthen how the business shows up publicly.",
    serviceIds: ["logo-branding", "social-media-management"],
  },
];

export const groupedServiceOffers: GroupedServiceOffers[] = serviceGroups.map((group) => ({
  ...group,
  offers: group.serviceIds
    .map((serviceId) => serviceOffers.find((service) => service.id === serviceId))
    .filter((service): service is ServiceOffer => Boolean(service)),
}));

export const serviceRequestGroups = [
  {
    title: "Core Builds",
    body: "For the main build work that shapes the business presence or system.",
    items: ["Websites", "Web Apps"],
  },
  {
    title: "AI & Automation",
    body: "For chatbots, routing, reporting, lead handling, and repeated business workflows.",
    items: ["AI ChatBots", "Workflow Automation"],
  },
  {
    title: "Launch & Infrastructure",
    body: "For the setup work around the build that helps the system launch cleanly.",
    items: ["Domain & Hosting", "Email Setup & Hosting"],
  },
  {
    title: "Brand & Presence",
    body: "For businesses that need cleaner presentation and better consistency after launch.",
    items: ["Logo & Branding", "Social Media Management"],
  },
  {
    title: "Continuity",
    body: "For updates, fixes, small refinements, and ongoing technical support.",
    items: ["Maintenance & Support"],
  },
];

export const engagementModels = [
  {
    title: "Defined service engagements",
    body:
      "For businesses that already know the core problem and want a clear scope, timeline, and implementation path.",
  },
  {
    title: "Complete setup projects",
    body:
      "For businesses that need a broader setup combining the build, launch infrastructure, and surrounding presentation work.",
  },
  {
    title: "Ongoing support",
    body:
      "For businesses that want continuity, maintenance, and technical help after launch without turning support into the main offer.",
  },
];

export const pricingAnchors: PricingAnchor[] = [
  {
    label: "Business Websites",
    value: "From $500",
    summary:
      "For stronger presentation, clearer communication, and better enquiry quality.",
    includes: [
      "page structure and service hierarchy",
      "contact and enquiry routing",
      "responsive implementation",
    ],
  },
  {
    label: "Custom Web Apps",
    value: "From $1,500+",
    summary:
      "For dashboards, reporting systems, portals, and operational software shaped around real workflows.",
    includes: [
      "role-aware dashboards",
      "workflow-specific logic",
      "reporting and operations views",
    ],
  },
  {
    label: "AI ChatBots",
    value: "From $1,000+",
    summary:
      "For lead capture, question handling, routing, and lighter support flows across websites or messaging channels.",
    includes: [
      "conversation flow design",
      "routing and handoff logic",
      "business-specific input collection",
    ],
  },
  {
    label: "Workflow Automation",
    value: "From $750+",
    summary:
      "For notifications, reporting flows, lead handling, and repeated business tasks that need cleaner execution.",
    includes: [
      "automation triggers and routing",
      "cross-tool workflow design",
      "reporting and follow-up logic",
    ],
  },
];

export const servicesIntro = {
  title: "Services built around complete business tech setup.",
  body:
    "We help businesses put the right digital setup in place, from websites and web apps to AI chatbots, workflow automation, and the launch-layer work that helps the whole system go live properly.",
};

export const servicesFraming = {
  title: "The service structure should match the actual business need.",
  body:
    "Some businesses need the core build first. Others need automation. Others need the build plus the domain, email, brand cleanup, and launch support around it. The service architecture now reflects that broader setup more clearly instead of flattening everything into one list.",
};

export const technicalCapabilities = [
  {
    title: "Role-Based Systems",
    body:
      "Systems can be shaped around owners, managers, staff, or different workflows so the right people see the right actions and reporting.",
  },
  {
    title: "Reporting & Operations",
    body:
      "The work can include end-of-day reports, weekly views, operational dashboards, lead tracking, and business analysis layers.",
  },
  {
    title: "Workflow Logic",
    body:
      "The system is not just screens. It includes the logic behind approvals, follow-up, routing, status changes, and repeated operational tasks.",
  },
  {
    title: "Integrations & Routing",
    body:
      "Forms, sheets, CRMs, email, chat, bots, and internal tools can be connected so information moves cleanly through the business.",
  },
  {
    title: "Launch Infrastructure",
    body:
      "Domain records, SSL, hosting, business email, and launch routing can be handled as part of the setup instead of left as separate loose ends.",
  },
  {
    title: "Continuity Support",
    body:
      "After launch, the work can continue through maintenance, updates, smaller refinements, and technical help where the business actually needs it.",
  },
];

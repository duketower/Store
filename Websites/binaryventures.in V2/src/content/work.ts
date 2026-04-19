export type CaseStudy = {
  title: string;
  category: string;
  metric: string;
  metricLabel: string;
  timeline: string;
  visualKind: "operations" | "website" | "institution" | "automation";
  proofPoints: string[];
  context: string;
  challenge: string;
  solution: string;
  technicalDetail: string;
  outcome: string;
  capabilities: string[];
  systemElements: string[];
  workflowHighlights: string[];
};

export const caseStudies: CaseStudy[] = [
  {
    title: "Custom Retail Operations System",
    category: "Web App / Operations",
    metric: "10+",
    metricLabel: "staff using the system daily",
    timeline: "Active since 2023",
    visualKind: "operations",
    proofPoints: [
      "Billing, inventory, and reporting in one operating view",
      "End-of-day summaries pushed through bot-based updates",
      "Dashboards shaped around different business workflows",
    ],
    context:
      "An inventory-led business needed a dependable system to manage billing, stock, day-to-day operations, and reporting in one place.",
    challenge:
      "Sales records, end-of-day reporting, stock visibility, expiry tracking, cash management, and business reporting were difficult to manage cleanly through disconnected tools and manual processes. Different businesses also needed different workflows.",
    solution:
      "Built a highly customizable retail operations system with workflow-specific dashboards, billing, inventory controls, expiry-product handling, cash management, sale forecasting, weekly and monthly reporting, and bot-based end-of-day sales summaries.",
    technicalDetail:
      "The system was structured around different operational views, reporting layers, and workflow-specific controls so the setup could adapt to how each business actually runs rather than forcing one generic pattern.",
    outcome:
      "The business gained stronger operational visibility, cleaner sales records, faster reporting, and a system that could adapt to the way the business actually runs.",
    capabilities: [
      "workflow-led dashboard design",
      "inventory and billing flows",
      "EOD reporting automation",
      "analysis and reporting",
    ],
    systemElements: [
      "role-aware dashboards",
      "billing and inventory logic",
      "expiry and stock monitoring",
      "cash and reporting views",
    ],
    workflowHighlights: [
      "daily sales activity flows into operational reporting instead of disconnected records",
      "end-of-day summaries are pushed through bot-based updates",
      "different businesses can work from different dashboard patterns inside the same broader system",
    ],
  },
  {
    title: "Managed Website for a Service Business",
    category: "Website / Ongoing Support",
    metric: "2+ yrs",
    metricLabel: "managed after launch",
    timeline: "Ongoing support engagement",
    visualKind: "website",
    proofPoints: [
      "Rebuilt public presence around trust and clearer enquiries",
      "Content updates handled without destabilizing the site",
      "Mobile behavior and enquiry routing improved over time",
    ],
    context:
      "A service-led business needed a stronger website presence that could support trust, explain the offer clearly, and stay updated over time.",
    challenge:
      "The existing website was outdated, difficult to maintain, weaker on mobile, and not presenting the business clearly enough to support enquiries.",
    solution:
      "Rebuilt and continue to manage the site with regular content changes, structural improvements, maintenance, and ongoing support.",
    technicalDetail:
      "The work focused on strengthening structure, mobile behavior, content update flow, and enquiry handling so the site could stay useful after launch rather than degrade over time.",
    outcome:
      "The business gained a more credible digital presence, a site that is easier to keep current, and a stronger platform for incoming enquiries.",
    capabilities: [
      "brand and offer clarity",
      "responsive website rebuild",
      "ongoing maintenance",
      "content updates",
    ],
    systemElements: [
      "service page structure",
      "responsive frontend behavior",
      "contact and enquiry routing",
      "managed update cycle",
    ],
    workflowHighlights: [
      "new updates can be made without the site becoming unstable or outdated",
      "the site stays aligned with the business as services, messaging, or content shift",
      "enquiry paths remain clearer and easier to manage over time",
    ],
  },
  {
    title: "Managed Website for an Academic Institution",
    category: "Website / Managed Delivery",
    metric: "Multi-year",
    metricLabel: "managed website engagement",
    timeline: "Continuously maintained",
    visualKind: "institution",
    proofPoints: [
      "Public information organized into clearer page structures",
      "Regular updates handled as part of an operating rhythm",
      "Maintenance reduced stress around website changes",
    ],
    context:
      "An academic institution needed a website that could communicate clearly, stay current, and support regular updates without friction.",
    challenge:
      "The site needed better design, better maintenance, clearer information structure, and reliable ongoing management.",
    solution:
      "Delivered and continue to manage the website with regular updates, structured maintenance, and ongoing improvements as needs evolve.",
    technicalDetail:
      "The implementation had to support ongoing publishing, information clarity, and dependable upkeep, which meant the website needed to function as a maintained communication system rather than a one-time launch asset.",
    outcome:
      "The institution gained a clearer public-facing platform, more dependable upkeep, and less operational stress around website changes.",
    capabilities: [
      "information structure",
      "managed website support",
      "content publishing",
      "ongoing improvements",
    ],
    systemElements: [
      "clear information hierarchy",
      "update-friendly page management",
      "mobile and accessibility improvements",
      "ongoing content operations",
    ],
    workflowHighlights: [
      "regular updates can be handled without rebuilding page structure each time",
      "public information stays clearer and easier to maintain",
      "website changes become part of an ongoing operating rhythm instead of ad hoc fixes",
    ],
  },
  {
    title: "Automation and Bot Workflows",
    category: "Bots / Automation",
    metric: "Hours",
    metricLabel: "of manual work reduced weekly",
    timeline: "Live operational workflows",
    visualKind: "automation",
    proofPoints: [
      "Routine reports delivered without manual collation",
      "Internal notifications routed through the right channel",
      "Lead and data workflows structured for faster follow-up",
    ],
    context:
      "Businesses needed faster reporting, cleaner internal visibility, and less manual follow-up across routine operational tasks.",
    challenge:
      "Important updates were trapped in repeated manual work, scattered data, and delayed reporting. Teams needed simpler ways to collect information, trigger actions, and stay informed.",
    solution:
      "Built report automation, internal notification bots, scraping and data collection workflows, lead capture and follow-up systems, and Telegram bots designed around the actual business process rather than a generic template.",
    technicalDetail:
      "The value came from designing triggers, routing logic, reporting output, and handoff points so information moved through the workflow with less manual coordination.",
    outcome:
      "Operations became faster to monitor, easier to act on, and less dependent on manual coordination for routine work.",
    capabilities: [
      "Telegram bots",
      "internal notifications",
      "data collection workflows",
      "lead follow-up automation",
    ],
    systemElements: [
      "report automation",
      "notification and alert flows",
      "scraping and data collection",
      "lead capture and follow-up logic",
    ],
    workflowHighlights: [
      "routine updates are pushed automatically instead of waiting on manual reporting",
      "internal stakeholders are notified through the right channel at the right point in the workflow",
      "lead or operational inputs can trigger follow-up and reporting without repeated handoffs",
    ],
  },
];

export const workCapabilities = [
  {
    title: "Operational Systems",
    body:
      "Software built around billing, inventory, reporting, internal visibility, workflow control, and the day-to-day logic of the business.",
  },
  {
    title: "Trust-Building Websites",
    body:
      "Websites that improve presentation, clarify the offer, support enquiries, and remain maintainable as the business changes.",
  },
  {
    title: "Bots and Automation",
    body:
      "Workflow support, reporting, notifications, lead handling, and repeated task execution delivered through practical automation.",
  },
  {
    title: "Ongoing Technical Support",
    body:
      "Longer-term continuity for businesses that need regular updates, maintenance, and technical help after launch.",
  },
];

export const implementationPatterns = [
  {
    title: "Role-Aware Interfaces",
    body:
      "Different users often need different controls, reporting, or operational views. Systems are shaped around that reality instead of forcing one flat interface.",
  },
  {
    title: "Reporting and Summaries",
    body:
      "Projects often include weekly, monthly, or end-of-day views so the business can act from current information instead of piecing it together manually.",
  },
  {
    title: "Workflow-Specific Logic",
    body:
      "Approvals, follow-up, stock movement, lead routing, notifications, and exception handling are treated as part of the build, not as afterthoughts.",
  },
  {
    title: "Connected Systems",
    body:
      "Forms, bots, dashboards, operational tools, and reporting layers are connected where useful so information keeps moving through the business.",
  },
];

export const deliveryStandards = [
  "The work is scoped around operational needs first, not around whatever happens to be trendy.",
  "Solutions are designed to be useful in real business conditions, with direct communication throughout delivery.",
  "Where client names cannot be shown publicly, the problem, solution, and outcome still remain real.",
];

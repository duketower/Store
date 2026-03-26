export type CaseStudy = {
  title: string;
  category: string;
  context: string;
  challenge: string;
  solution: string;
  outcome: string;
  capabilities: string[];
};

export const caseStudies: CaseStudy[] = [
  {
    title: "Custom Retail Operations System",
    category: "Web App / Operations",
    context:
      "An inventory-led business needed a dependable system to manage billing, stock, day-to-day operations, and reporting in one place.",
    challenge:
      "Sales records, end-of-day reporting, stock visibility, expiry tracking, cash management, and business reporting were difficult to manage cleanly through disconnected tools and manual processes. Different businesses also needed different workflows.",
    solution:
      "Built a highly customizable retail operations system with workflow-specific dashboards, billing, inventory controls, expiry-product handling, cash management, sale forecasting, weekly and monthly reporting, and bot-based end-of-day sales summaries.",
    outcome:
      "The business gained stronger operational visibility, cleaner sales records, faster reporting, and a system that could adapt to the way the business actually runs.",
    capabilities: [
      "workflow-led dashboard design",
      "inventory and billing flows",
      "EOD reporting automation",
      "analysis and reporting",
    ],
  },
  {
    title: "Managed Website for a Service Business",
    category: "Website / Ongoing Support",
    context:
      "A service-led business needed a stronger website presence that could support trust, explain the offer clearly, and stay updated over time.",
    challenge:
      "The existing website was outdated, difficult to maintain, weaker on mobile, and not presenting the business clearly enough to support enquiries.",
    solution:
      "Rebuilt and continue to manage the site with regular content changes, structural improvements, maintenance, and ongoing support.",
    outcome:
      "The business gained a more credible digital presence, a site that is easier to keep current, and a stronger platform for incoming enquiries.",
    capabilities: [
      "brand and offer clarity",
      "responsive website rebuild",
      "ongoing maintenance",
      "content updates",
    ],
  },
  {
    title: "Managed Website for an Academic Institution",
    category: "Website / Managed Delivery",
    context:
      "An academic institution needed a website that could communicate clearly, stay current, and support regular updates without friction.",
    challenge:
      "The site needed better design, better maintenance, clearer information structure, and reliable ongoing management.",
    solution:
      "Delivered and continue to manage the website with regular updates, structured maintenance, and ongoing improvements as needs evolve.",
    outcome:
      "The institution gained a clearer public-facing platform, more dependable upkeep, and less operational stress around website changes.",
    capabilities: [
      "information structure",
      "managed website support",
      "content publishing",
      "ongoing improvements",
    ],
  },
  {
    title: "Automation and Bot Workflows",
    category: "Bots / Automation",
    context:
      "Businesses needed faster reporting, cleaner internal visibility, and less manual follow-up across routine operational tasks.",
    challenge:
      "Important updates were trapped in repeated manual work, scattered data, and delayed reporting. Teams needed simpler ways to collect information, trigger actions, and stay informed.",
    solution:
      "Built report automation, internal notification bots, scraping and data collection workflows, lead capture and follow-up systems, and Telegram bots designed around the actual business process rather than a generic template.",
    outcome:
      "Operations became faster to monitor, easier to act on, and less dependent on manual coordination for routine work.",
    capabilities: [
      "Telegram bots",
      "internal notifications",
      "data collection workflows",
      "lead follow-up automation",
    ],
  },
];

export const workCapabilities = [
  {
    title: "Operational Systems",
    body:
      "Software built around billing, inventory, reporting, internal visibility, and workflow control.",
  },
  {
    title: "Trust-Building Websites",
    body:
      "Websites that improve presentation, clarify the offer, and support better-quality enquiries over time.",
  },
  {
    title: "Bots and Automation",
    body:
      "Workflow support, reporting, notifications, follow-up, and repeated task handling delivered through practical automation.",
  },
  {
    title: "Ongoing Technical Support",
    body:
      "Longer-term continuity for businesses that need regular updates, maintenance, and technical help after launch.",
  },
];

export const deliveryStandards = [
  "The work is scoped around operational needs first, not around whatever happens to be trendy.",
  "Solutions are designed to be useful in real business conditions, with direct communication throughout delivery.",
  "Where client names cannot be shown publicly, the problem, solution, and outcome still remain real.",
];

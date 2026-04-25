export type SupportingPage = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  intent: string;
  intro: string;
  whenRelevant: string[];
  whatItUsuallyIncludes: string[];
  whyItMatters: string[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  relatedServiceIds: string[];
  relatedArticleSlugs: string[];
  relatedCaseStudySlugs: string[];
};

export const supportingPages: SupportingPage[] = [
  {
    slug: "website-maintenance",
    title: "Website Maintenance",
    description:
      "Website maintenance support for businesses that need updates, fixes, content changes, and dependable continuity after launch.",
    eyebrow: "Supporting Page",
    intent: "Post-launch website continuity for businesses that need dependable upkeep.",
    intro:
      "Website maintenance is usually needed when a site is live but no one has clear ownership for updates, fixes, content changes, or small improvements. The goal is not just keeping the site online, but keeping it accurate, useful, and dependable over time.",
    whenRelevant: [
      "the website is live but updates keep getting delayed",
      "small issues pile up because every change feels like a separate project",
      "the site needs content edits, page changes, or launch follow-up regularly",
      "the business wants continuity without hiring an in-house technical team",
    ],
    whatItUsuallyIncludes: [
      "content and copy updates",
      "small technical fixes and layout corrections",
      "page additions or refinements where needed",
      "ongoing review of forms, contact paths, and key pages",
    ],
    whyItMatters: [
      "outdated websites weaken trust quickly",
      "small unresolved issues often hurt enquiries more than major rebuild problems",
      "regular maintenance keeps the site aligned with how the business is changing",
    ],
    faqs: [
      {
        question: "What does website maintenance usually cover?",
        answer:
          "It typically covers updates, small fixes, content changes, page refinements, and practical continuity work that keeps the site accurate and usable after launch.",
      },
      {
        question: "When should a business move from ad hoc changes to ongoing maintenance?",
        answer:
          "Usually when updates become recurring, when small issues keep waiting too long, or when the business wants one reliable path for keeping the site current.",
      },
      {
        question: "Is website maintenance the same as rebuilding the website?",
        answer:
          "No. Maintenance is about continuity, updates, and smaller improvements. A rebuild is a larger structural project when the current site no longer fits the business properly.",
      },
    ],
    relatedServiceIds: ["websites", "maintenance-support"],
    relatedArticleSlugs: [
      "website-maintenance-checklist-for-local-businesses",
      "website-maintenance-checklist-for-indore-businesses",
    ],
    relatedCaseStudySlugs: [
      "managed-website-for-a-service-business",
      "managed-website-for-an-academic-institution",
    ],
  },
  {
    slug: "custom-dashboard-development",
    title: "Custom Dashboard Development",
    description:
      "Custom dashboard development for businesses that need reporting, visibility, and workflow control built around their real operations.",
    eyebrow: "Supporting Page",
    intent: "Operational visibility and reporting for teams that have outgrown disconnected tools.",
    intro:
      "Custom dashboard development becomes useful when important information is scattered across spreadsheets, tools, messages, and manual updates. A good dashboard is not just a visual layer. It should help the business see the right information, at the right time, in the right operational context.",
    whenRelevant: [
      "teams are manually compiling reports every week or every day",
      "owners or managers do not have one dependable operational view",
      "different roles need different reporting, actions, or workflow visibility",
      "the business needs a system shaped around its own process instead of a generic template",
    ],
    whatItUsuallyIncludes: [
      "role-aware dashboards",
      "reporting views and operational summaries",
      "filters, states, and workflow tracking",
      "connected inputs from forms, internal tools, or data systems",
    ],
    whyItMatters: [
      "better visibility improves faster decisions",
      "one operational view reduces reporting friction",
      "custom dashboards often replace repeated manual coordination with clearer working systems",
    ],
    faqs: [
      {
        question: "When does a business need a custom dashboard instead of off-the-shelf reporting?",
        answer:
          "Usually when the workflow, user roles, or operational logic are specific enough that generic reports do not match how the team actually works.",
      },
      {
        question: "What makes a dashboard useful instead of just visually impressive?",
        answer:
          "The useful part is the business fit: the right metrics, the right actions, the right user views, and the right workflow context behind the interface.",
      },
      {
        question: "Can custom dashboard development include automation and reporting logic too?",
        answer:
          "Yes. In many cases the dashboard is only one part of the broader system, with routing, reporting, approvals, or automation working underneath it.",
      },
    ],
    relatedServiceIds: ["web-apps", "workflow-automation"],
    relatedArticleSlugs: ["when-should-a-small-business-use-automation"],
    relatedCaseStudySlugs: ["custom-retail-operations-system"],
  },
  {
    slug: "lead-follow-up-automation",
    title: "Lead Follow-Up Automation",
    description:
      "Lead follow-up automation for businesses that want faster responses, cleaner routing, and less manual coordination after an enquiry comes in.",
    eyebrow: "Supporting Page",
    intent: "Cleaner enquiry handling and follow-up workflows after leads come in.",
    intro:
      "Lead follow-up automation matters when enquiries arrive, but the response path is slow, inconsistent, or dependent on manual handoff. The goal is not to remove human involvement completely. It is to reduce delay, improve routing, and keep follow-up moving reliably.",
    whenRelevant: [
      "new enquiries wait too long before someone responds",
      "leads arrive through multiple channels with no clean routing system",
      "follow-up depends on someone remembering the next step manually",
      "the business wants clearer lead capture before sales or support steps begin",
    ],
    whatItUsuallyIncludes: [
      "lead capture and input collection",
      "routing to the right person or channel",
      "status-based follow-up logic",
      "notifications, reminders, or simple qualification steps",
    ],
    whyItMatters: [
      "response speed often changes conversion quality",
      "clean routing reduces missed or duplicated follow-up",
      "automation helps teams keep enquiry handling consistent across channels",
    ],
    faqs: [
      {
        question: "What is lead follow-up automation actually automating?",
        answer:
          "It usually automates the first response steps, lead routing, status updates, reminders, and repeated handoffs that should not depend on memory alone.",
      },
      {
        question: "Does lead follow-up automation replace real sales conversations?",
        answer:
          "No. It usually improves the path before and around the conversation so the right person gets the right lead with less delay and less confusion.",
      },
      {
        question: "Can lead follow-up automation work with websites, forms, chat, and inboxes together?",
        answer:
          "Yes. In many projects the useful part is connecting those channels so the lead flow is cleaner across the whole business.",
      },
    ],
    relatedServiceIds: ["workflow-automation", "ai-chatbots"],
    relatedArticleSlugs: ["when-should-a-small-business-use-automation"],
    relatedCaseStudySlugs: ["automation-and-bot-workflows"],
  },
  {
    slug: "business-website-cost",
    title: "Business Website Cost",
    description:
      "Business website cost guidance for companies that want to understand what changes pricing, what should be included, and how to budget realistically.",
    eyebrow: "Supporting Page",
    intent: "Commercial-intent page for buyers comparing website scope, pricing, and decision factors.",
    intro:
      "Business website cost depends less on arbitrary package labels and more on what the site needs to do. The real pricing drivers are page structure, content complexity, trust requirements, forms, integrations, and whether the business needs only a simple site or a more complete digital setup.",
    whenRelevant: [
      "the business is budgeting for a first website or a rebuild",
      "decision-makers want a clearer view of what affects price",
      "the company needs to compare simple brochure sites against more involved builds",
      "the buyer wants to understand what should be included before asking for quotes",
    ],
    whatItUsuallyIncludes: [
      "page structure and core website planning",
      "design and responsive implementation",
      "forms, contact paths, and trust-building sections",
      "launch setup, metadata, and practical post-launch readiness",
    ],
    whyItMatters: [
      "price without scope is rarely useful",
      "the cheapest site often leaves out the parts that make enquiries easier",
      "clear cost framing helps the business budget for the right level of setup",
    ],
    faqs: [
      {
        question: "What changes the cost of a business website most?",
        answer:
          "The biggest factors are page count, content clarity, design complexity, trust requirements, forms, integrations, and whether the project includes supporting setup around launch.",
      },
      {
        question: "Is a low-cost website always the better starting point?",
        answer:
          "Only if the business truly needs something simple. If the site also needs trust-building, clearer service positioning, or operational routing, under-scoping often creates more work later.",
      },
      {
        question: "Should website maintenance be considered separately from website cost?",
        answer:
          "Yes. The initial build cost and the ongoing maintenance cost solve different problems. One gets the site live; the other keeps it accurate and useful after launch.",
      },
    ],
    relatedServiceIds: ["websites", "maintenance-support"],
    relatedArticleSlugs: ["how-much-does-a-business-website-cost-in-india"],
    relatedCaseStudySlugs: ["managed-website-for-a-service-business"],
  },
];

export function getSupportingPagePath(slug: string) {
  return `/solutions/${slug}`;
}

export function getSupportingPageBySlug(slug: string) {
  return supportingPages.find((page) => page.slug === slug) ?? null;
}

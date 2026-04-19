import { publicContact } from "@/content/site";

export const contactIntro = {
  title: "Tell us what your business needs.",
  body:
    "If you need a new website, a custom system, an AI chatbot, workflow automation, or a broader digital setup, reach out. We will help you identify the right next step.",
};

export const contactOptions = [
  {
    title: "Book a Call",
    body:
      "Choose a 30-minute slot to talk through your business context, what needs to be built, and the best next step.",
    actionLabel: "Schedule a 30-Minute Call",
    actionHref: publicContact.bookingHref,
    variant: "primary" as const,
  },
  {
    title: "Email Us",
    body:
      "For direct project conversations, email us with your business context, what you need built, and your target timeline.",
    actionLabel: "connect@binaryventures.in",
    actionHref: "mailto:connect@binaryventures.in",
    variant: "secondary" as const,
  },
];

export const contactPrompts = [
  "What does your business need help with?",
  "What process or system are you trying to improve?",
  "Do you need a defined service or a custom solution?",
  "What timeline are you working with?",
];

export const responseExpectations = [
  {
    title: "Websites",
    body:
      "Business websites, rebuilds, managed website support, and ongoing updates.",
  },
  {
    title: "Systems",
    body:
      "Internal tools, portals, dashboards, POS-style workflows, and operational software.",
  },
  {
    title: "AI ChatBots and Automation",
    body:
      "AI chatbots, Telegram bots, reporting flows, notifications, lead follow-up, and repeated process automation.",
  },
];

"use client";

import React from "react";
import { motion } from "motion/react";

const proofItems = [
  {
    text: "An offline-first retail operations system brought billing, inventory visibility, and daily store workflows into one dependable setup.",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    name: "Retail Operations System",
    role: "Store workflows and reporting",
  },
  {
    text: "A custom website rebuild gave a service business a stronger digital presence, cleaner positioning, and a more credible first impression.",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    name: "Service Business Website",
    role: "Trust and enquiry improvement",
  },
  {
    text: "A lead sourcing workflow reduced manual effort by extracting, structuring, and preparing targeted prospect data for outreach.",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
    name: "Lead Workflow Automation",
    role: "Faster pipeline preparation",
  },
  {
    text: "Internal dashboards helped operators move from scattered tools to clearer reporting, cleaner handoffs, and better day-to-day visibility.",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    name: "Operational Dashboards",
    role: "Clarity for growing teams",
  },
  {
    text: "Bots were used to route repetitive tasks, reduce response lag, and keep business information moving without extra manual overhead.",
    image:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80",
    name: "Bot-Driven Workflows",
    role: "Lower operational drag",
  },
  {
    text: "Automation systems connected repeated business steps across tools, removing friction where teams were previously relying on manual work.",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    name: "Connected Automations",
    role: "Smoother business operations",
  },
  {
    text: "Business systems were designed around the way teams actually work, not around generic templates that look good but fail in practice.",
    image:
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80",
    name: "Custom Business Systems",
    role: "Built around real process",
  },
  {
    text: "Founder-led delivery meant faster decisions, more direct communication, and less confusion between strategy, design, and implementation.",
    image:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80",
    name: "Founder-Led Execution",
    role: "Direct collaboration model",
  },
  {
    text: "The strongest work came from combining websites, internal tools, bots, and automation into one practical setup instead of separate one-off fixes.",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    name: "Complete Tech Setup",
    role: "End-to-end digital systems",
  },
];

const firstColumn = proofItems.slice(0, 3);
const secondColumn = proofItems.slice(3, 6);
const thirdColumn = proofItems.slice(6, 9);

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: typeof proofItems;
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 bg-background pb-6"
      >
        {[...new Array(2).fill(0)].map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <div
                className="w-full max-w-xs rounded-3xl border border-border/70 bg-background/80 p-8 shadow-lg shadow-primary/10 backdrop-blur-sm"
                key={`${name}-${i}`}
              >
                <div className="text-sm leading-7 text-foreground/80">{text}</div>
                <div className="mt-5 flex items-center gap-3">
                  <img
                    width={40}
                    height={40}
                    src={image}
                    alt={name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <div className="font-medium leading-5 tracking-tight">{name}</div>
                    <div className="text-sm leading-5 tracking-tight text-muted-foreground">
                      {role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};

export function ProofColumnsSection() {
  return (
    <section className="relative my-20 bg-background pb-24 pt-10">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(155,153,254,0.12),transparent_70%)]"
      />

      <div className="container relative z-10 mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto flex max-w-[640px] flex-col items-center justify-center text-center"
        >
          <div className="flex justify-center">
            <div className="rounded-lg border border-border/70 bg-muted/50 px-4 py-1 text-sm">
              Proof of Work
            </div>
          </div>

          <h2 className="mt-5 text-xl font-bold tracking-tighter sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl">
            Practical systems. Real use. Measurable value.
          </h2>
          <p className="mt-5 max-w-2xl text-center text-muted-foreground">
            The work is built to be used in real operations, not just to look
            impressive in a portfolio.
          </p>
        </motion.div>

        <div className="mt-10 flex max-h-[740px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn
            testimonials={secondColumn}
            className="hidden md:block"
            duration={19}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            className="hidden lg:block"
            duration={17}
          />
        </div>
      </div>
    </section>
  );
}

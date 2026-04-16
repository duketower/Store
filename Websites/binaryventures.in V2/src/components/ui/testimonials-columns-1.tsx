"use client";

import React from "react";
import { motion } from "motion/react";

const proofItems = [
  {
    text: "A retail operations system consolidated billing, stock management, expiry tracking, and daily reporting — replacing disconnected tools that had been slowing the team down for years.",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    name: "Retail Operations System",
    role: "Active since 2023 · 10+ staff daily",
  },
  {
    text: "A service business website was rebuilt from scratch and has been actively managed for over 2 years — regular content updates, structural improvements, and reliable uptime throughout.",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    name: "Managed Service Website",
    role: "2+ years managed · ongoing",
  },
  {
    text: "A lead sourcing workflow cut hours of manual research per week by automatically extracting, structuring, and delivering targeted prospect data ready for outreach.",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
    name: "Lead Workflow Automation",
    role: "Hours saved weekly",
  },
  {
    text: "An academic institution website has been managed continuously since launch — content stays current, the design stays consistent, and the team no longer handles updates manually.",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    name: "Academic Institution Website",
    role: "Managed · multi-year engagement",
  },
  {
    text: "End-of-day sales summaries that once required manual collation now arrive automatically via bot — reducing close-of-day overhead and keeping reporting consistent across store locations.",
    image:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80",
    name: "Sales Reporting Bot",
    role: "Daily automated reporting",
  },
  {
    text: "A Telegram notification bot was built for internal operations — routing updates, surfacing alerts, and cutting the back-and-forth that was slowing down routine coordination.",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    name: "Operations Notification Bot",
    role: "Live in production",
  },
  {
    text: "Custom POS dashboards replaced spreadsheet-based reporting with real-time visibility — operators could see stock levels, daily totals, and forecasts without waiting for end-of-day summaries.",
    image:
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80",
    name: "POS Dashboards",
    role: "Real-time operational visibility",
  },
  {
    text: "A data scraping and structuring workflow processed thousands of records per run — turning unstructured public data into clean, actionable lists with no manual effort.",
    image:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80",
    name: "Data Collection Automation",
    role: "Thousands of records per run",
  },
  {
    text: "Projects built across websites, internal systems, bots, and automation — delivered with direct communication, clear scope, and no unnecessary agency layers between client and builder.",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    name: "Founder-Led Studio",
    role: "India & Adelaide, Australia",
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

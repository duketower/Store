'use client';

import React from "react";
import { motion, useReducedMotion } from "motion/react";

const objections = [
  {
    question: "Is a small studio right for what we need?",
    answer:
      "You work directly with the people defining and building the system — no account managers, no handoff layers, no briefing chain. Faster decisions, clearer communication, and real accountability on every project.",
  },
  {
    question: "How is this different from hiring a freelancer?",
    answer:
      "A freelancer covers one skill. We cover the full build: website, internal system, bot, automation, or a combination. One team, one point of contact, one coherent setup — not a collection of separate one-off hires.",
  },
  {
    question: "What happens after the system is built?",
    answer:
      "We offer structured maintenance and ongoing support for every project type. If your system needs to keep evolving — new features, content updates, operational changes — we can stay involved on a clear recurring basis.",
  },
  {
    question: "Can we start with something smaller first?",
    answer:
      "Yes. Defined service engagements with clear scope and starting prices mean you can begin with a focused project, see the quality of the work, and expand from there. No pressure to commit to a large build upfront.",
  },
];

function AnimatedContainer({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ObjectionCardsSection() {
  return (
    <section className="relative overflow-hidden bg-background py-16 md:py-28">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(55%_55%_at_50%_0%,rgba(155,153,254,0.07),transparent_70%)]"
      />
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <AnimatedContainer className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mx-auto mb-4 flex w-fit justify-center rounded-lg border border-border/70 bg-muted/50 px-4 py-1 text-sm text-foreground/80">
            Common Questions
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl lg:text-5xl">
            Things worth knowing before we talk.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
            Straightforward answers to the questions most businesses ask before
            deciding whether to reach out.
          </p>
        </AnimatedContainer>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {objections.map((item, i) => (
            <AnimatedContainer key={i} delay={0.1 + i * 0.08}>
              <div className="h-full rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm">
                <h3 className="text-base font-semibold leading-snug text-foreground">
                  {item.question}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>
    </section>
  );
}

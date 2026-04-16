'use client';

import Link from "next/link";
import React from "react";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

const pricingTiers = [
  {
    label: "Websites",
    price: "From $500",
    description:
      "Business websites built for trust, clarity, and better-quality enquiries.",
    href: "/services#websites",
    accent: false,
  },
  {
    label: "Web Apps",
    price: "From $1,500",
    description:
      "Custom systems, dashboards, and internal tools built around how you actually operate.",
    href: "/services#web-apps",
    accent: true,
  },
  {
    label: "Bots & Automation",
    price: "From $750",
    description:
      "Bots and workflows that remove repeated manual work and keep operations moving.",
    href: "/services#ai-automation",
    accent: false,
  },
  {
    label: "Ongoing Support",
    price: "From $150/mo",
    description:
      "Structured maintenance and continuity for systems that need to keep evolving.",
    href: "/services#continuity",
    accent: false,
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

export function PricingPreviewSection() {
  return (
    <section className="relative overflow-hidden bg-background py-16 md:py-28">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(55%_55%_at_50%_0%,rgba(43,200,183,0.07),transparent_70%)]"
      />
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <AnimatedContainer className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mx-auto mb-4 flex w-fit justify-center rounded-lg border border-border/70 bg-muted/50 px-4 py-1 text-sm text-foreground/80">
            Pricing
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl lg:text-5xl">
            Clear starting points. No hidden scope.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
            Defined service engagements begin at clear prices. Larger or more
            tailored builds are scoped after a conversation.
          </p>
        </AnimatedContainer>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pricingTiers.map((tier, i) => (
            <AnimatedContainer key={tier.label} delay={0.1 + i * 0.07}>
              <Link
                href={tier.href}
                className={cn(
                  "group flex h-full flex-col rounded-2xl border p-5 transition-all duration-200 hover:shadow-lg",
                  tier.accent
                    ? "border-primary/30 bg-[linear-gradient(160deg,rgba(155,153,254,0.08),rgba(43,200,183,0.04))] hover:border-primary/50 hover:shadow-primary/10"
                    : "border-border/70 bg-card/60 hover:border-border hover:shadow-primary/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {tier.label}
                  </span>
                  <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
                <p
                  className={cn(
                    "mt-3 text-2xl font-bold tracking-tight",
                    tier.accent ? "text-foreground" : "text-foreground"
                  )}
                >
                  {tier.price}
                </p>
                <p className="mt-3 grow text-xs leading-6 text-muted-foreground">
                  {tier.description}
                </p>
              </Link>
            </AnimatedContainer>
          ))}
        </div>

        <AnimatedContainer delay={0.45} className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Not sure what you need?{" "}
            <Link
              href="/contact"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Start a conversation
            </Link>{" "}
            and we will help define the right scope.
          </p>
        </AnimatedContainer>
      </div>
    </section>
  );
}

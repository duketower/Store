'use client';

import React from "react";
import {
  MessageSquareText,
  Rocket,
  Route,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type FeatureType = {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
};

type FeatureCardProps = React.ComponentProps<"div"> & {
  feature: FeatureType;
};

export function FeatureCard({
  feature,
  className,
  ...props
}: FeatureCardProps) {
  const p = genRandomPattern();

  return (
    <div className={cn("relative overflow-hidden p-6", className)} {...props}>
      <div className="pointer-events-none absolute left-1/2 top-0 -ml-20 -mt-2 h-full w-full [mask-image:linear-gradient(white,transparent)]">
        <div className="from-foreground/5 to-foreground/1 absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] opacity-100">
          <GridPattern
            width={20}
            height={20}
            x="-12"
            y="4"
            squares={p}
            className="fill-foreground/5 stroke-foreground/25 absolute inset-0 h-full w-full mix-blend-overlay"
          />
        </div>
      </div>
      <feature.icon className="text-foreground/75 size-6" strokeWidth={1} aria-hidden />
      <h3 className="mt-10 text-sm md:text-base">{feature.title}</h3>
      <p className="text-muted-foreground relative z-20 mt-2 text-xs font-light leading-6">
        {feature.description}
      </p>
    </div>
  );
}

function GridPattern({
  width,
  height,
  x,
  y,
  squares,
  ...props
}: React.ComponentProps<"svg"> & {
  width: number;
  height: number;
  x: string;
  y: string;
  squares?: number[][];
}) {
  const patternId = React.useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern id={patternId} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y], index) => (
            <rect
              strokeWidth="0"
              key={index}
              width={width + 1}
              height={height + 1}
              x={x * width}
              y={y * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}

function genRandomPattern(length?: number): number[][] {
  length = length ?? 5;
  return Array.from({ length }, () => [
    Math.floor(Math.random() * 4) + 7,
    Math.floor(Math.random() * 6) + 1,
  ]);
}

const features: FeatureType[] = [
  {
    title: "Understand the Business Problem",
    icon: Search,
    description:
      "Start with the actual operational problem, not a guessed solution or a trend-led tool choice.",
  },
  {
    title: "Define the Right Setup",
    icon: Route,
    description:
      "Map the website, system, bot, or workflow setup that best fits the way the business really works.",
  },
  {
    title: "Build with Practical Intent",
    icon: Wrench,
    description:
      "Turn the plan into usable software, automation, and interfaces designed for real-world use.",
  },
  {
    title: "Launch with Clarity",
    icon: Rocket,
    description:
      "Ship cleanly, reduce confusion, and make sure the solution is understandable for the people using it.",
  },
  {
    title: "Support Where It Matters",
    icon: ShieldCheck,
    description:
      "Offer structured updates, maintenance, and improvement paths when the system needs to keep evolving.",
  },
  {
    title: "Work Directly and Clearly",
    icon: MessageSquareText,
    description:
      "Keep communication direct, founder-led, and practical so the work moves without unnecessary layers.",
  },
];

type ViewAnimationProps = {
  delay?: number;
  className?: React.ComponentProps<typeof motion.div>["className"];
  children: React.ReactNode;
};

function AnimatedContainer({
  className,
  delay = 0.1,
  children,
}: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ProcessPreviewSection() {
  return (
    <section className="relative overflow-hidden bg-background py-16 md:py-28">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(55%_55%_at_50%_0%,rgba(43,200,183,0.08),transparent_70%)]"
      />
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4">
        <AnimatedContainer className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-4 flex w-fit justify-center rounded-lg border border-border/70 bg-muted/50 px-4 py-1 text-sm text-foreground/80">
            How We Work
          </div>
          <h2 className="text-3xl font-bold tracking-wide text-balance md:text-4xl lg:text-5xl xl:font-extrabold">
            Clear thinking, direct communication, working systems.
          </h2>
          <p className="text-muted-foreground mt-4 text-sm tracking-wide text-balance md:text-base">
            The process stays practical from discovery to launch so the work is
            useful, understandable, and easier to operate.
          </p>
        </AnimatedContainer>

        <AnimatedContainer
          delay={0.4}
          className="grid grid-cols-1 divide-x divide-y divide-dashed border border-dashed border-border/70 bg-card/40 sm:grid-cols-2 md:grid-cols-3"
        >
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} />
          ))}
        </AnimatedContainer>
      </div>
    </section>
  );
}

'use client';

import Link from "next/link";
import React from "react";
import { motion, type Transition } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BeamPath {
  path: string;
  gradientConfig: {
    initial: {
      x1: string;
      x2: string;
      y1: string;
      y2: string;
    };
    animate: {
      x1: string | string[];
      x2: string | string[];
      y1: string | string[];
      y2: string | string[];
    };
    transition?: Transition;
  };
  connectionPoints?: Array<{
    cx: number;
    cy: number;
    r: number;
  }>;
}

interface PulseBeamsProps {
  children?: React.ReactNode;
  className?: string;
  background?: React.ReactNode;
  beams: BeamPath[];
  width?: number;
  height?: number;
  baseColor?: string;
  accentColor?: string;
  gradientColors?: {
    start: string;
    middle: string;
    end: string;
  };
}

export const PulseBeams = ({
  children,
  className,
  background,
  beams,
  width = 858,
  height = 434,
  baseColor = "rgba(255,255,255,0.08)",
  accentColor = "rgba(255,255,255,0.15)",
  gradientColors,
}: PulseBeamsProps) => {
  return (
    <div
      className={cn(
        "relative flex h-screen w-full items-center justify-center overflow-hidden antialiased",
        className
      )}
    >
      {background}
      <div className="relative z-10">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <SVGs
          beams={beams}
          width={width}
          height={height}
          baseColor={baseColor}
          accentColor={accentColor}
          gradientColors={gradientColors}
        />
      </div>
    </div>
  );
};

function SVGs({
  beams,
  width,
  height,
  baseColor,
  accentColor,
  gradientColors,
}: {
  beams: BeamPath[];
  width: number;
  height: number;
  baseColor: string;
  accentColor: string;
  gradientColors?: {
    start: string;
    middle: string;
    end: string;
  };
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex shrink-0"
    >
      {beams.map((beam, index) => (
        <React.Fragment key={index}>
          <path d={beam.path} stroke={baseColor} strokeWidth="1" />
          <path
            d={beam.path}
            stroke={`url(#grad${index})`}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {beam.connectionPoints?.map((point, pointIndex) => (
            <circle
              key={`${index}-${pointIndex}`}
              cx={point.cx}
              cy={point.cy}
              r={point.r}
              fill={baseColor}
              stroke={accentColor}
            />
          ))}
        </React.Fragment>
      ))}

      <defs>
        {beams.map((beam, index) => (
          <motion.linearGradient
            key={index}
            id={`grad${index}`}
            gradientUnits="userSpaceOnUse"
            initial={beam.gradientConfig.initial}
            animate={beam.gradientConfig.animate}
            transition={beam.gradientConfig.transition}
          >
            <GradientColors colors={gradientColors} />
          </motion.linearGradient>
        ))}
      </defs>
    </svg>
  );
}

function GradientColors({
  colors = {
    start: "#9B99FE",
    middle: "#2BC8B7",
    end: "#DDF8F3",
  },
}: {
  colors?: {
    start: string;
    middle: string;
    end: string;
  };
}) {
  return (
    <>
      <stop offset="0%" stopColor={colors.start} stopOpacity="0" />
      <stop offset="20%" stopColor={colors.start} stopOpacity="1" />
      <stop offset="50%" stopColor={colors.middle} stopOpacity="1" />
      <stop offset="100%" stopColor={colors.end} stopOpacity="0" />
    </>
  );
}

const beamTransition = (delay: number): Transition => ({
  duration: 2.2,
  repeat: Infinity,
  repeatType: "loop",
  ease: "linear",
  repeatDelay: 1.8,
  delay,
});

const beams: BeamPath[] = [
  {
    path: "M269 220.5H16.5C10.9772 220.5 6.5 224.977 6.5 230.5V398.5",
    gradientConfig: {
      initial: {
        x1: "0%",
        x2: "0%",
        y1: "80%",
        y2: "100%",
      },
      animate: {
        x1: ["0%", "0%", "200%"],
        x2: ["0%", "0%", "180%"],
        y1: ["80%", "0%", "0%"],
        y2: ["100%", "20%", "20%"],
      },
      transition: beamTransition(0),
    },
    connectionPoints: [
      { cx: 6.5, cy: 398.5, r: 6 },
      { cx: 269, cy: 220.5, r: 6 },
    ],
  },
  {
    path: "M568 200H841C846.523 200 851 195.523 851 190V40",
    gradientConfig: {
      initial: {
        x1: "0%",
        x2: "0%",
        y1: "80%",
        y2: "100%",
      },
      animate: {
        x1: ["20%", "100%", "100%"],
        x2: ["0%", "90%", "90%"],
        y1: ["80%", "80%", "-20%"],
        y2: ["100%", "100%", "0%"],
      },
      transition: beamTransition(0.35),
    },
    connectionPoints: [
      { cx: 851, cy: 34, r: 6.5 },
      { cx: 568, cy: 200, r: 6 },
    ],
  },
  {
    path: "M425.5 274V333C425.5 338.523 421.023 343 415.5 343H152C146.477 343 142 347.477 142 353V426.5",
    gradientConfig: {
      initial: {
        x1: "0%",
        x2: "0%",
        y1: "80%",
        y2: "100%",
      },
      animate: {
        x1: ["20%", "100%", "100%"],
        x2: ["0%", "90%", "90%"],
        y1: ["80%", "80%", "-20%"],
        y2: ["100%", "100%", "0%"],
      },
      transition: beamTransition(0.7),
    },
    connectionPoints: [
      { cx: 142, cy: 427, r: 6.5 },
      { cx: 425.5, cy: 274, r: 6 },
    ],
  },
  {
    path: "M493 274V333.226C493 338.749 497.477 343.226 503 343.226H760C765.523 343.226 770 347.703 770 353.226V427",
    gradientConfig: {
      initial: {
        x1: "40%",
        x2: "50%",
        y1: "160%",
        y2: "180%",
      },
      animate: {
        x1: "0%",
        x2: "10%",
        y1: "-40%",
        y2: "-20%",
      },
      transition: beamTransition(1.05),
    },
    connectionPoints: [
      { cx: 770, cy: 427, r: 6.5 },
      { cx: 493, cy: 274, r: 6 },
    ],
  },
  {
    path: "M380 168V17C380 11.4772 384.477 7 390 7H414",
    gradientConfig: {
      initial: {
        x1: "-40%",
        x2: "-10%",
        y1: "0%",
        y2: "20%",
      },
      animate: {
        x1: ["40%", "0%", "0%"],
        x2: ["10%", "0%", "0%"],
        y1: ["0%", "0%", "180%"],
        y2: ["20%", "20%", "200%"],
      },
      transition: beamTransition(1.4),
    },
    connectionPoints: [
      { cx: 420.5, cy: 6.5, r: 6 },
      { cx: 380, cy: 168, r: 6 },
    ],
  },
];

const gradientColors = {
  start: "#9B99FE",
  middle: "#2BC8B7",
  end: "#DDF8F3",
};

export function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden bg-background px-4 py-16 md:px-6 md:py-28">
      <PulseBeams
        beams={beams}
        gradientColors={gradientColors}
        className="h-[34rem] rounded-[2rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] md:h-[38rem]"
        background={
          <>
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(55%_60%_at_50%_25%,rgba(155,153,254,0.12),transparent_60%)]"
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.18))]"
            />
          </>
        }
      >
        <div className="mx-auto flex max-w-2xl flex-col items-center px-6 text-center">
          <div className="mb-5 rounded-lg border border-border/70 bg-muted/50 px-4 py-1 text-sm text-foreground/80">
            Start the Conversation
          </div>
          <h2 className="max-w-3xl text-balance text-3xl font-semibold text-foreground md:text-5xl">
            If your business needs better systems, let us talk through it properly.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
            Whether you need a stronger digital presence, internal tools, bots,
            automations, or a broader operational setup, we can help define the
            right next step.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/contact">Book a Call</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8">
              <a href="mailto:connect@binaryventures.in">Email Us</a>
            </Button>
          </div>
        </div>
      </PulseBeams>
    </section>
  );
}

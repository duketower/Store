"use client";

import Link from "next/link";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { pricingPlans, type PricingMode, type PricingPlan } from "@/content/services";

export default function RuixenPricing04() {
  const [pricingMode, setPricingMode] = useState<PricingMode>("project");

  const plans = useMemo(() => pricingPlans[pricingMode], [pricingMode]);

  return (
    <section className="relative px-6 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <div className="rounded-lg border border-border/70 bg-muted/50 px-4 py-1 text-sm text-foreground/80">
            Pricing
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            Clear starting points for the work you need now.
          </h2>
          <p className="mt-6 text-base text-muted-foreground md:text-lg">
            Switch between new project builds and post-launch support to see how
            Binary Ventures prices the most common engagement types.
          </p>
        </div>

        <div className="mt-8 inline-flex items-center rounded-full border border-border/80 bg-card/80 p-1 shadow-sm">
          <ModeButton
            active={pricingMode === "project"}
            onClick={() => setPricingMode("project")}
          >
            Project Work
          </ModeButton>
          <ModeButton
            active={pricingMode === "support"}
            onClick={() => setPricingMode("support")}
          >
            Ongoing Support
          </ModeButton>
        </div>

        <div className="mt-4 h-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={pricingMode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-sm text-muted-foreground"
            >
              {pricingMode === "project"
                ? "Starting prices for new builds and scoped implementation work."
                : "Starting prices for continuity, maintenance, and ongoing technical support."}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="grid w-full max-w-5xl grid-cols-1 gap-4 pt-8 lg:grid-cols-2 lg:gap-6 lg:pt-12">
          {plans.map((plan) => (
            <PricingPlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-5 py-2.5 text-sm font-medium transition-[background-color,color,box-shadow] duration-200",
        active
          ? "bg-foreground text-background shadow-[0_14px_28px_-20px_rgba(15,23,42,0.5)]"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function PricingPlanCard({ plan }: { plan: PricingPlan }) {
  const isMailto = plan.href.startsWith("mailto:");

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-start overflow-hidden rounded-[2rem] border border-foreground/10 bg-card/80 shadow-sm shadow-black/5 transition-all",
        plan.badge && "border-[#7c8fd9]/55"
      )}
    >
      {plan.badge && (
        <div className="absolute inset-x-0 top-10 -z-10 mx-auto h-16 w-2/3 -rotate-6 rounded-full bg-[#7c8fd9]/18 blur-[5rem]" />
      )}

      <div className="flex w-full flex-col items-start p-6 md:p-8">
        {plan.badge && (
          <div className="rounded-full border border-[#7c8fd9]/40 bg-[#7c8fd9]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/80">
            {plan.badge}
          </div>
        )}
        <h3 className="pt-4 text-xl font-medium text-foreground">{plan.title}</h3>
        <div className="mt-3 flex items-end gap-2 text-foreground">
          <NumberFlow
            value={plan.price}
            format={{
              currency: "USD",
              style: "currency",
              currencySign: "standard",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
              currencyDisplay: "narrowSymbol",
            }}
            className="text-3xl font-bold md:text-5xl"
          />
          <span className="pb-1 text-base font-medium text-muted-foreground">
            {plan.unitLabel}
          </span>
        </div>
        <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
          {plan.desc}
        </p>
      </div>

      <div className="flex w-full flex-col items-start px-6 py-2 md:px-8">
        <Button asChild size="lg" className="w-full">
          {isMailto ? (
            <a href={plan.href}>{plan.buttonText}</a>
          ) : (
            <Link href={plan.href}>{plan.buttonText}</Link>
          )}
        </Button>
        <div className="h-8 w-full">
          <span className="mt-3 block text-center text-sm text-muted-foreground">
            {plan.unitLabel === "/mo"
              ? "Starting monthly support scope"
              : "Starting project scope"}
          </span>
        </div>
      </div>

      <div className="mb-4 ml-1 flex w-full flex-col items-start gap-y-2 p-6 md:px-8">
        <span className="mb-2 text-base text-left text-foreground">Includes:</span>
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-center justify-start gap-2">
            <div className="flex items-center justify-center text-foreground/70">
              <CheckIcon className="size-5" />
            </div>
            <span className="text-sm leading-7 text-foreground/80">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

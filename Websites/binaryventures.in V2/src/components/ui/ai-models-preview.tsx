'use client';

import Link from "next/link";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  groupedServiceOffers,
  type GroupedServiceOffers,
  type ServiceOffer,
} from "@/content/services";

type Props = {
  models: GroupedServiceOffers[];
  className?: string;
};

export const AiModelsList: React.FC<Props> = ({ models, className = "" }) => {
  const [selected, setSelected] = useState<GroupedServiceOffers | null>(null);

  React.useEffect(() => {
    if (!selected) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [selected]);

  const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="inline-flex items-center rounded-md bg-muted/70 px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border/80">
      {children}
    </span>
  );

  return (
    <div className={`mx-auto w-full max-w-6xl ${className}`}>
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <div className="mx-auto mb-4 flex w-fit justify-center rounded-lg border border-border/70 bg-muted/50 px-4 py-1 text-sm text-foreground/80">
          Services
        </div>
        <h2 className="text-2xl font-semibold text-foreground md:text-4xl">
          Structured so the core build and the supporting setup both stay visible.
        </h2>
        <p className="mt-4 text-muted-foreground">
          A clearer service architecture for businesses that need the main build,
          the automation layer, and the setup around it to work together.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {models.map((group) => (
          <motion.li
            key={group.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer rounded-2xl border border-border/70 bg-card/80 p-5 text-card-foreground shadow-sm shadow-primary/5 transition hover:shadow-lg hover:shadow-primary/10"
            onClick={() => setSelected(group)}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">{group.name}</span>
              <Badge>{group.eyebrow}</Badge>
            </div>
            <p className="mt-3 min-h-24 text-sm leading-6 text-muted-foreground">
              {group.homepageSummary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {group.offers.map((offer) => (
                <Badge key={offer.id}>{offer.name}</Badge>
              ))}
            </div>
          </motion.li>
        ))}
      </ul>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 px-4 py-24 backdrop-blur-sm sm:items-center sm:py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative my-auto max-h-[calc(100svh-8rem)] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] border border-border/80 bg-card p-5 text-card-foreground shadow-lg shadow-primary/10 overscroll-contain sm:max-h-[min(90vh,48rem)] sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute right-4 top-4 z-10 rounded-full border border-border/80 bg-background/90 px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
                onClick={() => setSelected(null)}
              >
                Close
              </button>

              <p className="pr-20 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {selected.eyebrow}
              </p>
              <h3 className="mt-2 pr-20 text-2xl font-semibold">{selected.name}</h3>
              <p className="mt-3 pr-8 text-sm leading-6 text-muted-foreground">
                {selected.description}
              </p>

              <div className="mt-5 grid gap-3 sm:flex">
                <Link
                  href={`/services#${selected.id}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-border/80 bg-card/80 px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  View full section
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/80 bg-white px-5 py-3 text-sm font-semibold !text-slate-950 transition-opacity hover:opacity-90"
                >
                  Book a Call
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {selected.offers.map((offer) => (
                  <ServiceSummaryCard key={offer.id} service={offer} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function ServiceSummaryCard({ service }: { service: ServiceOffer }) {
  return (
    <div className="rounded-[1.25rem] border border-border/80 bg-background/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-[70%]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {service.category}
          </p>
          <h4 className="mt-2 text-lg font-semibold text-foreground">{service.name}</h4>
        </div>
        <span className="rounded-full border border-border/80 bg-card/80 px-3 py-1 text-xs font-medium text-foreground">
          {formatStartingPoint(service)}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {service.description}
      </p>

      <div className="mt-4 rounded-xl border border-border/80 bg-card/70 p-3 text-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Best for
        </p>
        <p className="mt-2 leading-6 text-foreground/80">{service.meta.bestFor}</p>
      </div>
    </div>
  );
}

function formatStartingPoint(service: ServiceOffer) {
  if (service.startingLabel) {
    return service.startingLabel;
  }

  if (typeof service.startingFromUSD === "number") {
    return `From $${service.startingFromUSD.toLocaleString()}`;
  }

  return "Custom scope";
}

export function ServicesPreviewSection() {
  return (
    <section className="relative overflow-hidden bg-background py-24 md:py-32">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(55%_55%_at_50%_0%,rgba(155,153,254,0.10),transparent_70%)]"
      />
      <div className="relative z-10 px-6">
        <AiModelsList models={groupedServiceOffers} />
      </div>
    </section>
  );
}

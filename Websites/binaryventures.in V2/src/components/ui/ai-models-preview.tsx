'use client';

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { serviceOffers, type ServiceOffer } from "@/content/services";

type Props = {
  models: ServiceOffer[];
  className?: string;
};

export const AiModelsList: React.FC<Props> = ({ models, className = "" }) => {
  const [selected, setSelected] = useState<ServiceOffer | null>(null);

  const sorted = useMemo(() => {
    return [...models].sort((a, b) => {
      return (a.category || "").localeCompare(b.category || "");
    });
  }, [models]);

  const formatPrice = (n?: number) =>
    typeof n === "number" ? `From $${n.toLocaleString()}` : "Custom scope";

  const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="inline-flex items-center rounded-md bg-muted/70 px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border/80">
      {children}
    </span>
  );

  return (
    <div className={`mx-auto w-full max-w-6xl ${className}`}>
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <div className="mx-auto mb-4 flex w-fit justify-center rounded-lg border border-border/70 bg-muted/50 px-4 py-1 text-sm text-foreground/80">
          Service Pillars
        </div>
        <h2 className="text-2xl font-semibold text-foreground md:text-4xl">
          Built for the work that actually matters.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Clear service pillars for businesses that need practical systems, not
          disconnected one-off fixes.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sorted.map((m) => (
          <motion.li
            key={m.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer rounded-2xl border border-border/70 bg-card/80 p-5 text-card-foreground shadow-sm shadow-primary/5 transition hover:shadow-lg hover:shadow-primary/10"
            onClick={() => setSelected(m)}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">{m.name}</span>
              {m.category && <Badge>{m.category}</Badge>}
            </div>
            <p className="mt-3 min-h-20 text-sm leading-6 text-muted-foreground">
              {m.description || "No description available"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {m.capabilities?.strategy && <Badge>Strategy</Badge>}
              {m.capabilities?.build && <Badge>Build</Badge>}
              {m.capabilities?.support && <Badge>Support</Badge>}
              {m.capabilities?.automation && <Badge>Automation</Badge>}
              {m.capabilities?.integrations && <Badge>Integrations</Badge>}
              {(m.tags || []).map((t) => (
                <Badge key={t}>#{t}</Badge>
              ))}
            </div>
          </motion.li>
        ))}
      </ul>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm"
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
              className="relative w-full max-w-2xl rounded-2xl border border-border/80 bg-card p-6 text-card-foreground shadow-lg shadow-primary/10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute right-4 top-4 rounded-md bg-muted px-2 py-1 text-sm hover:bg-muted-foreground/20"
                onClick={() => setSelected(null)}
              >
                Close x
              </button>

              <h3 className="mb-2 text-xl font-semibold">{selected.name}</h3>
              <p className="mb-4 text-sm leading-6 text-muted-foreground">
                {selected.description}
              </p>

              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Category</div>
                  <div>{selected.category}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Delivery</div>
                  <div>{selected.delivery}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Starting Point</div>
                  <div>{formatPrice(selected.startingFromUSD)}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Support Plan</div>
                  <div>{formatPrice(selected.supportPlanUSD)}</div>
                </div>
              </div>

              <div className="mt-4 rounded-md border p-3 text-sm">
                <div className="mb-1 text-xs text-muted-foreground">
                  Typical Scope
                </div>
                <div>{selected.scope}</div>
              </div>

              <div className="mt-4 text-sm">
                <h4 className="mb-2 font-medium">What This Usually Includes</h4>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="w-32 shrink-0 text-muted-foreground">
                      includes:
                    </span>
                    <span>{selected.meta.includes}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 shrink-0 text-muted-foreground">
                      best for:
                    </span>
                    <span>{selected.meta.bestFor}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function ServicesPreviewSection() {
  return (
    <section className="relative overflow-hidden bg-background py-24 md:py-32">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(55%_55%_at_50%_0%,rgba(155,153,254,0.10),transparent_70%)]"
      />
      <div className="relative z-10 px-6">
        <AiModelsList models={serviceOffers} />
      </div>
    </section>
  );
}

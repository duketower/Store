import Link from "next/link";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import {
  engagementModels,
  groupedServiceOffers,
  technicalCapabilities,
  servicesFraming,
  servicesIntro,
  type ServiceOffer,
} from "@/content/services";
import { FinalCtaSection } from "@/components/ui/pulse-beams";

const serviceArchitectureItems = [
  ...groupedServiceOffers.map((group) => ({
    id: group.id,
    eyebrow: group.eyebrow,
    title: group.name,
    body: group.homepageSummary,
    href: `#${group.id}`,
    items: group.offers.map((service) => service.name),
  })),
  {
    id: "continuity",
    eyebrow: "Post-Launch Support",
    title: "Continuity",
    body:
      "Maintenance, updates, fixes, and smaller improvements after the main system is delivered.",
    href: "#continuity",
    items: ["Maintenance & Support"],
  },
];

const startingPointItems = [
  ...groupedServiceOffers.flatMap((group) =>
    group.offers.map((service) => ({
      label: service.name,
      value: formatStartingPoint(service),
      summary: service.scope,
      href: `#${service.id}`,
      kind: service.level === "primary" ? "Primary" : "Supporting",
    }))
  ),
  {
    label: "Maintenance & Support",
    value: "From $150/mo",
    summary:
      "Ongoing website management, operational updates, technical fixes, and smaller improvements after project delivery.",
    href: "#continuity",
    kind: "Continuity",
  },
];

export function ServicesPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <section className="relative overflow-hidden px-6 pb-20 pt-10 sm:pt-12 md:pb-28 md:pt-40">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(55%_55%_at_50%_0%,rgba(43,200,183,0.14),transparent_70%)]"
          />
          <div className="mx-auto max-w-6xl">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Services
              </p>
              <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
                {servicesIntro.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                {servicesIntro.body}
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 pb-12 pt-2 md:pb-20">
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.95fr_1.05fr]">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Approach
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                {servicesFraming.title}
              </h2>
            </div>
            <div className="rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
              <p className="text-sm leading-8 text-muted-foreground md:text-base">
                {servicesFraming.body}
              </p>
              <p className="mt-6 text-sm leading-8 text-muted-foreground md:text-base">
                The work usually starts with a core build, then expands into the
                supporting pieces that make it usable in practice: automation,
                launch setup, brand support, and continuity after launch.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-12 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Service Architecture
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Choose the layer you need, or combine them into one complete setup.
              </h2>
              <p className="mt-5 text-sm leading-8 text-muted-foreground md:text-base">
                The page is organized around the way projects usually come together:
                the main build, the automation layer, the launch setup, the brand
                presence, and the support that keeps it useful after launch.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {serviceArchitectureItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex min-h-64 flex-col rounded-[1.5rem] border border-border/80 bg-card/60 p-5 transition-colors hover:border-border hover:bg-card/80"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {item.eyebrow}
                  </p>
                  <h3 className="mt-4 text-xl font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-3 grow text-sm leading-7 text-muted-foreground">
                    {item.body}
                  </p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {item.items.map((service) => (
                      <li
                        key={service}
                        className="rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-medium text-foreground"
                      >
                        {service}
                      </li>
                    ))}
                  </ul>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {groupedServiceOffers.map((group) => (
          <section
            key={group.id}
            id={group.id}
            className="scroll-mt-32 px-6 py-10 md:py-12"
          >
            <div className="mx-auto max-w-6xl rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {group.eyebrow}
                </p>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  {group.name}
                </h2>
                <p className="mt-5 text-sm leading-8 text-muted-foreground md:text-base">
                  {group.description}
                </p>
              </div>

              <div className="mt-10 grid gap-6 md:grid-cols-2">
                {group.offers.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </div>
          </section>
        ))}

        <section id="continuity" className="scroll-mt-32 px-6 py-10 md:py-12">
          <div className="mx-auto grid max-w-6xl gap-6 rounded-[2rem] border border-border/80 bg-card/60 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Post-Launch Support
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Continuity keeps the setup useful after launch.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-muted-foreground md:text-base">
                Maintenance and support are available for clients who want regular
                updates, technical fixes, smaller refinements, and practical help
                after the main system is delivered.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-border/80 bg-background/80 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Starting Point
              </p>
              <p className="mt-4 text-3xl font-semibold text-foreground">From $150/mo</p>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Best suited for ongoing website management, operational updates,
                technical fixes, continuity support, and smaller improvements after
                project delivery.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Technical Capability
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Technical depth is built into the service, not bolted on afterward.
              </h2>
              <p className="mt-5 text-sm leading-8 text-muted-foreground md:text-base">
                The work can include reporting layers, workflow logic, dashboards,
                integrations, bots, alerts, launch infrastructure, and post-launch
                support where the business actually needs them.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {technicalCapabilities.map((capability) => (
                <div
                  key={capability.title}
                  className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5"
                >
                  <h3 className="text-lg font-semibold text-foreground">
                    {capability.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {capability.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Starting Points
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Pricing starts from clear entry points, then adjusts to the real scope.
              </h2>
              <p className="mt-5 text-sm leading-8 text-muted-foreground md:text-base">
                These are starting points, not forced packages. Supporting services
                are often bundled into broader setup projects when that is the cleaner
                path.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {startingPointItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-[1.5rem] border border-border/80 bg-card/60 p-5 transition-colors hover:border-border hover:bg-card/80"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {item.kind}
                  </p>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      {item.label}
                    </h3>
                    <p className="shrink-0 text-sm font-semibold text-foreground">
                      {item.value}
                    </p>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    {item.summary}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Ways to Work Together
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Clear service engagements, broader setup projects, and post-launch continuity.
              </h2>
              <p className="mt-5 text-sm leading-8 text-muted-foreground md:text-base">
                Not sure what the right setup looks like yet? That is exactly
                where a useful conversation begins.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {engagementModels.map((model, index) => (
                <div
                  key={model.title}
                  className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    0{index + 1}
                  </p>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {model.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {model.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FinalCtaSection />
      </main>
      <SiteFooter />
    </>
  );
}

function ServiceCard({ service }: { service: ServiceOffer }) {
  return (
    <article
      id={service.id}
      className="scroll-mt-32 rounded-[1.75rem] border border-border/80 bg-background/80 p-5 shadow-sm md:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-[75%]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {service.category}
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-foreground">
            {service.name}
          </h3>
        </div>
        <div className="rounded-full border border-border/80 bg-card/80 px-4 py-2 text-sm font-medium text-foreground">
          {formatStartingPoint(service)}
        </div>
      </div>

      <p className="mt-6 text-sm leading-7 text-muted-foreground md:text-base">
        {service.description}
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <DetailBlock label="Delivery" body={service.delivery} />
        <DetailBlock label="Best For" body={service.meta.bestFor} />
      </div>

      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Typical Scope
        </p>
        <p className="mt-3 text-sm leading-7 text-foreground/80">{service.scope}</p>
      </div>

      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          What This Usually Includes
        </p>
        <p className="mt-3 text-sm leading-7 text-foreground/80">
          {service.meta.includes}
        </p>
      </div>

      <details className="group mt-8 rounded-[1.25rem] border border-border/80 bg-card/60 p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
          <span>Technical details and integrations</span>
          <span className="text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45">
            +
          </span>
        </summary>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ListBlock label="Technical Scope" items={service.technicalScope} />
          <ListBlock label="Common System Elements" items={service.systemElements} />
        </div>

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Integration Examples
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {service.integrationExamples.map((item) => (
              <li
                key={item}
                className="rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <ul className="mt-8 flex flex-wrap gap-2">
          {service.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-border/80 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground"
            >
              #{tag}
            </li>
          ))}
        </ul>
      </details>
    </article>
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

function DetailBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-sm leading-7 text-foreground/80">{body}</p>
    </div>
  );
}

function ListBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-7 text-foreground/80">
            <span className="mt-[0.7rem] h-1.5 w-1.5 rounded-full bg-foreground/40" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

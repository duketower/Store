import Link from "next/link";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { publicContact } from "@/content/site";
import {
  engagementModels,
  pricingAnchors,
  serviceOffers,
  servicesFraming,
  servicesIntro,
} from "@/content/services";
import { Button } from "@/components/ui/button";
import { FinalCtaSection } from "@/components/ui/pulse-beams";

export function ServicesPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <section className="relative overflow-hidden px-6 pb-20 pt-32 md:pb-28 md:pt-40">
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

        <section className="px-6 pb-12 pt-2 md:pb-16">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-4">
            {pricingAnchors.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border/80 bg-card/70 px-5 py-5 shadow-sm"
              >
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                <p className="mt-3 text-xl font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 py-16 md:py-24">
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
                Business systems and POS-style work sit inside custom web app and
                automation capability, rather than being presented as a separate
                top-level service.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Service Categories
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                Four clear entry points, with room for broader custom work.
              </h2>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {serviceOffers.map((service) => (
                <article
                  key={service.id}
                  className="rounded-[2rem] border border-border/80 bg-card/60 p-6 shadow-sm md:p-8"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {service.category}
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold text-foreground">
                        {service.name}
                      </h3>
                    </div>
                    <div className="rounded-full border border-border/80 bg-background/80 px-4 py-2 text-sm font-medium text-foreground">
                      From ${service.startingFromUSD?.toLocaleString()}
                    </div>
                  </div>

                  <p className="mt-6 text-sm leading-7 text-muted-foreground md:text-base">
                    {service.description}
                  </p>

                  <div className="mt-8 grid gap-5 sm:grid-cols-2">
                    <DetailBlock label="Typical Scope" body={service.scope} />
                    <DetailBlock label="Best For" body={service.meta.bestFor} />
                  </div>

                  <div className="mt-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      What This Usually Includes
                    </p>
                    <p className="mt-3 text-sm leading-7 text-foreground/80">
                      {service.meta.includes}
                    </p>
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
                </article>
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
                Clear service engagements, custom solutions, and post-launch continuity.
              </h2>
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

        <section className="px-6 pb-16 pt-4 md:pb-24">
          <div className="mx-auto grid max-w-6xl gap-6 rounded-[2rem] border border-border/80 bg-card/60 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Support
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Maintenance stays available after launch, but it is not the main product.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-muted-foreground md:text-base">
                Support is offered as a post-launch continuity option for clients
                who want regular updates, maintenance, and technical help after
                the main system is delivered.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-border/80 bg-background/80 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Starting Point
              </p>
              <p className="mt-4 text-3xl font-semibold text-foreground">From $150/mo</p>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Best suited for ongoing website management, operational updates,
                technical fixes, and continuity after project delivery.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 pb-16 pt-4 md:pb-24">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Custom Scope
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Not sure what the right setup looks like yet?
              </h2>
              <p className="mt-5 text-sm leading-8 text-muted-foreground md:text-base">
                That is exactly where a useful conversation begins. We can help
                you define the system before you commit to the wrong build.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link href={publicContact.bookingHref}>Book a Call</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                <a href={`mailto:${publicContact.email}`}>Email Us</a>
              </Button>
            </div>
          </div>
        </section>

        <FinalCtaSection />
      </main>
      <SiteFooter />
    </>
  );
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

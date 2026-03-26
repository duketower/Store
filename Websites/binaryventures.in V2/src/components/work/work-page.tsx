import Link from "next/link";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { publicContact } from "@/content/site";
import {
  caseStudies,
  deliveryStandards,
  implementationPatterns,
  workCapabilities,
} from "@/content/work";
import { Button } from "@/components/ui/button";
import { FinalCtaSection } from "@/components/ui/pulse-beams";

export function WorkPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <section className="relative overflow-hidden px-6 pb-12 pt-10 sm:pt-12 md:pb-16 md:pt-40">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(55%_55%_at_50%_0%,rgba(155,153,254,0.14),transparent_70%)]"
          />
          <div className="mx-auto max-w-6xl">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Case Studies
              </p>
              <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
                Systems built around real operational needs.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                Our work spans websites, internal systems, bots, automation, and
                business infrastructure. Some projects are anonymized where client
                permission is limited, but the problems, solutions, and outcomes are real.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full rounded-full px-8 sm:w-auto">
                  <Link href={publicContact.bookingHref}>Book a Call</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full rounded-full px-8 sm:w-auto"
                >
                  <a href={`mailto:${publicContact.email}`}>Email Us</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-16 pt-6 md:pb-24 md:pt-10">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Selected Case Studies
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                Built around real business problems, not generic deliverables.
              </h2>
              <p className="mt-5 text-base leading-8 text-muted-foreground">
                Each project starts with a business requirement and ends with a
                system that is clearer, more useful, and easier to operate.
              </p>
            </div>

            <div className="mt-10 space-y-8 md:mt-12">
              {caseStudies.map((caseStudy) => (
                <article
                  key={caseStudy.title}
                  className="rounded-[2rem] border border-border/80 bg-card/60 p-6 shadow-sm md:p-8"
                >
                  <div className="flex flex-col gap-8 md:grid md:grid-cols-[1.1fr_0.9fr]">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {caseStudy.category}
                      </p>
                      <h3 className="mt-4 text-2xl font-semibold text-foreground md:text-3xl">
                        {caseStudy.title}
                      </h3>
                      <div className="mt-8 grid gap-6">
                        <InfoBlock label="Context" body={caseStudy.context} />
                        <InfoBlock label="Challenge" body={caseStudy.challenge} />
                      </div>
                    </div>

                    <div className="space-y-6 rounded-[1.5rem] border border-border/80 bg-background/80 p-6">
                      <InfoBlock label="Solution" body={caseStudy.solution} />
                      <InfoBlock
                        label="Technical Detail"
                        body={caseStudy.technicalDetail}
                      />
                      <InfoBlock label="Outcome" body={caseStudy.outcome} />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Workflow Highlights
                        </p>
                        <ul className="mt-4 space-y-3">
                          {caseStudy.workflowHighlights.map((item) => (
                            <li
                              key={item}
                              className="flex gap-3 text-sm leading-7 text-foreground/80"
                            >
                              <span className="mt-[0.7rem] h-1.5 w-1.5 rounded-full bg-foreground/40" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          System Elements
                        </p>
                        <ul className="mt-4 flex flex-wrap gap-2">
                          {caseStudy.systemElements.map((item) => (
                            <li
                              key={item}
                              className="rounded-full border border-border/80 bg-card/70 px-3 py-1.5 text-xs font-medium text-foreground"
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Capabilities
                        </p>
                        <ul className="mt-4 flex flex-wrap gap-2">
                          {caseStudy.capabilities.map((capability) => (
                            <li
                              key={capability}
                              className="rounded-full border border-border/80 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground"
                            >
                              {capability}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Technical Patterns
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                The technical layer usually sits underneath the visible outcome.
              </h2>
              <p className="mt-5 text-sm leading-8 text-muted-foreground md:text-base">
                Behind the website, dashboard, or bot, the real value often comes
                from reporting, workflow logic, role-based access, automation,
                and connected systems that make the business easier to run.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {implementationPatterns.map((pattern) => (
                <div
                  key={pattern.title}
                  className="rounded-[1.5rem] border border-border/80 bg-background/80 p-6"
                >
                  <h3 className="text-lg font-semibold text-foreground">
                    {pattern.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {pattern.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
              <div className="max-w-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Capability
                </p>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                  The work often sits between public-facing trust and internal execution.
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {workCapabilities.map((capability) => (
                  <div
                    key={capability.title}
                    className="rounded-[1.5rem] border border-border/80 bg-card/60 p-6"
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
          </div>
        </section>

        <section className="px-6 pb-16 pt-4 md:pb-24">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Delivery Standards
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Clear scope, direct communication, working systems.
              </h2>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {deliveryStandards.map((standard, index) => (
                <div
                  key={standard}
                  className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    0{index + 1}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-foreground/80">
                    {standard}
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

function InfoBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-sm leading-7 text-foreground/80 md:text-[0.95rem]">
        {body}
      </p>
    </div>
  );
}

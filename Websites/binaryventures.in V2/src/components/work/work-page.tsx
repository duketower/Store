import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  CalendarClock,
  CheckCircle2,
  Database,
  FileText,
  Gauge,
  Globe2,
  LayoutDashboard,
  LineChart,
  Send,
  ShieldCheck,
} from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { publicContact } from "@/content/site";
import {
  caseStudies,
  type CaseStudy,
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
                  <a href={publicContact.bookingHref}>Book a Call</a>
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
                <CaseStudyCard key={caseStudy.title} caseStudy={caseStudy} />
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

function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudy }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/60 shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <CaseStudyVisual caseStudy={caseStudy} />

        <div className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {caseStudy.category}
          </p>
          <h3 className="mt-4 text-2xl font-semibold text-foreground md:text-3xl">
            {caseStudy.title}
          </h3>
          <p className="mt-6 text-sm leading-7 text-muted-foreground md:text-[0.95rem]">
            {caseStudy.context}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.25rem] border border-border/80 bg-background/70 p-4">
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {caseStudy.metric}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {caseStudy.metricLabel}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-border/80 bg-background/70 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CalendarClock className="size-4 text-secondary" aria-hidden />
                {caseStudy.timeline}
              </p>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                Anonymized proof, shown without exposing private client data.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.25rem] border border-border/80 bg-background/70 p-4">
            <InfoBlock label="Outcome" body={caseStudy.outcome} />
          </div>

          <details className="group mt-5 rounded-[1.25rem] border border-border/80 bg-background/80 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
              <span>Technical and workflow detail</span>
              <span className="text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>

            <div className="mt-6 space-y-6">
              <InfoBlock label="Challenge" body={caseStudy.challenge} />
              <InfoBlock label="Solution" body={caseStudy.solution} />
              <InfoBlock label="Technical Detail" body={caseStudy.technicalDetail} />
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
                      <span className="mt-[0.7rem] h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <TagList label="System Elements" items={caseStudy.systemElements} />
              <TagList label="Capabilities" items={caseStudy.capabilities} accent />
            </div>
          </details>
        </div>
      </div>
    </article>
  );
}

function CaseStudyVisual({ caseStudy }: { caseStudy: CaseStudy }) {
  return (
    <div className="relative min-h-[26rem] overflow-hidden border-b border-border/80 bg-background/80 p-6 lg:border-b-0 lg:border-r md:p-8">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_0%,rgba(155,153,254,0.16),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(43,200,183,0.13),transparent_70%)] blur-3xl"
      />

      <div className="relative z-10 flex h-full min-h-[22rem] flex-col justify-between gap-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Proof Snapshot
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {caseStudy.title}
            </p>
          </div>
          <span className="rounded-full border border-border/80 bg-card/70 px-3 py-1.5 text-xs font-medium text-foreground">
            {caseStudy.metric}
          </span>
        </div>

        {caseStudy.visualKind === "operations" && <OperationsVisual />}
        {caseStudy.visualKind === "website" && <WebsiteVisual />}
        {caseStudy.visualKind === "institution" && <InstitutionVisual />}
        {caseStudy.visualKind === "automation" && <AutomationVisual />}

        <ul className="grid gap-2">
          {caseStudy.proofPoints.map((point) => (
            <li
              key={point}
              className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/55 px-3 py-2.5 text-xs leading-5 text-foreground/80"
            >
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-secondary" aria-hidden />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function OperationsVisual() {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/70 p-4 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <LayoutDashboard className="size-4 text-secondary" aria-hidden />
          Operations Dashboard
        </div>
        <span className="rounded-full bg-secondary/15 px-2 py-1 text-[0.68rem] font-medium text-secondary">
          Live
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          ["Sales", "82%", BarChart3],
          ["Stock", "1.2k", Database],
          ["Forecast", "+18%", LineChart],
        ].map(([label, value, Icon]) => (
          <div key={label as string} className="rounded-xl border border-border/70 bg-background/70 p-3">
            <Icon className="size-4 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-xl font-semibold text-foreground">{value as string}</p>
            <p className="mt-1 text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
              {label as string}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {[78, 48, 64].map((width, index) => (
          <div key={width} className="flex items-center gap-3">
            <span className="w-16 text-xs text-muted-foreground">Flow 0{index + 1}</span>
            <span className="h-2 flex-1 rounded-full bg-muted">
              <span
                className="block h-2 rounded-full bg-[linear-gradient(90deg,var(--primary),var(--secondary))]"
                style={{ width: `${width}%` }}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WebsiteVisual() {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/70 p-4 shadow-2xl shadow-black/20">
      <div className="rounded-xl border border-border/70 bg-background/80 p-3">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-red-400/70" />
          <span className="size-2 rounded-full bg-yellow-300/70" />
          <span className="size-2 rounded-full bg-green-400/70" />
          <span className="ml-3 h-2 flex-1 rounded-full bg-muted" />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Globe2 className="size-5 text-secondary" aria-hidden />
            <div className="mt-4 h-4 w-4/5 rounded-full bg-foreground/80" />
            <div className="mt-3 h-3 w-2/3 rounded-full bg-muted-foreground/40" />
            <div className="mt-5 h-9 w-28 rounded-full bg-white" />
          </div>
          <div className="space-y-2">
            {[0, 1, 2].map((item) => (
              <div key={item} className="rounded-lg border border-border/70 bg-card/80 p-3">
                <div className="h-2 w-2/3 rounded-full bg-muted-foreground/45" />
                <div className="mt-2 h-2 w-4/5 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[0.68rem] text-muted-foreground">
        <span>Structure</span>
        <span>Mobile</span>
        <span>Updates</span>
      </div>
    </div>
  );
}

function InstitutionVisual() {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/70 p-4 shadow-2xl shadow-black/20">
      <div className="grid gap-3 sm:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-xl border border-border/70 bg-background/70 p-3">
          <FileText className="size-5 text-secondary" aria-hidden />
          <div className="mt-5 space-y-2">
            {[72, 88, 54, 66].map((width) => (
              <div
                key={width}
                className="h-2 rounded-full bg-muted"
                style={{ width: `${width}%` }}
              />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/70 bg-background/70 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-foreground">Publishing Queue</span>
            <ShieldCheck className="size-4 text-secondary" aria-hidden />
          </div>
          <div className="mt-4 space-y-2">
            {["Content update", "Notice page", "Mobile pass"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg bg-card/70 px-3 py-2">
                <span className="text-xs text-foreground/80">{item}</span>
                <span className="size-2 rounded-full bg-secondary" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-border/70 bg-background/70 p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="size-4 text-secondary" aria-hidden />
          Maintained information architecture
        </div>
      </div>
    </div>
  );
}

function AutomationVisual() {
  const steps = [
    ["Input", Database],
    ["Bot", Bot],
    ["Alert", Bell],
    ["Send", Send],
  ] as const;

  return (
    <div className="rounded-2xl border border-border/80 bg-card/70 p-4 shadow-2xl shadow-black/20">
      <div className="grid grid-cols-4 gap-2">
        {steps.map(([label, Icon], index) => (
          <div key={label} className="relative rounded-xl border border-border/70 bg-background/70 p-3 text-center">
            <Icon className="mx-auto size-5 text-secondary" aria-hidden />
            <p className="mt-3 text-xs font-medium text-foreground">{label}</p>
            {index < steps.length - 1 && (
              <span
                aria-hidden
                className="absolute left-[calc(100%-0.15rem)] top-1/2 hidden h-px w-3 bg-border sm:block"
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-border/70 bg-background/70 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Gauge className="size-4 text-secondary" aria-hidden />
            Workflow Load
          </div>
          <span className="text-xs text-muted-foreground">Automated</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-muted">
          <span className="block h-2 w-[84%] rounded-full bg-[linear-gradient(90deg,var(--primary),var(--secondary))]" />
        </div>
      </div>
    </div>
  );
}

function TagList({
  label,
  items,
  accent = false,
}: {
  label: string;
  items: string[];
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className={`rounded-full border border-border/80 px-3 py-1.5 text-xs font-medium text-foreground ${
              accent ? "bg-secondary/50" : "bg-card/70"
            }`}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

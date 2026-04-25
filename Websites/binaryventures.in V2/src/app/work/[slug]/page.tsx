import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarClock, CheckCircle2 } from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Button } from "@/components/ui/button";
import { FinalCtaSection } from "@/components/ui/pulse-beams";
import { publicContact } from "@/content/site";
import { getServiceOfferById, getServicePath } from "@/content/services";
import { caseStudies, getCaseStudyBySlug } from "@/content/work";
import { buildMetadata, getBreadcrumbJsonLd, getWebPageJsonLd, siteConfig } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return caseStudies.map((caseStudy) => ({ slug: caseStudy.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);
  if (!caseStudy) return {};

  return buildMetadata({
    title: caseStudy.title,
    description: caseStudy.outcome,
    path: `/work/${caseStudy.slug}`,
    keywords: [
      caseStudy.title,
      caseStudy.category,
      ...caseStudy.capabilities,
      "case study",
      "Binary Ventures",
    ],
  });
}

export default async function WorkDetailPage({ params }: Props) {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);
  if (!caseStudy) notFound();

  const relatedServices = caseStudy.relatedServiceIds
    .map((serviceId) => getServiceOfferById(serviceId))
    .filter((service) => Boolean(service));

  const relatedCaseStudies = caseStudies
    .filter((item) => item.slug !== caseStudy.slug)
    .slice(0, 3);

  const jsonLd = JSON.stringify([
    getBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Case Studies", path: "/work" },
      { name: caseStudy.title, path: `/work/${caseStudy.slug}` },
    ]),
    getWebPageJsonLd({
      title: `${caseStudy.title} | Binary Ventures`,
      description: caseStudy.outcome,
      path: `/work/${caseStudy.slug}`,
    }),
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: caseStudy.title,
      description: caseStudy.outcome,
      url: `${siteConfig.baseUrl}/work/${caseStudy.slug}`,
      creator: {
        "@type": "Organization",
        name: siteConfig.name,
        url: siteConfig.baseUrl,
      },
      keywords: [...caseStudy.capabilities, ...caseStudy.systemElements].join(", "),
      about: caseStudy.category,
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <SiteHeader />
      <main className="bg-background">
        <section className="relative overflow-hidden px-6 pb-14 pt-10 sm:pt-12 md:pb-18 md:pt-40">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(55%_55%_at_50%_0%,rgba(155,153,254,0.14),transparent_70%)]"
          />
          <div className="mx-auto max-w-6xl">
            <Link
              href="/work"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All Case Studies
            </Link>

            <div className="mt-8 max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {caseStudy.category}
              </p>
              <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
                {caseStudy.title}
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                {caseStudy.context}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-border/80 bg-card/70 px-4 py-2 text-sm font-medium text-foreground">
                {caseStudy.metric} {caseStudy.metricLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-4 py-2 text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                {caseStudy.timeline}
              </span>
            </div>
          </div>
        </section>

        <section className="px-6 pb-12">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
              <SectionBlock label="Challenge" body={caseStudy.challenge} />
              <div className="mt-8">
                <SectionBlock label="Solution" body={caseStudy.solution} />
              </div>
              <div className="mt-8">
                <SectionBlock label="Outcome" body={caseStudy.outcome} />
              </div>
              <div className="mt-8">
                <SectionBlock label="Technical Detail" body={caseStudy.technicalDetail} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Workflow Highlights
                </p>
                <ul className="mt-5 space-y-3">
                  {caseStudy.workflowHighlights.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-7 text-foreground/80">
                      <CheckCircle2 className="mt-1.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <TagPanel label="System Elements" items={caseStudy.systemElements} />
              <TagPanel label="Capabilities" items={caseStudy.capabilities} accent />
            </div>
          </div>
        </section>

        {relatedServices.length > 0 ? (
          <section className="px-6 py-12 md:py-16">
            <div className="mx-auto max-w-6xl rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Related Services
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {relatedServices.map((service) =>
                  service ? (
                    <Link
                      key={service.id}
                      href={getServicePath(service.id)}
                      className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5 transition-colors hover:border-border hover:bg-card/80"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {service.category}
                      </p>
                      <h2 className="mt-4 text-lg font-semibold text-foreground">{service.name}</h2>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        {service.description}
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                        View service <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  ) : null
                )}
              </div>
            </div>
          </section>
        ) : null}

        {relatedCaseStudies.length > 0 ? (
          <section className="px-6 py-12 md:py-16">
            <div className="mx-auto max-w-6xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                More Work
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {relatedCaseStudies.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/work/${item.slug}`}
                    className="rounded-[1.5rem] border border-border/80 bg-card/60 p-5 transition-colors hover:border-border hover:bg-card/80"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {item.category}
                    </p>
                    <h2 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {item.outcome}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="px-6 pb-16 pt-4 md:pb-24">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Next Step
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                If you need a similar outcome, we can map the right build path quickly.
              </h2>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full rounded-full px-8 sm:w-auto">
                <a href={publicContact.bookingHref}>Book a Call</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full rounded-full px-8 sm:w-auto">
                <Link href="/services">View Services</Link>
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

function SectionBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-sm leading-7 text-foreground/80 md:text-[0.95rem]">{body}</p>
    </div>
  );
}

function TagPanel({
  label,
  items,
  accent = false,
}: {
  label: string;
  items: string[];
  accent?: boolean;
}) {
  return (
    <div className="rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <ul className="mt-5 flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className={`rounded-full border border-border/80 px-3 py-1.5 text-xs font-medium text-foreground ${
              accent ? "bg-secondary/50" : "bg-background/80"
            }`}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

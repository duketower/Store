import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { FinalCtaSection } from "@/components/ui/pulse-beams";
import { publicContact } from "@/content/site";
import {
  getAllIndexableServices,
  getServicePath,
} from "@/content/services";
import { caseStudies } from "@/content/work";
import { getAllArticles } from "@/lib/insights";
import { buildMetadata, getBreadcrumbJsonLd, getWebPageJsonLd, siteConfig } from "@/lib/seo";

type IndexableService = ReturnType<typeof getAllIndexableServices>[number];

interface Props {
  params: Promise<{ slug: string }>;
}

function getServiceBySlug(slug: string) {
  return getAllIndexableServices().find((service) => service.id === slug) ?? null;
}

function getServiceFaqs(service: IndexableService) {
  return [
    {
      question: `What is included in ${service.name.toLowerCase()}?`,
      answer: service.meta.includes,
    },
    {
      question: `What kind of business is ${service.name.toLowerCase()} best for?`,
      answer: service.meta.bestFor,
    },
    {
      question: `How is ${service.name.toLowerCase()} usually delivered?`,
      answer: `${service.delivery}. The scope is shaped around the business need rather than forced into a generic fixed package.`,
    },
  ];
}

function getServiceNarrative(service: IndexableService) {
  return {
    whenToConsider: `Businesses usually need ${service.name.toLowerCase()} when repeated work, unclear communication, disconnected tools, or manual follow-up start slowing down delivery, visibility, or growth.`,
    outcomeFocus: `${service.name} should leave the business with a setup that is easier to explain, easier to operate, and easier to improve over time instead of creating one more isolated tool.`,
    deliveryApproach: `The delivery usually starts by clarifying the real workflow, the people involved, and the practical decisions the system needs to support. From there, the scope is shaped around the business rather than around a generic package.`,
  };
}

function getRelatedInsights(service: IndexableService) {
  const tagMatches = new Set(service.tags.map((tag) => tag.toLowerCase()));

  return getAllArticles()
    .filter((article) => {
      const articleText = [
        article.category,
        article.title,
        article.description,
        article.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return [...tagMatches].some((tag) => articleText.includes(tag));
    })
    .slice(0, 3);
}

export function generateStaticParams() {
  return getAllIndexableServices().map((service) => ({ slug: service.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};

  return buildMetadata({
    title: service.name,
    description: service.description,
    path: getServicePath(service.id),
    keywords: [
      service.name,
      service.category,
      ...service.tags,
      "Binary Ventures services",
    ],
  });
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const faqs = getServiceFaqs(service);
  const narrative = getServiceNarrative(service);
  const relatedServices = getAllIndexableServices()
    .filter((item) => item.id !== service.id)
    .slice(0, 3);
  const relatedCaseStudies = caseStudies
    .filter((caseStudy) => caseStudy.relatedServiceIds.includes(service.id))
    .slice(0, 3);
  const relatedInsights = getRelatedInsights(service);

  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: service.name, path: getServicePath(service.id) },
  ]);

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    serviceType: service.category,
    description: service.description,
    url: `${siteConfig.baseUrl}${getServicePath(service.id)}`,
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.baseUrl,
    },
    areaServed: publicContact.locations.map((location) => ({
      "@type": "Place",
      name: location.label,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const webPageJsonLd = getWebPageJsonLd({
    title: `${service.name} | Binary Ventures`,
    description: service.description,
    path: getServicePath(service.id),
  });

  const jsonLd = JSON.stringify([breadcrumbJsonLd, webPageJsonLd, serviceJsonLd, faqJsonLd]);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <SiteHeader />
      <main className="bg-background">
        <section className="relative overflow-hidden px-6 pb-16 pt-10 sm:pt-12 md:pb-20 md:pt-40">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(55%_55%_at_50%_0%,rgba(43,200,183,0.14),transparent_70%)]"
          />
          <div className="mx-auto max-w-6xl">
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All Services
            </Link>
            <div className="mt-8 max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {service.category}
              </p>
              <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
                {service.name}
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                {service.description}
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-border/80 bg-card/70 px-4 py-2 text-sm font-medium text-foreground">
                {formatStartingPoint(service)}
              </span>
              <span className="rounded-full border border-border/80 bg-card/70 px-4 py-2 text-sm text-muted-foreground">
                {service.delivery}
              </span>
            </div>
          </div>
        </section>

        <section className="px-6 pb-12">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Typical Scope
              </p>
              <p className="mt-5 text-sm leading-8 text-muted-foreground md:text-base">
                {service.scope}
              </p>

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <ListBlock label="Technical Scope" items={service.technicalScope} />
                <ListBlock label="Common System Elements" items={service.systemElements} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Best Fit
              </p>
              <p className="mt-5 text-sm leading-8 text-muted-foreground md:text-base">
                {service.meta.bestFor}
              </p>

              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Usually Includes
              </p>
              <p className="mt-3 text-sm leading-8 text-muted-foreground md:text-base">
                {service.meta.includes}
              </p>

              <div className="mt-8 flex flex-col gap-3">
                <a
                  href={publicContact.bookingHref}
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Book a Call
                </a>
                <a
                  href={`mailto:${publicContact.email}`}
                  className="inline-flex items-center justify-center rounded-full border border-border/80 px-5 py-3 text-sm font-semibold text-foreground"
                >
                  Email Us
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-12 md:py-16">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
            <NarrativeCard
              label="When Businesses Need This"
              body={narrative.whenToConsider}
            />
            <NarrativeCard
              label="How Delivery Usually Starts"
              body={narrative.deliveryApproach}
            />
            <NarrativeCard
              label="What Good Outcomes Look Like"
              body={narrative.outcomeFocus}
            />
          </div>
        </section>

        <section className="px-6 py-12 md:py-16">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Integration Examples
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {service.integrationExamples.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-2">
              {service.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border/80 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-12 md:py-16">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Delivery Notes
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                The build matters, but the operating fit matters more.
              </h2>
              <p className="mt-5 text-sm leading-8 text-muted-foreground md:text-base">
                For most businesses, the real value in {service.name.toLowerCase()} comes from
                how it fits into the surrounding workflow: who uses it, what
                happens before it, what happens after it, and what information
                needs to move cleanly through the business.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Connected Systems
                </p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {service.name} is often delivered alongside forms, routing,
                  inboxes, dashboards, reporting flows, or post-launch support
                  rather than as a disconnected standalone output.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Scope Principle
                </p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  The cleanest project is usually the one that solves the real
                  operational problem with the fewest awkward handoffs, not the
                  one that maximizes feature count.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-12 md:py-16">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              FAQs
            </p>
            <div className="mt-8 grid gap-4">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5"
                >
                  <h2 className="text-lg font-semibold text-foreground">{faq.question}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {relatedInsights.length > 0 ? (
          <section className="px-6 py-12 md:py-16">
            <div className="mx-auto max-w-6xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Related Insights
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {relatedInsights.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/insights/${article.slug}`}
                    className="rounded-[1.5rem] border border-border/80 bg-card/60 p-5 transition-colors hover:border-border hover:bg-card/80"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {article.category}
                    </p>
                    <h2 className="mt-4 text-lg font-semibold text-foreground">
                      {article.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {article.description}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                      Read insight <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {relatedCaseStudies.length > 0 ? (
          <section className="px-6 py-12 md:py-16">
            <div className="mx-auto max-w-6xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Related Case Studies
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {relatedCaseStudies.map((caseStudy) => (
                  <Link
                    key={caseStudy.slug}
                    href={`/work/${caseStudy.slug}`}
                    className="rounded-[1.5rem] border border-border/80 bg-card/60 p-5 transition-colors hover:border-border hover:bg-card/80"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {caseStudy.category}
                    </p>
                    <h2 className="mt-4 text-lg font-semibold text-foreground">
                      {caseStudy.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {caseStudy.outcome}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                      Read case study <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {relatedServices.length > 0 ? (
          <section className="px-6 py-12 md:py-16">
            <div className="mx-auto max-w-6xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Related Services
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {relatedServices.map((item) => (
                  <Link
                    key={item.id}
                    href={getServicePath(item.id)}
                    className="rounded-[1.5rem] border border-border/80 bg-card/60 p-5 transition-colors hover:border-border hover:bg-card/80"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {item.category}
                    </p>
                    <h2 className="mt-4 text-lg font-semibold text-foreground">{item.name}</h2>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {item.description}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                      View service <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <FinalCtaSection />
      </main>
      <SiteFooter />
    </>
  );
}

function formatStartingPoint(service: IndexableService) {
  if ("startingLabel" in service && service.startingLabel) {
    return service.startingLabel;
  }

  if ("startingFromUSD" in service && typeof service.startingFromUSD === "number") {
    return `From $${service.startingFromUSD.toLocaleString()}`;
  }

  return "Custom scope";
}

function ListBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-7 text-foreground/80">
            <CheckCircle2 className="mt-1.5 h-4 w-4 shrink-0 text-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NarrativeCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border/80 bg-card/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">{body}</p>
    </div>
  );
}

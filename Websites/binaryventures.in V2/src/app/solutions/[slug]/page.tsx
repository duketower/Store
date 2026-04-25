import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { FinalCtaSection } from "@/components/ui/pulse-beams";
import { publicContact } from "@/content/site";
import { getArticleBySlug, getAllArticles } from "@/lib/insights";
import { getServiceOfferById, getServicePath } from "@/content/services";
import { caseStudies, getCaseStudyBySlug } from "@/content/work";
import {
  getSupportingPageBySlug,
  getSupportingPagePath,
  supportingPages,
} from "@/content/supporting-pages";
import { buildMetadata, getBreadcrumbJsonLd, getWebPageJsonLd, siteConfig } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return supportingPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getSupportingPageBySlug(slug);
  if (!page) return {};

  return buildMetadata({
    title: page.title,
    description: page.description,
    path: getSupportingPagePath(page.slug),
    keywords: [page.title, ...page.relatedServiceIds, ...page.relatedArticleSlugs],
  });
}

export default async function SupportingPageDetail({ params }: Props) {
  const { slug } = await params;
  const page = getSupportingPageBySlug(slug);
  if (!page) notFound();

  const relatedServices = page.relatedServiceIds
    .map((serviceId) => getServiceOfferById(serviceId))
    .filter((service) => Boolean(service));

  const relatedArticles = getAllArticles().filter((article) =>
    page.relatedArticleSlugs.includes(article.slug)
  );

  const relatedCaseStudies = page.relatedCaseStudySlugs
    .map((caseStudySlug) => getCaseStudyBySlug(caseStudySlug))
    .filter((caseStudy) => Boolean(caseStudy));

  const jsonLd = JSON.stringify([
    getBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Use Cases", path: "/solutions" },
      { name: page.title, path: getSupportingPagePath(page.slug) },
    ]),
    getWebPageJsonLd({
      title: `${page.title} | Binary Ventures`,
      description: page.description,
      path: getSupportingPagePath(page.slug),
    }),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      description: page.description,
      url: `${siteConfig.baseUrl}${getSupportingPagePath(page.slug)}`,
      about: page.intent,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
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
        <section className="relative overflow-hidden px-6 pb-16 pt-10 sm:pt-12 md:pb-20 md:pt-40">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(55%_55%_at_50%_0%,rgba(155,153,254,0.14),transparent_70%)]"
          />
          <div className="mx-auto max-w-6xl">
            <Link
              href="/solutions"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All Use Cases
            </Link>
            <div className="mt-8 max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {page.eyebrow}
              </p>
              <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
                {page.title}
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                {page.intro}
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 pb-12">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
              <SectionList label="When This Is Usually Relevant" items={page.whenRelevant} />
            </div>
            <div className="rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Intent
              </p>
              <p className="mt-5 text-sm leading-8 text-muted-foreground md:text-base">
                {page.intent}
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
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
            <PanelList label="What It Usually Includes" items={page.whatItUsuallyIncludes} />
            <PanelList label="Why It Matters" items={page.whyItMatters} />
          </div>
        </section>

        <section className="px-6 py-12 md:py-16">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              FAQs
            </p>
            <div className="mt-8 grid gap-4">
              {page.faqs.map((faq) => (
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

        {relatedServices.length > 0 ? (
          <section className="px-6 py-12 md:py-16">
            <div className="mx-auto max-w-6xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Related Services
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {relatedServices.map((service) =>
                  service ? (
                    <Link
                      key={service.id}
                      href={getServicePath(service.id)}
                      className="rounded-[1.5rem] border border-border/80 bg-card/60 p-5 transition-colors hover:border-border hover:bg-card/80"
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
                Related Case Studies
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {relatedCaseStudies.map((caseStudy) =>
                  caseStudy ? (
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
                    </Link>
                  ) : null
                )}
              </div>
            </div>
          </section>
        ) : null}

        {relatedArticles.length > 0 ? (
          <section className="px-6 py-12 md:py-16">
            <div className="mx-auto max-w-6xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Related Insights
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {relatedArticles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/insights/${article.slug}`}
                    className="rounded-[1.5rem] border border-border/80 bg-card/60 p-5 transition-colors hover:border-border hover:bg-card/80"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {article.category}
                    </p>
                    <h2 className="mt-4 text-lg font-semibold text-foreground">{article.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {article.description}
                    </p>
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

function SectionList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <ul className="mt-5 space-y-3">
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

function PanelList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
      <SectionList label={label} items={items} />
    </div>
  );
}

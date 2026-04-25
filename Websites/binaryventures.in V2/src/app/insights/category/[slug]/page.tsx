import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";

import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { FinalCtaSection } from "@/components/ui/pulse-beams";
import {
  categoryToSlug,
  getArticlesByCategory,
  getCategoryBySlug,
  insightCategories,
} from "@/lib/insights";
import { buildMetadata, getBreadcrumbJsonLd, getWebPageJsonLd } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return insightCategories.map((category) => ({ slug: categoryToSlug(category) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};

  const title = `${category} Insights`;
  const description = `Practical ${category.toLowerCase()} articles, guides, and how-tos from Binary Ventures for business owners and operators.`;

  return buildMetadata({
    title,
    description,
    path: `/insights/category/${slug}`,
    keywords: [category, "business technology insights", "how-to articles"],
  });
}

export default async function InsightCategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const articles = getArticlesByCategory(category);
  const description = `Practical ${category.toLowerCase()} articles, guides, and how-tos from Binary Ventures for business owners and operators.`;
  const jsonLd = JSON.stringify([
    getWebPageJsonLd({
      title: `${category} Insights | Binary Ventures`,
      description,
      path: `/insights/category/${slug}`,
    }),
    getBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Insights", path: "/insights" },
      { name: category, path: `/insights/category/${slug}` },
    ]),
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
        <section className="relative overflow-hidden px-6 pb-12 pt-10 sm:pt-12 md:pb-16 md:pt-40">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(55%_55%_at_50%_0%,rgba(43,200,183,0.13),transparent_70%)]"
          />
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <Link
                href="/insights"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                All Insights
              </Link>
              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {category}
              </p>
              <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
                {category} articles.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                Practical guides and notes from Binary Ventures, grouped for quicker reading.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-border/50 px-6 pb-4">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/insights"
                className="rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                All
              </Link>
              {insightCategories.map((item) => {
                const itemSlug = categoryToSlug(item);
                const isActive = itemSlug === slug;

                return (
                  <Link
                    key={item}
                    href={`/insights/category/${itemSlug}`}
                    aria-current={isActive ? "page" : undefined}
                    className={
                      isActive
                        ? "rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        : "rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                    }
                  >
                    {item}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-6 py-12 md:py-16">
          <div className="mx-auto max-w-6xl">
            {articles.length === 0 ? (
              <div className="rounded-xl border border-border/50 bg-card p-6">
                <p className="text-sm text-muted-foreground">
                  No published articles in this category yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/insights/${article.slug}`}
                    className="group flex flex-col rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-border"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
                        {article.category}
                      </span>
                      {article.market && <span>{article.market}</span>}
                    </div>
                    <h2 className="mt-3 flex-1 text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                      {article.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {article.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.readingTime} min read
                      </span>
                      <span className="inline-flex items-center gap-1 text-primary">
                        Read <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <FinalCtaSection />
      </main>
      <SiteFooter />
    </>
  );
}

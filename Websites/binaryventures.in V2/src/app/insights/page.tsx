import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { FinalCtaSection } from "@/components/ui/pulse-beams";
import { getAllArticles } from "@/lib/insights";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Guides, how-tos, and business technology articles from Binary Ventures — practical reading for business owners and operators in India.",
  openGraph: {
    title: "Insights — Binary Ventures",
    description:
      "Guides, how-tos, and business technology articles from Binary Ventures.",
    url: "https://binaryventures.in/insights",
  },
};

const CATEGORIES = [
  "All",
  "Guides",
  "Websites",
  "Web Apps",
  "Automation",
  "AI Chatbots",
  "Business Systems",
  "SEO & Growth",
  "Local Business",
];

export default function InsightsPage() {
  const articles = getAllArticles();
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-12 pt-10 sm:pt-12 md:pb-16 md:pt-40">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(55%_55%_at_50%_0%,rgba(155,153,254,0.14),transparent_70%)]"
          />
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Insights
              </p>
              <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
                Practical reads for business owners.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                Guides, how-tos, and business technology articles — written for
                operators, not developers.
              </p>
            </div>
          </div>
        </section>

        {/* Category links */}
        <section className="border-b border-border/50 px-6 pb-4">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground cursor-pointer"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </section>

        {articles.length === 0 ? (
          <section className="px-6 py-24 text-center">
            <p className="text-muted-foreground">No articles published yet. Check back soon.</p>
          </section>
        ) : (
          <>
            {/* Featured article */}
            {featured && (
              <section className="px-6 py-12 md:py-16">
                <div className="mx-auto max-w-6xl">
                  <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Featured
                  </p>
                  <Link
                    href={`/insights/${featured.slug}`}
                    className="group block rounded-2xl border border-border/50 bg-card p-6 transition-colors hover:border-border md:p-10"
                  >
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {featured.category}
                      </span>
                      {featured.market && (
                        <span>{featured.market}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {featured.readingTime} min read
                      </span>
                      <span>{featured.date}</span>
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary md:text-3xl">
                      {featured.title}
                    </h2>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                      {featured.description}
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary">
                      Read article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                </div>
              </section>
            )}

            {/* Article grid */}
            {rest.length > 0 && (
              <section className="px-6 pb-16">
                <div className="mx-auto max-w-6xl">
                  <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Latest
                  </p>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {rest.map((article) => (
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
                        <h3 className="mt-3 flex-1 text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                          {article.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {article.description}
                        </p>
                        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {article.readingTime} min read
                          </span>
                          <span>{article.date}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        <FinalCtaSection />
      </main>
      <SiteFooter />
    </>
  );
}

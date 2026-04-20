import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, Tag } from "lucide-react";

import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { FinalCtaSection } from "@/components/ui/pulse-beams";
import {
  getAllArticles,
  getArticleBySlug,
} from "@/lib/insights";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.description,
    authors: [{ name: article.author }],
    keywords: article.tags,
    alternates: { canonical: article.canonical },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      url: article.canonical,
      publishedTime: article.date,
      modifiedTime: article.updated,
      authors: [article.author],
      tags: article.tags,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const allArticles = getAllArticles();
  const related = allArticles
    .filter((a) => a.slug !== slug && a.category === article.category)
    .slice(0, 3);

  // JSON-LD is constructed entirely from our own data — no user input.
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    author: { "@type": "Organization", name: article.author },
    datePublished: article.date,
    dateModified: article.updated,
    url: article.canonical,
    publisher: {
      "@type": "Organization",
      name: "Binary Ventures",
      url: "https://binaryventures.in",
    },
    keywords: article.tags.join(", "),
    articleSection: article.category,
    inLanguage: "en-IN",
  });

  return (
    <>
      {/* JSON-LD from controlled internal data only */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <SiteHeader />
      <main className="bg-background">
        {/* Article header */}
        <section className="relative overflow-hidden px-6 pb-10 pt-10 sm:pt-12 md:pt-40">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(50%_50%_at_50%_0%,rgba(155,153,254,0.12),transparent_70%)]"
          />
          <div className="mx-auto max-w-3xl">
            <Link
              href="/insights"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All Insights
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
                {article.category}
              </span>
              {article.market && <span>{article.market}</span>}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.readingTime} min read
              </span>
            </div>

            <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {article.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
              {article.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border/50 pt-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Published {article.date}
              </span>
              {article.updated !== article.date && (
                <span>Updated {article.updated}</span>
              )}
              <span>{article.author}</span>
            </div>
          </div>
        </section>

        {/* Article body */}
        <section className="px-6 pb-16">
          <div className="mx-auto max-w-3xl">
            <div
              className="article-content"
              // Content is parsed from repo-controlled Markdown via remark-html.
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border/50 pt-6">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border/60 px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Related articles */}
        {related.length > 0 && (
          <section className="border-t border-border/50 px-6 py-12">
            <div className="mx-auto max-w-6xl">
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Related Insights
              </p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((a) => (
                  <Link
                    key={a.slug}
                    href={`/insights/${a.slug}`}
                    className="group flex flex-col rounded-xl border border-border/50 bg-card p-5 transition-colors hover:border-border"
                  >
                    <span className="text-xs font-medium text-primary">
                      {a.category}
                    </span>
                    <h3 className="mt-2 flex-1 text-sm font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
                      {a.title}
                    </h3>
                    <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {a.readingTime} min read
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <FinalCtaSection />
      </main>
      <SiteFooter />
    </>
  );
}

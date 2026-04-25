import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { FinalCtaSection } from "@/components/ui/pulse-beams";
import { supportingPages, getSupportingPagePath } from "@/content/supporting-pages";
import { buildMetadata, getBreadcrumbJsonLd, getWebPageJsonLd } from "@/lib/seo";

const description =
  "High-intent buyer pages around common business problems like website maintenance, dashboard development, lead follow-up automation, and website cost.";

export const metadata: Metadata = buildMetadata({
  title: "Use Cases",
  description,
  path: "/solutions",
  keywords: [
    "website maintenance",
    "custom dashboard development",
    "lead follow-up automation",
    "business website cost",
  ],
});

export default function SolutionsPage() {
  const jsonLd = JSON.stringify([
    getWebPageJsonLd({
      title: "Use Cases | Binary Ventures",
      description,
      path: "/solutions",
    }),
    getBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Use Cases", path: "/solutions" },
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
        <section className="relative overflow-hidden px-6 pb-16 pt-10 sm:pt-12 md:pb-20 md:pt-40">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(55%_55%_at_50%_0%,rgba(43,200,183,0.14),transparent_70%)]"
          />
          <div className="mx-auto max-w-6xl">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Use Cases
              </p>
              <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
                Supporting pages built around real buyer problems.
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                These pages are for businesses comparing practical next steps:
                keeping a website current, building operational visibility,
                improving follow-up, or understanding what a website should cost.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 pb-16 md:pb-24">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 xl:grid-cols-4">
            {supportingPages.map((page) => (
              <Link
                key={page.slug}
                href={getSupportingPagePath(page.slug)}
                className="rounded-[1.5rem] border border-border/80 bg-card/60 p-5 transition-colors hover:border-border hover:bg-card/80"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {page.eyebrow}
                </p>
                <h2 className="mt-4 text-xl font-semibold text-foreground">{page.title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {page.description}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                  Open page <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <FinalCtaSection />
      </main>
      <SiteFooter />
    </>
  );
}

import Link from "next/link";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import {
  contactIntro,
  contactOptions,
  contactPrompts,
  responseExpectations,
} from "@/content/contact";
import { publicContact } from "@/content/site";
import { Button } from "@/components/ui/button";

export function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <section className="relative overflow-hidden px-6 pb-20 pt-10 sm:pt-12 md:pb-28 md:pt-40">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(55%_55%_at_50%_0%,rgba(43,200,183,0.12),transparent_70%)]"
          />
          <div className="mx-auto max-w-6xl">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Contact
              </p>
              <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
                {contactIntro.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                {contactIntro.body}
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
            {contactOptions.map((option) => (
              <div
                key={option.title}
                className="rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {option.title}
                </p>
                <p className="mt-5 text-sm leading-8 text-muted-foreground md:text-base">
                  {option.body}
                </p>
                <div className="mt-8">
                  {option.variant === "primary" ? (
                    <Button asChild size="lg" className="w-full rounded-full px-8 sm:w-auto">
                      <Link href={option.actionHref}>{option.actionLabel}</Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="w-full rounded-full px-8 sm:w-auto"
                    >
                      <a href={option.actionHref}>{option.actionLabel}</a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Locations
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Public contact details for both operating locations.
              </h2>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {publicContact.locations.map((location) => (
                <div
                  key={location.label}
                  className="rounded-[1.5rem] border border-border/80 bg-background/80 p-6"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {location.label}
                  </p>
                  <div className="mt-5 space-y-3 text-sm leading-7 text-foreground/80">
                    <p>{location.addressLine}</p>
                    <p>{location.postalCode}</p>
                    <p>{location.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Helpful Context
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                A short brief makes the first conversation much more useful.
              </h2>
              <ul className="mt-8 space-y-4">
                {contactPrompts.map((prompt, index) => (
                  <li
                    key={prompt}
                    className="rounded-[1.5rem] border border-border/80 bg-background/80 px-5 py-4 text-sm leading-7 text-foreground/80"
                  >
                    <span className="mr-3 text-muted-foreground">0{index + 1}</span>
                    {prompt}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[2rem] border border-border/80 bg-card/60 p-6 md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Typical Enquiries
              </p>
              <div className="mt-8 grid gap-4">
                {responseExpectations.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5"
                  >
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {item.body}
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
                Direct Contact
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                For serious project conversations, email us directly.
              </h2>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full rounded-full px-8 sm:w-auto">
                <a href={`mailto:${publicContact.email}`}>{publicContact.email}</a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full rounded-full px-8 sm:w-auto"
              >
                <Link href="/services">View Services</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

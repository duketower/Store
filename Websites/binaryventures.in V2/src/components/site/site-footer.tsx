import Link from "next/link";

import { siteNavigation, publicContact } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80 bg-background">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-12 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Binary Ventures
            </p>
            <h2 className="mt-3 max-w-xl text-2xl font-semibold text-foreground md:text-3xl">
              Websites, systems, bots, and automation built to support real business operations.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground">
            Founder-led, direct, and built around practical implementation for clients
            across India, Australia, the US, and beyond.
          </p>
          <a
            href={`mailto:${publicContact.email}`}
            className="inline-flex text-sm font-medium text-foreground underline underline-offset-4"
          >
            {publicContact.email}
          </a>
        </div>

        <div className="grid gap-10 sm:grid-cols-2">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Navigate
            </p>
            <ul className="space-y-3 text-sm text-foreground">
              {siteNavigation.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="transition-opacity hover:opacity-70">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Locations
            </p>
            <div className="space-y-5 text-sm text-muted-foreground">
              {publicContact.locations.map((location) => (
                <div key={location.label} className="space-y-1.5">
                  <p className="font-medium text-foreground">{location.label}</p>
                  <p>{location.addressLine}</p>
                  <p>{location.postalCode}</p>
                  <p>{location.phone}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

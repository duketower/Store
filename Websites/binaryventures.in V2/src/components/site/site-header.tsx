'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { ArrowRight, Menu, X } from "lucide-react";

import { siteNavigation, publicContact } from "@/content/site";
import { groupedServiceOffers } from "@/content/services";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  className?: string;
};

const servicesDropdownGroups = [
  ...groupedServiceOffers.map((group) => ({
    title: group.name,
    description: group.homepageSummary,
    items: group.offers.map((service) => ({
      title: service.name,
      href: `/services#${service.id}`,
    })),
  })),
];

const continuityDropdownItem = {
  title: "Maintenance & Support",
  href: "/services#continuity",
  description: "Continuity, updates, fixes, and technical support after launch.",
};

export function SiteHeader({ className }: SiteHeaderProps) {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const pathname = usePathname();

  const isActiveLink = React.useCallback(
    (href: string) => {
      if (href === "/") {
        return pathname === "/";
      }

      return pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname]
  );

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    setMenuState(false);
  }, [pathname]);

  return (
    <header className={className}>
      <nav
        data-state={menuState ? "active" : "inactive"}
        className="group fixed z-20 w-full px-2"
      >
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-4 transition-all duration-300 sm:px-6 lg:px-12",
            isScrolled &&
              "max-w-4xl rounded-2xl border bg-background/70 backdrop-blur-lg lg:px-5"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link href="/" aria-label="Binary Ventures home" className="flex items-center">
                <SiteLogo />
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="m-auto size-6 duration-200 group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0" />
                <X className="absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200 group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100" />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex items-center gap-8 text-sm">
                {siteNavigation.map((item) => (
                  <li key={item.name}>
                    {item.name === "Services" ? (
                      <NavigationMenu>
                        <NavigationMenuList>
                          <NavigationMenuItem>
                            <NavigationMenuTrigger
                              className={cn(
                                "h-11 rounded-full bg-transparent px-3 py-2 text-sm font-medium transition-colors duration-150 hover:bg-white/[0.04] focus:outline-none data-[state=open]:bg-white/[0.06]",
                                isActiveLink(item.href)
                                  ? "text-foreground"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {item.name}
                            </NavigationMenuTrigger>
                            <NavigationMenuContent className="p-0">
                              <div className="w-[min(980px,calc(100vw-2rem))]">
                                <div className="grid divide-y divide-white/[0.07] lg:grid-cols-4 lg:divide-x lg:divide-y-0">
                                  {servicesDropdownGroups.map((group) => (
                                    <div key={group.title} className="flex min-w-0 flex-col gap-5 p-5">
                                      <div className="space-y-2 border-b border-white/[0.07] pb-4">
                                        <h3 className="text-base font-semibold leading-6 text-foreground">
                                          {group.title}
                                        </h3>
                                        <p className="text-xs leading-5 text-muted-foreground">
                                          {group.description}
                                        </p>
                                      </div>
                                      <div className="relative space-y-1 rounded-xl bg-white/[0.025] py-1 pl-3 pr-1 before:absolute before:bottom-2 before:left-0 before:top-2 before:w-px before:bg-gradient-to-b before:from-secondary/70 before:to-white/[0.06]">
                                        {group.items.map((service) => (
                                          <NavigationMenuLink key={service.title} asChild>
                                            <Link
                                              href={service.href}
                                              className="group/link flex min-h-10 items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                            >
                                              <span>{service.title}</span>
                                              <ArrowRight className="size-3.5 shrink-0 translate-x-0 opacity-45 transition duration-200 group-hover/link:translate-x-0.5 group-hover/link:opacity-100" />
                                            </Link>
                                          </NavigationMenuLink>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="border-t border-white/[0.07] bg-white/[0.025] p-3">
                                  <div className="grid gap-2 lg:grid-cols-[1fr_13rem]">
                                    <NavigationMenuLink asChild>
                                      <Link
                                        href={continuityDropdownItem.href}
                                        className="group/link flex min-h-14 items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                      >
                                        <span className="min-w-0">
                                          <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
                                            Continuity
                                          </span>
                                          <span className="mt-1 block font-medium text-foreground">
                                            {continuityDropdownItem.title}
                                          </span>
                                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                                            {continuityDropdownItem.description}
                                          </span>
                                        </span>
                                        <ArrowRight className="size-3.5 shrink-0 opacity-60 transition duration-200 group-hover/link:translate-x-0.5 group-hover/link:opacity-100" />
                                      </Link>
                                    </NavigationMenuLink>
                                    <NavigationMenuLink asChild>
                                      <Link
                                        href="/services"
                                        className="group/link flex min-h-14 items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                      >
                                        <span>View all services</span>
                                        <ArrowRight className="size-3.5 shrink-0 transition duration-200 group-hover/link:translate-x-0.5" />
                                      </Link>
                                    </NavigationMenuLink>
                                  </div>
                                </div>
                              </div>
                            </NavigationMenuContent>
                          </NavigationMenuItem>
                        </NavigationMenuList>
                      </NavigationMenu>
                    ) : (
                      <Link
                        href={item.href}
                        aria-current={isActiveLink(item.href) ? "page" : undefined}
                        className={cn(
                          "relative inline-flex h-11 items-center px-1 text-sm font-medium transition-colors duration-150",
                          isActiveLink(item.href)
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span className="relative">
                          {item.name}
                          <span
                            aria-hidden="true"
                            className={cn(
                              "absolute left-1/2 top-[calc(100%+0.45rem)] h-px -translate-x-1/2 rounded-full bg-border transition-all duration-200",
                              isActiveLink(item.href) ? "w-[calc(100%+1rem)] opacity-100" : "w-0 opacity-0"
                            )}
                          />
                        </span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border bg-background p-6 shadow-2xl shadow-zinc-300/20 group-data-[state=active]:block md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:group-data-[state=active]:flex dark:shadow-none">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {siteNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        aria-current={isActiveLink(item.href) ? "page" : undefined}
                        className={cn(
                          "inline-flex min-h-11 items-center rounded-full px-5 py-2 text-base transition-[color,background-color,border-color] duration-150",
                          isActiveLink(item.href)
                            ? "bg-white/60 text-foreground"
                            : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                        )}
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className={cn("h-12 px-5", isScrolled && "lg:hidden")}
                >
                  <a href={`mailto:${publicContact.email}`}>
                    <span>Email Us</span>
                  </a>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className={cn("h-12 px-5", isScrolled && "lg:hidden")}
                >
                  <Link href={publicContact.bookingHref}>
                    <span>Book a Call</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className={cn("h-12 px-5", isScrolled ? "lg:inline-flex" : "hidden")}
                >
                  <Link href={publicContact.bookingHref}>
                    <span>Book a Call</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div aria-hidden className="h-24 sm:h-28 lg:hidden" />
    </header>
  );
}

export function SiteLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="inline-flex size-2.5 rounded-full bg-[linear-gradient(135deg,#9B99FE_0%,#2BC8B7_100%)]" />
      <span className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
        Binary Ventures
      </span>
    </div>
  );
}

'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Menu, X } from "lucide-react";

import { siteNavigation, publicContact } from "@/content/site";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  className?: string;
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

  return (
    <header className={className}>
      <nav data-state={menuState ? "active" : "inactive"} className="group fixed z-20 w-full px-2">
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
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
              <ul className="flex items-center gap-2 text-sm">
                {siteNavigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      aria-current={isActiveLink(item.href) ? "page" : undefined}
                      className={cn(
                        "inline-flex h-11 items-center rounded-full border px-5 text-sm font-medium transition-[color,background-color,border-color,box-shadow] duration-150",
                        isActiveLink(item.href)
                          ? "border-border/85 bg-white/75 text-foreground shadow-[0_14px_28px_-24px_rgba(15,23,42,0.38)]"
                          : "border-transparent text-muted-foreground hover:border-border/65 hover:bg-white/45 hover:text-foreground"
                      )}
                    >
                      <span>{item.name}</span>
                    </Link>
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
                          "inline-flex min-h-11 items-center rounded-full border px-5 py-2 text-base transition-[color,background-color,border-color] duration-150",
                          isActiveLink(item.href)
                            ? "border-border/85 bg-white/85 text-foreground"
                            : "border-transparent text-muted-foreground hover:border-border/65 hover:bg-white/50 hover:text-foreground"
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

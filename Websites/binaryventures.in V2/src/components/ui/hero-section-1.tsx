'use client';

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Variants } from "framer-motion";

import { SiteHeader } from "@/components/site/site-header";
import { Button } from "@/components/ui/button";
import { ServicesPreviewSection } from "@/components/ui/ai-models-preview";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { ProcessPreviewSection } from "@/components/ui/grid-feature-cards";
import { FinalCtaSection } from "@/components/ui/pulse-beams";
import { ProofColumnsSection } from "@/components/ui/testimonials-columns-1";
import SectionWithMockup from "@/components/ui/section-with-mockup";
import { ObjectionCardsSection } from "@/components/ui/objection-cards";
import { PricingPreviewSection } from "@/components/ui/pricing-preview";
import { publicContact } from "@/content/site";

const transitionVariants: { item: Variants } = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export function HeroSection() {
  return (
    <>
      <SiteHeader />
      <main className="overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 isolate z-[2] hidden opacity-50 contain-strict lg:block"
        >
          <div className="absolute left-0 top-0 h-[80rem] w-[35rem] -translate-y-[350px] -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="absolute left-0 top-0 h-[80rem] w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="absolute left-0 top-0 h-[80rem] w-56 -translate-y-[350px] -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>
        <section>
          <div className="relative pt-10 sm:pt-12 md:pt-36">
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      delayChildren: 1,
                    },
                  },
                },
                item: {
                  hidden: {
                    opacity: 0,
                    y: 20,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      type: "spring",
                      bounce: 0.3,
                      duration: 2,
                    },
                  },
                },
              }}
              className="absolute inset-0 -z-20"
            >
              <img
                src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=80"
                alt="abstract technology background"
                className="absolute inset-x-0 top-56 -z-20 hidden opacity-70 lg:top-32 lg:block"
                width="3276"
                height="4095"
                fetchPriority="high"
              />
            </AnimatedGroup>
            <div
              aria-hidden
              className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]"
            />
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={transitionVariants}>
                  <Link
                    href="/services"
                    className="bg-muted/70 group mx-auto flex w-fit max-w-full items-center gap-3 rounded-full border border-border/75 p-1 pl-3 pr-1 shadow-md shadow-black/20 transition-[background-color,border-color,box-shadow,transform] duration-300 hover:bg-muted/90 sm:gap-4 sm:pl-4"
                  >
                    <span className="text-foreground text-xs sm:text-sm">
                      Websites, systems, and automation
                    </span>
                    <span className="block h-4 w-0.5 border-l bg-foreground/20" />

                    <div className="bg-background size-6 overflow-hidden rounded-full duration-500 group-hover:bg-muted">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </Link>

                  <h1 className="mx-auto mt-8 max-w-4xl text-balance text-4xl leading-[0.95] sm:text-5xl md:text-7xl lg:mt-16 xl:text-[5.25rem]">
                    We build the technology your business runs on.
                  </h1>
                  <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                    Binary Ventures helps businesses set up high-trust websites,
                    internal systems, bots, and automations that improve
                    operations and support real growth.
                  </p>
                </AnimatedGroup>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mx-auto mt-10 flex max-w-sm flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row md:mt-12"
                >
                  <Button
                    asChild
                    size="lg"
                    className="h-14 w-full px-7 text-base sm:w-auto"
                  >
                    <a href={publicContact.bookingHref}>
                      <span className="text-nowrap">Book a Call</span>
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-14 w-full px-7 text-base sm:w-auto"
                  >
                    <Link href="/work">
                      <span className="text-nowrap">View Case Studies</span>
                    </Link>
                  </Button>
                </AnimatedGroup>
              </div>
            </div>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}
            >
              <div className="relative mx-auto mt-10 overflow-hidden px-4 sm:mt-12 sm:px-2 md:mt-20 lg:-mr-16 xl:-mr-24">
                <div
                  aria-hidden
                  className="absolute inset-0 z-10 bg-gradient-to-b from-transparent from-35% to-background"
                />
                <div className="inset-shadow-2xs bg-background ring-background relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-white/10 p-4 shadow-lg shadow-zinc-950/15 ring-1">
                  <img
                    className="relative aspect-[4/3] w-full rounded-2xl object-cover sm:aspect-[15/8]"
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=2400&q=80"
                    alt="business systems collaboration"
                    width="2700"
                    height="1440"
                    fetchPriority="high"
                  />
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
        <ProofColumnsSection />
        <SectionWithMockup
          title={
            <>
              More than a website.
              <br />
              More than an automation.
              <br />
              The right setup, end to end.
            </>
          }
          description={
            <>
              Most businesses do not need another disconnected tool. They need
              the right pieces working together.
              <br />
              <br />
              We help put those pieces in place: the website that builds trust,
              the system that supports delivery, the bot that removes repeated
              work, and the automation that keeps the business moving.
            </>
          }
          primaryImageSrc="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80"
          secondaryImageSrc="https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&w=1400&q=80"
          reverseLayout
        />
        <ObjectionCardsSection />
        <ServicesPreviewSection />
        <PricingPreviewSection />
        <ProcessPreviewSection />
        <FinalCtaSection />
      </main>
    </>
  );
}

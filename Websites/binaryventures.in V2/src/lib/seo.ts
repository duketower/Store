import type { Metadata } from "next";

import { publicContact } from "@/content/site";
import { groupedServiceOffers } from "@/content/services";
import { caseStudies } from "@/content/work";

export const siteConfig = {
  name: "Binary Ventures",
  baseUrl: "https://binaryventures.in",
  title: "Binary Ventures",
  description:
    "Binary Ventures builds websites, web apps, bots, and automation systems for businesses that need practical digital infrastructure.",
  ogImage: "/opengraph-image",
  locale: "en_IN",
};

type MetadataOptions = {
  title?: string;
  description: string;
  path?: string;
  keywords?: string[];
  type?: "website" | "article";
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.baseUrl).toString();
}

export function buildMetadata({
  title,
  description,
  path = "/",
  keywords = [],
  type = "website",
}: MetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title;

  return {
    title: title ?? siteConfig.title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type,
      locale: siteConfig.locale,
      url,
      title: fullTitle,
      description,
      siteName: siteConfig.name,
      images: [{ url: absoluteUrl(siteConfig.ogImage) }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [absoluteUrl(siteConfig.ogImage)],
    },
  };
}

export function getOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.baseUrl,
    email: publicContact.email,
    contactPoint: publicContact.locations.map((location) => ({
      "@type": "ContactPoint",
      contactType: `sales (${location.label})`,
      telephone: location.phone.replace(/\s+/g, ""),
      areaServed: location.label,
      availableLanguage: ["English"],
    })),
    areaServed: publicContact.locations.map((location) => ({
      "@type": "Place",
      name: location.addressLine,
    })),
  };
}

export function getWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.baseUrl,
    inLanguage: "en-IN",
    description: siteConfig.description,
  };
}

export function getWebPageJsonLd({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: absoluteUrl(path),
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.baseUrl,
    },
  };
}

export function getServicesPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Services | Binary Ventures",
    url: absoluteUrl("/services"),
    description:
      "Services from Binary Ventures across websites, web apps, bots, automation, and post-launch support.",
    hasPart: groupedServiceOffers.flatMap((group) =>
      group.offers.map((offer) => ({
        "@type": "Service",
        name: offer.name,
        description: offer.description,
        serviceType: offer.category,
        provider: {
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.baseUrl,
        },
        areaServed: publicContact.locations.map((location) => ({
          "@type": "Place",
          name: location.label,
        })),
      }))
    ),
  };
}

export function getWorkPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Case Studies | Binary Ventures",
    url: absoluteUrl("/work"),
    description:
      "Case studies from Binary Ventures across websites, web apps, bots, automation, and business systems.",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: caseStudies.map((study, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: study.title,
        description: study.outcome,
      })),
    },
  };
}

export function getContactPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact | Binary Ventures",
    url: absoluteUrl("/contact"),
    description:
      "Contact Binary Ventures for websites, web apps, bots, automation, and broader business systems work.",
    mainEntity: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.baseUrl,
      email: publicContact.email,
      contactPoint: publicContact.locations.map((location) => ({
        "@type": "ContactPoint",
        contactType: `sales (${location.label})`,
        telephone: location.phone.replace(/\s+/g, ""),
        areaServed: location.addressLine,
      })),
    },
  };
}

export function getBreadcrumbJsonLd(
  items: Array<{
    name: string;
    path: string;
  }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

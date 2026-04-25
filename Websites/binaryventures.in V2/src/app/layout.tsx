import type { Metadata, Viewport } from "next";
import Script from "next/script";

import "./globals.css";
import { absoluteUrl, getOrganizationJsonLd, getWebsiteJsonLd, siteConfig } from "@/lib/seo";

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const googleSiteVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? process.env.GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.baseUrl),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "business website development",
    "custom web apps",
    "workflow automation",
    "AI chatbots",
    "business systems",
  ],
  alternates: { canonical: siteConfig.baseUrl },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.baseUrl,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [{ url: absoluteUrl(siteConfig.ogImage) }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [absoluteUrl(siteConfig.ogImage)],
  },
  applicationName: siteConfig.name,
  category: "technology",
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  verification: googleSiteVerification
    ? {
        google: googleSiteVerification,
      }
    : undefined,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#050816",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = JSON.stringify([getOrganizationJsonLd(), getWebsiteJsonLd()]);

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        {gaMeasurementId ? (
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
        ) : null}
        <Script id="binaryventures-seo-jsonld" type="application/ld+json" strategy="beforeInteractive">
          {structuredData}
        </Script>
        <Script id="binaryventures-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            window.gtag = window.gtag || gtag;
            window.trackConversion = function(eventName, params) {
              var payload = params || {};
              if (typeof window.gtag === "function") {
                window.gtag("event", eventName, payload);
              }
              window.dataLayer.push(Object.assign({ event: eventName }, payload));
            };
            ${gaMeasurementId ? `window.gtag("js", new Date()); window.gtag("config", "${gaMeasurementId}");` : ""}
            document.addEventListener("click", function(event) {
              var anchor = event.target instanceof Element ? event.target.closest("a") : null;
              if (!anchor) return;
              var href = anchor.getAttribute("href") || "";
              if (!href) return;

              if (href.indexOf("calendly.com") !== -1) {
                window.trackConversion("book_call_click", { href: href });
                return;
              }

              if (href.indexOf("mailto:") === 0) {
                window.trackConversion("email_click", { href: href });
                return;
              }

              if (href.indexOf("tel:") === 0) {
                window.trackConversion("phone_click", { href: href });
                return;
              }

              if (href === "/contact" || href.indexOf("/contact?") === 0 || href.indexOf("/contact#") === 0) {
                window.trackConversion("contact_page_click", { href: href });
              }
            }, { passive: true });
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}

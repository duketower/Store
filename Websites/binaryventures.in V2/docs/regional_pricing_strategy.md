# Regional Pricing and International SEO Strategy

## Goal

Create a region-aware Binary Ventures website experience without weakening the current India-first site or making the Australia SEO path messy later.

The site should eventually let visitors see the service framing, contact details, and pricing that match their country while giving search engines clear regional URLs to index.

## Recommendation

Use regional URLs for SEO and a region selector for user experience.

Do not solve regional pricing only with a client-side dropdown that changes prices on the same URL. That can help visitors, but it does not create distinct Australia-focused pages for search engines.

Recommended structure:

```text
/              Default site, India-first/global
/services      Default services
/contact       Default contact

/au            Australia landing page
/au/services   Australia services and AUD pricing
/au/contact    Australia contact framing

/in            Optional India-specific landing page later
/in/services   Optional India pricing later
/in/contact    Optional India contact framing later
```

The current root can remain the default version for now. Add `/au` first because Australia is the main international SEO target.

## Why This Approach

`binaryventures.in` naturally sends an India signal because `.in` is a country-code top-level domain. That does not make Australia targeting impossible, but Australia-focused pages need stronger regional signals.

Region-specific URLs give Google and users a clear page to understand:

- which country the page targets
- which currency applies
- which location/contact details matter
- which service framing is most relevant

Avoid forced IP redirects. If a visitor appears to be in Australia, show a small suggestion to view the Australia version, but let them choose. Search engines can miss regional variations when a site automatically redirects based on location.

Reference guidance:

- Google multi-regional site guidance: `https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites`
- Google localized versions and `hreflang`: `https://developers.google.com/search/docs/specialty/international/localized-versions`

## Region Selector UX

Add a compact region selector in the site shell.

Desktop:

- place near the header CTA or inside a small utility dropdown
- options: India, Australia, Global
- each option links to a regional URL, not just a hidden client-side state

Mobile:

- place inside the mobile menu
- keep it below the main navigation or near the CTA block
- make the active region clear

Optional later:

- show a non-blocking banner if the visitor seems to be in Australia:

```text
Looking for Australia pricing? View Australia version.
```

Do not automatically redirect.

## Pricing Model

Use manually defined regional pricing, not exchange-rate conversion.

Pricing should reflect market expectations, support cost, positioning, and local buying behavior.

Initial pricing model draft:

```text
Websites
India: From Rs 40,000
Australia: From A$900
Global: From US$500

Web Apps
India: From Rs 1,25,000
Australia: From A$2,500
Global: From US$1,500

AI ChatBots
India: From Rs 85,000
Australia: From A$1,700
Global: From US$1,000

Workflow Automation
India: From Rs 60,000
Australia: From A$1,200
Global: From US$750

Domain & Hosting
India: From Rs 12,000
Australia: From A$250
Global: From US$150

Email Setup & Hosting
India: From Rs 12,000
Australia: From A$250
Global: From US$150

Logo & Branding
India: From Rs 20,000
Australia: From A$450
Global: From US$250

Social Media Management
India: From Rs 18,000/mo
Australia: From A$400/mo
Global: From US$200/mo

Maintenance & Support
India: From Rs 12,000/mo
Australia: From A$300/mo
Global: From US$150/mo
```

These are starting points and should be reviewed before launch.

## Content Differences By Region

The regional pages should not be exact duplicates with only currency changed.

Australia pages should include:

- AUD pricing
- Adelaide or Australia location framing
- Australian phone number
- Australia-relevant service examples
- copy for Australian small businesses, service companies, and operators
- page titles such as:
  - `Business Websites and Automation in Australia`
  - `Web Apps, Bots, and Automation for Australian Businesses`
  - later: `Web Design and Business Automation in Adelaide`

India/default pages should keep:

- current broader Binary Ventures positioning
- India location details
- India/global-friendly pricing where needed
- broader operational systems framing

## SEO Requirements

When regional pages are implemented:

- Add region-specific metadata titles and descriptions
- Add canonical URLs
- Add `hreflang` alternates:
  - `en-IN` for India/default or `/in`
  - `en-AU` for `/au`
  - `x-default` for the default/global version
- Include regional pages in the sitemap
- Add Organization or LocalBusiness structured data where appropriate
- Link to the Australia version from the footer and/or region selector

## Implementation Phases

### Phase 1 - Region Data Model

Create one source of truth for regions.

Each region should define:

- region code
- display name
- URL prefix
- currency label
- pricing labels for all services
- phone number
- location copy
- CTA copy if different
- regional SEO metadata
- `hreflang` value

Likely regions:

```text
default/global
india
australia
```

### Phase 2 - Region Selector

Add a selector to the shared site header and mobile menu.

The selector should:

- show the active region
- link to equivalent regional routes where possible
- fall back to the regional landing page when no equivalent route exists
- avoid forced redirects

### Phase 3 - Australia Pages

Build the first Australia-specific routes:

```text
/au
/au/services
/au/contact
```

Start with these before duplicating every route.

### Phase 4 - Metadata, Sitemap, and Hreflang

Add:

- regional page metadata
- canonical URLs
- `hreflang` alternates
- sitemap entries
- structured data where useful

### Phase 5 - Optional Location Suggestion

Add a small, non-blocking country suggestion if visitor location can be inferred.

This should be treated as a convenience layer, not the core SEO mechanism.

## Domain Strategy

Short term:

- keep `binaryventures.in`
- add `/au` regional pages
- use region selector and `hreflang`

Medium term:

- consider `binaryventures.com` if the business becomes genuinely international
- consider `binaryventures.com.au` if Australia becomes a major standalone market

Do not change domains until there is enough proof that the Australia channel is worth the migration cost.

## First Execution Step

When ready to implement, start with:

1. Add region pricing/content data
2. Add `/au` and `/au/services`
3. Add region selector in header/mobile menu
4. Add metadata and sitemap support
5. Review live behavior before adding auto-suggestion

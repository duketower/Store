# SEO Guideline

This is a reusable SEO guide for websites and web apps. It is written to be project-agnostic so it can be used across different client projects, products, and internal builds.

## 1. Goal

SEO is not one thing. It is the combination of:

- clear page intent
- useful content
- crawlable site structure
- good metadata
- healthy internal linking
- trustworthy business signals
- search performance review after launch

The goal is not to "add SEO." The goal is to make a site easy for search engines to understand and worth showing to users.

## 2. Core Principles

- Build pages around real search intent, not vague topics.
- One page should serve one main intent well.
- Use clear URLs and clear hierarchy.
- Prefer a small number of strong pages over many thin pages.
- Metadata helps, but it does not rescue weak content.
- Schema helps, but it does not replace clear page structure.
- Search Console data should guide refinement after launch.

## 3. Pre-Build Checklist

Before implementation, define:

- business name format
- main service or product categories
- target countries, cities, or service areas
- primary commercial pages
- supporting informational pages
- conversion goals
- canonical domain
- real contact details and public business details

If local SEO matters, also confirm:

- exact address
- phone number
- opening hours
- Google Maps URL
- whether the business is a staffed office, service-area business, or both

## 4. URL Structure

Use simple, stable, readable URLs.

Good examples:

- `/services`
- `/services/web-design`
- `/services/seo-audit`
- `/work/project-name`
- `/blog/how-to-choose-a-crm`

Guidelines:

- use lowercase
- use hyphens
- avoid unnecessary nesting
- avoid date-heavy URLs unless the format truly needs it
- do not change URLs casually after launch

If a URL must change, add a proper redirect.

## 5. Page Types To Plan

Most projects should consider these page types:

- homepage
- service or product landing pages
- about page
- contact page
- case studies or proof pages
- blog or insights pages if content marketing matters
- local landing pages only if they are real, distinct, and supportable

Each important service should usually have its own page if it has distinct search intent.

If you create high-intent supporting pages for buyer problems or use cases, they do not always need their own top-level navbar item. In many projects, they work better as a subgroup under Services or Products while keeping their own crawlable URLs.

## 6. Metadata Standards

Each important page should have:

- unique title tag
- unique meta description
- canonical URL
- Open Graph title, description, URL, and image
- Twitter card metadata

Guidelines:

- titles should be specific and readable, not keyword-stuffed
- descriptions should describe the page honestly
- canonicals should point to the preferred live URL
- social preview images should look intentional, not broken or blank

## 7. Technical SEO Minimum

Every production site should have:

- `robots.txt`
- `sitemap.xml`
- canonical tags
- valid status codes
- no accidental `noindex`
- no major crawl traps
- mobile-friendly layouts
- acceptable performance on real devices

Also verify:

- staging URLs are not being indexed
- duplicate variants are controlled
- the preferred domain is consistent
- broken internal links are fixed

## 8. Structured Data

Use schema where it reflects real page meaning.

Common useful schema:

- `Organization`
- `WebSite`
- `WebPage`
- `Service`
- `Product`
- `BreadcrumbList`
- `Article` or `BlogPosting`
- `FAQPage`
- `LocalBusiness`

Rules:

- only use schema that matches the content
- do not add fake reviews or fake ratings
- do not mark generic text as FAQ unless it is a real FAQ section
- local business schema should use real public business details

## 9. Content Rules

Good SEO content is:

- useful
- clear
- specific
- written for the actual buyer or user
- connected to the page’s intent

Avoid:

- filler paragraphs
- copy written only to include keywords
- dozens of near-duplicate local pages
- fake proof
- fake statistics
- generic AI text with no practical substance

For service pages, include:

- who it is for
- what problem it solves
- what is typically included
- delivery approach
- related proof
- next step or CTA

For case studies, include:

- context
- challenge
- solution
- outcome
- supporting technical detail

For blog or insight pages, include:

- clear query match
- useful explanation
- real examples or grounded process
- links to related commercial pages where relevant

## 10. Internal Linking

Internal links are one of the highest-value SEO tools available.

Every site should link across:

- homepage -> main services
- homepage or services hub -> supporting use-case pages
- services -> related case studies
- services -> related blog or insights articles
- services -> related use-case or buyer-problem pages
- use-case pages -> related services
- case studies -> related services
- blog or insights articles -> related services
- contact page -> relevant commercial pages

Use descriptive anchor text when natural. Do not force-match every keyword.

## 11. Image SEO

Use:

- descriptive filenames
- useful alt text when the image carries meaning
- compressed images
- correct dimensions
- intentional social preview images

Do not:

- stuff keywords into alt text
- use decorative alt text for decorative images
- rely on giant unoptimized assets

## 12. Local SEO

If local SEO matters, do this properly.

On-site:

- keep business name, address, phone, and hours consistent
- make contact details easy to find
- use real local proof
- add local business schema when appropriate
- create location pages only when each one is genuinely distinct

Off-site:

- create or optimize Google Business Profile
- verify categories
- keep hours accurate
- add real photos
- collect legitimate reviews
- reply to reviews

Do not build fake-location pages or vague doorway pages.

## 13. Search Console

Every serious project should be added to Google Search Console.

After launch:

1. verify the property
2. submit the sitemap
3. inspect important URLs
4. request indexing where needed
5. review:
   queries
   pages
   countries
   devices
   click-through rate

Use Search Console to refine:

- title tags
- meta descriptions
- content gaps
- underperforming pages

## 14. Analytics

At minimum, track:

- page views
- contact clicks
- booking clicks
- phone clicks
- form submissions

Analytics should support business decisions, not become noise.

## 15. Performance and UX

SEO and user experience are connected.

Review:

- mobile rendering
- image weight
- layout shifts
- large JavaScript cost
- slow pages on real devices
- interaction clarity

If a page is technically indexable but hard to use, rankings and conversions both suffer.

## 16. Launch Checklist

Before launch:

- confirm canonical domain
- confirm metadata is unique on key pages
- confirm `robots.txt`
- confirm `sitemap.xml`
- confirm schema renders correctly
- confirm no broken links
- confirm no placeholder copy
- confirm social image previews
- confirm mobile checks
- confirm analytics and Search Console setup

## 17. Post-Launch Workflow

SEO work continues after launch.

Run a simple review cycle:

Weekly:

- check Search Console issues
- review indexing issues
- review major broken links or crawl issues

Monthly:

- review query growth
- improve low-CTR pages
- update stale pages
- add or improve internal links
- publish useful new content if content strategy is active

Quarterly:

- audit service pages
- audit case studies
- review local SEO signals
- review technical health
- review whether weak pages should be improved, merged, or removed

## 18. Common Mistakes

- launching with only one generic services page
- using the same metadata on multiple pages
- building thin local landing pages
- publishing AI-written filler content
- ignoring Search Console after launch
- using schema without real supporting content
- failing to connect case studies, services, and articles through links
- forgetting to update sitemap and canonicals when routes change
- treating SEO as a one-time checklist

## 19. Reusable Priority Order

When time is limited, implement in this order:

1. crawlability and indexability
2. core metadata and canonical setup
3. sitemap and robots
4. service/product landing pages
5. proof pages and case studies
6. internal linking
7. structured data
8. Search Console and analytics
9. content expansion
10. local SEO and off-site authority work

## 20. Practical Rule

If a page is not useful enough to send a real prospect to, it is usually not strong enough to be an SEO target page either.

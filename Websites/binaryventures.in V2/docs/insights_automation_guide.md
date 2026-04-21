# Insights Automation Implementation Guide

This guide explains how to implement, execute, and verify the Binary Ventures Insights section and daily article automation system.

Recommended staged pipeline:

```txt
Trend/news signals -> Notion topic tracker -> manual topic approval -> Gemini draft generation -> manual publish approval -> Markdown article file -> Next.js static build -> Firebase Hosting deploy -> Notion published status
```

## 1. Goal

Add an `Insights` section to `binaryventures.in` for blog posts, how-to guides, local SEO articles, automation explainers, and business technology content.

The final system should:

- Publish SEO-friendly static article pages.
- Let topics be tracked and edited in Notion.
- Find useful article topics automatically.
- Generate article drafts only from manually approved topics.
- Publish articles only after a second manual approval.
- Commit generated Markdown articles to GitHub.
- Build and deploy automatically to Firebase Hosting.
- Keep the publishing workflow easy to audit, pause, and improve.

## 2. Recommended Tools

Use this stack:

- **Next.js static pages** for `/insights` and `/insights/[slug]`.
- **Markdown files** for article content.
- **Notion database** for tracking ideas, briefs, approvals, and publishing status.
- **Gemini API** for generating article drafts.
- **GitHub Actions** for daily scheduling, commits, build checks, and deploy.
- **Firebase Hosting** for live deployment.
- **Google Search Console** for indexing and SEO monitoring.

Why this setup:

- It is low-cost and can start on free tiers.
- The site keeps ownership of all content.
- Markdown is easy to version, review, and automate.
- Notion gives a friendly editorial dashboard.
- GitHub Actions gives repeatable scheduled automation.
- Firebase is already the live hosting target for this website.

## 2.1 Editorial Status Flow

Use these Notion Status values:

```txt
Trend Found -> Topic Approved -> Draft Generated -> Approved to Publish -> Published
```

Supporting statuses:

```txt
Needs Review
Rejected
```

Daily automation:

- `Find Insight Trends` runs at 08:37 AM IST and creates `Trend Found` rows in Notion.
- You review topics and change good ones to `Topic Approved`.
- `Generate Insight Draft` runs at 10:07 AM IST and generates one draft article.
- You review the draft and change ready items to `Approved to Publish`.
- `Publish Approved Insight` runs at 05:37 PM IST, deploys the article, and marks Notion as `Published`.

## 3. Website Section Structure

Public section name:

```txt
Insights
```

Routes:

```txt
/insights
/insights/[slug]
```

Recommended content folder:

```txt
src/content/insights/articles/
```

Example article file:

```txt
src/content/insights/articles/website-maintenance-for-indore-businesses.md
```

Recommended categories:

- Guides
- Websites
- Web Apps
- Automation
- AI Chatbots
- Business Systems
- SEO & Growth
- Local Business

## 4. Article Markdown Format

Each article should use frontmatter plus Markdown body content.

Example:

```md
---
title: "Website Maintenance Checklist for Indore Businesses"
description: "A practical checklist for local businesses that want faster, safer, and more reliable websites."
slug: "website-maintenance-for-indore-businesses"
date: "2026-04-21"
updated: "2026-04-21"
category: "Websites"
market: "Indore"
tags:
  - website maintenance
  - local business
  - Indore
  - SEO
author: "Binary Ventures"
status: "published"
canonical: "https://binaryventures.in/insights/website-maintenance-for-indore-businesses"
---

# Website Maintenance Checklist for Indore Businesses

Article content starts here.
```

Required frontmatter fields:

- `title`
- `description`
- `slug`
- `date`
- `updated`
- `category`
- `market`
- `tags`
- `author`
- `status`
- `canonical`

## 5. Insights Listing Page

Implement:

```txt
src/app/insights/page.tsx
```

The listing page should include:

- Featured article.
- Latest articles grid.
- Category filters or category links.
- Search-friendly article cards.
- Internal links to relevant service pages.
- Call-to-action using the existing Calendly booking link.

Each article card should show:

- Title.
- Short description.
- Category.
- Publish date.
- Reading time.
- Market or city focus.

Verification:

```bash
npm run build
```

Manual checks:

- Open `/insights`.
- Confirm article cards appear.
- Confirm cards link to the right article pages.
- Confirm layout works on desktop and mobile.
- Confirm no console errors.

## 6. Individual Article Pages

Implement:

```txt
src/app/insights/[slug]/page.tsx
```

Because this project is statically exported, the page must use:

```ts
export function generateStaticParams()
```

Each article page should include:

- Article title.
- Description.
- Published date.
- Updated date.
- Category.
- Reading time.
- Markdown body.
- Related articles.
- CTA section.
- SEO metadata.
- `BlogPosting` JSON-LD schema.

Required SEO metadata:

- Title.
- Description.
- Canonical URL.
- Open Graph title.
- Open Graph description.
- Open Graph image.
- Article published time.
- Article modified time.
- Author.
- Category.
- Tags.

Recommended schema type:

```json
{
  "@type": "BlogPosting"
}
```

Verification:

```bash
npm run build
```

Manual checks:

- Open one article page locally.
- Confirm article renders correctly.
- Confirm headings and spacing are readable.
- Confirm metadata appears in page source.
- Confirm JSON-LD appears in page source.
- Confirm mobile layout does not overlap or clip text.

## 7. Starter Articles

Before enabling automation, create three manually reviewed starter articles. These articles become the quality benchmark for future generated content.

Recommended starter topics:

1. How Much Does a Business Website Cost in India?
2. Website Maintenance Checklist for Local Businesses.
3. When Should a Small Business Use Automation?

Each article should include:

- Practical introduction.
- Clear headings.
- Local examples where relevant.
- Checklists or steps.
- Internal links to service pages.
- CTA to book a call.
- No fake client names.
- No fake statistics.
- No keyword stuffing.

Verification:

```bash
npm run build
firebase deploy
```

Live check:

```txt
https://binaryventures.in/insights
```

## 8. Notion Database Setup

Create a Notion database named:

```txt
Binary Ventures Insights Pipeline
```

Recommended properties:

| Property | Type | Purpose |
| --- | --- | --- |
| Title | Title | Article topic/title |
| Slug | Text | Final URL slug |
| Status | Select | Trend Found, Topic Approved, Draft Generated, Approved to Publish, Published, Needs Review, Rejected |
| Category | Select | Article category |
| Market | Text | India, Indore, Bhopal, Mumbai, Delhi, Bangalore, Other |
| Primary Keyword | Text | Main SEO keyword |
| Secondary Keywords | Multi-select | Supporting keywords |
| Angle | Text | The article angle |
| Target Audience | Text | Local Business, Startup, School, Clinic, Manufacturer, Service Business |
| Brief | Text | Human-provided instructions |
| Generated Draft | Checkbox | Whether automation created the draft |
| Published URL | URL | Final live URL |
| Publish Date | Date | Publishing date |
| Last Automation Run | Date | Last time automation touched this item |
| Notes | Text | Errors, comments, or review notes |

Important rule:

```txt
Only Status = Topic Approved should be picked by draft generation.
Only Status = Approved to Publish should be picked by publishing.
```

This keeps topic approval and final publishing approval separate.

## 9. Notion API Integration

Steps:

1. Create a new internal Notion integration.
2. Copy the integration token.
3. Open the Notion database.
4. Share the database with the integration.
5. Copy the database ID.

Required GitHub secrets:

```txt
NOTION_TOKEN
NOTION_DATABASE_ID
```

Verification:

- Run the GitHub workflow `Find Insight Trends`.
- Expected result:

```txt
New Trend Found topics appear in Notion.
```

## 10. Gemini API Setup

Create a Gemini API key from Google AI Studio.

Recommended model:

```txt
Use the current free-tier Gemini Flash or Flash-Lite model available at implementation time.
```

Required GitHub secret:

```txt
GEMINI_API_KEY
```

Before final implementation, confirm the current model ID and free-tier limits from the official Gemini API documentation.

## 11. Article Generation Script

Create:

```txt
scripts/generate-insight-article.mjs
```

The draft generation script should:

1. Connect to Notion.
2. Find one article where `Status = Topic Approved`.
3. Read the title, market, category, keywords, audience, angle, and brief.
4. Send a structured prompt to Gemini.
5. Generate Markdown with frontmatter.
6. Validate the generated article.
7. Save the article to `src/content/insights/articles/`.
8. Update the Notion item status to `Draft Generated`.

Active workflow:

```txt
Trend Found -> Topic Approved -> Draft Generated -> Approved to Publish -> Published
```

Scripts:

```txt
scripts/find-insight-trends.mjs
scripts/generate-insight-article.mjs
scripts/publish-approved-insight.mjs
```

Keep manual review in place until generated article quality is consistently strong.

## 12. Quality Validation Rules

Before saving or publishing, the script should verify:

- Title exists.
- Description exists.
- Slug exists.
- Date exists.
- Category exists.
- Article has at least 800 words.
- Article has at least 4 headings.
- No placeholder text exists.
- No fake client names exist.
- No fake statistics are presented as facts.
- Internal CTA exists.
- Canonical URL exists.
- Slug does not already exist.
- Markdown file does not already exist.

If validation fails:

1. Do not publish.
2. Update Notion status to `Needs Review`.
3. Add the validation error to Notion notes.

## 13. Daily GitHub Action

Create:

```txt
.github/workflows/daily-insight.yml
```

Recommended trigger:

```yaml
on:
  workflow_dispatch:
  schedule:
    - cron: "37 4 * * *"
```

This runs daily at **10:07 AM India time** when interpreted from UTC cron as `04:37 UTC`.

Use a non-round minute because scheduled workflows can be delayed during peak times.

Workflow steps:

1. Checkout repo.
2. Setup Node.
3. Run `npm ci`.
4. Run the relevant automation script.
5. Run `npm run build`.
6. Commit generated or published Markdown changes when a file changed.
7. Push to `main`.
8. Deploy to Firebase Hosting when publishing.

Required GitHub secrets:

```txt
NOTION_TOKEN
NOTION_DATABASE_ID
GEMINI_API_KEY
FIREBASE_SERVICE_ACCOUNT
```

Verification:

1. Open GitHub Actions.
2. Select `Find Insight Trends`, `Generate Insight Draft`, or `Publish Approved Insight`.
3. Click `Run workflow`.
4. Confirm the expected Notion status changes.
5. Confirm generated drafts stay private with `status: "draft"`.
6. Confirm approved published articles go live with `status: "published"`.

## 14. Firebase Deploy GitHub Action

Create or confirm:

```txt
.github/workflows/firebase-deploy.yml
```

Trigger:

```yaml
on:
  push:
    branches:
      - main
```

Workflow steps:

1. Checkout repo.
2. Setup Node.
3. Run `npm ci`.
4. Run `npm run build`.
5. Deploy `out/` to Firebase Hosting.

Firebase setup can be created with:

```bash
firebase init hosting:github
```

Verification:

1. Push a small change to `main`.
2. Confirm GitHub Action passes.
3. Confirm Firebase deploy completes.
4. Open:

```txt
https://binaryventures.in
```

5. Confirm the latest change is visible.

## 15. SEO Content Rules

Every generated article should include:

- One primary keyword.
- One clear city, region, or India-wide market focus.
- Helpful introduction.
- Practical steps.
- Internal service link.
- FAQ section.
- CTA.
- No fake guarantees.
- No fake testimonials.
- No copied content.

Good topic examples:

- Website Maintenance Checklist for Indore Businesses.
- How Schools Can Use Automation for Admissions Follow-Ups.
- Best Website Features for Clinics in India.
- How Local Service Businesses Can Use WhatsApp Automation.
- When Should a Business Replace Excel With a Web App?

Avoid:

- Top 10 Best Company in India.
- Guaranteed #1 SEO Ranking.
- Fake case studies.
- Thin 400-word AI posts.
- Duplicate city-swapped articles.

## 16. Local Verification

Run:

```bash
npm run build
```

Optional static preview:

```bash
npx serve out
```

Check:

```txt
/insights
/insights/article-slug
/sitemap.xml
/robots.txt
```

Expected:

- Static build completes.
- Insights listing page renders.
- Article pages render.
- No broken internal links.
- No console errors.
- Metadata exists.
- CTA links to Calendly.

## 17. Live Verification

After deploy, run:

```bash
curl -I https://binaryventures.in/insights
curl -I https://binaryventures.in/insights/article-slug
```

Expected response:

```txt
HTTP 200
```

Also verify:

- Mobile layout.
- Article readability.
- Metadata in page source.
- JSON-LD schema in page source.
- Calendly CTA link.
- Internal service links.
- No browser console errors.

## 18. Google Search Console

After launch:

1. Open Google Search Console.
2. Add property:

```txt
https://binaryventures.in
```

3. Submit sitemap:

```txt
https://binaryventures.in/sitemap.xml
```

4. Inspect new article URLs after publishing.

Track:

- Impressions.
- Clicks.
- Average position.
- Indexed pages.
- Search queries.
- Pages with crawl or indexing issues.

## 19. First Two Weeks Publishing Policy

For the first two weeks:

```txt
Generate 1 article daily.
Review manually before publishing.
Track Search Console performance.
Improve prompts based on weak articles.
```

After quality is stable:

```txt
Allow auto-publish for low-risk article types.
Keep manual review for high-stakes SEO or city-focused articles.
```

## 20. Implementation Checklist

Use this order:

1. Add `/insights` listing page.
2. Add `/insights/[slug]` article page.
3. Add Markdown article loader.
4. Add article metadata and schema.
5. Add three starter articles.
6. Add article URLs to sitemap generation.
7. Run local build verification.
8. Deploy manually to Firebase.
9. Create Notion database.
10. Create Notion integration.
11. Create Gemini API key.
12. Add GitHub secrets.
13. Add Firebase deploy GitHub Action.
14. Add daily article generation script.
15. Add daily GitHub Action.
16. Test workflow manually.
17. Verify live article.
18. Submit sitemap in Google Search Console.
19. Monitor results for two weeks.
20. Decide whether to allow full auto-publishing.

## 21. Immediate Next Step

The next coding task should be:

```txt
Implement the Insights section with Markdown support and three starter articles.
```

After that is stable, add the automation layer.

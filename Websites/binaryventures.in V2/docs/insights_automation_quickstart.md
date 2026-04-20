# Insights Automation Quickstart

Use this short checklist after creating the Notion database.

## Current Status

- GitHub workflows are active:
  - `Daily Insight`
  - `Firebase Deploy`
- `NOTION_DATABASE_ID` has been added to GitHub secrets.
- The Notion database id is:

```txt
2162e69679514a28ae27a64a91fa27f9
```

## Secrets Still Needed

Add these in GitHub:

```txt
NOTION_TOKEN
GEMINI_API_KEY
FIREBASE_SERVICE_ACCOUNT
```

Path:

```txt
GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret
```

## First Test Topic

Create one Notion row with these values:

```txt
Title: Website Maintenance Checklist for Indore Businesses
Slug: website-maintenance-checklist-for-indore-businesses
Status: Approved
Category: Websites
Market: Indore
Primary Keyword: website maintenance Indore
Secondary Keywords: website support, website security, website updates, local business website
Target Audience: Local Business
Angle: Practical checklist for local business owners
Brief: Write a helpful, practical article for businesses in Indore that explains what to check monthly, quarterly, and annually. Avoid fake claims. Include a CTA to book a call.
```

The generated article should be committed as a draft:

```txt
status: "draft"
```

It will not go live until reviewed and changed to:

```txt
status: "published"
```

## Manual Test

After secrets are set:

```txt
GitHub -> Actions -> Daily Insight -> Run workflow
```

Expected result:

- One Markdown draft appears in `src/content/insights/articles/`.
- Notion status changes from `Approved` to `Generated`.
- The generated draft is committed to `main`.
- The article does not appear publicly until `status` is changed to `published`.

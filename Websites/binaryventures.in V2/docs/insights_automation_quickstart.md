# Insights Automation Quickstart

Use this checklist to run the staged Insights automation.

## Current Status

- GitHub workflows are active:
  - `Find Insight Trends`
  - `Generate Insight Draft`
  - `Publish Approved Insight`
  - `Firebase Deploy`
- GitHub secrets are configured for Notion, Gemini, and Firebase.
- Topic discovery and draft generation use `gemini-2.5-flash-lite` by default.
- The Notion database id is:

```txt
2162e69679514a28ae27a64a91fa27f9
```

## Required Secrets

These must be in GitHub repo secrets:

```txt
NOTION_DATABASE_ID
NOTION_TOKEN
GEMINI_API_KEY
FIREBASE_SERVICE_ACCOUNT
```

Path:

```txt
GitHub repo: duketower/Store
Settings -> Secrets and variables -> Actions -> New repository secret
```

## Notion Status Flow

Use these Status values:

```txt
Trend Found -> Topic Approved -> Draft Generated -> Approved to Publish -> Published
```

Other useful statuses:

```txt
Needs Review
Rejected
```

## Daily Flow

1. `Find Insight Trends` runs at 08:37 AM IST.
2. It searches trend/news signals and creates Notion rows with Status = `Trend Found`.
3. You review the topic in Notion.
4. If you like it, change Status to `Topic Approved`.
5. `Generate Insight Draft` runs at 10:07 AM IST.
6. It generates one Markdown article as `status: "draft"` and changes Notion Status to `Draft Generated`.
7. You review the generated article.
8. If it is ready, change Notion Status to `Approved to Publish`.
9. `Publish Approved Insight` runs at 05:37 PM IST.
10. It changes the Markdown article to `status: "published"`, builds, deploys to Firebase, and changes Notion Status to `Published`.

## Manual Tests

Run topic discovery:

```txt
GitHub -> Actions -> Find Insight Trends -> Run workflow
```

Expected result:

- 1-5 new Notion rows appear with Status = `Trend Found`.
- No website files change.

Run draft generation after approving one topic:

```txt
Set one Notion row to Status = Topic Approved
GitHub -> Actions -> Generate Insight Draft -> Run workflow
```

Expected result:

- One Markdown draft appears in `src/content/insights/articles/`.
- The article frontmatter says `status: "draft"`.
- Notion status changes to `Draft Generated`.
- The article is committed to `main`.
- The article does not appear publicly yet.

Run publishing after reviewing one draft:

```txt
Set one Notion row to Status = Approved to Publish
GitHub -> Actions -> Publish Approved Insight -> Run workflow
```

Expected result:

- The article frontmatter changes to `status: "published"`.
- The workflow builds and deploys Firebase Hosting.
- Notion status changes to `Published`.
- The article appears at `https://binaryventures.in/insights/<slug>`.

#!/usr/bin/env node
/**
 * Publish approval pipeline:
 *   Notion (Approved + Generated Draft checked) -> Markdown status: published -> deploy -> Notion (Published)
 *
 * Usage:
 *   node scripts/publish-approved-insight.mjs prepare
 *   node scripts/publish-approved-insight.mjs complete
 *
 * Required env vars:
 *   NOTION_TOKEN
 *   NOTION_DATABASE_ID
 *
 * Optional env vars:
 *   PUBLISH_RESULT_PATH
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.resolve(__dirname, "../src/content/insights/articles");
const RESULT_PATH = process.env.PUBLISH_RESULT_PATH || path.resolve(__dirname, ".publish-result.json");
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const TODAY = new Date().toISOString().split("T")[0];

async function notionRequest(method, path, body) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Notion ${method} ${path} failed: ${JSON.stringify(data)}`);
  }
  return data;
}

function getText(prop) {
  if (!prop) return "";
  if (prop.type === "title") return prop.title.map((t) => t.plain_text).join("");
  if (prop.type === "rich_text") return prop.rich_text.map((t) => t.plain_text).join("");
  if (prop.type === "url") return prop.url ?? "";
  return "";
}

async function fetchApprovedToPublish() {
  const data = await notionRequest("POST", `/databases/${NOTION_DATABASE_ID}/query`, {
    filter: {
      and: [
        {
          property: "Status",
          select: { equals: "Approved" },
        },
        {
          property: "Generated Draft",
          checkbox: { equals: true },
        },
      ],
    },
    sorts: [{ property: "Publish Date", direction: "ascending" }],
    page_size: 1,
  });

  if (!data.results?.length) return null;
  const page = data.results[0];
  const p = page.properties;
  return {
    pageId: page.id,
    title: getText(p.Title),
    slug: getText(p.Slug),
    publishedUrl: getText(p["Published URL"]),
  };
}

async function updateNotion(pageId, status, extra = {}) {
  const properties = {
    Status: { select: { name: status } },
    "Last Automation Run": { date: { start: TODAY } },
  };

  if (extra.notes) {
    properties.Notes = { rich_text: [{ text: { content: extra.notes.slice(0, 2000) } }] };
  }
  if (extra.url) {
    properties["Published URL"] = { url: extra.url };
  }
  if (extra.publishDate) {
    properties["Publish Date"] = { date: { start: extra.publishDate } };
  }

  await notionRequest("PATCH", `/pages/${pageId}`, { properties });
}

function writeResult(result) {
  fs.mkdirSync(path.dirname(RESULT_PATH), { recursive: true });
  fs.writeFileSync(RESULT_PATH, JSON.stringify(result, null, 2), "utf8");
}

function replaceFrontmatterField(raw, key, value) {
  const line = `${key}: "${value}"`;
  const pattern = new RegExp(`^${key}:\\s*"?[^"\\n]+"?`, "m");
  if (pattern.test(raw)) return raw.replace(pattern, line);

  return raw.replace(/^---\r?\n/, `---\n${line}\n`);
}

async function prepare() {
  const item = await fetchApprovedToPublish();
  if (!item) {
    console.log("No approved generated drafts found.");
    writeResult({ didPublish: false });
    return;
  }

  if (!item.slug) {
    await updateNotion(item.pageId, "Needs Review", { notes: "Cannot publish: missing Slug." });
    throw new Error("Approved Notion item is missing Slug");
  }

  const filePath = path.join(ARTICLES_DIR, `${item.slug}.md`);
  if (!fs.existsSync(filePath)) {
    await updateNotion(item.pageId, "Needs Review", {
      notes: `Cannot publish: Markdown file not found at src/content/insights/articles/${item.slug}.md`,
    });
    throw new Error(`Markdown file not found: ${filePath}`);
  }

  const url = `https://binaryventures.in/insights/${item.slug}`;
  let raw = fs.readFileSync(filePath, "utf8");
  raw = replaceFrontmatterField(raw, "status", "published");
  raw = replaceFrontmatterField(raw, "updated", TODAY);
  raw = replaceFrontmatterField(raw, "canonical", url);
  fs.writeFileSync(filePath, raw, "utf8");

  writeResult({
    didPublish: true,
    pageId: item.pageId,
    slug: item.slug,
    title: item.title,
    url,
    filePath,
  });

  console.log(`Prepared article for publishing: ${item.slug}`);
}

async function complete() {
  if (!fs.existsSync(RESULT_PATH)) {
    console.log("No publish result file found. Nothing to complete.");
    return;
  }

  const result = JSON.parse(fs.readFileSync(RESULT_PATH, "utf8"));
  if (!result.didPublish) {
    console.log("No article was prepared. Nothing to complete.");
    return;
  }

  await updateNotion(result.pageId, "Published", {
    url: result.url,
    publishDate: TODAY,
    notes: `Published by automation: ${result.url}`,
  });
  console.log(`Notion status updated to Published: ${result.url}`);
}

async function run() {
  if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    console.error("Missing required env vars: NOTION_TOKEN, NOTION_DATABASE_ID");
    process.exit(1);
  }

  const command = process.argv[2] || "prepare";
  if (command === "prepare") return prepare();
  if (command === "complete") return complete();

  throw new Error(`Unknown command: ${command}`);
}

run().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

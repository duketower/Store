#!/usr/bin/env node
/**
 * Daily article generation pipeline:
 *   Notion (Approved) → Gemini → draft Markdown file → Notion (Generated)
 *
 * Required env vars:
 *   NOTION_TOKEN          — Notion internal integration secret
 *   NOTION_DATABASE_ID    — ID of the "Binary Ventures Insights Pipeline" database
 *   GEMINI_API_KEY        — Google AI Studio API key
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.resolve(__dirname, "../src/content/insights/articles");

// ─── Config ──────────────────────────────────────────────────────────────────

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Keep this on a low-cost/free-tier friendly model. Override with GEMINI_MODEL if needed.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

// ─── Notion helpers ───────────────────────────────────────────────────────────

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
  if (prop.type === "select") return prop.select?.name ?? "";
  if (prop.type === "multi_select") return prop.multi_select.map((s) => s.name);
  if (prop.type === "date") return prop.date?.start ?? "";
  if (prop.type === "checkbox") return prop.checkbox;
  if (prop.type === "url") return prop.url ?? "";
  return "";
}

async function fetchApprovedTopic() {
  const data = await notionRequest("POST", "/databases/" + NOTION_DATABASE_ID + "/query", {
    filter: {
      property: "Status",
      select: { equals: "Approved" },
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
    category: getText(p.Category),
    market: getText(p.Market),
    primaryKeyword: getText(p["Primary Keyword"]),
    secondaryKeywords: getText(p["Secondary Keywords"]) || [],
    targetAudience: getText(p["Target Audience"]),
    angle: getText(p.Angle),
    brief: getText(p.Brief),
  };
}

async function updateNotionStatus(pageId, status, notes = "") {
  const properties = {
    Status: { select: { name: status } },
    "Last Automation Run": { date: { start: new Date().toISOString().split("T")[0] } },
  };
  if (notes) {
    properties.Notes = { rich_text: [{ text: { content: notes.slice(0, 2000) } }] };
  }
  if (status === "Generated") {
    properties["Generated Draft"] = { checkbox: true };
  }
  await notionRequest("PATCH", "/pages/" + pageId, { properties });
}

// ─── Gemini helpers ───────────────────────────────────────────────────────────

async function generateArticle(topic) {
  const today = new Date().toISOString().split("T")[0];
  const secondaryKeywordsText = Array.isArray(topic.secondaryKeywords)
    ? topic.secondaryKeywords.join(", ")
    : topic.secondaryKeywords;

  const prompt = `You are a business technology writer for Binary Ventures, an Indian tech company based in Indore.

Write a complete, high-quality article in Markdown format for the following topic.

## Article Brief

Title: ${topic.title}
Category: ${topic.category}
Market: ${topic.market}
Primary keyword: ${topic.primaryKeyword}
Secondary keywords: ${secondaryKeywordsText}
Target audience: ${topic.targetAudience}
Angle: ${topic.angle || "Practical, helpful guide"}
Additional brief: ${topic.brief || "None"}

## Requirements

- Start with the YAML frontmatter block (see format below), followed immediately by the article body.
- Minimum 900 words, maximum 1500 words.
- At least 5 clear headings (H2 or H3).
- Include a practical introduction.
- Include numbered steps or checklists where relevant.
- Include at least one CTA linking to: https://calendly.com/binaryventurespvtltd/30min
- Include a FAQ section with 3–4 relevant questions.
- Use the primary keyword naturally — do not stuff it.
- Write in clear, direct English. No jargon. No buzzwords.
- No fake client names. No fake statistics. No guarantees.
- Keep the tone professional and accessible for business owners.

## Frontmatter format

---
title: "ARTICLE TITLE HERE"
description: "ONE SENTENCE DESCRIPTION FOR SEO"
slug: "${topic.slug || slugify(topic.title)}"
date: "${today}"
updated: "${today}"
category: "${topic.category}"
market: "${topic.market}"
tags:
  - tag one
  - tag two
  - tag three
author: "Binary Ventures"
status: "draft"
canonical: "https://binaryventures.in/insights/${topic.slug || slugify(topic.title)}"
---

Output ONLY the frontmatter + article body. No preamble, no explanation.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`Gemini API error: ${JSON.stringify(data.error || data)}`);
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ─── Slug helpers ─────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── Frontmatter parser ───────────────────────────────────────────────────────

function parseFrontmatter(raw) {
  const match = raw.match(/---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const block = match[1];
  const get = (key) => {
    const m = block.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?`, "m"));
    return m ? m[1].trim() : "";
  };
  return {
    title: get("title"),
    description: get("description"),
    slug: get("slug"),
    date: get("date"),
    updated: get("updated"),
    category: get("category"),
    canonical: get("canonical"),
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(raw, fm) {
  const errors = [];
  const body = raw.replace(/^[\s\S]*?---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  const wordCount = body.trim().split(/\s+/).length;
  const headingCount = (body.match(/^#{1,3}\s/gm) || []).length;

  if (!fm.title) errors.push("Missing title");
  if (!fm.description) errors.push("Missing description");
  if (!fm.slug) errors.push("Missing slug");
  if (!fm.date) errors.push("Missing date");
  if (!fm.category) errors.push("Missing category");
  if (!fm.canonical) errors.push("Missing canonical");
  if (!/^https:\/\/binaryventures\.in\/insights\//.test(fm.canonical))
    errors.push("Canonical must use binaryventures.in insights URL");
  if (wordCount < 800) errors.push(`Too short: ${wordCount} words (min 800)`);
  if (headingCount < 4) errors.push(`Too few headings: ${headingCount} (min 4)`);
  if (/\[PLACEHOLDER\]|\[INSERT\]|\[ADD HERE\]/i.test(body))
    errors.push("Placeholder text found");
  if (!/calendly\.com/i.test(body)) errors.push("Missing CTA link to Calendly");

  const slugPath = path.join(ARTICLES_DIR, `${fm.slug}.md`);
  if (fs.existsSync(slugPath)) errors.push(`Article file already exists: ${fm.slug}.md`);

  return errors;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  // Check required env vars
  if (!NOTION_TOKEN || !NOTION_DATABASE_ID || !GEMINI_API_KEY) {
    console.error(
      "❌ Missing required env vars: NOTION_TOKEN, NOTION_DATABASE_ID, GEMINI_API_KEY"
    );
    process.exit(1);
  }

  console.log("🔍 Fetching approved topic from Notion...");
  const topic = await fetchApprovedTopic();

  if (!topic) {
    console.log("✅ No approved topics found. Nothing to generate today.");
    process.exit(0);
  }

  console.log(`📝 Generating article: "${topic.title}"`);

  let raw;
  try {
    raw = await generateArticle(topic);
  } catch (err) {
    console.error("❌ Gemini generation failed:", err.message);
    await updateNotionStatus(topic.pageId, "Needs Review", `Generation failed: ${err.message}`);
    process.exit(1);
  }

  // Strip any code fences Gemini may wrap around the output.
  raw = raw
    .replace(/^```[a-zA-Z0-9_-]*\r?\n/, "")
    .replace(/\r?\n```$/, "")
    .trim();

  const fm = parseFrontmatter(raw);
  if (!fm) {
    const msg = "Could not parse frontmatter from generated article";
    console.error("❌", msg);
    await updateNotionStatus(topic.pageId, "Needs Review", msg);
    process.exit(1);
  }

  const errors = validate(raw, fm);
  if (errors.length) {
    const msg = "Validation failed:\n" + errors.join("\n");
    console.error("❌", msg);
    await updateNotionStatus(topic.pageId, "Needs Review", msg);
    process.exit(1);
  }

  // Save article
  if (!fs.existsSync(ARTICLES_DIR)) {
    fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  }
  const filePath = path.join(ARTICLES_DIR, `${fm.slug}.md`);
  fs.writeFileSync(filePath, raw, "utf8");
  console.log(`✅ Article saved: src/content/insights/articles/${fm.slug}.md`);

  // Update Notion
  await updateNotionStatus(topic.pageId, "Generated");
  console.log(`✅ Notion status updated to: Generated`);
  console.log(`\n🎉 Done. Review the draft before publishing:\n   ${filePath}`);
  console.log('   To publish, change frontmatter status from "draft" to "published" and commit it.');
}

run().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});

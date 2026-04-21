#!/usr/bin/env node
/**
 * Trend discovery pipeline:
 *   Google News RSS signals -> Gemini topic selection -> Notion (Trend Found)
 *
 * Required env vars:
 *   NOTION_TOKEN
 *   NOTION_DATABASE_ID
 *   GEMINI_API_KEY
 */

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

const TODAY = new Date().toISOString().split("T")[0];
const MAX_TOPICS_TO_CREATE = Number(process.env.MAX_TREND_TOPICS || 5);

const TREND_QUERIES = [
  "small business automation India",
  "website maintenance India business",
  "AI chatbot small business India",
  "local business SEO India",
  "WhatsApp automation business India",
  "clinic appointment automation India",
  "school admission automation India",
  "business website cost India",
];

const ALLOWED_CATEGORIES = [
  "Guides",
  "Websites",
  "Web Apps",
  "Automation",
  "AI Chatbots",
  "Business Systems",
  "SEO & Growth",
  "Local Business",
];

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
  return "";
}

function decodeXml(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1].trim()) : "";
}

async function fetchGoogleNewsSignals() {
  const signals = [];

  for (const query of TREND_QUERIES) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
    const res = await fetch(url, {
      headers: { "User-Agent": "BinaryVenturesInsightsBot/1.0" },
    });
    if (!res.ok) {
      console.warn(`Skipping ${query}: RSS request failed with ${res.status}`);
      continue;
    }

    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 5);
    for (const [, item] of items) {
      signals.push({
        query,
        title: extractTag(item, "title"),
        link: extractTag(item, "link"),
        published: extractTag(item, "pubDate"),
      });
    }
  }

  return signals.filter((signal) => signal.title);
}

async function fetchExistingTopics() {
  const topics = [];
  let cursor;

  do {
    const body = {
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    };
    const data = await notionRequest("POST", `/databases/${NOTION_DATABASE_ID}/query`, body);
    for (const page of data.results || []) {
      topics.push({
        title: getText(page.properties.Title).toLowerCase(),
        slug: getText(page.properties.Slug).toLowerCase(),
      });
    }
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return topics;
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractJsonArray(raw) {
  const cleaned = raw
    .replace(/^```[a-zA-Z0-9_-]*\r?\n/, "")
    .replace(/\r?\n```$/, "")
    .trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemini did not return a JSON array");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function generateTopicSuggestions(signals, existingTopics) {
  const prompt = `You are planning SEO-friendly article topics for Binary Ventures, a practical technology company serving Indian businesses.

Use the trend signals below to propose ${MAX_TOPICS_TO_CREATE} useful article topics. The user will approve topics manually before articles are written.

Prefer topics that can help Indian business owners, local service businesses, schools, clinics, shops, and SMEs understand websites, automation, AI chatbots, business systems, SEO, and maintenance.

Avoid duplicate topics already in the database.

Allowed categories: ${ALLOWED_CATEGORIES.join(", ")}

Existing titles and slugs:
${JSON.stringify(existingTopics.slice(-200), null, 2)}

Trend signals:
${JSON.stringify(signals.slice(0, 40), null, 2)}

Return ONLY a JSON array. Each item must have:
{
  "title": "clear article title",
  "slug": "seo-friendly-slug",
  "category": "one allowed category",
  "market": "India" or a specific Indian city if the angle is local,
  "primaryKeyword": "main SEO keyword",
  "secondaryKeywords": ["keyword 1", "keyword 2", "keyword 3"],
  "targetAudience": "Local Business" or "SME Owner" or "School Owner" or "Clinic Owner",
  "angle": "specific editorial angle",
  "brief": "short article brief for the writer",
  "sourceTitles": ["source signal title 1", "source signal title 2"]
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.45,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`Gemini API error: ${JSON.stringify(data.error || data)}`);
  }

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return extractJsonArray(raw);
}

function uniqueSuggestions(suggestions, existingTopics) {
  const existingTitles = new Set(existingTopics.map((t) => t.title));
  const existingSlugs = new Set(existingTopics.map((t) => t.slug));
  const seenSlugs = new Set();

  return suggestions
    .map((topic) => ({
      ...topic,
      slug: slugify(topic.slug || topic.title),
      category: ALLOWED_CATEGORIES.includes(topic.category) ? topic.category : "Guides",
      market: topic.market || "India",
      secondaryKeywords: Array.isArray(topic.secondaryKeywords) ? topic.secondaryKeywords.slice(0, 6) : [],
      sourceTitles: Array.isArray(topic.sourceTitles) ? topic.sourceTitles.slice(0, 4) : [],
    }))
    .filter((topic) => topic.title && topic.slug)
    .filter((topic) => {
      const titleKey = topic.title.toLowerCase();
      const slugKey = topic.slug.toLowerCase();
      if (existingTitles.has(titleKey) || existingSlugs.has(slugKey) || seenSlugs.has(slugKey)) {
        return false;
      }
      seenSlugs.add(slugKey);
      return true;
    })
    .slice(0, MAX_TOPICS_TO_CREATE);
}

function richText(content) {
  return { rich_text: [{ text: { content: String(content || "").slice(0, 2000) } }] };
}

async function createNotionTopic(topic) {
  const brief = [
    topic.brief,
    topic.sourceTitles?.length ? `Trend signals: ${topic.sourceTitles.join(" | ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const properties = {
    Title: { title: [{ text: { content: topic.title.slice(0, 2000) } }] },
    Slug: richText(topic.slug),
    Status: { select: { name: "Trend Found" } },
    Category: { select: { name: topic.category } },
    Market: { select: { name: topic.market } },
    "Primary Keyword": richText(topic.primaryKeyword || topic.title),
    "Secondary Keywords": {
      multi_select: topic.secondaryKeywords.map((name) => ({ name: String(name).slice(0, 100) })),
    },
    "Target Audience": { select: { name: topic.targetAudience || "SME Owner" } },
    Angle: richText(topic.angle || "Helpful practical guide"),
    Brief: richText(brief),
    Notes: richText("Created by trend discovery automation. Review the topic and set Status to Topic Approved if you want an article draft."),
    "Last Automation Run": { date: { start: TODAY } },
  };

  await notionRequest("POST", "/pages", {
    parent: { database_id: NOTION_DATABASE_ID },
    properties,
  });
}

async function run() {
  if (!NOTION_TOKEN || !NOTION_DATABASE_ID || !GEMINI_API_KEY) {
    console.error("Missing required env vars: NOTION_TOKEN, NOTION_DATABASE_ID, GEMINI_API_KEY");
    process.exit(1);
  }

  console.log("Fetching trend signals...");
  const signals = await fetchGoogleNewsSignals();
  if (!signals.length) {
    console.log("No trend signals found today.");
    process.exit(0);
  }

  console.log("Fetching existing Notion topics...");
  const existingTopics = await fetchExistingTopics();

  console.log("Generating topic suggestions...");
  const suggestions = await generateTopicSuggestions(signals, existingTopics);
  const topics = uniqueSuggestions(suggestions, existingTopics);

  if (!topics.length) {
    console.log("No new unique topics to create.");
    process.exit(0);
  }

  for (const topic of topics) {
    await createNotionTopic(topic);
    console.log(`Created Trend Found topic: ${topic.title}`);
  }

  console.log(`Done. Created ${topics.length} Notion topic(s) for review.`);
}

run().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

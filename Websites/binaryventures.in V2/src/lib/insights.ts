import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

const ARTICLES_DIR = path.join(process.cwd(), "src/content/insights/articles");

export interface ArticleFrontmatter {
  title: string;
  description: string;
  slug: string;
  date: string;
  updated: string;
  category: string;
  market: string;
  tags: string[];
  author: string;
  status: string;
  canonical: string;
}

export interface Article extends ArticleFrontmatter {
  content: string;
  readingTime: number;
}

export interface ArticleMeta extends ArticleFrontmatter {
  readingTime: number;
}

export const insightCategories = [
  "Guides",
  "Websites",
  "Web Apps",
  "Automation",
  "AI Chatbots",
  "Business Systems",
  "SEO & Growth",
  "Local Business",
] as const;

function stripLeadingTitle(content: string): string {
  return content.replace(/^\s*# [^\n]+\n+/, "");
}

export function categoryToSlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function getCategoryBySlug(slug: string): string | null {
  return insightCategories.find((category) => categoryToSlug(category) === slug) ?? null;
}

function calcReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function getAllArticleSlugs(): string[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getAllArticles(): ArticleMeta[] {
  const slugs = getAllArticleSlugs();
  return slugs
    .map((slug) => {
      const raw = fs.readFileSync(path.join(ARTICLES_DIR, `${slug}.md`), "utf8");
      const { data, content } = matter(raw);
      return {
        ...(data as ArticleFrontmatter),
        readingTime: calcReadingTime(content),
      };
    })
    .filter((a) => a.status === "published")
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getArticlesByCategory(category: string): ArticleMeta[] {
  return getAllArticles().filter((article) => article.category === category);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const filePath = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = data as ArticleFrontmatter;
  if (frontmatter.status !== "published") return null;

  const articleBody = stripLeadingTitle(content);
  const processed = await remark().use(remarkHtml).process(articleBody);
  return {
    ...frontmatter,
    content: processed.toString(),
    readingTime: calcReadingTime(articleBody),
  };
}

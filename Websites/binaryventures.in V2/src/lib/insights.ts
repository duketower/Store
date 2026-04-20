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

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const filePath = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const processed = await remark().use(remarkHtml).process(content);
  return {
    ...(data as ArticleFrontmatter),
    content: processed.toString(),
    readingTime: calcReadingTime(content),
  };
}

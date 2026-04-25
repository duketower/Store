import type { MetadataRoute } from "next";
import { getAllIndexableServices, getServicePath } from "@/content/services";
import { categoryToSlug, getAllArticles, insightCategories } from "@/lib/insights";
import { getSupportingPagePath, supportingPages } from "@/content/supporting-pages";
import { caseStudies } from "@/content/work";

export const dynamic = "force-static";

const BASE_URL = "https://binaryventures.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/work`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/services`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/solutions`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE_URL}/insights`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = getAllArticles().map((article) => ({
    url: `${BASE_URL}/insights/${article.slug}`,
    lastModified: new Date(article.updated),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const serviceRoutes: MetadataRoute.Sitemap = getAllIndexableServices().map((service) => ({
    url: `${BASE_URL}${getServicePath(service.id)}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: service.level === "primary" ? 0.85 : 0.7,
  }));

  const caseStudyRoutes: MetadataRoute.Sitemap = caseStudies.map((caseStudy) => ({
    url: `${BASE_URL}/work/${caseStudy.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  const supportingRoutes: MetadataRoute.Sitemap = supportingPages.map((page) => ({
    url: `${BASE_URL}${getSupportingPagePath(page.slug)}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.72,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = insightCategories.map((category) => ({
    url: `${BASE_URL}/insights/category/${categoryToSlug(category)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...serviceRoutes,
    ...supportingRoutes,
    ...caseStudyRoutes,
    ...categoryRoutes,
    ...articleRoutes,
  ];
}

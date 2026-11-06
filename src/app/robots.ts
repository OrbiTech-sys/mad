import type { MetadataRoute } from "next";
import { SITE } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  // The proof of concept holds demo content, so crawlers are asked to stay out until launch.
  if (!SITE.poc.indexable) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/checkout"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}

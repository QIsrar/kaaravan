import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kaaravan.pk";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/category/*", "/product/*", "/store/*", "/search", "/sell"],
        disallow: ["/admin/*", "/seller/*", "/api/*", "/account/*", "/checkout/*"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

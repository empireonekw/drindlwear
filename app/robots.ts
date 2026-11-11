import type { MetadataRoute } from "next";

/** Keep search engines out of the API, admin and account pages. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/account", "/checkout", "/cart"] },
  };
}

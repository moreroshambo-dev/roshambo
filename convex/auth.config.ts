import { AuthConfig } from "convex/server";

// Keep this in sync with the site URL that issues your JWTs
// (CONVEX_SITE_URL in dev/prod). Default to the local dev server.
const siteUrl = process.env.CONVEX_SITE_URL ?? "http://localhost:5173";

export default {
  providers: [
    {
      domain: siteUrl,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;

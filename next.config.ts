import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // "Today" for every number on the site is the moment the site was built
  // ("latest 6 days ago", the 24-month window). Stamped once here because
  // Next.js doesn't allow reading the clock while pages are prerendered.
  env: {
    BUILD_DATE: new Date().toISOString(),
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

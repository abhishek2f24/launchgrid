import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'assets.jina.ai' },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Suppresses source map upload logs during builds
  silent: !process.env.CI,
  // Delete source maps after upload so they aren't shipped to the browser
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});

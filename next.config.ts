import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Removed: the case study described a store that was not a real customer.
      { source: '/blog/case-study-local-clothing-store-launchgrid', destination: '/blog', permanent: true },
    ];
  },
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

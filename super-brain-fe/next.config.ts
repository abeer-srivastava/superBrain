import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      // The bookmarklet capture page is opened as a popup from other sites; everything else refuses framing.
      { source: "/((?!capture).*)", headers: [...securityHeaders, { key: "X-Frame-Options", value: "DENY" }] },
      { source: "/capture", headers: securityHeaders },
    ];
  },
  async redirects() {
    return [
      { source: "/dashboard", destination: "/library", permanent: true },
      { source: "/search", destination: "/library", permanent: true },
      { source: "/account", destination: "/settings", permanent: true },
      { source: "/help", destination: "/settings", permanent: true },
      { source: "/auth/signin", destination: "/signin", permanent: true },
      { source: "/auth/signup", destination: "/signup", permanent: true },
    ];
  },
};

export default nextConfig;

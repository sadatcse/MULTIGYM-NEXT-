/** @type {import('next').NextConfig} */

// Baseline security headers for every page: no framing (clickjacking), no
// MIME sniffing, limited referrer, and no access to device sensors the HR
// panel never uses.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig = {
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    // Same normalization as useAxiosSecure: always target the /api prefix.
    const raw = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://multigym-hr-backend.vercel.app/api").replace(/\/$/, "");
    const backendUrl = raw.endsWith("/api") ? raw : `${raw}/api`;
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;

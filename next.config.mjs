/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Actions handle multi-megabyte tender uploads; raise the body cap.
    serverActions: {
      bodySizeLimit: "50mb",
      // Allow the action POST when the app is reached behind a proxy or via a
      // host that differs from the server's own (e.g. a preview/tunnel URL).
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000"],
    },
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Actions handle multi-megabyte tender uploads; raise the body cap.
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;

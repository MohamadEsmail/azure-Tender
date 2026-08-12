/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tender/brief packages reach tens of MB — allow large multipart uploads to
  // server actions. Individual file limits are enforced in the ingestion module.
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;

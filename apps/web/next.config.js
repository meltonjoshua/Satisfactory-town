/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@satisfactory-planner/shared"],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    };
    return config;
  },
};

module.exports = nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Claude Agent SDK ships a bundled native binary and uses dynamic requires;
  // Prisma's engine is likewise a native dependency. Keep them external to the
  // server bundle so Next's bundler doesn't break them.
  experimental: {
    serverComponentsExternalPackages: [
      "@anthropic-ai/claude-agent-sdk",
      "@prisma/client",
      "prisma",
    ],
  },
};

export default nextConfig;

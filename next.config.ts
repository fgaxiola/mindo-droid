import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-dialog",
      "@radix-ui/react-popover",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-progress",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-tabs",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
      "lucide-react",
      "date-fns",
    ],
  },
  // Turbopack handles bundle splitting automatically and more efficiently than webpack
  // No need for manual webpack config - Turbopack optimizes chunks automatically
  // For production builds, Turbopack will still use webpack internally if needed
  turbopack: {
    // Turbopack automatically optimizes bundle splitting
    // It's faster and more efficient than manual webpack configuration
  },
};

export default nextConfig;

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
  // Optimize bundle splitting
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for large libraries
            vendor: {
              name: "vendor",
              chunks: "all",
              test: /node_modules/,
              priority: 20,
            },
            // Separate chunk for TipTap (heavy library)
            tiptap: {
              name: "tiptap",
              test: /[\\/]node_modules[\\/]@tiptap[\\/]/,
              chunks: "all",
              priority: 30,
            },
            // Separate chunk for dnd-kit
            dndkit: {
              name: "dndkit",
              test: /[\\/]node_modules[\\/]@dnd-kit[\\/]/,
              chunks: "all",
              priority: 30,
            },
            // Separate chunk for Radix UI
            radix: {
              name: "radix",
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              chunks: "all",
              priority: 30,
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;

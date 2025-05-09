import createNextIntlPlugin from "next-intl/plugin";
import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // ppr: true,
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  webpack: (config, { isServer }) => {
    // Ensure single instance of @codemirror/state
    config.resolve.alias = {
      ...config.resolve.alias,
      "@codemirror/state": path.resolve("node_modules/@codemirror/state"),
    };

    // Optimize module resolution
    config.resolve.modules = [
      "node_modules",
      ...(config.resolve.modules || []),
    ];
    config.resolve.mainFields = ["browser", "module", "main"];

    // Add specific handling for CodeMirror, ProseMirror, and TipTap packages
    config.module.rules.push({
      test: /\.(js|mjs|jsx|ts|tsx)$/,
      include: [
        /[\\/]node_modules[\\/]@codemirror[\\/]/,
        /[\\/]node_modules[\\/]codemirror[\\/]/,
        /[\\/]node_modules[\\/]@tiptap[\\/]/,
        /[\\/]node_modules[\\/]prosemirror-[\w-]+[\\/]/,
      ],
      // This ensures these modules are processed correctly
      resolve: {
        fullySpecified: false,
      },
    });

    // Ensure single instances of key packages
    config.resolve.alias = {
      ...config.resolve.alias,
      "@codemirror/state": path.resolve("node_modules/@codemirror/state"),
      "@codemirror/view": path.resolve("node_modules/@codemirror/view"),
      "@codemirror/commands": path.resolve("node_modules/@codemirror/commands"),
      "@codemirror/language": path.resolve("node_modules/@codemirror/language"),
      "@codemirror/search": path.resolve("node_modules/@codemirror/search"),
      "@codemirror/autocomplete": path.resolve(
        "node_modules/@codemirror/autocomplete",
      ),
      "prosemirror-state": path.resolve("node_modules/prosemirror-state"),
      "prosemirror-view": path.resolve("node_modules/prosemirror-view"),
      "prosemirror-model": path.resolve("node_modules/prosemirror-model"),
    };

    return config;
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);

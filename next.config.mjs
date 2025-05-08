import createNextIntlPlugin from "next-intl/plugin";
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
      '@codemirror/state': require.resolve('@codemirror/state'),
    };

    // Optimize module resolution
    config.resolve.modules = ['node_modules', ...config.resolve.modules || []];
    config.resolve.mainFields = ['browser', 'module', 'main'];

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
      '@codemirror/state': require.resolve('@codemirror/state'),
      '@codemirror/view': require.resolve('@codemirror/view'),
      '@codemirror/commands': require.resolve('@codemirror/commands'),
      '@codemirror/language': require.resolve('@codemirror/language'),
      '@codemirror/search': require.resolve('@codemirror/search'),
      '@codemirror/autocomplete': require.resolve('@codemirror/autocomplete'),
      'prosemirror-state': require.resolve('prosemirror-state'),
      'prosemirror-view': require.resolve('prosemirror-view'),
      'prosemirror-model': require.resolve('prosemirror-model'),
    };

    return config;
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);

import { mergeConfig } from "vite";

export default {
  stories: [
    "../stories/**/*.stories.mdx",
    "../stories/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  framework: "@storybook/html-vite",
  async viteFinal(config) {
    // Merge custom configuration into the default config
    return mergeConfig(config, {
      // Add storybook-specific dependencies to pre-optimization
      optimizeDeps: {
        include: ["storybook-addon-designs"],
      },
    });
  },
};

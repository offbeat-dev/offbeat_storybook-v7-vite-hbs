import { mergeConfig } from "vite";
import path from "path";
import RollupInjectPlugin from "@rollup/plugin-inject";
import ViteHandlebars from "./vitePlugins/ViteHandlebars";

export default {
  stories: ["../stories/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    {
      name: "@storybook/addon-essentials",
      options: {
        actions: false,
      },
    },
    "@storybook-addon-designs",
    "@storybook/addon-interactions",
  ],
  framework: "@storybook/html-vite",
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          story: path.resolve(__dirname, "./utils/story.js"),
        },
      },
      commonjsOptions: {
        transformMixedEsModules: true,
        exclude: [
          "node_modules/lodash-es/**",
          "node_modules/@types/lodash-es/**",
        ],
      },
      plugins: [ViteHandlebars(), RollupInjectPlugin({ story: "story" })],
      optimizeDeps: {
        include: [
          "@storybook/addon-essentials",
          "@storybook-addon-designs",
          "@storybook/addon-interactions",
        ],
      },
    });
  },
};

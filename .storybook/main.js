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
  ],
  framework: "@storybook/html-vite",
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          story: path.resolve(__dirname, "./utils/story.js"),
        },
      },
      plugins: [ViteHandlebars({}), RollupInjectPlugin({ story: "story" })],
    });
  },
};

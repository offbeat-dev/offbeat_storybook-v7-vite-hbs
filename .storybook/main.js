import { mergeConfig } from "vite";
import path from "path";
import fs from "fs";
import RollupInjectPlugin from "@rollup/plugin-inject";
import ViteHandlebars from "./vitePlugins/ViteHandlebars";
const config = require("../config");
const { paths } = config.dir;

const readHbsPartialDirectories = () => {
  const directories = [`../${paths.srcModules}/`, `../${paths.srcComponents}/`];
  const readdir = (directory) =>
    fs
      .readdirSync(path.resolve(__dirname, directory))
      .map((dir) => directory + dir)
      .filter((dir) => !path.extname(dir));

  return directories
    .concat(...directories.map((directory) => readdir(directory)))
    .map((directory) => path.resolve(__dirname, directory));
};

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
      plugins: [
        ViteHandlebars({
          helperDirs: path.resolve("handlebars"),
          partialDirs: readHbsPartialDirectories(),
          precompileOptions: {
            knownHelpersOnly: false,
          },
        }),
        RollupInjectPlugin({ story: "story" }),
      ],
    });
  },
};

import { mergeConfig } from "vite";
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import RollupInjectPlugin from "@rollup/plugin-inject";

const jsHandlebars = (userOptions = {}) => {
  return {
    name: "vite-js-handlebars",
    enforce: "pre",
    transform(code, id) {
      if (/\.(hbs)$/.test(id)) {
        const buf = fs.readFileSync(id).toString(); //read contents of .hbs file
        const templateFunction = Handlebars.precompile(buf); //precompile the template reduces runtime overhead
        let compiled = ""; //create a string to hold the compiled template
        compiled += "import HandlebarsCompiler from 'handlebars/runtime';\n";
        compiled +=
          "export default HandlebarsCompiler['default'].template(" +
          templateFunction.toString() +
          ");\n";

        return {
          code: compiled,
          map: { mappings: "" },
        };
      }
    },
  };
};

export default {
  stories: ["../stories/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-interactions"],
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
      plugins: [jsHandlebars(), RollupInjectPlugin({ story: "story" })],
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

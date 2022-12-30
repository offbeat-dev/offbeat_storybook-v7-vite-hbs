import { mergeConfig } from "vite";
import Handlebars from "handlebars";
import fs from "fs";

const jsHandlebars = (userOptions = {}) => {
  return {
    name: "vite-js-handlebars",
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
      plugins: [jsHandlebars()],
      optimizeDeps: {
        include: [
          "@storybook/addon-essentials",
          "storybook-addon-designs",
          "@storybook/addon-interactions",
        ],
      },
    });
  },
};

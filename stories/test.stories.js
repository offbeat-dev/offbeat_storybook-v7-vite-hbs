import template from "../stories/test.hbs";
//this works and needs to be reproduced by the plugin
//import Handlebars from "handlebars";
// Handlebars.registerPartial("partial", "<button>partial</button>");
// const templateFunction = Handlebars.compile(
//   "{{> partial}}<button>main</button>"
// );
// console.log(templateFunction({}));

export default {
  title: "Button",
  argTypes: {
    text: {
      name: "Text",
      control: "text",
    },
  },
};

export const Primary = story.build(
  template,
  { text: "this comes from main component" },
  "padded"
);

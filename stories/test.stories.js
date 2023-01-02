import template from "../src/html/modules/test.hbs";

export default {
  title: "Button",
  argTypes: {
    text: {
      name: "Text",
      control: "text",
    },
  },
};

export const Primary = story.build(template, { text: "maybe" }, "padded");

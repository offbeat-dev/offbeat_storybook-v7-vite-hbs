import template from "../stories/test.hbs";
import build from "../.storybook/utils/story.js";

export default {
  title: "Button",
  argTypes: {
    text: {
      name: "Text",
      control: "text",
    },
  },
};

export const Primary = build(template, { text: "maybe" }, "padded");

// export const Primary = build(
//   template,
//   {
//     text: "Hello ",
//   },
//   "padded"
// );

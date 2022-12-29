export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/html/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "Button",
};

export const Primary = {
  render: (args) => {
    const btn = document.createElement("button");
    btn.innerText = args.label;

    const mode = args.primary
      ? "storybook-button--primary"
      : "storybook-button--secondary";
    btn.className = ["storybook-button", "storybook-button--medium", mode].join(
      " "
    );

    return btn;
  },
  args: {
    primary: false,
    label: "Button test",
  },
};

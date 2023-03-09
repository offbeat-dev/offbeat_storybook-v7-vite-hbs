export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  backgrounds: {
    default: "light",
    values: [
      {
        name: "light",
        value: "#ffffff",
      },
      {
        name: "dark",
        value: "#000000",
      },
    ],
  },
};

export const decorators = [
  (storyFn) => {
    console.log("PREVIEW.JS -- decorators: ", storyFn);
    return storyFn();
  },
];

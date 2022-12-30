export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

export const decorators = [
  (storyFn) => {
    console.log("PREVIEW.JS -- decorators: ", storyFn);
    return storyFn();
  },
];

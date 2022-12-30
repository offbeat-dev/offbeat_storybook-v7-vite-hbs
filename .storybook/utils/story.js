const build = (template, args, layout = "fullscreen") => {
  const Template = ((args) => template({ ...args })).bind({});
  Template.args = args;
  return Template;
};

export default build;

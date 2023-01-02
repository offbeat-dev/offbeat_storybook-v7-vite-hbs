module.exports = (context, options) =>
  typeof context === 'string'
    ? options.fn(JSON.parse(context))
    : options.fn(context);

import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import async from "async";

const versionCheck = (hbCompiler, hbRuntime) => {
  console.table({
    "Handlebars Compiler": { version: hbCompiler.COMPILER_REVISION },
    "Handlebars Runtime": {
      version: (hbRuntime["default"] || hbRuntime).COMPILER_REVISION,
    },
  });

  return (
    hbCompiler.COMPILER_REVISION ===
    (hbRuntime["default"] || hbRuntime).COMPILER_REVISION
  );
};

const init = async (code, id, userOptions) => {
  const runtimePath = require.resolve("handlebars/runtime");
  if (!versionCheck(Handlebars, require(runtimePath))) {
    throw new Error(
      "Handlebars compiler version does not match runtime version"
    );
  }
  const extensions = [".handlebars", ".hbs", ""];
  const rootRelative = "./";
  let foundPartials = {};
  let foundHelpers = {};
  let foundUnclearStuff = {};
  let knownHelpers = {};

  const hb = Handlebars.create();
  let JavaScriptCompiler = hb.JavaScriptCompiler;

  function MyJavaScriptCompiler() {
    JavaScriptCompiler.apply(this, arguments);
  }

  MyJavaScriptCompiler.prototype = Object.create(JavaScriptCompiler.prototype);
  MyJavaScriptCompiler.prototype.compiler = MyJavaScriptCompiler;
  MyJavaScriptCompiler.prototype.nameLookup = function (parent, name, type) {
    if (type === "partial") {
      if (name === "@partial-block") {
        // this is a built in partial, no need to require it
        return JavaScriptCompiler.prototype.nameLookup.apply(this, arguments);
      }
      if (foundPartials["$" + name]) {
        return "require(" + JSON.stringify(foundPartials["$" + name]) + ")";
      }
      foundPartials["$" + name] = null;
      return JavaScriptCompiler.prototype.nameLookup.apply(this, arguments);
    } else if (type === "helper") {
      console.log("type helper", name);
      if (foundHelpers["$" + name]) {
        console.log(
          "found helper",
          name,
          "__default(require(" + JSON.stringify(foundHelpers["$" + name]) + "))"
        );
        return (
          "__default(require(" + JSON.stringify(foundHelpers["$" + name]) + "))"
        );
      }
      foundHelpers["$" + name] = null;
      return JavaScriptCompiler.prototype.nameLookup.apply(this, arguments);
    } else if (type === "context") {
      // This could be a helper too, save it to check it later
      if (!foundUnclearStuff["$" + name]) foundUnclearStuff["$" + name] = false;
      return JavaScriptCompiler.prototype.nameLookup.apply(this, arguments);
    } else {
      return JavaScriptCompiler.prototype.nameLookup.apply(this, arguments);
    }
  };

  hb.JavaScriptCompiler = MyJavaScriptCompiler;

  // Define custom visitor for further template AST parsing
  let Visitor = Handlebars.Visitor;
  function InternalBlocksVisitor() {
    this.partialBlocks = [];
    this.inlineBlocks = [];
  }

  InternalBlocksVisitor.prototype = new Visitor();
  InternalBlocksVisitor.prototype.PartialBlockStatement = function (partial) {
    this.partialBlocks.push(partial.name.original);
    Visitor.prototype.PartialBlockStatement.call(this, partial);
  };
  InternalBlocksVisitor.prototype.DecoratorBlock = function (partial) {
    if (partial.path.original === "inline") {
      this.inlineBlocks.push(partial.params[0].value);
    }
    Visitor.prototype.DecoratorBlock.call(this, partial);
  };

  // Parse the template
  let firstCompile = true;
  let compilationPass = 0;

  function compile() {
    let slug = "";
    console.log("\nCompilation pass %d", ++compilationPass);
    function referenceToRequest(ref, type) {
      if (/^\$/.test(ref)) {
        return ref.substring(1);
      }

      // Use a relative path for helpers if helper directories are given
      // unless automatic relative helper resolution has been turned off
      if (
        type === "helper" &&
        userOptions.helperDirs &&
        userOptions.helperDirs.length &&
        rootRelative !== ""
      ) {
        console.log("./" + ref);
        return "./" + ref;
      }

      return rootRelative + ref;
    }
    // Need another compiler pass?
    let needRecompile = false;

    // Precompile template
    let template = "";

    // AST holder for current template
    let ast = null;

    // Compile options
    let opts = Object.assign(
      {
        knownHelpersOnly: !firstCompile,
        // TODO: Remove these in next major release
        preventIndent: !!userOptions.preventIndent,
        compat: !!userOptions.compat,
      },
      {
        knownHelpers: knownHelpers,
      }
    );

    try {
      if (id) {
        const buf = fs.readFileSync(id).toString();
        ast = hb.parse(buf, opts);
        template = hb.precompile(buf, opts);
      }
    } catch (err) {
      return (err) => {
        throw err;
      };
    }

    const resolve = function (request, type, callback) {
      var contexts = [];

      // Any additional helper dirs will be added to the searchable contexts
      if (userOptions.helperDirs) {
        contexts = contexts.concat(userOptions.helperDirs);
      }

      // Any additional partial dirs will be added to the searchable contexts
      if (userOptions.partialDirs) {
        contexts = contexts.concat(userOptions.partialDirs);
      }

      const resolveWithContexts = function () {
        let context = contexts.shift();
        let traceMsg = path.normalize(path.join(context, request));
        console.log("Attempting to resolve %s %s", type, traceMsg);
        console.log("request=%s", request);

        const next = function (err) {
          if (contexts.length > 0) {
            resolveWithContexts();
          } else {
            console.log("Failed to resolve %s %s", type, traceMsg);
            return callback(err);
          }
        };

        try {
          const result = require(path.normalize(path.join(context, request)));
          console.log("Resolved %s %s", type, traceMsg);
          return callback(null, result);
        } catch (e) {
          return next({ err: true });
        }
      };

      resolveWithContexts();
    };

    const resolveUnclearStuffIterator = function (stuff, unclearStuffCallback) {
      if (foundUnclearStuff[stuff]) return unclearStuffCallback();
      var request = referenceToRequest(stuff.substr(1), "unclearStuff");

      if (userOptions.ignoreHelpers) {
        unclearStuffCallback();
      } else {
        resolve(request, "unclearStuff", function (err, result) {
          if (!err && result) {
            knownHelpers[stuff.substr(1)] = true;
            foundHelpers[stuff] = result;
            needRecompile = true;
          }
          foundUnclearStuff[stuff] = true;
          unclearStuffCallback();
        });
      }
    };

    const defaultPartialResolver = function defaultPartialResolver(
      request,
      callback
    ) {
      request = referenceToRequest(request, "partial");
      // Try every extension for partials
      var i = 0;
      (function tryExtension() {
        if (i >= extensions.length) {
          var errorMsg = `Partial${request}not found`;
          return callback(new Error(errorMsg));
        }
        var extension = extensions[i++];

        resolve(request + extension, "partial", function (err, result) {
          if (!err && result) {
            return callback(null, result);
          }
          tryExtension();
        });
      })();
    };

    const resolvePartialsIterator = function (partial, partialCallback) {
      if (foundPartials[partial]) return partialCallback();
      // Strip the # off of the partial name
      var request = partial.substr(1);

      var partialResolver =
        userOptions.partialResolver || defaultPartialResolver;

      if (userOptions.ignorePartials) {
        return partialCallback();
      } else {
        partialResolver(request, function (err, resolved) {
          if (err) {
            var visitor = new InternalBlocksVisitor();
            visitor.accept(ast);
            if (
              visitor.inlineBlocks.indexOf(request) !== -1 ||
              visitor.partialBlocks.indexOf(request) !== -1
            ) {
              return partialCallback();
            } else {
              return partialCallback(err);
            }
          }
          foundPartials[partial] = resolved;
          needRecompile = true;
          return partialCallback();
        });
      }
    };

    const resolveHelpersIterator = function (helper, helperCallback) {
      if (foundHelpers[helper]) return helperCallback();
      var request = referenceToRequest(helper.substr(1), "helper");

      if (userOptions.ignoreHelpers) {
        helperCallback();
      } else {
        var defaultHelperResolver = function (request, callback) {
          return resolve(request, "helper", callback);
        };

        var helperResolver = defaultHelperResolver;

        helperResolver(request, function (err, result) {
          if (!err && result) {
            knownHelpers[helper.substr(1)] = true;
            foundHelpers[helper] = result;
            needRecompile = true;
            return helperCallback();
          }

          // We don't return an error: we just fail to resolve the helper.
          // This is b/c Handlebars calls nameLookup with type=helper for non-helper
          // template options, e.g. something that comes from the template data.
          helperCallback();
        });
      }
    };

    const doneResolving = function (err) {
      if (err)
        return (err) => {
          throw err;
        };

      // Do another compiler pass if not everything was resolved
      if (needRecompile) {
        firstCompile = false;
        return compile();
      }

      let slug =
        "import HandlebarsCompiler from " +
        JSON.stringify(runtimePath) +
        ");\n" +
        'exports default HandlebarsCompiler["default"].template(' +
        template +
        ");\n";

      console.log("done", slug.toString());
    };

    const resolveItems = function (err, type, items, iterator, callback) {
      if (err) return callback(err);
      var itemKeys = Object.keys(items);
      console.log("Attempting to resolve ", type, ":", itemKeys);
      // Resolve path for each item
      async.each(itemKeys, iterator, callback);
    };

    const resolvePartials = function (err) {
      resolveItems(
        err,
        "partials",
        foundPartials,
        resolvePartialsIterator,
        doneResolving
      );
    };

    const resolveUnclearStuff = function (err) {
      resolveItems(
        err,
        "unclearStuff",
        foundUnclearStuff,
        resolveUnclearStuffIterator,
        resolvePartials
      );
    };

    const resolveHelpers = function (err) {
      resolveItems(
        err,
        "helpers",
        foundHelpers,
        resolveHelpersIterator,
        resolveUnclearStuff
      );
    };

    resolveHelpers();
  }

  return compile();
};

const ViteHandlebars = (options = {}) => {
  return {
    name: "vite-js-handlebars",
    enforce: "pre",
    transform(code, id) {
      if (/\.(hbs)$/.test(id)) {
        console.log("Compiling Handlebars template: " + id);
        const buf = fs.readFileSync(id).toString(); //read contents of .hbs file
        const templateFunction = Handlebars.precompile(buf); //precompile the template reduces runtime overhead
        const partialFunction = Handlebars.precompile(
          "<strong>{{prop}}</strong>"
        ); //compile the template to a function

        let compiled = ""; //create a string to hold the compiled template
        compiled += "import Handlebars from 'handlebars/runtime';\n";
        compiled +=
          "Handlebars.registerPartial('testpartial', Handlebars.template(" +
          partialFunction.toString() +
          "));\n";
        compiled +=
          "export default Handlebars.template(" +
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

export default ViteHandlebars;

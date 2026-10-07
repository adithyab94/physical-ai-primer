// Loads all data/*.js files into a sandbox and returns window.PAI. Used by validate.js and build-sources.js.
const fs = require("fs"), path = require("path"), vm = require("vm");
module.exports = function loadData(root) {
  const ctx = { window: {} }; ctx.window.window = ctx.window; vm.createContext(ctx);
  const run = (f) => vm.runInContext(fs.readFileSync(path.join(root, f), "utf8").replace(/\bPAI\b/g, "window.PAI").replace(/window\.window\.PAI/g, "window.PAI"), ctx, { filename: f });
  run("data/meta.js");
  ctx.window.PAI.meta.dataFiles.forEach(run);
  return ctx.window.PAI;
};

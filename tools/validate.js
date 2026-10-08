#!/usr/bin/env node
// Schema check for data files. Usage: node tools/validate.js   (exit code 1 on errors)
const path = require("path");
const ROOT = path.join(__dirname, "..");
const PAI = require("./load-data")(ROOT);
const errors = [], warn = [];
const req = (obj, keys, where) => keys.forEach(k => { if (obj[k] === undefined || obj[k] === null || obj[k] === "") errors.push(`${where}: missing ${k}`); });
const MAT = ["research", "pilot", "production"], OPEN = ["open", "closed", "mixed"], STATUS = ["current", "superseded", "deprecated"];
const WHERE = ["cloud", "onprem", "sim", "edge", "robot"], TECH = ["il", "rl", "classical", "sim2real", "real2sim", "real2sim2real", "fm", "wam", "icl"];
const frontierIds = new Set((PAI.data.frontier.items || []).map(i => i.id));
const glossIds = new Set((PAI.data.glossary.terms || []).map(t => t.id));
const toolIds = {};
PAI.meta.stages.forEach(sm => {
  const st = PAI.stages[sm.id]; const W = sm.id;
  if (!st) return errors.push(`${W}: data missing`);
  req(st, ["id", "num", "title", "version", "last_verified", "purpose", "mental_model", "interface", "methods", "decision", "tools", "where", "tech", "stacks", "example", "pitfalls", "numbers", "papers", "open_problems", "self_check", "upstream", "downstream", "handoff_short"], W);
  if ((st.papers || []).length > 6) errors.push(`${W}: more than 6 papers`);
  if ((st.self_check || []).length !== 5) errors.push(`${W}: self_check must have 5 questions`);
  WHERE.forEach(k => { if (!st.where || !st.where[k]) errors.push(`${W}: where.${k} missing`); });
  TECH.forEach(k => { if (!st.tech || !st.tech[k]) errors.push(`${W}: tech.${k} missing`); });
  const mids = new Set();
  (st.methods || []).forEach(m => { req(m, ["id", "name", "summary"], `${W} method`); if (mids.has(m.id)) errors.push(`${W}: duplicate method id ${m.id}`); mids.add(m.id); if (m.frontier_ref && !frontierIds.has(m.frontier_ref)) errors.push(`${W}: method ${m.id} frontier_ref '${m.frontier_ref}' not in frontier.js`); });
  toolIds[W] = new Set();
  (st.tools || []).forEach(t => {
    const w = `${W} tool ${t.id}`;
    req(t, ["id", "name", "what", "maker", "open", "license", "maturity", "best_for", "limitations", "link", "added", "last_verified", "status"], w);
    if (!OPEN.includes(t.open)) errors.push(`${w}: open must be one of ${OPEN}`);
    if (!MAT.includes(t.maturity)) errors.push(`${w}: maturity must be one of ${MAT}`);
    if (!STATUS.includes(t.status)) errors.push(`${w}: status must be one of ${STATUS}`);
    if (t.status !== "current" && !t.superseded_by) warn.push(`${w}: non-current status without superseded_by`);
    if (!t.release && !t.release_note) warn.push(`${w}: no release date and no release_note`);
    if (t.release && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(t.release)) errors.push(`${w}: release must be YYYY, YYYY-MM or YYYY-MM-DD`);
    if (!/^https?:\/\//.test(t.link || "")) errors.push(`${w}: link must be absolute http(s)`);
    (t.runs || []).forEach(r => { if (!WHERE.includes(r)) errors.push(`${w}: unknown runs tag ${r}`); });
    (t.tech || []).forEach(r => { if (!TECH.includes(r)) errors.push(`${w}: unknown tech tag ${r}`); });
    if (toolIds[W].has(t.id)) errors.push(`${w}: duplicate tool id`); toolIds[W].add(t.id);
  });
  (st.papers || []).forEach(p => req(p, ["title", "year", "url"], `${W} paper`));
});
// cross-references inside inline markup
const refRe = /\[\[([sgvft]):([^\]|]+)/g;
function checkRefs(text, where) {
  let m; while ((m = refRe.exec(String(text)))) {
    const [k, ref] = [m[1], m[2]];
    if (k === "g" && !glossIds.has(ref)) errors.push(`${where}: glossary ref '${ref}' missing`);
    if (k === "f" && !frontierIds.has(ref)) errors.push(`${where}: frontier ref '${ref}' missing`);
    if (k === "v" && !PAI.meta.views.some(v => v.id === "view-" + ref.split("#")[0])) errors.push(`${where}: view ref '${ref}' missing`);
    if (k === "s") { const id = "stage-" + ref.split("#")[0].padStart(2, "0"); if (!PAI.stages[id]) errors.push(`${where}: stage ref '${ref}' missing`); }
    if (k === "t") { const [s, t] = ref.split(":"); const id = "stage-" + s.padStart(2, "0"); if (!toolIds[id] || !toolIds[id].has(t)) errors.push(`${where}: tool ref '${ref}' missing`); }
  }
}
function walk(o, where) { if (typeof o === "string") return checkRefs(o, where); if (Array.isArray(o)) return o.forEach((x, i) => walk(x, where)); if (o && typeof o === "object") Object.keys(o).forEach(k => walk(o[k], where)); }
Object.keys(PAI.stages).forEach(k => walk(PAI.stages[k], k));
Object.keys(PAI.data).forEach(k => walk(PAI.data[k], "data/" + k));
// frontier schema
(PAI.data.frontier.items || []).forEach(i => req(i, ["id", "name", "definition", "differs", "replaces", "papers", "readiness", "readiness_note", "verdict", "verdict_note", "stages", "added", "last_verified", "status"], `frontier ${i.id}`));
(PAI.data.frontier.timeline || []).forEach(e => { if (e.ref && !frontierIds.has(e.ref)) errors.push(`timeline '${e.label}': ref ${e.ref} missing`); });
warn.forEach(w => console.log("warn  " + w));
errors.forEach(e => console.log("ERROR " + e));
console.log(`${Object.keys(PAI.stages).length} stages, ${Object.values(PAI.stages).reduce((a, s) => a + s.tools.length, 0)} tools, ${frontierIds.size} frontier items, ${glossIds.size} glossary terms — ${errors.length} errors, ${warn.length} warnings`);
process.exit(errors.length ? 1 : 0);

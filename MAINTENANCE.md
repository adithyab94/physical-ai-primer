# Maintenance guide

This site is static HTML + CSS + JS with no build step. It opens from `file://`: every page loads its data with `<script>` tags (no `fetch`). Content lives in `data/*.js`; HTML pages are thin shells that `assets/app.js` renders.

```
index.html                 landing page, master diagram, changelog
stages/NN-name.html        one shell per stage (renders data/stage-NN.js)
views/*.html               integration views (some static HTML + data-render blocks)
assets/style.css           all styling; colour tokens for light/dark at the top
assets/app.js              rail, top bar, search, filters, sorting, theme, renderers
data/meta.js               version, dates, page registry, tag vocabulary, changelog
data/stage-NN.js           all content for stage NN
data/frontier.js           frontier items + timeline
data/glossary.js           glossary terms
data/views.js              paradigms, reference architectures, runtime processes
data/roadmap.js            learning projects
data/capstone.js           20 capstone questions
tools/validate.js          schema + cross-reference check (Node, optional)
tools/build-sources.js     regenerates sources.md from the data files (Node, optional)
sources.md                 every external link, grouped by stage
```

The `tools/` scripts are maintenance aids. The site never needs them to run.

## Data schema

### Stage file (`data/stage-NN.js`)

```js
window.PAI = window.PAI || {}; PAI.stages = PAI.stages || {};
PAI.stages["stage-NN"] = {
  id, num, title, short, version, last_verified,          // strings; last_verified = YYYY-MM-DD
  upstream:   [{ id: "stage-XX", what }],                  // feeds this stage
  downstream: [{ id: "stage-XX", what }],                  // consumes its output
  handoff_short,                                           // one line for the landing-page table
  purpose,                                                 // two sentences
  interface: { inputs: [{name, format, rate, from}], outputs: [{name, format, rate, to}], handoff },
  mental_model, mental_detail,                             // one idea + optional paragraphs ("\n\n" splits)
  methods: [{ id, name, tags: [], frontier: bool, frontier_ref: "<frontier id>", summary, pros, cons, refs: [{t, u}] }],
  extras:  [{ title, note, columns: [], rows: [[]] }],     // optional extra tables under Methods
  decision: [{ if, use, why }],
  tools: [ TOOL ],
  where: { cloud, onprem, sim, edge, robot: { l: 0..3, n: "note" } },
  tech:  { il, rl, classical, sim2real, real2sim, real2sim2real, fm, wam, icl: { l: 0..3, n } },
  stacks: { open: { title, items: [], note }, industry: { title, items: [], note } },
  example: { summary, artifacts: [{ artifact, format, shape, consumer }], humanoid },
  pitfalls: [{ t, d }],
  numbers:  [{ m, v, s }],                                 // quantity, value, source
  papers:   [{ title, year, venue, url, why }],            // max 6
  open_problems: [],
  self_check: [{ q, a }],                                  // exactly 5
  annotation_matrix: [...]                                 // stage-04 only; feeds the modality view
};
```

### Tool entry (`TOOL`)

| Field | Meaning |
|---|---|
| `id` | Stable, unique within the stage. Used for deep links `stage#t-<id>` and `[[t:NN:id]]`. Never reuse. |
| `name`, `what`, `maker` | Display name, one-line description, organisation |
| `open` | `open`, `closed` or `mixed` (e.g. open code, closed weights) |
| `license` | Licence text as published |
| `maturity` | `research`, `pilot` or `production` |
| `best_for`, `limitations` | One line each |
| `release` | `YYYY-MM-DD`, `YYYY-MM` or `YYYY`; `null` if no tagged releases |
| `version` | Release tag / version label shown under the date |
| `release_note` | Shown when `release` is null (e.g. `rolling`, `continuous (SaaS)`) |
| `link` | Source link found during research (release page preferred) |
| `runs` | Subset of `cloud onprem sim edge robot` |
| `tech` | Subset of `il rl classical sim2real real2sim real2sim2real fm wam icl` |
| `frontier` | `true` to badge as frontier |
| `added`, `last_verified` | Dates |
| `status` | `current`, `superseded` or `deprecated` |
| `superseded_by` | Name of the replacement (required if not current) |

Superseded entries stay in the table, struck through. Do not delete history.

### Frontier item (`data/frontier.js`)

`id, name, category, tags[], stages[] (e.g. "07"), definition, differs, replaces, papers [{t, u, y}], open_impl, closed_impl, readiness (research|pilot|production), readiness_note, verdict (breakthrough|important|incremental), verdict_note, added, last_verified, status, superseded_by`.
Timeline events: `{ date: "YYYY-MM-DD", label, kind: breakthrough|important|incremental|infra, ref: "<frontier id>" }`.

### Glossary term

`{ id, term, aka: [], def, see: [] }`. The `see` items use inline markup.

### Inline markup (any string field)

| Markup | Renders as |
|---|---|
| `**bold**`, `` `code` `` | bold, code |
| `[text](https://…)` | external link (new tab) |
| `[[s:07]]`, `[[s:07#m-wam\|text]]` | stage link (anchors: section ids such as `tools`, `m-<method id>`, `t-<tool id>`) |
| `[[v:paradigms\|text]]` | view link (view id without `view-`) |
| `[[g:term-id\|text]]` | glossary entry |
| `[[f:item-id\|text]]` | frontier entry |
| `[[t:07:tool-id\|text]]` | tool row on a stage page |

## How to…

### Update a tool's release
1. Check the official release page. GitHub listings rendered by some fetchers omit the year: confirm the year on PyPI or the release post. If you cannot confirm it, add “(year inferred)” to `version`.
2. Edit `release`, `version`, `last_verified` in the stage file.
3. Add a changelog entry to `data/meta.js` (date, version, stage, change, why, source).
4. Run `node tools/validate.js`.

### Add a tool
Add a `TOOL` object to the stage's `tools` array with a new unique `id`, then validate. The row appears in the table, search and filters automatically.

### Mark a tool superseded
Set `status: "superseded"` and `superseded_by: "<replacement>"`, then add the replacement as a new entry. Keep the old row.

### Add a frontier concept
1. Add an item to `data/frontier.js` (all fields), with `stages` pointing at the pipeline locations.
2. Optionally add a timeline event with `ref` = the item id.
3. In each affected stage, add or update a method with `frontier: true` and `frontier_ref: "<id>"`.
4. Validate; the method gains a FRONTIER badge and a link to the entry.

### Add a stage
1. Add it to `PAI.meta.stages` (order matters: it drives the rail, pager and matrices) and its file to `PAI.meta.dataFiles`.
2. Create `data/stage-NN.js` following the schema.
3. Create the shell `stages/NN-name.html` by copying another stage shell and changing `data-id`, the `<title>` and the data script.
4. If it should appear on the master diagram, add coordinates in `MAP_LAYOUT` and edges in `MAP_EDGES` in `assets/app.js`.
5. Add the data file to the script list of `index.html`, `views/traces.html` and `views/what-goes-where.html` (they show all stages).

### Re-verify the site
1. For every stage: re-check tool releases, statuses and links; update `last_verified` on each changed entry and on the stage.
2. Re-run the frontier scan for the period since `PAI.meta.research_window` ended; add items, adjust verdicts (an item can move from `research` to `pilot` or be marked `superseded`).
3. Re-check regulatory dates in stage 14 (AI Act, Machinery Regulation, CRA, PLD, ISO 25785-1 status).
4. Bump `PAI.meta.version` (semver: patch = data refresh, minor = new items/sections, major = structural change), `last_verified`, `research_window`, and add a changelog entry.
5. Run `node tools/validate.js` and `node tools/build-sources.js`.
6. Open `index.html` from disk and click through: search (`/`), filter chips, table sorting, theme toggle. The browser console must stay clean.

## Design tokens

Colours are tokens on `:root` in `assets/style.css`, redefined for dark mode under `@media (prefers-color-scheme: dark)` (guarded by `:root:not([data-theme="light"])`) and under `:root[data-theme="dark"]`. Technique tags use one hue each (`--t-rl`, `--t-il`, …) everywhere. Change colours only through tokens.

# Physical AI Systems Map

An interactive, multi-page reference of the complete physical AI pipeline, from problem definition to fleet deployment. It covers 15 stages and 10 integration views and was verified in October 2026.

Open `index.html` in a browser; no server or build step is needed.

- **Stages** (`stages/`): each follows the same 16-section template: interface contract, mental model, methods, decision guide, a sortable tool table with release dates and links, the running example, pitfalls, numbers, papers, open problems and a self-check.
- **Integration views** (`views/`): end-to-end traces of a bimanual connector-mating robot and a humanoid; a what-goes-where matrix; a modality × annotation matrix; an on-robot runtime architecture; a paradigm comparison (VLA / WAM / diffusion / RL / classical); three reference architectures; a frontier scan with timeline; a learning roadmap; a capstone self-test; and a glossary.
- **Data** (`data/`): all content, tools, papers and frontier items as JS data files. See `MAINTENANCE.md` for the schema and the update procedure, and `sources.md` for every source grouped by stage.

Optional maintenance tools (Node ≥ 18): `node tools/validate.js` checks the schema and cross-references; `node tools/build-sources.js` regenerates `sources.md`.

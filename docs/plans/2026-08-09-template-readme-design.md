# Conference Template README Design

## Goal

Turn the repository README into a Traditional Chinese operator and developer guide for reusing the site as a single-conference Notion-backed template.

## Design

- Explain the runtime architecture and single-conference model first.
- Document the registry database contract and every website page/section mapping.
- Document each source database's expected fields, types, aliases, and display behavior.
- Separate Notion-managed content from code-managed branding, navigation, layout, animation, and fallback content.
- Provide a practical customization checklist, deployment steps, verification commands, and troubleshooting notes.
- Keep code identifiers and Notion property names in English while explaining them in Traditional Chinese.

## Verification

Cross-check every documented key and field against API handlers, registry parsers, App consumers, environment examples, theme constants, and package scripts. Run Markdown-focused content checks and the repository test/lint/build suite.

# Rename Papers Section Design

## Goal

Rename the Call for Participation papers navigation and heading, and follow the Notion registry section key that has already changed from `Papers and Talks` to `Papers`.

## Design

- Display `Papers` in the submission submenu.
- Display `Call for Papers` as the papers section heading.
- Resolve Notion page content with section key `papers` only.
- Rename the local block variable to match the new single source name.
- Keep the Notion page body and fallback copy unchanged.

## Verification

Add source-contract assertions for the visible labels and registry lookup, then run the complete test, lint, and production build commands.

# Map Submission Organizers Design

## Goal

Show the organizers whose Notion roles correspond to each visible Call for Participation page.

## Design

- The Papers page selects organizers whose role contains `paper`.
- The Posters and Demos page selects organizers whose role contains `poster` or `demo`.
- Matching remains case-insensitive and accepts singular, plural, and extended role labels such as `Co-Chair`.
- Organizer cards remain at the bottom of each page.
- The Notion database schema remains unchanged.

## Verification

Add source-contract tests for both role mappings, then run the complete test suite, TypeScript lint, and production build.

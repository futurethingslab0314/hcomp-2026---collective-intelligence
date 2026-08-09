# Registry Enabled Visibility Design

## Goal

Treat an unchecked Notion registry `enabled` checkbox as an explicit instruction to hide its website section and navigation control.

## Design

- Add a lightweight visibility-only mode to `/api/content` that returns every normalized page/section key with its enabled state without loading source content.
- Load that manifest once in the frontend.
- Hide a main navigation page when all of its registry sections are disabled.
- Hide each Call for Participation tab when its matching section is disabled.
- Missing visibility metadata and API failures remain permissive so transient failures do not erase navigation.
- Enabled content continues through the existing lazy content-loading path; disabled sources are never queried.

## Verification

Test visibility helpers and source contracts, then run all tests, TypeScript lint, and production build.

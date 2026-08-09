# Show All General Chairs Design

## Goal

Show every organizer whose Notion role contains `general` in the homepage Current Conference panel.

## Design

- Replace the single `.find()` selection with a case-insensitive `.filter()` using the existing role helper.
- Change the chair feature component to accept an organizer array.
- Render every matching organizer in a responsive grid: one column on mobile and multiple columns on larger screens.
- Preserve each organizer's role, photo, name, organization, and email.
- Render the existing fallback chair only when no matching organizer exists.

## Verification

Add source-contract assertions for array filtering and multi-person rendering, then run tests, TypeScript lint, and the production build.

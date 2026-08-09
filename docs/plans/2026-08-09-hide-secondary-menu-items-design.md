# Hide Secondary Menu Items Design

## Goal

Hide `Code of Conduct` and `Past Meeting` from both desktop and mobile navigation without deleting their page components, registry loading, or Notion-backed data.

## Design

Both navigation variants render the same `sections` array in `src/App.tsx`. Removing the two entries from that array is the single source change needed to hide them consistently. The `SectionId` variants, page render branches, and content components remain intact so the pages can be restored later without reconstructing their implementation.

## Testing

A source contract test will identify the `sections` array and verify it does not contain the `coc` or `past-meetings` menu entries. Existing tests, TypeScript checking, and the production build verify that retaining the page branches does not create errors.

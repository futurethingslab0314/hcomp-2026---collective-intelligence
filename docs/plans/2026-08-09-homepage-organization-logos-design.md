# Homepage Organization Logos Design

## Goal

Add a Notion-managed organization Logo area at the bottom of the Home page.

## Design

- Read a Registry database source at `home page` / `logo area`.
- Parse `Logo Name`, `area`, and `logo`, accepting either a URL or Files & media value for the image.
- Group records in this order: `main organizers`, `co-organizers`, `Supporting Organizations`, `Sponsors`.
- Display the groups as 主辦單位、共同主辦、協辦單位、贊助單位.
- Omit empty groups and hide the entire area when the Registry row is disabled or contains no usable logos.
- Render responsive, wrapping logo cards on a light surface for logo legibility.

## Registry Setup

- `page_key`: `home page`
- `section_key`: `logo area`
- `source_type`: `database`
- `source_id`: `3b7a7f1b413c806e8627dc2469ded445`
- `enabled`: checked

## Verification

Test parsing, grouping source contracts, Registry lookup, and enabled behavior; then run tests, TypeScript lint, and production build.

# Notion Conference Year Design

## Goal

Use the `year` property from the main record in the Notion `conference info` database as the single source for labels that identify the current conference edition.

## Data flow

`parseConferenceInfoContent` reads the main record's `year` property and returns it with the other conference metadata. `App` derives one `conferenceYear`, falling back to the local `CONFERENCE_CONTENT.hero.year` while Notion is loading or when the property is empty. The value is then passed to sections and reusable people grids that render current-edition labels.

The two-digit menu mark is derived from the last two digits of `conferenceYear`. The browser document title is updated when the Notion value becomes available.

## In scope

- Navigation logo (`HCOMP'26`)
- Hero year
- Browser title
- Current HCOMP and CI labels in organizer and sponsor displays
- Current-edition topic placeholders
- Current-edition copy on the home, submission, organizer, sponsor, and venue pages

## Out of scope

- Past Meetings years
- Fixed ACM policy dates and subsidy years
- URLs and discount codes
- Deadline dates, which have their own Notion-backed content source
- Static build metadata that is not rendered in the running application

## Failure behavior

The current local year remains the fallback, so the page never renders an empty year during loading or when Notion is unavailable.

## Testing

Parser tests cover string and numeric Notion year values and the empty fallback shape. Type checking and a production build verify that the year is propagated through all affected React components.

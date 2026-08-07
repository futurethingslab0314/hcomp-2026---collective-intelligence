# Single Conference Data Model Design

## Goal

Convert the site from a joint HCOMP/CI experience into one conference whose current name and edition metadata come from the main record in the Notion `conference info` database. If that record's `name` changes from `HCOMP` to `TAICHI`, all current-conference labels should update without code changes.

## Data model

The main `conference info` record is the single source of truth for current-conference identity:

- `name`: short public name, such as `TAICHI`
- `long name`: expanded conference name used in the hero
- `year`: current edition year
- `about`, `conference info`, location, and event date: supporting conference copy

Organizer and topic databases no longer need a `conference` property. Every enabled record returned for those sections belongs to the one current conference.

Local HCOMP values remain temporary fallbacks while Notion is loading or when a field is empty, so an API failure does not leave headings blank.

## API and parsing

`/api/organizers` returns one sorted organizer list instead of `{ hcomp, ci }`. Sorting uses `order`, then role/name where appropriate, and does not inspect a conference label.

The frontend conference API normalizes that response into `Organizer[]`. Registry parsers return one topic list, one topic brief, one organizer list, and one past-meeting list. They do not bucket records by conference.

During deployment compatibility, the organizer response normalizer may accept the previous grouped response as a fallback, but all internal application state and rendered behavior use the flat single-conference shape.

## Interface changes

The homepage becomes a single conference narrative:

- retain the hero, conference introduction, topics, and current organizer information;
- remove the CI co-location statement and the complete CI Track 2 column;
- render the retained conference content as one full-width section;
- use the Notion-backed conference name in current-edition labels.

The submission page removes the HCOMP/CI topic switcher and renders all topic records as one list. Copy referring to two communities, track selection, separate proceedings, or separate awards is removed or rewritten for one conference.

The organizer page shows one team. Organizer cards and sponsor contacts use the current Notion-backed conference name and year. The past-meetings page shows one history and removes the CI tab and CI archive. Current-conference labels in navigation, page copy, sponsor copy, venue copy, and the browser title use the same conference name.

## Failure and empty states

If Notion conference info cannot be loaded, the site falls back to the static HCOMP name, long name, and year. Empty organizer or topic databases show their existing coming-soon states. Records are not discarded merely because they lack a `conference` property.

## Testing

Parser tests verify that the conference name is read from string Notion properties and that missing data yields an empty parser value for the application fallback. New tests cover flat topic, organizer, and past-meeting parsing without `conference` fields. API normalization tests cover the new flat organizer payload and the temporary legacy-response fallback. Type checking and a production build verify all React call sites after the grouped models and CI branches are removed.

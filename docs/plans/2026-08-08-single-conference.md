# Single Conference Data Model Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the site represent one Notion-defined conference, with the main conference-info record's `name` driving current conference labels and no CI-specific branches or database fields.

**Architecture:** Flatten grouped conference data at the API/parser boundary so React receives one organizer list, one topic list, and one past-meeting list. Derive `conferenceName`, `conferenceYear`, and the long name once in `App`, use local HCOMP content only as an availability fallback, and pass the derived identity to sections that render current-edition labels.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Vercel serverless functions, Notion API, Node test runner via `tsx`.

---

### Task 1: Flatten registry parsers

**Files:**
- Modify: `src/lib/registryParsers.test.ts`
- Modify: `src/lib/registryParsers.ts`

**Step 1: Write failing parser tests**

Add tests proving that:

```ts
parseConferenceInfoContent([record({ name: 'TAICHI', year: 2027 })]).heroName === 'TAICHI';
parseTopicSections([record({ name: 'Human-AI teams', topic: ['Coordination'] })])
  // returns one TopicSection[] even without `conference`
parseConferenceTopicBriefs([record({ brief_topic_of_interests: 'One conference brief' })])
  // returns the one brief string
parseOrganizers([record({ name: 'Ada', Role: 'General Chair' })])
  // returns one OrganizerPerson[] even without `conference`
parsePastMeetings([record({ year: 2025, name: 'Annual Meeting' })])
  // returns one PastMeetingRecord[] even without `conference`
```

**Step 2: Run tests and verify RED**

Run: `./node_modules/.bin/tsx --test src/lib/registryParsers.test.ts`

Expected: FAIL because the current parsers return `{ hcomp, ci }`, require conference buckets, or expose topic briefs as grouped values.

**Step 3: Implement the flat parser shapes**

- Remove `ConferenceTopicBriefs` and all conference-bucket normalization.
- Remove `conference` from `TopicSection`, `OrganizerPerson`, and `PastMeetingRecord`.
- Make `parseTopicSections`, `parseOrganizers`, and `parsePastMeetings` return sorted arrays.
- Make `parseConferenceTopicBriefs` return the first available brief string.
- Keep `parseConferenceInfoContent.heroName` sourced from the main record's `name`.

**Step 4: Run tests and verify GREEN**

Run: `./node_modules/.bin/tsx --test src/lib/registryParsers.test.ts src/lib/notionContent.test.ts`

Expected: all tests PASS.

**Step 5: Commit**

```bash
git add src/lib/registryParsers.ts src/lib/registryParsers.test.ts
git commit -m "refactor: flatten conference registry data"
```

### Task 2: Flatten the organizer API contract

**Files:**
- Create: `src/lib/conferenceApi.test.ts`
- Modify: `src/lib/conferenceApi.ts`
- Modify: `api/organizers.ts`
- Modify: `README.md`

**Step 1: Write failing organizer normalization tests**

Export the organizer payload normalizer for focused testing and assert:

```ts
normalizeOrganizers({ organizers: [{ name: 'Ada', organization: 'Example U' }] })
// returns [{ name: 'Ada', org: 'Example U', ... }]

normalizeOrganizers({ hcomp: [{ name: 'Legacy' }], ci: [] })
// temporarily returns the legacy HCOMP list for rolling-deploy compatibility
```

The normalized organizer type must not include a `conference` discriminator.

**Step 2: Run tests and verify RED**

Run: `./node_modules/.bin/tsx --test src/lib/conferenceApi.test.ts`

Expected: FAIL because the current normalizer is private and returns `OrganizerGroups`.

**Step 3: Implement the flat API**

- Replace `OrganizerGroups` with `Organizer[]` throughout the client contract.
- Return `{ organizers: sorted }` from `/api/organizers`.
- Sort by `order`, then name, without reading `conference`.
- Keep legacy `{ hcomp, ci }` input support only inside the client normalizer.
- Update README database requirements to remove the organizer `conference` property and describe the conference-info `name` source.

**Step 4: Run tests and verify GREEN**

Run: `./node_modules/.bin/tsx --test src/lib/conferenceApi.test.ts`

Expected: all tests PASS.

**Step 5: Commit**

```bash
git add api/organizers.ts src/lib/conferenceApi.ts src/lib/conferenceApi.test.ts README.md
git commit -m "refactor: expose one organizer collection"
```

### Task 3: Propagate the dynamic conference identity through React

**Files:**
- Modify: `src/App.tsx`

**Step 1: Establish a failing static contract check**

Before editing, run:

```bash
rg -n "OrganizerGroups|activeTopicTrack|activePastMeetingTab|PastCISection|Collective Intelligence|CI \\${conferenceYear}|HCOMP \\${conferenceYear}" src/App.tsx
```

Expected: matches identify the grouped state, CI-only components, track switcher, and hard-coded current-conference labels that must disappear.

**Step 2: Derive one conference identity**

At the `App` boundary, derive:

```ts
const conferenceName = conferenceInfoContent.heroName.trim() || CONFERENCE_CONTENT.hero.title;
const conferenceYear = conferenceInfoContent.year.trim() || CONFERENCE_CONTENT.hero.year;
```

Set the document title and navigation brand from those values and pass `conferenceName` with `conferenceYear` to current-edition sections.

**Step 3: Flatten organizer UI**

- Change homepage and organization state to `Organizer[]`.
- Remove conference bucketing and unassigned-conference rendering.
- Render one organizer grid/column titled `${conferenceName} Team`.
- Render sponsor contact labels as `${conferenceName} ${conferenceYear}`.
- Update organization intro text to use the dynamic name.

**Step 4: Flatten homepage and submission UI**

- Replace the dual-track homepage comparison with one full-width conference section using Notion conference info, topic records, and the one general chair.
- Remove the co-location copy, `hoveredTrack`, Track 2, and View Past CI action.
- Remove `activeTopicTrack` and the HCOMP/CI topic toggle from Submission.
- Render the single brief and topic array directly.
- Rewrite current visible fallback submission wording so it describes one conference and uses `conferenceName` where appropriate.

**Step 5: Flatten past meetings UI**

- Remove `activePastMeetingTab`, its event detail handling, the HCOMP/CI switcher, and `PastCISection`.
- Feed the single `parsePastMeetings` array to the retained past-meetings component.
- Replace fixed current-edition back labels and archive description with `conferenceName`.

**Step 6: Run type checking and build**

Run: `npm run lint`

Expected: PASS with no TypeScript errors.

Run: `npm run build`

Expected: PASS and Vite emits the production bundle.

**Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat: render one Notion-defined conference"
```

### Task 4: Remove remaining CI-only fallback data and verify the site

**Files:**
- Modify: `src/constants/content.ts`
- Modify: `src/constants/pastMeetings.ts`
- Modify: `src/constants/assets.ts`

**Step 1: Record the remaining CI-specific matches**

Run:

```bash
rg -n "Collective Intelligence|CI/HCOMP|CI or HCOMP|CI and HCOMP|PAST_CI|about\.ci|organization\.ci|CI 20" src README.md
```

Expected: FAIL the cleanup criterion by returning CI-only fallback content and archives.

**Step 2: Remove CI-only fallback content**

- Delete the CI about block, CI organizer fallback group, and CI past-meeting archive.
- Remove CI community photos/assets that exclusively represent the removed conference.
- Rewrite retained static submission fallback text for one conference, keeping HCOMP-specific fallback copy only where it is used when Notion is unavailable.
- Do not remove ordinary English words that happen to contain the letters `ci`; target semantic CI conference references only.

**Step 3: Verify the static cleanup**

Run the same `rg` command.

Expected: no semantic CI conference references remain in active `src` or README content.

**Step 4: Run the full verification suite**

Run: `./node_modules/.bin/tsx --test src/lib/*.test.ts`

Expected: all tests PASS.

Run: `npm run lint`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

Run: `git diff --check`

Expected: no whitespace errors.

**Step 5: Commit**

```bash
git add src/constants/content.ts src/constants/pastMeetings.ts src/constants/assets.ts
git commit -m "chore: remove CI conference fallback content"
```

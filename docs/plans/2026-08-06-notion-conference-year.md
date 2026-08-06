# Notion Conference Year Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make all current-conference year labels use the Notion `conference info.year` value with a safe local fallback.

**Architecture:** Extend the existing conference-info parser instead of reading raw database records in components. Derive the effective year once in `App`, then pass it to the page sections and reusable grids that render current-edition labels.

**Tech Stack:** React 19, TypeScript, Node test runner via `tsx`, Vite

---

### Task 1: Parse the Notion conference year

**Files:**
- Create: `src/lib/registryParsers.test.ts`
- Modify: `src/lib/registryParsers.ts`

**Step 1: Write the failing test**

Add tests that call `parseConferenceInfoContent` with a main conference-info record containing `year: 2027` and assert that the returned `year` is `"2027"`. Also cover a string year and an empty record list.

**Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/tsx --test src/lib/registryParsers.test.ts`

Expected: FAIL because `ConferenceInfoContent` does not return a `year` property.

**Step 3: Write minimal implementation**

Add `year: string` to `ConferenceInfoContent` and populate it with:

```ts
year: mainRecord ? getStringField(mainRecord, ['year']) : '',
```

**Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/tsx --test src/lib/registryParsers.test.ts`

Expected: all tests PASS.

### Task 2: Propagate one effective year through the UI

**Files:**
- Modify: `src/App.tsx`

**Step 1: Derive the effective year in App**

Read the parsed conference info from `registryContent`, calculate `conferenceYear` with `CONFERENCE_CONTENT.hero.year` as fallback, calculate its two-digit label, and update `document.title` in an effect.

**Step 2: Replace current-edition literals**

Pass `conferenceYear` to the home, submission, venue, organization, and sponsor sections plus reusable organizer/contact grids. Replace only current-conference labels and copy. Keep past-meeting years, policy dates, deadlines, URLs, and discount codes unchanged.

**Step 3: Run type checking**

Run: `npm run lint`

Expected: TypeScript exits successfully with no errors.

### Task 3: Verify the complete change

**Files:**
- Inspect: `src/App.tsx`
- Inspect: `src/lib/registryParsers.ts`
- Inspect: `src/lib/registryParsers.test.ts`

**Step 1: Search for unintended current-edition literals**

Run: `rg -n "HCOMP 2026|CI 2026|HCOMP'26|hero\\.year" src/App.tsx`

Expected: no current-edition UI literal remains; fixed policy dates may still contain `2026` elsewhere.

**Step 2: Run all tests**

Run: `./node_modules/.bin/tsx --test src/lib/*.test.ts`

Expected: all tests PASS.

**Step 3: Run the production build**

Run: `npm run build`

Expected: Vite build exits successfully.

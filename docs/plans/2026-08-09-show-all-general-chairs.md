# Show All General Chairs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Display all General organizers side by side in the homepage Current Conference panel.

**Architecture:** Derive a `generalChairs` array from the existing organizer API response and pass it into a pluralized chair component. The component builds a fallback item only for an empty array and maps the resulting list into a responsive grid.

**Tech Stack:** React, TypeScript, Node test runner, Tailwind CSS, Vite

---

### Task 1: Render all General organizers

**Files:**
- Modify: `src/lib/singleConferenceUi.test.ts`
- Modify: `src/App.tsx`

**Step 1: Write the failing test**

Assert that the homepage uses `.filter()` for roles containing `general`, passes the array to the chair component, and maps all people in a responsive grid.

**Step 2: Verify the test fails**

Run: `./node_modules/.bin/tsx --test src/lib/singleConferenceUi.test.ts`

Expected: FAIL because the page currently uses `.find()` and a single-person component.

**Step 3: Implement the minimal UI change**

Rename `GeneralChairFeature` to `GeneralChairsFeature`, accept `people`, render the fallback only for an empty list, and map all items in a responsive grid.

**Step 4: Verify the repository**

Run:

```bash
./node_modules/.bin/tsx --test src/lib/*.test.ts
npm run lint
npm run build
```

Expected: all commands exit successfully.

**Step 5: Commit**

Commit the design, plan, test, and implementation with an intentional feature message.

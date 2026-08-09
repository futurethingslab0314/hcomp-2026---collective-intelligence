# Map Submission Organizers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Map Papers, Posters, and Demos organizer cards to the matching Notion role labels.

**Architecture:** Reuse the existing case-insensitive `roleIncludes` helper in `SubmissionSection`. Change only the keyword lists that derive the two organizer collections, leaving rendering and the Notion schema unchanged.

**Tech Stack:** React, TypeScript, Node test runner, Vite

---

### Task 1: Update organizer role mappings

**Files:**
- Modify: `src/lib/singleConferenceUi.test.ts`
- Modify: `src/App.tsx`

**Step 1: Write the failing test**

Assert that Papers filters on `paper`, while Posters and Demos filters on both `poster` and `demo`.

**Step 2: Verify the test fails**

Run: `./node_modules/.bin/tsx --test src/lib/singleConferenceUi.test.ts`

Expected: FAIL because the existing keyword lists use `program` and combined poster/demo phrases.

**Step 3: Implement the minimal mapping change**

Replace the Papers keywords with `['paper']` and the Posters and Demos keywords with `['poster', 'demo']`.

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

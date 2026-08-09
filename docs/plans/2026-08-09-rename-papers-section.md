# Rename Papers Section Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rename the Call for Participation papers UI and use the new Notion `papers` section key.

**Architecture:** Keep the registry data model unchanged and update only the consumer key and visible UI strings in `SubmissionSection`. A source-contract test protects the exact Notion lookup and labels.

**Tech Stack:** React, TypeScript, Node test runner, Vite, ESLint

---

### Task 1: Rename the papers section

**Files:**
- Modify: `src/lib/singleConferenceUi.test.ts`
- Modify: `src/App.tsx`

**Step 1: Write the failing test**

Add assertions that `SubmissionSection` contains the `papers` registry key, submenu label `Papers`, and heading `Call for Papers`, and no longer contains the old lookup or visible strings.

**Step 2: Run the focused test to verify it fails**

Run: `npm test -- src/lib/singleConferenceUi.test.ts`

Expected: FAIL because `App.tsx` still uses `papers and talks`, `Papers and Talks`, and `Call for Papers and Talks`.

**Step 3: Write the minimal implementation**

Update the registry lookup to `papers`, rename `papersAndTalksBlocks` to `papersBlocks`, and replace the two visible labels.

**Step 4: Run verification**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all commands pass.

**Step 5: Commit**

```bash
git add src/App.tsx src/lib/singleConferenceUi.test.ts docs/plans/2026-08-09-rename-papers-section-design.md docs/plans/2026-08-09-rename-papers-section.md
git commit -m "feat: rename papers submission section"
```

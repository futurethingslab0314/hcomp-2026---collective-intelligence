# Hide Secondary Menu Items Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Hide Code of Conduct and Past Meeting from desktop and mobile navigation while retaining both pages.

**Architecture:** Update the shared `sections` navigation array used by both responsive menu variants. Add a source contract test so the hidden items cannot accidentally return to the menu while the underlying page branches remain available.

**Tech Stack:** React 19, TypeScript 5.8, Node test runner through `tsx`, Vite 6.

---

### Task 1: Hide the two shared menu entries

**Files:**
- Modify: `src/lib/singleConferenceUi.test.ts`
- Modify: `src/App.tsx:209-217`

**Step 1: Write the failing test**

Read the `sections` array from `src/App.tsx` and assert it does not contain these entries:

```ts
assert.doesNotMatch(menuSource, /id: 'coc'/);
assert.doesNotMatch(menuSource, /id: 'past-meetings'/);
```

The test must scope `menuSource` to the text between `const sections = [` and the following `];`, so retained page branches do not cause false failures.

**Step 2: Run the focused test to verify RED**

Run: `./node_modules/.bin/tsx --test src/lib/singleConferenceUi.test.ts`

Expected: FAIL because both IDs are currently present in the shared menu array.

**Step 3: Implement the minimal change**

Delete only these two objects from `sections`:

```ts
{ id: 'coc', label: 'Code of Conduct', icon: ShieldCheck },
{ id: 'past-meetings', label: 'Past Meeting', icon: BookOpen },
```

Do not remove either value from `SectionId`, registry loading, render branches, or page components.

**Step 4: Run verification**

Run: `./node_modules/.bin/tsx --test src/lib/*.test.ts`

Expected: all tests PASS.

Run: `npm run lint`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/App.tsx src/lib/singleConferenceUi.test.ts
git commit -m "feat: hide secondary navigation items"
```

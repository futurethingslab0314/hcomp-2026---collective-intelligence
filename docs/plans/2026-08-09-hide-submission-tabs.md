# Hide Submission Tabs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Hide Doctoral Consortium and CrowdCamp from both responsive Call for Participation submenus without removing their content.

**Architecture:** Modify only the shared `tabs` array in `SubmissionSection`. Protect the intended split between hidden navigation and retained content with a focused source contract test.

**Tech Stack:** React 19, TypeScript 5.8, Node test runner through `tsx`, Vite 6.

---

### Task 1: Hide the two submission submenu entries

**Files:**
- Modify: `src/lib/singleConferenceUi.test.ts`
- Modify: `src/App.tsx:1536-1544`

**Step 1: Write the failing test**

Extract source text between `const tabs = [` and the following `];`, then assert:

```ts
assert.doesNotMatch(tabSource, /id: 'dc'/);
assert.doesNotMatch(tabSource, /id: 'crowdcamp'/);
assert.match(appSource, /activeTab === 'dc'/);
assert.match(appSource, /activeTab === 'crowdcamp'/);
```

**Step 2: Run the focused test to verify RED**

Run: `./node_modules/.bin/tsx --test src/lib/singleConferenceUi.test.ts`

Expected: FAIL because both IDs remain in `tabs`.

**Step 3: Implement the minimal change**

Delete only:

```ts
{ id: 'dc', label: 'Doctoral Consortium' },
{ id: 'crowdcamp', label: 'CrowdCamp' },
```

Keep the active-tab type, Notion reads, organizer filters, and both conditional render branches.

**Step 4: Verify**

Run: `./node_modules/.bin/tsx --test src/lib/*.test.ts`

Expected: all tests PASS.

Run: `npm run lint`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/App.tsx src/lib/singleConferenceUi.test.ts
git commit -m "feat: hide secondary submission tabs"
```

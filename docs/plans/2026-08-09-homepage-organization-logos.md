# Homepage Organization Logos Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Render four Notion-managed organization logo groups at the bottom of the Home page.

**Architecture:** Add a focused parser for the Logo database, then pass parsed records into a presentational Home page component. The existing Registry content and visibility helpers control data loading and disabled-state hiding.

**Tech Stack:** React, TypeScript, Notion API, Tailwind CSS, Node test runner, Vite

---

### Task 1: Parse Logo records

Add a failing parser test for `Logo Name`, `area`, and URL/Files logo values. Implement a typed `parseOrganizationLogos` parser.

### Task 2: Render Logo groups

Add a failing source-contract test for the `home page` / `logo area` lookup, four ordered groups, and visibility guard. Implement the responsive bottom-of-home section.

### Task 3: Verify and document

Update README with the new mapping/schema, run `./node_modules/.bin/tsx --test src/lib/*.test.ts`, `npm run lint`, and `npm run build`, then commit.

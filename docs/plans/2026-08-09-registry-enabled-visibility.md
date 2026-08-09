# Registry Enabled Visibility Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Hide website sections and their navigation controls when the Notion registry row is unchecked.

**Architecture:** `/api/content?visibility_only=1` returns a cheap visibility manifest. Shared helpers interpret missing metadata as enabled, while App and SubmissionSection filter navigation from explicit false values.

**Tech Stack:** React, TypeScript, Vercel functions, Node test runner, Vite

---

### Task 1: Add visibility contracts

Add failing tests for section/page visibility semantics and frontend/API source contracts.

### Task 2: Implement visibility manifest

Add shared types/helpers, API visibility-only response, frontend fetch, main navigation filtering, and submission tab filtering.

### Task 3: Verify and commit

Run `./node_modules/.bin/tsx --test src/lib/*.test.ts`, `npm run lint`, and `npm run build`; then commit.

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8f58d37e-1342-42e0-8a46-800b1ddc0be5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Notion via Vercel

This site now reads the `Program` and `Organizers` sections from Vercel serverless API routes backed by Notion.

Set these environment variables in Vercel Project Settings:

- `NOTION_API_KEY`
- `NOTION_PROGRAM_DATABASE_ID`
- `NOTION_ORGANIZER_DATABASE_ID`

Expected Notion database properties:

- `program database`: `Date`, `start_time`, `end_time`, `Topic`, `location`, `keywords`
- `organizer database`: `Name`, `organization`, `Role`, `photos`, `order`, `email`
- `conference info database` main record: `name`, `long name`, `year`, `about`, `conference info`

API routes used by the frontend:

- `/api/program`
- `/api/organizers`

Notes:

- `keywords` can be either `select` or `multi_select`. Values like `keynote`, `networking`, and `social` are used to style session types.
- The site represents one conference. Organizer and topic records do not need a `conference` property.
- The main conference-info record's `name` is the short name shown across the site (for example, changing it to `TAICHI` updates current-conference labels).
- `photos` should be a Notion `files` field if you want organizer headshots to appear.
- In local `vite` development, if `/api/*` is not available, the UI automatically falls back to the existing static content.

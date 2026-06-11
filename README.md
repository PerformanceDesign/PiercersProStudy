<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Piercer's Pro-Study

This app is being migrated from live AI-generated lessons to a source-backed documentation database.

Lessons should come from uploaded PDF documentation stored in Supabase, with optional source citations by document and page.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create [.env.local](.env.local) with:
   `VITE_SUPABASE_URL=your-project-url`
   `VITE_SUPABASE_ANON_KEY=your-anon-key`
3. Run `supabase/schema.sql` in the Supabase SQL editor.
4. Run the app:
   `npm run dev`

## Content Architecture

- `documents` stores uploaded PDF metadata.
- `document_chunks` stores extracted source text.
- `lessons` stores reviewed lesson content by topic.
- `lesson_sources` links lessons back to source PDFs and pages.

The frontend reads published lessons from Supabase through `services/lessonService.ts`.

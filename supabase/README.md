# Supabase Content Database

This app is now shaped around a source-backed content model instead of live AI lesson generation.

## Required Environment

Create `.env.local` with:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Database Setup

Run `supabase/schema.sql` in the Supabase SQL editor.

Create a private/public storage bucket named:

```txt
source-documents
```

## Current Frontend Contract

The frontend expects:

- published lessons in `lessons`
- optional source citations in `lesson_sources`
- visible documents in `documents`
- a future Edge Function named `process-pdf`

`process-pdf` should receive:

```json
{
  "path": "storage-path.pdf",
  "filename": "original-file-name.pdf"
}
```

It should return a document row shaped like:

```json
{
  "id": "uuid",
  "filename": "aftercare.pdf",
  "title": "Aftercare Manual",
  "description": null,
  "topic_tags": ["Aftercare"],
  "status": "draft",
  "created_at": "2026-06-11T00:00:00Z"
}
```

## Recommended Next Step

Build PDF ingestion as a draft publishing workflow:

1. Upload PDF to `source-documents`.
2. Extract text into `document_chunks`.
3. Map chunks to one or more `topic_title` values.
4. Create draft records in `lessons`.
5. Let an admin review and publish lessons.

Avoid open anon write policies. Use the service role key only in a protected server-side context.

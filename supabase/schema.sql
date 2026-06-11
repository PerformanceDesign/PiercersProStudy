-- Supabase schema for a source-backed Piercer's Pro-Study content database.
-- Run this in the Supabase SQL editor before wiring the PDF processor.

create extension if not exists pgcrypto;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  title text not null,
  description text,
  storage_path text not null,
  topic_tags text[] not null default '{}',
  status text not null default 'uploaded'
    check (status in ('uploaded', 'processing', 'draft', 'published', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  topic_title text,
  heading text,
  page_number integer,
  chunk_index integer not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  topic_title text not null,
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  overview text,
  anatomy text,
  tools text,
  procedure text,
  aftercare text,
  complications text,
  jewelry_specs text,
  pain_and_healing text,
  difficulty text,
  setup text,
  faqs text,
  pros_cons text,
  red_flags text,
  client_discussion text,
  common_issues text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_sources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  document_chunk_id uuid references public.document_chunks(id) on delete set null,
  page_number integer,
  excerpt text,
  created_at timestamptz not null default now()
);

create index if not exists documents_status_idx on public.documents(status);
create index if not exists documents_topic_tags_idx on public.documents using gin(topic_tags);
create index if not exists document_chunks_document_id_idx on public.document_chunks(document_id);
create index if not exists document_chunks_topic_title_idx on public.document_chunks(topic_title);
create index if not exists lessons_topic_title_idx on public.lessons(topic_title);
create index if not exists lessons_status_idx on public.lessons(status);
create index if not exists lesson_sources_lesson_id_idx on public.lesson_sources(lesson_id);

alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_sources enable row level security;

create policy "Public can read published documents"
  on public.documents
  for select
  using (status = 'published');

create policy "Public can read chunks for published documents"
  on public.document_chunks
  for select
  using (
    exists (
      select 1
      from public.documents
      where documents.id = document_chunks.document_id
        and documents.status = 'published'
    )
  );

create policy "Public can read published lessons"
  on public.lessons
  for select
  using (status = 'published');

create policy "Public can read sources for published lessons"
  on public.lesson_sources
  for select
  using (
    exists (
      select 1
      from public.lessons
      where lessons.id = lesson_sources.lesson_id
        and lessons.status = 'published'
    )
  );

-- Do not add anon insert/update/delete policies for production.
-- PDF uploads and lesson publishing should be performed by an admin process,
-- a protected Edge Function, or a local import script using the service role key.

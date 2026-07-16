-- FELT — replace the dead `default_aesthetic_id` with two fields the engine
-- actually reads.
--
-- WHY:
--   default_aesthetic_id was collected in onboarding, required by the API and
--   stored — but never read by the generation engine. The artist's choice had
--   zero effect on their covers.
--
-- WHAT REPLACES IT:
--   default_genre        — the artist's declared lane. Essentia reads math, not
--                          culture, so it mislabels culturally-specific music
--                          (a Fireboy DML Afrobeats track is stored as
--                          "hip-hop"). This is the "user metadata hybrid"
--                          fail-safe: the artist's tag corrects the genre used
--                          for `Lineage:` in the scene prompt, while Essentia's
--                          numbers still drive the Visual DNA.
--   default_subject_mode — whether a person appears on their covers at all
--                          ('figure' | 'no_people' | 'auto').
--
-- Run this in the Supabase SQL editor BEFORE deploying the matching backend.

alter table public.users
  add column if not exists default_genre text,
  add column if not exists default_subject_mode text;

-- Sensible default for existing accounts so nothing breaks mid-flight.
update public.users
   set default_subject_mode = 'auto'
 where default_subject_mode is null;

-- Optional — only run once you've confirmed nothing else reads it.
-- The application code no longer references this column.
-- alter table public.users drop column if exists default_aesthetic_id;

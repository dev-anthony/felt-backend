'use strict'
/**
 * Artist-declared profile options — the single source of truth for the two
 * fields that replaced the dead `default_aesthetic_id`.
 *
 * Both are consumed by the generation pipeline (see routes/generation.js):
 *   - GENRES        corrects Essentia's genre, which reads math not culture and
 *                   mislabels culturally-specific music (Afrobeats -> "hip-hop").
 *                   The artist's lane becomes `Lineage:` in the scene prompt;
 *                   Essentia's numbers still drive the Visual DNA.
 *   - SUBJECT_MODES decides whether a person appears on the cover at all.
 *
 * `label` is what the artist sees. `promptLineage` is the exact wording fed to
 * the scene prompt — kept here so the frontend can never drift from it.
 */

const GENRES = [
  { id: 'afrobeats',  label: 'Afrobeats',        promptLineage: 'Afrobeats' },
  { id: 'amapiano',   label: 'Amapiano',         promptLineage: 'Amapiano' },
  { id: 'drill',      label: 'Drill',            promptLineage: 'Drill' },
  { id: 'hip_hop',    label: 'Hip-Hop / Rap',    promptLineage: 'Hip-Hop' },
  { id: 'rnb_soul',   label: 'R&B / Soul',       promptLineage: 'R&B / Soul' },
  { id: 'pop',        label: 'Pop',              promptLineage: 'Pop' },
  { id: 'alte_indie', label: 'Alté / Indie',     promptLineage: 'Alté / Indie' },
  { id: 'electronic', label: 'Electronic',       promptLineage: 'Electronic / Dance' },
  { id: 'gospel',     label: 'Gospel',           promptLineage: 'Gospel' },
  { id: 'dancehall',  label: 'Dancehall',        promptLineage: 'Dancehall' },
]

const SUBJECT_MODES = [
  {
    id: 'auto',
    label: 'Let the song decide',
    // No extra constraint — the scene generator casts whoever fits the track.
    promptRule: '',
  },
  {
    id: 'figure',
    label: 'Always a person',
    promptRule:
      'A human subject MUST appear in frame on this cover — never an empty scene or an object-only still life.',
  },
  {
    id: 'no_people',
    label: 'Never a person',
    promptRule:
      'NO human being may appear in this frame at all — no figure, no silhouette, no body part, no hands. Carry the entire emotion through the place, the objects, the light and the atmosphere alone.',
  },
]

const GENRE_IDS = GENRES.map((g) => g.id)
const SUBJECT_MODE_IDS = SUBJECT_MODES.map((s) => s.id)

const isValidGenre = (id) => GENRE_IDS.includes(id)
const isValidSubjectMode = (id) => SUBJECT_MODE_IDS.includes(id)

/** Artist's declared lane -> the wording used for `Lineage:` in the prompt. */
function genreLineage(id) {
  const g = GENRES.find((x) => x.id === id)
  return g ? g.promptLineage : null
}

/** Subject mode -> a hard rule appended to the scene prompt (or '' for auto). */
function subjectModeRule(id) {
  const s = SUBJECT_MODES.find((x) => x.id === id)
  return s ? s.promptRule : ''
}

module.exports = {
  GENRES,
  SUBJECT_MODES,
  GENRE_IDS,
  SUBJECT_MODE_IDS,
  isValidGenre,
  isValidSubjectMode,
  genreLineage,
  subjectModeRule,
}

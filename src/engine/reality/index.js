'use strict'
/**
 * PHOTOGRAPHIC REALITY ENGINE — FELT's believability layer.
 *
 * Music-agnostic. It does not care what the song is about; its only job is to
 * force the image model to produce something that looks CAPTURED by a real
 * camera rather than SYNTHESIZED — the single biggest difference between "AI
 * art" and "a magazine cover shot by a photographer."
 *
 * It contributes two things to the final prompt, both appended by the assembler
 * for photographic mediums only:
 *   - a positive realism clause (anatomy, skin, fabric, optics, light physics)
 *   - a hard negative clause targeting the specific tells of diffusion output
 *     (waxy skin, mangled hands, warped faces, duplicated limbs, plastic sheen).
 *
 * Kept as its own module so realism can be tuned in one place independent of
 * the music-driven layers.
 */

// Positive constraints — what a real photograph physically contains. Kept tight
// so the tail survives inside the image provider's prompt-length budget.
// Same constraints as before, said in the fewest words that still carry the
// intent (Fix 4) — this tail was ~35-40% of total prompt length, crowding out
// the creative content. Nothing dropped: anatomy, hands, skin, fabric, eyes,
// shadow direction and the AI-tell negatives are all still here.
const REALITY_POSITIVES = [
  'correct anatomy, real weight, natural five-fingered hands',
  'skin with subsurface scattering, visible pores and natural oils, never waxy',
  'a specific asymmetric face, not a doll',
  'clothing with real fabric weight and drape, contact shadows where cloth meets skin',
  'catchlights in the eyes, shadows in one direction',
]

// Negative constraints — the recognizable fingerprints of AI generation.
const REALITY_NEGATIVES = [
  'waxy plastic skin', 'airbrushed poreless faces', 'malformed or extra fingers',
  'warped doll faces', 'duplicated limbs', 'floating shapeless garments', 'over-smoothed CGI',
]

/**
 * The believability tail for photographic prompts. Doubles as the quality tail
 * so we never emit two competing "make it real" clauses (keeps prompt length in
 * check). `singleSubject` adds an explicit one-person constraint — the most
 * common failure mode (e.g. an unwanted second person / dancing couple).
 */
function photographicRealityTail({ singleSubject = false, faceVisible = true } = {}) {
  const solo = singleSubject
    ? 'Exactly one person in frame, no second person, no crowd. '
    : ''
  // SUBJECT PRIMACY — the single most important quality constraint. Mood must
  // never bury the subject: even in a dark or backlit scene the face has to be
  // clearly lit and readable, and it must be the brightest focal anchor.
  // Suppressed only for genuine silhouette techniques (faceVisible=false).
  const face = faceVisible
    ? 'Subject is the focal point at 30-45% of frame, face front-lit and readable, never darker than the background. '
    : ''
  const faceNeg = faceVisible ? ', a blacked-out or silhouetted face, a background brighter than the subject' : ''
  return (
    'A 1:1 square streaming cover, edge to edge, no border. ' +
    solo + face +
    'Shot on a real camera — ' +
    REALITY_POSITIVES.join(', ') + '. ' +
    'Absolutely no ' + REALITY_NEGATIVES.join(', ') + faceNeg + '. ' +
    'No text or logos anywhere.'
  )
}

// Illustration mediums get realism of a different kind — tactile handmade print,
// not photographic anatomy — but still need the AI-tell negatives.
function illustrationRealityTail() {
  return (
    'A definitive 1:1 square single cover for streaming, edge to edge, no frame or border. ' +
    'Handmade print aesthetic with visible tactile ink, paper grain and registration imperfection, ' +
    'natural human proportions and correct hands. ' +
    'Absolutely no ' + REALITY_NEGATIVES.join(', ') + '. ' +
    'No text, letters, watermarks or logos rendered anywhere in the image.'
  )
}

module.exports = {
  photographicRealityTail,
  illustrationRealityTail,
  REALITY_POSITIVES,
  REALITY_NEGATIVES,
}

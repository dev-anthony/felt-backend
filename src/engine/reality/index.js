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

// Positive constraints — what a real photograph physically contains.
const REALITY_POSITIVES = [
  'anatomically correct human proportions',
  'natural hands with exactly five fingers and correct joint structure',
  'natural facial asymmetry and lifelike bone structure',
  'real skin with visible pores, fine texture, subtle blemishes and natural oil sheen (never airbrushed or waxy)',
  'authentic fabric behaviour with real folds, seams, weave and weight',
  'catchlights and moist reflections in the eyes',
  'individually varied hair strands with natural flyaways',
  'physically consistent lighting with shadows all falling in one coherent direction',
  'realistic lens compression, depth of field and focus falloff',
  'true-to-life material response and optical micro-imperfections',
]

// Negative constraints — the recognizable fingerprints of AI generation.
const REALITY_NEGATIVES = [
  'plastic or waxy skin',
  'airbrushed poreless faces',
  'malformed or extra or fused fingers',
  'warped or asymmetrical-in-the-wrong-way faces',
  'duplicated or missing limbs',
  'dead glassy eyes',
  'floating neon or particle haze',
  'over-smoothed CGI render look',
  'unnatural bilateral symmetry',
]

/**
 * The believability tail for photographic prompts. Doubles as the quality tail
 * so we never emit two competing "make it real" clauses (keeps prompt length in
 * check). `singleSubject` adds an explicit one-person constraint — the most
 * common failure mode (e.g. an unwanted second person / dancing couple).
 */
function photographicRealityTail({ singleSubject = false } = {}) {
  const solo = singleSubject
    ? 'Exactly one person in frame, no second person, no crowd. '
    : ''
  return (
    'A definitive 1:1 square single cover for streaming, edge to edge, no frame or border. ' +
    solo +
    'Shot on a real camera and hand-graded — ' +
    REALITY_POSITIVES.join(', ') + '. ' +
    'Absolutely no ' + REALITY_NEGATIVES.join(', ') + '. ' +
    'No text, letters, watermarks or logos rendered anywhere in the image.'
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

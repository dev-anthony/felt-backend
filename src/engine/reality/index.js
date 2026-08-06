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

// Several equivalent realism framings, keyed to what kind of capture the DNA
// actually chose — a shallow-DOF portrait lens and a hyperfocal documentary
// lens don't earn their realism the same way, and repeating one fixed sentence
// on every cover was itself becoming a visible pattern.
const REALITY_VARIANTS = {
  shallow: [
    'correct anatomy and real weight, natural five-fingered hands, skin with subsurface scattering and visible pores, never waxy, a specific asymmetric face not a doll, true optical falloff with the focal plane exactly where the lens would place it',
    'anatomically correct hands and proportions, real skin texture with natural oil and pore detail, an asymmetric individual face, authentic shallow-focus falloff with real bokeh character, not a synthetic blur',
  ],
  deep: [
    'correct anatomy and real weight, natural five-fingered hands, skin with visible pores and natural texture held sharp end to end, a specific asymmetric face not a doll, true edge-to-edge optical sharpness consistent with a small aperture',
    'anatomically correct hands and proportions, real skin texture with visible pores throughout the deep-focus frame, an asymmetric individual face, no soft-focus fudging where the lens would actually resolve detail',
  ],
  default: [
    'correct anatomy, real weight, natural five-fingered hands, skin with subsurface scattering, visible pores and natural oils, never waxy, a specific asymmetric face, not a doll, clothing with real fabric weight and drape, contact shadows where cloth meets skin, catchlights in the eyes, shadows in one direction',
  ],
}

// Negative constraints — the recognizable fingerprints of AI generation.
const REALITY_NEGATIVES = [
  'waxy plastic skin', 'airbrushed poreless faces', 'malformed or extra fingers',
  'warped doll faces', 'duplicated limbs', 'floating shapeless garments', 'over-smoothed CGI',
]

function pickVariant(list, seed) {
  if (list.length === 1) return list[0]
  const rand = mulberry32(seed ^ 0x52454c54) // 'RELT' salt, distinct PRNG stream from other layers
  return list[Math.floor(rand() * list.length)]
}

/**
 * The believability tail for photographic prompts. Doubles as the quality tail
 * so we never emit two competing "make it real" clauses (keeps prompt length in
 * check). `singleSubject` adds an explicit one-person constraint — the most
 * common failure mode (e.g. an unwanted second person / dancing couple).
 *
 * @param {object} [opts]
 * @param {object} [opts.lensAnchor] the DNA's chosen lens concept's anchor,
 *   used only to decide shallow vs deep framing — not to leak lens jargon here.
 * @param {number} [opts.seed] track seed, for deterministic variant rotation.
 */
function photographicRealityTail({
  singleSubject = false,
  crowd = false,
  faceVisible = true,
  noPeople = false,
  lensAnchor,
  seed = 0,
} = {}) {
  if (noPeople) {
    return (
      'A 1:1 square streaming cover, edge to edge, no border. ' +
      'No people at all in the frame — no person, figure, silhouette, body part or hands. ' +
      'Shot on a real camera — authentic material texture and real fabric/surface weight, ' +
      'physically plausible light with shadows in one direction, ' +
      'realistic lens depth of field with soft background separation. ' +
      'Absolutely no ' + REALITY_NEGATIVES.join(', ') + '. ' +
      'No text or logos anywhere.'
    )
  }

  const solo = crowd ? '' : singleSubject
    ? 'Exactly one person in frame, no second person, no crowd. '
    : ''

  const crowdClause = crowd
    ? 'A real crowd of distinguishable people, natural body variety, no fused or duplicated bodies. '
    : ''

  const face = (faceVisible && !crowd)
    ? 'Subject is the focal point at 30-45% of frame, face front-lit and readable, never darker than the background. '
    : ''

  const faceNeg = (faceVisible && !crowd)
    ? ', a blacked-out or silhouetted face, a background brighter than the subject'
    : ''

  // Pick shallow vs deep phrasing from the lens the DNA actually chose,
  // rather than one fixed realism sentence regardless of gear.
  const bucket = lensAnchor && lensAnchor.brightness != null
    ? (lensAnchor.brightness < 0.4 ? 'shallow' : lensAnchor.brightness > 0.65 ? 'deep' : 'default')
    : 'default'

  const realismClause = pickVariant(REALITY_VARIANTS[bucket] || REALITY_VARIANTS.default, seed)

  return (
    'A 1:1 square streaming cover, edge to edge, no border. ' +
    solo + crowdClause + face +
    'Shot on a real camera — ' + realismClause + '. ' +
    'Absolutely no ' + REALITY_NEGATIVES.join(', ') + faceNeg + '. ' +
    'No text or logos anywhere.'
  )
}

// Illustration mediums get realism of a different kind — tactile handmade print,
// not photographic anatomy — but still need the AI-tell negatives.
//
// `noPeople` was previously accepted by `photographicRealityTail` only — this
// tail unconditionally said "natural human proportions and correct hands" even
// on a cover whose scene, metaphor and DNA all agreed there was no person in
// it, which is a direct instruction for the model to render hands regardless.
function illustrationRealityTail({ noPeople = false } = {}) {
  if (noPeople) {
    return (
      'A definitive 1:1 square single cover for streaming, edge to edge, no frame or border. ' +
      'Handmade print aesthetic with visible tactile ink, paper grain and registration imperfection. ' +
      'No people at all in the frame — no person, figure, silhouette, body part or hands. ' +
      'Absolutely no ' + REALITY_NEGATIVES.join(', ') + '. ' +
      'No text, letters, watermarks or logos rendered anywhere in the image.'
    )
  }
  return (
    'A definitive 1:1 square single cover for streaming, edge to edge, no frame or border. ' +
    'Handmade print aesthetic with visible tactile ink, paper grain and registration imperfection, ' +
    'natural human proportions and correct hands. ' +
    'Absolutely no ' + REALITY_NEGATIVES.join(', ') + '. ' +
    'No text, letters, watermarks or logos rendered anywhere in the image.'
  )
}

// 3D CGI is a third kind of "real" entirely. It must NOT inherit the
// illustration tail — "handmade ink, paper grain and registration imperfection"
// directly contradicts a pristine ray-traced render, and it must not inherit the
// photographic tail either (no film grain, no lens dust, no analog imperfection).
// What makes CGI read as expensive rather than cheap is physically-based
// rendering: correct light transport, real material response, clean geometry.
function cgiRealityTail({ noPeople = false } = {}) {
  if (noPeople) {
    return (
      'A definitive 1:1 square single cover for streaming, edge to edge, no frame or border. ' +
      'Physically-based rendering with accurate light transport, true reflection and refraction, ' +
      'correct material roughness and metalness response, clean topology with no distorted geometry. ' +
      'No people at all in the frame — no person, figure, silhouette, body part or hands. ' +
      'Absolutely no waxy plastic surfaces, warped geometry, duplicated or fused objects, ' +
      'no film grain, no paper texture, no analog light leaks. ' +
      'No text, letters, watermarks or logos rendered anywhere in the image.'
    )
  }
  return (
    'A definitive 1:1 square single cover for streaming, edge to edge, no frame or border. ' +
    'Physically-based rendering with accurate light transport, true reflection and refraction, ' +
    'subsurface scattering on skin, correct material roughness and metalness response, ' +
    'clean topology with no distorted geometry, anatomically correct proportions and hands. ' +
    'Absolutely no waxy plastic skin, airbrushed poreless faces, malformed or extra fingers, ' +
    'warped doll faces, duplicated limbs, floating shapeless garments, ' +
    'no film grain, no paper texture, no analog light leaks. ' +
    'No text, letters, watermarks or logos rendered anywhere in the image.'
  )
}

module.exports = {
  photographicRealityTail,
  illustrationRealityTail,
  cgiRealityTail,
  REALITY_VARIANTS,
  REALITY_NEGATIVES,
}
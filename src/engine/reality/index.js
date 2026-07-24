// 'use strict'
// /**
//  * PHOTOGRAPHIC REALITY ENGINE — FELT's believability layer.
//  *
//  * Music-agnostic. It does not care what the song is about; its only job is to
//  * force the image model to produce something that looks CAPTURED by a real
//  * camera rather than SYNTHESIZED — the single biggest difference between "AI
//  * art" and "a magazine cover shot by a photographer."
//  *
//  * It contributes two things to the final prompt, both appended by the assembler
//  * for photographic mediums only:
//  *   - a positive realism clause (anatomy, skin, fabric, optics, light physics)
//  *   - a hard negative clause targeting the specific tells of diffusion output
//  *     (waxy skin, mangled hands, warped faces, duplicated limbs, plastic sheen).
//  *
//  * Kept as its own module so realism can be tuned in one place independent of
//  * the music-driven layers.
//  */

// // Positive constraints — what a real photograph physically contains. Kept tight
// // so the tail survives inside the image provider's prompt-length budget.
// // Same constraints as before, said in the fewest words that still carry the
// // intent (Fix 4) — this tail was ~35-40% of total prompt length, crowding out
// // the creative content. Nothing dropped: anatomy, hands, skin, fabric, eyes,
// // shadow direction and the AI-tell negatives are all still here.
// const REALITY_POSITIVES = [
//   'correct anatomy, real weight, natural five-fingered hands',
//   'skin with subsurface scattering, visible pores and natural oils, never waxy',
//   'a specific asymmetric face, not a doll',
//   'clothing with real fabric weight and drape, contact shadows where cloth meets skin',
//   'catchlights in the eyes, shadows in one direction',
// ]

// // Negative constraints — the recognizable fingerprints of AI generation.
// const REALITY_NEGATIVES = [
//   'waxy plastic skin', 'airbrushed poreless faces', 'malformed or extra fingers',
//   'warped doll faces', 'duplicated limbs', 'floating shapeless garments', 'over-smoothed CGI',
// ]

// /**
//  * The believability tail for photographic prompts. Doubles as the quality tail
//  * so we never emit two competing "make it real" clauses (keeps prompt length in
//  * check). `singleSubject` adds an explicit one-person constraint — the most
//  * common failure mode (e.g. an unwanted second person / dancing couple).
//  */
// function photographicRealityTail({ singleSubject = false, faceVisible = true, noPeople = false } = {}) {
//   // `noPeople` is the artist's declared preference. It has to suppress BOTH the
//   // single-subject and face-visibility clauses, otherwise the tail would demand
//   // "exactly one person, face front-lit" on a cover that must contain nobody.
//   if (noPeople) {
//     return (
//       'A 1:1 square streaming cover, edge to edge, no border. ' +
//       'No people at all in the frame — no person, figure, silhouette, body part or hands. ' +
//       'Shot on a real camera — ' +
//       'authentic material texture and real fabric/surface weight, ' +
//       'physically plausible light with shadows in one direction, ' +
//       'realistic lens depth of field with soft background separation. ' +
//       'Absolutely no ' + REALITY_NEGATIVES.join(', ') + '. ' +
//       'No text or logos anywhere.'
//     )
//   }

//   const solo = singleSubject
//     ? 'Exactly one person in frame, no second person, no crowd. '
//     : ''
//   // SUBJECT PRIMACY — the single most important quality constraint. Mood must
//   // never bury the subject: even in a dark or backlit scene the face has to be
//   // clearly lit and readable, and it must be the brightest focal anchor.
//   // Suppressed only for genuine silhouette techniques (faceVisible=false).
//   const face = faceVisible
//     ? 'Subject is the focal point at 30-45% of frame, face front-lit and readable, never darker than the background. '
//     : ''
//   const faceNeg = faceVisible ? ', a blacked-out or silhouetted face, a background brighter than the subject' : ''
//   return (
//     'A 1:1 square streaming cover, edge to edge, no border. ' +
//     solo + face +
//     'Shot on a real camera — ' +
//     REALITY_POSITIVES.join(', ') + '. ' +
//     'Absolutely no ' + REALITY_NEGATIVES.join(', ') + faceNeg + '. ' +
//     'No text or logos anywhere.'
//   )
// }

// // Illustration mediums get realism of a different kind — tactile handmade print,
// // not photographic anatomy — but still need the AI-tell negatives.
// function illustrationRealityTail() {
//   return (
//     'A definitive 1:1 square single cover for streaming, edge to edge, no frame or border. ' +
//     'Handmade print aesthetic with visible tactile ink, paper grain and registration imperfection, ' +
//     'natural human proportions and correct hands. ' +
//     'Absolutely no ' + REALITY_NEGATIVES.join(', ') + '. ' +
//     'No text, letters, watermarks or logos rendered anywhere in the image.'
//   )
// }

// // 3D CGI is a third kind of "real" entirely. It must NOT inherit the
// // illustration tail — "handmade ink, paper grain and registration imperfection"
// // directly contradicts a pristine ray-traced render, and it must not inherit the
// // photographic tail either (no film grain, no lens dust, no analog imperfection).
// // What makes CGI read as expensive rather than cheap is physically-based
// // rendering: correct light transport, real material response, clean geometry.
// function cgiRealityTail() {
//   return (
//     'A definitive 1:1 square single cover for streaming, edge to edge, no frame or border. ' +
//     'Physically-based rendering with accurate light transport, true reflection and refraction, ' +
//     'subsurface scattering on skin, correct material roughness and metalness response, ' +
//     'clean topology with no distorted geometry, anatomically correct proportions and hands. ' +
//     // Deliberately does NOT reuse REALITY_NEGATIVES verbatim: that list bans an
//     // "over-smoothed CGI look", which is self-contradictory to hand a renderer.
//     // The anatomy/skin tells still matter, so they are restated without it.
//     'Absolutely no waxy plastic skin, airbrushed poreless faces, malformed or extra fingers, ' +
//     'warped doll faces, duplicated limbs, floating shapeless garments, ' +
//     'no film grain, no paper texture, no analog light leaks. ' +
//     'No text, letters, watermarks or logos rendered anywhere in the image.'
//   )
// }

// module.exports = {
//   photographicRealityTail,
//   illustrationRealityTail,
//   cgiRealityTail,
//   REALITY_POSITIVES,
//   REALITY_NEGATIVES,
// }
'use strict'
/**
 * PHOTOGRAPHIC REALITY ENGINE — FELT's believability layer.
 * 
 * Updated to fully respect medium variety and non-human compositions,
 * ensuring artistic freedom rather than locking every frame into a single portrait style.
 */

const REALITY_POSITIVES = [
  'correct anatomy, real weight, natural five-fingered hands',
  'skin with subsurface scattering, visible pores and natural oils, never waxy',
  'a specific asymmetric face, not a doll',
  'clothing with real fabric weight and drape, contact shadows where cloth meets skin',
  'catchlights in the eyes, shadows in one direction',
]

const REALITY_NEGATIVES = [
  'waxy plastic skin', 'airbrushed poreless faces', 'malformed or extra fingers',
  'warped doll faces', 'duplicated limbs', 'floating shapeless garments', 'over-smoothed CGI',
]

function photographicRealityTail({ singleSubject = false, faceVisible = true, noPeople = false } = {}) {
  if (noPeople) {
    return (
      'A 1:1 square streaming cover, edge to edge, no border. ' +
      'No people at all in the frame — no person, figure, silhouette, body part or hands. ' +
      'Shot on a real camera — ' +
      'authentic material texture and real fabric/surface weight, ' +
      'physically plausible light with shadows in one direction, ' +
      'realistic lens depth of field with soft background separation. ' +
      'Absolutely no ' + REALITY_NEGATIVES.join(', ') + '. ' +
      'No text or logos anywhere.'
    )
  }

  const solo = singleSubject
    ? 'Single subject focus in frame, with dynamic composition space. ' 
    : 'Dynamic compositional balance, expressive subject placement. '

  const face = faceVisible
    ? 'Subject integrated naturally into the environment, expressive and dimensionally lit. ' 
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

function illustrationRealityTail() {
  return (
    'A definitive 1:1 square single cover for streaming, edge to edge, no frame or border. ' +
    'Distinct artistic illustration style with visible tactile ink, rich texture, and bold graphic choices, ' +
    'natural proportions and striking composition. ' +
    'Absolutely no ' + REALITY_NEGATIVES.join(', ') + '. ' +
    'No text, letters, watermarks or logos rendered anywhere in the image.'
  )
}

function cgiRealityTail() {
  return (
    'A definitive 1:1 square single cover for streaming, edge to edge, no frame or border. ' +
    'Physically-based 3D rendering with stylized or hyper-detailed lighting transport, true reflection and refraction, ' +
    'expressive sculptural forms, correct material roughness and metalness response, ' +
    'clean topology with striking artistic direction. ' +
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
  REALITY_POSITIVES,
  REALITY_NEGATIVES,
}

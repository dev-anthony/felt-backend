'use strict'
/**
 * PROMPT ASSEMBLER — FELT's compiler.
 *
 * Deterministic. Contains almost no creative logic: it takes decisions that
 * were already made (the scene blueprint from Gemini, the fragments from the
 * Visual DNA, the technique suffix) and welds them into one coherent FLUX
 * prompt in a fixed order. Given the same inputs it always returns the same
 * string.
 *
 * Fixed assembly order (front-loaded so FLUX commits to a real photographic
 * look before it reads the story):
 *   medium/editorial/graphic → subject+wardrobe+pose+expression → action+env →
 *   camera+lens+film → lighting → motion → composition+typography → color →
 *   texture+post → symbolism → technique suffix → quality guardrails
 */

const { getSuffix, techniqueHidesFace } = require('../technique')
const { getConcept } = require('../vocabulary')
const { photographicRealityTail, illustrationRealityTail } = require('../reality')

// Non-photographic mediums whose presence must suppress the camera/film chain,
// otherwise the prompt says both "screen-print" and "shot on a film camera".
const NON_PHOTO_TAGS = ['risograph', 'screenprint', 'collage', 'painterly', 'oil', 'illustration', 'print']

function isPhotographicMedium(dna) {
  const sel = dna.selections.artMedium
  if (!sel) return true
  const concept = getConcept(sel.conceptId)
  const tags = (concept && concept.tags) || []
  if (tags.includes('photo') || tags.includes('default')) return true
  return !tags.some((t) => NON_PHOTO_TAGS.includes(t))
}

function frag(dna, key) {
  const s = dna.selections[key]
  return s && s.fragment ? s.fragment.trim() : ''
}

// Join non-empty parts into one sentence, ", "-separated, single trailing stop.
function sentence(parts) {
  const clean = parts.map((p) => (p || '').trim()).filter(Boolean)
  if (clean.length === 0) return ''
  return clean.join(', ').replace(/\s+/g, ' ').replace(/,\s*,/g, ',') + '.'
}

/**
 * @param {object} args
 * @param {import('../types').SceneBlueprint} args.blueprint
 * @param {import('../types').VisualDNA} args.dna
 * @param {boolean} [args.allowGroup] permit more than one person in frame
 *   (default false — guards against the common unwanted second-person result)
 * @param {number} [args.symbolismMinConfidence] minimum DNA symbolism confidence
 *   required before its motif may be glued onto the scene. 0 (default) keeps the
 *   Gemini-compiler path unchanged — there Gemini names symbolism explicitly.
 *   The deterministic path passes a threshold, because the DNA's symbolism pick
 *   is never checked against the actual scene text and a low-confidence match
 *   produced unrelated objects (e.g. "an object piercing the body under tension"
 *   on a man calmly drinking coffee).
 * @returns {import('../types').AssembledPrompt}
 */
function assemblePrompt({ blueprint, dna, allowGroup = false, symbolismMinConfidence = 0 }) {
  const b = blueprint || {}
  const technique = dna.technique

  // Symbolism: prefer the concrete object Gemini staged; fall back to the DNA
  // motif only when the DNA actually proposed one (not sym_none) AND it cleared
  // the caller's confidence bar.
  const dnaSymbolism = dna.selections.symbolism
  const blueprintSym = b.symbolism && b.symbolism.toLowerCase() !== 'none' ? b.symbolism : ''
  const dnaSymConfident =
    dnaSymbolism &&
    dnaSymbolism.conceptId !== 'sym_none' &&
    (dnaSymbolism.confidence ?? 0) >= symbolismMinConfidence
  const dnaSym = dnaSymConfident ? dnaSymbolism.fragment : ''
  const symbolism = blueprintSym || dnaSym

  const photographic = isPhotographicMedium(dna)

  // Capture chain (camera/lens/film), grain texture and exposure-based motion
  // only make sense for a real photograph. For an illustrated medium they are
  // suppressed so the prompt stays internally coherent.
  const captureChain = photographic
    ? sentence([frag(dna, 'camera'), frag(dna, 'lens'), frag(dna, 'filmStock')])
    : ''
  const motionBlock = photographic ? sentence([frag(dna, 'motion')]) : ''
  const textureBlock = photographic
    ? sentence([frag(dna, 'texture'), frag(dna, 'postProcessing')])
    : sentence([frag(dna, 'postProcessing')])

  const blocks = [
    // 1. Medium / editorial / graphic framing
    sentence([frag(dna, 'artMedium'), frag(dna, 'editorial'), frag(dna, 'graphic')]),
    // 2. Subject — STORY-owned (from the blueprint), never the DNA archetype,
    //    so we never describe two different subjects in one prompt.
    sentence([b.subject, b.wardrobe, b.pose, b.expression]),
    // 3. Setting + action — STORY-owned. The compiler supplies a specific
    //    `environment`; the deterministic path folds the location into
    //    `sceneAction`. The DNA `environment` selection is intentionally NOT
    //    emitted (it would add a second, conflicting setting); it only informs
    //    the compiler as a soft styling constraint.
    sentence([b.environment, b.sceneAction]),
    // 4. Capture chain (photographic only)
    captureChain,
    // 5. Lighting
    sentence([frag(dna, 'lighting')]),
    // 6. Motion (photographic only)
    motionBlock,
    // 7. Composition + typography safe zone
    sentence([frag(dna, 'composition'), frag(dna, 'typography')]),
    // 8. Color
    sentence([frag(dna, 'color')]),
    // 9. Texture + post
    textureBlock,
    // 10. Symbolism (optional)
    symbolism ? sentence([symbolism]) : '',
    // 11. Narrative beat (kept last of the story so it colors nothing technical)
    b.narrative ? sentence([`the moment reads as ${b.narrative}`]) : '',
    // 12. Technique suffix — verbatim from the legacy system, photographic only
    photographic ? getSuffix(technique) : '',
    // 13. Photographic Reality Engine tail (believability + AI-tell negatives).
    //     Doubles as the quality tail. Single-subject unless the caller opts into
    //     a group (default guards against the common unwanted-second-person leak).
    photographic
      ? photographicRealityTail({ singleSubject: !allowGroup, faceVisible: !techniqueHidesFace(technique) })
      : illustrationRealityTail(),
  ]

  const prompt = blocks.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()

  return { prompt, technique, dna, scene: b }
}

module.exports = { assemblePrompt }

'use strict'
/**
 * IMAGE PROMPT COMPOSER — the last step before any image model.
 *
 * The assembled aesthetic prompt (engine/assembler) is written for completeness:
 * ~2000 characters, every DNA layer, a long negative list. Image models do not
 * read like that. Attention is finite and front-loaded, so every clause that is
 * not the picture competes with the picture — "a vertical column of quiet space
 * along one edge for stacked typography" produces dead bands or literal text,
 * and buys nothing on a 1:1 canvas.
 *
 * This composes the prompt directly from parts we already hold instead of
 * parsing prose: the scene text (passed in whole, never cut) and
 * `dna.selections` (each chosen fragment, keyed by layer). An earlier version
 * regex-guessed which sentences were "the narrative" and, on a real generation,
 * kept the format boilerplate and dropped the technique's rendering fragments —
 * so the model was never told the image was thermal at all. Deterministic
 * composition cannot make that mistake.
 *
 * Model-agnostic on purpose: nothing here is tuned to one provider. The order
 * (what → how it was captured → what kind of act it was → constraints) and the
 * length budget suit Cloudflare/Leonardo, FLUX, SDXL and Sana alike.
 *
 *   [MEDIUM] → [SCENE] → [RENDERING] → [TECHNIQUE] → [SUBJECT GUARD + FORMAT]
 */

const { getSuffix } = require('../technique')
const { mediumFamily } = require('../assembler/promptAssembler')

// Layers that carry a technique's visual identity. Order is reading order.
// Capture-chain layers only apply to a photographic medium — a render or a
// drawing never had a camera body or a film stock (same rule as the assembler).
const CAPTURE_LAYERS = ['camera', 'lens', 'filmStock', 'motion']
const LOOK_LAYERS = ['lighting', 'color', 'texture', 'postProcessing', 'composition']

// Deliberately NOT included:
//   typography  - a reserved band for stacked type; models render it as text/bands
//   editorial / graphic - layout and print-treatment claims that compete with the medium
//   symbolism   - a DNA-chosen motif glued on would fight the scene's one dominant subject
//   subject/pose/environment - the scene owns these (STORY-ONLY boundary)

// When over budget, drop in this order. camera, lighting and color are never
// dropped: without them there is no look left to protect. `motion` is protected
// for the two techniques whose whole identity is a motion artifact.
const DROP_ORDER = ['postProcessing', 'texture', 'composition', 'lens', 'filmStock', 'motion']
const MOTION_TECHNIQUES = new Set(['MOTION_BLUR_STROBE', 'LONG_EXPOSURE_LIGHT_PAINTING'])

const DEFAULT_BUDGET = 1800

function clean(fragment) {
  return String(fragment || '').trim().replace(/\.+$/, '')
}

/**
 * @param {object} args
 * @param {string} args.scene the complete scene text — never truncated
 * @param {object} [args.dna] Visual DNA whose `.selections` hold the fragments
 * @param {string} args.technique technique key, for the one-line suffix
 * @param {boolean} [args.noPeople] the cover has no human subject
 * @param {number} [args.budget] soft character ceiling for the whole prompt
 * @returns {{ prompt: string, parts: { medium: string, scene: string, rendering: string[], dropped: string[], suffix: string }, length: number }}
 */
function composeImagePrompt({ scene, dna, technique, noPeople = false, budget = DEFAULT_BUDGET }) {
  const story = String(scene || '').trim().replace(/\.+$/, '.')
  const suffix = getSuffix(technique, { noPeople }) || ''

  const tail = [
    noPeople
      ? 'No people at all in frame — no person, figure, silhouette or hands.'
      : 'Exactly one person in frame, no second person, no crowd.',
    'A 1:1 square album cover, edge to edge. No text, letters, watermarks or logos.',
    // Skin/hand negatives only matter when a person can appear; on an object
    // cover they would re-introduce the very body parts the line above bans.
    noPeople
      ? 'Natural material texture, no over-smoothed CGI.'
      : 'No waxy plastic skin, no malformed hands, no over-smoothed CGI.',
  ]

  // No DNA (engine failure path): the scene and the technique's one-line look
  // are still far better than the legacy full prompt.
  if (!dna || !dna.selections) {
    const prompt = [story, suffix, ...tail].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
    return { prompt, length: prompt.length, parts: { medium: '', scene: story, rendering: [], dropped: [], suffix } }
  }

  const frag = (key) => {
    const s = dna.selections[key]
    return s && s.fragment ? clean(s.fragment) : ''
  }

  const photographic = mediumFamily(dna) === 'photo'
  const medium = clean(frag('artMedium'))

  // Ordered [layerKey, text] pairs so budget dropping can address them by key.
  const layers = [
    ...(photographic ? CAPTURE_LAYERS : []),
    ...LOOK_LAYERS,
  ].map((key) => [key, frag(key)]).filter(([, text]) => text)

  const build = () => {
    const rendering = layers.map(([, text]) => text)
    const sentence = rendering.length ? rendering.join(', ') + '.' : ''
    return [medium ? medium + '.' : '', story, sentence, suffix, ...tail]
      .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
  }

  const dropped = []
  let prompt = build()
  for (const key of DROP_ORDER) {
    if (prompt.length <= budget) break
    if (key === 'motion' && MOTION_TECHNIQUES.has(technique)) continue
    const at = layers.findIndex(([k]) => k === key)
    if (at !== -1) {
      layers.splice(at, 1)
      dropped.push(key)
      prompt = build()
    }
  }

  return {
    prompt,
    length: prompt.length,
    parts: { medium, scene: story, rendering: layers.map(([, t]) => t), dropped, suffix },
  }
}

module.exports = { composeImagePrompt, DEFAULT_BUDGET, DROP_ORDER }

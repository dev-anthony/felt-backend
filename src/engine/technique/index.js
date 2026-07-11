'use strict'
/**
 * TECHNIQUE LAYER — FELT's storytelling method.
 *
 * This is the modular home of what used to live inline in generation.js as
 * TECHNIQUE_SUFFIXES. Nothing about the 10 techniques or their FLUX suffixes
 * changed — they are re-exported verbatim so the existing routes keep behaving
 * identically. What's NEW is that each technique now also declares how it
 * SOFT-BIASES the Visual DNA:
 *
 *   - `dnaBias`: a small additive nudge to specific music signals before the
 *     DNA scores vocabulary (e.g. a duotone story leans the color layer darker),
 *     never a hard override.
 *
 * The technique still NEVER picks cameras/lenses/lighting/etc. directly — it
 * only tilts the reasoning. The Visual DNA Engine makes the actual selections,
 * and any vocabulary concept that lists this technique gets a scoring bonus
 * (see scoring.js `techniqueBonus`).
 */

/** @type {Record<string, { suffix: string, dnaBias: Record<string, number> }>} */
const TECHNIQUES = {
  FLASH_DOCUMENTARY: {
    suffix: 'Shot on a compact point-and-shoot with direct on-camera flash, slightly overexposed skin tones, hard graphic shadow cast behind the subject, visible grain, cluttered candid environment.',
    dnaBias: { grit: +0.12, energy: +0.08 },
  },
  VINTAGE_FILM_NOSTALGIA: {
    suffix: 'Shot on grainy 35mm film with warm halation around highlights, slightly faded lifted blacks, nostalgic analog color cast, visible film grain throughout.',
    dnaBias: { warmth: +0.12, acousticness: +0.08 },
  },
  SILHOUETTE_ATMOSPHERE: {
    suffix: 'Shot with the subject rim-lit against atmospheric haze or night light, deep crushed shadow detail, visible grain, dramatic negative space.',
    dnaBias: { darkness: +0.12, intimacy: +0.05 },
  },
  SURREAL_PRACTICAL_METAPHOR: {
    suffix: 'Shot as an in-camera practical effect with real physical props, correct object weight and cast shadows, raw documentary lighting, visible film grain, zero CGI compositing artifacts.',
    dnaBias: { darkness: +0.08, aggression: +0.06 },
  },
  DUOTONE_COLOR_WASH: {
    suffix: 'Shot on film and printed with a single dominant color-gel wash across the entire frame, grain and texture visible underneath the color cast.',
    dnaBias: { darkness: +0.10, intimacy: +0.06 },
  },
  MACRO_INTIMATE_DETAIL: {
    suffix: 'Shot in extreme macro close-up with shallow depth of field, soft natural falloff, real visible skin pores and texture, no airbrushing.',
    dnaBias: { intimacy: +0.15 },
  },
  MOTION_BLUR_STROBE: {
    suffix: 'Shot with a slow shutter and a single strobe pop, real directional motion blur trails, one sharp frozen instant, visible grain.',
    dnaBias: { motion: +0.15, danceability: +0.06 },
  },
  MIRROR_DOUBLE_EXPOSURE: {
    suffix: 'Shot as a real in-camera double exposure with slight misalignment and ghosting between the two layers, visible grain throughout.',
    dnaBias: { darkness: +0.06, intimacy: +0.06 },
  },
  STUDIO_SEAMLESS_EDITORIAL: {
    suffix: 'Shot in-studio against a saturated seamless paper backdrop with direct flash or hard strip lighting, gritty real skin texture, no glossy catalog smoothing.',
    dnaBias: { euphoria: +0.08, brightness: +0.06 },
  },
  MONUMENTAL_SCALE_ISOLATION: {
    suffix: 'Shot with a wide lens to emphasize scale imbalance between the tiny subject (or empty scene) and the massive dominant element, flat even lighting on the large element, visible grain, real atmospheric depth and haze, minimal competing detail.',
    dnaBias: { darkness: +0.06, intimacy: +0.04, energy: -0.06 },
  },
}

// Fallback technique when the model doesn't return a valid one. Deliberately
// NOT a silhouette technique — silhouettes hide the subject's identity and are
// the main cause of generic-looking fallbacks. DUOTONE reveals a lit face while
// staying moody and working with almost any scene/palette.
const DEFAULT_TECHNIQUE = 'DUOTONE_COLOR_WASH'

// Backward-compatible flat map: exactly the old TECHNIQUE_SUFFIXES shape so the
// existing parse/build helpers in generation.js can import it unchanged.
const TECHNIQUE_SUFFIXES = Object.fromEntries(
  Object.entries(TECHNIQUES).map(([name, t]) => [name, t.suffix])
)

function isValidTechnique(name) {
  return Object.prototype.hasOwnProperty.call(TECHNIQUES, name)
}

function getSuffix(name) {
  return (TECHNIQUES[name] || TECHNIQUES[DEFAULT_TECHNIQUE]).suffix
}

function getDnaBias(name) {
  return (TECHNIQUES[name] || TECHNIQUES[DEFAULT_TECHNIQUE]).dnaBias || {}
}

/**
 * Applies a technique's soft bias to a copy of the feature vector. Bounded to
 * 0..1 so a bias can nudge but never invert a signal. Pure — returns a new
 * vector, leaving the DNA's canonical vector intact for storage/debug.
 */
function applyTechniqueBias(vector, techniqueName) {
  const bias = getDnaBias(techniqueName)
  const biased = { ...vector, meta: vector.meta }
  for (const [dim, delta] of Object.entries(bias)) {
    if (typeof biased[dim] === 'number') {
      biased[dim] = Math.max(0, Math.min(1, biased[dim] + delta))
    }
  }
  return biased
}

module.exports = {
  TECHNIQUES,
  TECHNIQUE_SUFFIXES,
  DEFAULT_TECHNIQUE,
  isValidTechnique,
  getSuffix,
  getDnaBias,
  applyTechniqueBias,
}

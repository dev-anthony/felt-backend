'use strict'
/**
 * EMOTIONAL ARCHETYPES — Research Module 1, the 144-cell Visual Scaling Matrix.
 *
 * 12 archetypes × 3 Aesthetic States × 4 Visual Intensity tiers = 144 cells.
 * Each archetype lives in its own file so a cell can be tuned without scrolling
 * past 700 lines of unrelated prose; this module only aggregates and validates.
 *
 * Every cell is one dense phrase written in a fixed order —
 *   lighting → colour → composition → texture
 * — because that is the order the research tables define, and because it is the
 * order a photographer actually makes decisions in. The phrase is consumed by
 * `emotionalRegisterBlock()` and reaches only the Gemini scene-writer, never the
 * image model, so density here costs nothing in the FLUX token budget.
 */

const ARCHETYPES = {
  TRANSCENDENCE: require('./transcendence'),
  SERENITY: require('./serenity'),
  TENDERNESS: require('./tenderness'),
  NOSTALGIA: require('./nostalgia'),
  MELANCHOLY: require('./melancholy'),
  DREAD: require('./dread'),
  TENSION: require('./tension'),
  POWER: require('./power'),
  JOY: require('./joy'),
  EUPHORIA: require('./euphoria'),
  CEREBRAL: require('./cerebral'),
  PRIMAL: require('./primal'),
}

/** Aesthetic States — the production-value register the visuals are staged in. */
const AESTHETIC_STATES = {
  normal: {
    label: 'Normal',
    directive: 'grounded real-world realism — believable places, natural materials, nothing staged or stylised beyond what a documentary photographer would find',
  },
  luxury: {
    label: 'Luxury',
    directive: 'high-end editorial polish — premium materials, flawless surfaces, deliberate restraint, expensive light',
  },
  gritty: {
    label: 'Gritty / Raw',
    directive: 'raw and unpolished — visible wear, real dirt and sweat, uncorrected light, imperfection kept in',
  },
}

/** Visual Intensity tiers — how hard the emotional register is pushed. */
const INTENSITY_TIERS = {
  low: { label: 'Low', directive: 'restrained and quiet — understated, minimal, held back' },
  medium: { label: 'Medium', directive: 'clearly present and legible — confident but not extreme' },
  high: { label: 'High', directive: 'bold and dominant — strong contrast, decisive gesture, the feeling is unmistakable' },
  extreme: { label: 'Extra High', directive: 'pushed to the edge — overwhelming, near-abstract, the feeling consumes the frame' },
}

// ── Require-time validation ────────────────────────────────────────────────
// The matrix is looked up as states[state][intensity], so a single missing cell
// is a silent `undefined` that would reach the scene-writer as an empty visual
// direction. Failing loudly at require time turns that into a boot error instead
// of a mysteriously generic cover.
const STATE_IDS = Object.keys(AESTHETIC_STATES)
const TIER_IDS = Object.keys(INTENSITY_TIERS)

for (const [key, a] of Object.entries(ARCHETYPES)) {
  for (const field of ['label', 'genres', 'register', 'anchor', 'states']) {
    if (!a[field]) throw new Error(`Archetype ${key} is missing "${field}"`)
  }
  for (const state of STATE_IDS) {
    const cells = a.states[state]
    if (!cells) throw new Error(`Archetype ${key} is missing aesthetic state "${state}"`)
    for (const tier of TIER_IDS) {
      if (typeof cells[tier] !== 'string' || !cells[tier].trim()) {
        throw new Error(`Archetype ${key}.${state} is missing intensity tier "${tier}"`)
      }
    }
  }
}

module.exports = { ARCHETYPES, AESTHETIC_STATES, INTENSITY_TIERS }

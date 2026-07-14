'use strict'
/**
 * VISUAL DNA ENGINE — FELT's reasoning engine.
 *
 * Computes the full visual execution for a track from its analyzed music.
 * It NEVER invents visual concepts — every layer selects from the Visual
 * Vocabulary via the shared weighted scoring engine. Given the same song it
 * always returns the same DNA (pure over the feature vector); given different
 * songs it diverges across the continuous signals, so the same genre yields
 * many different executions.
 *
 * Each layer is independent (it scores vocabulary against the vector on its
 * own). The only cross-layer influence is a SOFT bias from the active
 * Technique, applied once to a copy of the vector before any layer runs.
 */

const { buildFeatureVector } = require('./featureVector')
const { selectConcept } = require('./scoring')
const { getCategory } = require('../vocabulary')
const { applyTechniqueBias, getAffinity, DEFAULT_TECHNIQUE, isValidTechnique } = require('../technique')

/**
 * Layer registry. `priority` orders fragments in the assembled prompt and
 * weights the mean-confidence rollup. `fallbackId` is used only when scoring
 * yields nothing (empty category — should never happen in practice).
 * `explore`/`bonus` tune the seeded variety vs. the technique pull per layer.
 */
const LAYERS = [
  // artMedium: photographic realism is FELT's default, so give the technique
  // bonus (which only medium_photography carries) extra weight — an illustrated
  // medium must be a decisively better anchor match to win.
  { key: 'artMedium',      category: 'artMedium',      priority: 1,  fallbackId: 'medium_photography',    explore: 0.12, bonus: 0.22 },
  { key: 'editorial',      category: 'editorial',      priority: 2,  fallbackId: 'edit_documentary',      explore: 0.30 },
  { key: 'subject',        category: 'subject',        priority: 3,  fallbackId: 'subj_editorial_minimal',explore: 0.30 },
  { key: 'environment',    category: 'environment',    priority: 4,  fallbackId: 'env_seamless_studio',   explore: 0.35 },
  { key: 'camera',         category: 'camera',         priority: 5,  fallbackId: 'cam_hasselblad_h6d',    explore: 0.30 },
  { key: 'lens',           category: 'lens',           priority: 6,  fallbackId: 'lens_80mm_f28',         explore: 0.30 },
  { key: 'filmStock',      category: 'filmStock',      priority: 7,  fallbackId: 'film_digital_clean',    explore: 0.35 },
  { key: 'lighting',       category: 'lighting',       priority: 8,  fallbackId: 'light_north_window',    explore: 0.30 },
  { key: 'motion',         category: 'motion',         priority: 9,  fallbackId: 'motion_freeze',         explore: 0.25 },
  { key: 'composition',    category: 'composition',    priority: 10, fallbackId: 'comp_rule_of_thirds',   explore: 0.35 },
  { key: 'color',          category: 'color',          priority: 11, fallbackId: 'color_muted_earth',     explore: 0.35 },
  { key: 'texture',        category: 'texture',        priority: 12, fallbackId: 'tex_fine_film_grain',   explore: 0.25 },
  { key: 'postProcessing', category: 'postProcessing', priority: 13, fallbackId: 'post_none',             explore: 0.30 },
  { key: 'typography',     category: 'typography',     priority: 14, fallbackId: 'type_lower_third',      explore: 0.35 },
  { key: 'symbolism',      category: 'symbolism',      priority: 15, fallbackId: 'sym_none',              explore: 0.30 },
  { key: 'graphic',        category: 'graphic',        priority: 16, fallbackId: 'graphic_clean_photo',   explore: 0.25, bonus: 0.12 },
]

function fallbackSelection(layer) {
  const concept = getCategory(layer.category).find((c) => c.id === layer.fallbackId)
  return {
    layer: layer.key,
    conceptId: concept ? concept.id : layer.fallbackId,
    fragment: concept ? concept.fragment : '',
    confidence: 0,
    fallback: true,
    alternatives: [],
  }
}

/**
 * @param {import('../types').RawAudioFeatures} rawFeatures
 * @param {string} [techniqueName]
 * @returns {import('../types').VisualDNA}
 */
function computeVisualDNA(rawFeatures, techniqueName) {
  const technique = isValidTechnique(techniqueName) ? techniqueName : DEFAULT_TECHNIQUE
  const vector = buildFeatureVector(rawFeatures)
  const biased = applyTechniqueBias(vector, technique)

  const selections = {}
  const fragments = {}
  let confSum = 0
  let confWeight = 0

  for (const layer of LAYERS) {
    const candidates = getCategory(layer.category)
    const { selection } = selectConcept(candidates, biased, {
      technique,
      explore: layer.explore,
      techniqueBonus: layer.bonus,
      // Art-direction coherence: the technique names its preferred concepts for
      // this layer, so camera/lens/lighting/etc. speak one visual language.
      preferredIds: getAffinity(technique, layer.key),
    })
    const chosen = selection || fallbackSelection(layer)
    chosen.layer = layer.key
    chosen.priority = layer.priority

    selections[layer.key] = chosen
    fragments[layer.key] = chosen.fragment

    // Higher-priority (lower number) layers weigh a little more in the rollup.
    const w = 1 / layer.priority
    confSum += chosen.confidence * w
    confWeight += w
  }

  return {
    technique,
    vector,
    selections,
    fragments,
    confidence: confWeight > 0 ? Math.round((confSum / confWeight) * 1000) / 1000 : 0,
  }
}

/** Fragments in assembler priority order — used by the Prompt Assembler. */
function orderedFragments(dna) {
  return LAYERS
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map((l) => ({ key: l.key, fragment: dna.fragments[l.key] }))
    .filter((f) => f.fragment)
}

module.exports = { computeVisualDNA, orderedFragments, LAYERS }

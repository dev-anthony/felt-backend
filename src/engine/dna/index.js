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

const { buildFeatureVector, dspDims } = require('./featureVector')
const { selectConcept } = require('./scoring')
const { getCategory, getConcept } = require('../vocabulary')
const { conceptMediumFamily } = require('../assembler/promptAssembler')
const { applyTechniqueBias, getAffinity, DEFAULT_TECHNIQUE, isValidTechnique } = require('../technique')
// Safe require order: emotion/index pulls in dna/scoring only, never dna/index,
// so this is a tree rather than a cycle.
const { readEmotion, emotionDnaBias } = require('../emotion')

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
/**
 * Additive, clamped bias over the numeric dimensions of a vector. Same
 * semantics as applyTechniqueBias so the two compose predictably; `meta` is
 * carried by reference because it holds the PRNG seed and DSP presence flags.
 */
function applyBias(vector, bias) {
  if (!bias) return vector
  const out = { ...vector, meta: vector.meta }
  for (const [dim, delta] of Object.entries(bias)) {
    if (typeof out[dim] === 'number') {
      out[dim] = Math.max(0, Math.min(1, out[dim] + delta))
    }
  }
  return out
}

function computeVisualDNA(rawFeatures, techniqueName, opts = {}) {
  const technique = isValidTechnique(techniqueName) ? techniqueName : DEFAULT_TECHNIQUE
  const vector = buildFeatureVector(rawFeatures)

  // EMOTIONAL BIAS — the emotion layer's read of the track (aesthetic state,
  // visual intensity, kinetic level) nudges the vector before any concept is
  // scored, so a Gritty/Luxury world and a High/Low intensity actually change
  // WHICH vocabulary wins rather than only what the prompt text says. Applied
  // before the technique bias so an explicit art direction still has the last
  // word. Deterministic: derived purely from the same features.
  const emotion = readEmotion(vector, vector.meta.genre, '')
  const biased = applyTechniqueBias(applyBias(vector, emotionDnaBias(emotion)), technique)

  // Module 3 axes this track has no real measurement for. Excluded from
  // scoring so a legacy track cannot earn points on evidence it never had.
  const skipDims = dspDims(vector)

  const selections = {}
  const fragments = {}
  let confSum = 0
  let confWeight = 0

  for (const layer of LAYERS) {
    const all = getCategory(layer.category)

    // ART DIRECTION IS A SHORTLIST, NOT A NUDGE.
    // When the technique names the concepts it wants for this layer, the music
    // chooses AMONG those — it cannot leave the set. This was previously only a
    // +0.30 scoring bonus, which an extreme track could outvote: an aggressive
    // drill song pulled `motion_strobe_freeze` (0.878) over the art-directed
    // `motion_freeze` (0.854) inside SILHOUETTE_ATMOSPHERE — a technique built
    // on stillness. A soft bonus can always lose by a hair, which silently
    // reintroduces exactly the cross-layer contradictions the affinity table
    // exists to prevent.
    //
    // Variety is preserved: the anchor still picks between the technique's
    // options (plus seeded near-tie exploration), so different songs under the
    // same technique still diverge. Layers with no affinity (subject,
    // environment, artMedium, graphic, typography) score freely as before.
    const shortlist = getAffinity(technique, layer.key)
    let candidates = shortlist.length
      ? all.filter((c) => shortlist.includes(c.id))
      : all

    // MEDIUM AGREEMENT.
    // The scene is written BEFORE the technique is known, so it has already
    // committed to a medium family ("you write ONE rendered moment"). If the
    // per-technique scoring here then picked a different family, the prompt
    // would describe a photograph and label it a 3D render — the exact
    // contradiction this constraint exists to prevent. When the caller states
    // the family the scene was written for, the medium layer must stay inside it.
    if (layer.key === 'artMedium' && opts.mediumFamily) {
      const inFamily = candidates.filter((c) => conceptMediumFamily(c) === opts.mediumFamily)
      if (inFamily.length) candidates = inFamily
    }

    const { selection } = selectConcept(candidates.length ? candidates : all, biased, {
      technique,
      explore: layer.explore,
      techniqueBonus: layer.bonus,
      skipDims,
    })
    const chosen = selection || fallbackSelection(layer)
    chosen.layer = layer.key
    chosen.priority = layer.priority

    // STATE-AWARE STAGING.
    // A symbol carries one meaning but is a different physical object in a
    // different world — the open road is a coastal highway from a supercar in
    // Luxury and a cracked two-lane with weeds through it in Gritty. Concepts
    // that declare `staging` resolve their fragment from the aesthetic state the
    // emotion layer just read, exactly as an archetype resolves its cell.
    // Concepts without `staging` are untouched.
    const concept = getConcept(chosen.conceptId)
    const staged = concept && concept.staging && concept.staging[emotion.state]
    if (staged) chosen.fragment = staged

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

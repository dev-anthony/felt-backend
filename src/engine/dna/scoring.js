'use strict'
/**
 * Scoring Engine — the shared reasoning primitive for every DNA layer.
 *
 * Given a set of vocabulary candidates (each with an `anchor` of ideal signal
 * values) and the track's FeatureVector, it ranks candidates by weighted
 * proximity to their anchor, applies a soft bias from the active Technique,
 * and returns the winner plus a confidence margin.
 *
 * Why not `if (genre==='trap') return black`: those simplistic mappings make
 * every trap song identical. Here the FULL continuous vector participates, so
 * two trap songs with different valence/brightness/acousticness resolve to
 * different film stocks, lighting and color — the same genre yields many looks.
 *
 * Determinism: near-ties are broken with a seeded PRNG derived from the track's
 * own features, so the choice is reproducible for a given song yet varied
 * across songs.
 */

// Mulberry32 — tiny, fast, deterministic PRNG seeded from the feature vector.
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Weighted distance between the vector and a candidate's anchor, over only the
 * dimensions the anchor declares. Returns a similarity score in 0..1
 * (1 = perfect match).
 */
function anchorScore(vector, anchor, weights, skipDims) {
  // `skipDims` removes dimensions the track has no real measurement for (see
  // dspDims in featureVector). Skipping is not the same as defaulting: a
  // defaulted 0.5 against a 0.5 anchor reads as a PERFECT match on evidence that
  // was never collected, quietly promoting whichever concept happens to anchor
  // near the middle.
  let dims = Object.keys(anchor || {})
  if (skipDims && skipDims.size) dims = dims.filter((d) => !skipDims.has(d))
  if (dims.length === 0) return 0.5 // anchorless concept = neutral baseline
  let sum = 0
  let wsum = 0
  for (const dim of dims) {
    const w = (weights && weights[dim]) != null ? weights[dim] : 1
    // Number.isFinite, not `typeof === 'number'`: NaN and Infinity are both
    // typeof "number" and would otherwise poison `rms`, making every score NaN
    // and the resulting ranking arbitrary.
    const actual = Number.isFinite(vector[dim]) ? vector[dim] : 0.5
    const diff = actual - anchor[dim]
    sum += w * diff * diff
    wsum += w
  }
  const rms = Math.sqrt(sum / wsum) // 0 (identical) .. 1 (opposite)
  return 1 - rms
}

/**
 * Rank candidates. Returns { selection, ranked }.
 *
 * @param {import('../types').VocabularyConcept[]} candidates
 * @param {import('../types').FeatureVector} vector
 * @param {object} [opts]
 * @param {string} [opts.technique]      active technique name for soft bias
 * @param {number} [opts.techniqueBonus] additive score when a candidate lists
 *                                        the active technique (default 0.12)
 * @param {string[]} [opts.preferredIds] concept ids the active technique's art
 *                                        direction prefers for THIS layer — a
 *                                        strong (still soft) coherence pull
 * @param {number} [opts.preferredBonus] additive score for a preferred id
 *                                        (default 0.30)
 * @param {number} [opts.explore]        prob. of picking a near-tie runner-up
 *                                        via seeded PRNG (default 0.35)
 * @param {string} [opts.fallbackId]     id to use if candidates is empty
 */
function selectConcept(candidates, vector, opts = {}) {
  const { technique, techniqueBonus = 0.12, preferredIds, preferredBonus = 0.30, explore = 0.35, skipDims } = opts
  const list = Array.isArray(candidates) ? candidates.filter(Boolean) : []
  const preferred = preferredIds && preferredIds.length ? new Set(preferredIds) : null

  if (list.length === 0) {
    return {
      selection: null,
      ranked: [],
    }
  }

  const scored = list.map((c) => {
    let score = anchorScore(vector, c.anchor, c.weights, skipDims)
    if (technique && Array.isArray(c.techniques) && c.techniques.includes(technique)) {
      score += techniqueBonus
    }
    // Art-direction coherence: the active technique names the concepts it wants
    // per layer. Those get a strong bonus, so every layer speaks one visual
    // language — but the anchor still chooses AMONG the preferred set, so
    // different songs under the same technique still diverge.
    if (preferred && preferred.has(c.id)) {
      score += preferredBonus
    }
    return { concept: c, score }
  })

  scored.sort((a, b) => b.score - a.score)

  // Seeded exploration: when the top few candidates are within a small margin,
  // pick among them deterministically so similar-but-distinct songs diverge
  // instead of always snapping to the single argmax.
  const rand = mulberry32(vector.meta.seed ^ hashLayer(list[0].category))
  const top = scored[0]
  const nearTies = scored.filter((s) => top.score - s.score <= 0.05)
  let winner = top
  if (nearTies.length > 1 && rand() < explore) {
    winner = nearTies[Math.floor(rand() * nearTies.length)]
  }

  const runnerUp = scored.find((s) => s.concept.id !== winner.concept.id)
  const confidence = runnerUp ? clamp01(winner.score - runnerUp.score + 0.5) : 1

  return {
    selection: {
      layer: winner.concept.category,
      conceptId: winner.concept.id,
      fragment: winner.concept.fragment,
      confidence: round3(confidence),
      fallback: false,
      alternatives: scored.slice(0, 4).map((s) => ({ conceptId: s.concept.id, score: round3(s.score) })),
    },
    ranked: scored,
  }
}

function hashLayer(name) {
  let h = 0
  const s = String(name || '')
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h >>> 0
}
const clamp01 = (n) => Math.max(0, Math.min(1, n))
const round3 = (n) => Math.round(n * 1000) / 1000

module.exports = { selectConcept, anchorScore, mulberry32 }

'use strict'
/**
 * Feature Normalization → canonical 0..1 FeatureVector.
 *
 * Every Visual DNA layer reasons over THIS vector, never raw audio_features.
 * That guarantees one thing the whole architecture depends on: the same song
 * always produces the same vector (pure function, no randomness), so the same
 * song always computes the same Visual DNA. Different songs with similar moods
 * still differ across the continuous signals, so their executions diverge.
 *
 * Raw shape (from the Essentia frontend / audio_features column):
 *   bpm: absolute (~60..180)         energy/valence/danceability: 0..100
 *   acousticness/spectral_brightness: 0..100   loudness: dB (~-60..0)
 *   speechiness: 0..100              key/scale/mood/genre: strings
 */

const clamp01 = (n) => Math.max(0, Math.min(1, n))
// Number.isFinite, not `!Number.isNaN`: ±Infinity is a number and is not NaN, so
// it previously slipped through and then clamped to a hard 0 or 1 — silently
// reading as a maximal value rather than as the missing data it actually is.
const num = (v, d) => (Number.isFinite(v) ? v : d)

/** The canonical 0..1 axes every downstream layer reasons over. */
const FEATURE_KEYS = [
  'tempo', 'energy', 'danceability', 'valence', 'brightness', 'loudness',
  'acousticness', 'speechiness', 'scaleMajor',
  'aggression', 'warmth', 'darkness', 'intimacy', 'motion', 'grit', 'euphoria',
  // Research Module 3.
  'subBass', 'spectralFlatness', 'spectralFlux', 'onsetRate',
]

/** The Module 3 axes. Scored only when `meta.dsp` says they were measured. */
const DSP_KEYS = ['subBass', 'spectralFlatness', 'spectralFlux', 'onsetRate']

/**
 * Dimensions to EXCLUDE from anchor scoring for this vector — every Module 3
 * axis the track has no real measurement for. Without this, a legacy track's
 * neutral 0.5 default would score a perfect match against any anchor that
 * happens to sit near 0.5, handing concepts free points on evidence that does
 * not exist. Returns null when nothing needs skipping (the common fast path).
 */
function dspDims(vector) {
  const present = (vector.meta && vector.meta.dsp) || {}
  const skip = DSP_KEYS.filter((k) => !present[k])
  return skip.length ? new Set(skip) : null
}

/**
 * Final guard on the vector before it leaves this module.
 *
 * Every field above is 0..1 "by construction" — but that only holds if every
 * input was finite, and `clamp01` does NOT enforce it: Math.min/Math.max
 * propagate NaN, so `clamp01(NaN) === NaN`. One corrupt `audio_features` row or
 * one divide-by-zero in a derived signal therefore travels the whole pipeline
 * intact, and fails silently in two places that both pick the WRONG answer
 * rather than erroring:
 *
 *   - `anchorScore` returns NaN, so the archetype sort compares NaN against
 *     everything (always false) and ranking becomes arbitrary input order.
 *   - `scaleIntensity`'s threshold ladder falls through every `<` comparison to
 *     its final `else`, pinning intensity at "Extra High" — the most dramatic
 *     of the four cells, on a track that may be a quiet acoustic ballad.
 *
 * Neutral-filling here means a single bad feature degrades one axis instead of
 * corrupting the entire emotional read. We warn rather than throw: a cover still
 * gets made, but the bad input is visible in the logs instead of silently
 * producing a confidently wrong result.
 */
function sanitizeVector(vec) {
  const bad = []
  for (const key of FEATURE_KEYS) {
    const v = vec[key]
    if (!Number.isFinite(v)) {
      bad.push(`${key}=${v}`)
      vec[key] = 0.5 // neutral — same default anchorScore uses for a missing dim
    } else if (v < 0 || v > 1) {
      bad.push(`${key}=${v}`)
      vec[key] = clamp01(v)
    }
  }
  if (bad.length) {
    console.warn(`[FEATURES] non-finite/out-of-range values neutralised: ${bad.join(', ')}`)
  }
  return vec
}

/**
 * Deterministic 32-bit seed derived from the raw feature values. Used by the
 * scoring engine to break near-ties reproducibly — same song, same seed.
 */
function seedFromFeatures(f) {
  const src = [
    Math.round(num(f.bpm, 90)),
    Math.round(num(f.energy, 50)),
    Math.round(num(f.valence, 50)),
    Math.round(num(f.danceability, 50)),
    Math.round(num(f.acousticness, 50)),
    Math.round(num(f.spectral_brightness, num(f.brightness, 50))),
    Math.round(num(f.speechiness, 50)),
    Math.round(num(f.loudness, -8)),
    String(f.key || 'C'),
    String(f.scale || 'major'),
  ].join('|')

  let h = 2166136261 >>> 0 // FNV-1a
  for (let i = 0; i < src.length; i++) {
    h ^= src.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** @returns {import('../types').FeatureVector} */
function buildFeatureVector(rawFeatures) {
  const f = rawFeatures || {}

  const tempo = clamp01((num(f.bpm, 90) - 60) / 120) // 60bpm→0, 180bpm→1
  const energy = clamp01(num(f.energy, 50) / 100)
  const danceability = clamp01(num(f.danceability, 50) / 100)
  const valence = clamp01(num(f.valence, 50) / 100)
  const brightness = clamp01(num(f.spectral_brightness, num(f.brightness, 50)) / 100)
  const loudness = clamp01((num(f.loudness, -8) + 60) / 60)
  const acousticness = clamp01(num(f.acousticness, 50) / 100)
  const speechiness = clamp01(num(f.speechiness, 50) / 100)
  const scaleMajor = String(f.scale || 'major').toLowerCase().startsWith('maj') ? 1 : 0

  // ── Derived emotional signals (weighted composites, all 0..1) ──
  // These are the interpretive axes the vocabulary anchors mostly speak in.
  const aggression = clamp01(0.34 * energy + 0.28 * speechiness + 0.22 * (1 - valence) + 0.16 * tempo)
  const warmth = clamp01(0.45 * valence + 0.30 * acousticness + 0.25 * scaleMajor)
  const darkness = clamp01(0.45 * (1 - valence) + 0.30 * (1 - brightness) + 0.25 * (1 - scaleMajor))
  const intimacy = clamp01(0.40 * (1 - energy) + 0.30 * acousticness + 0.30 * (1 - loudness))
  const motion = clamp01(0.50 * danceability + 0.30 * tempo + 0.20 * energy)
  const grit = clamp01(0.40 * speechiness + 0.32 * energy + 0.28 * (1 - acousticness))
  const euphoria = clamp01(0.45 * valence + 0.30 * energy + 0.25 * danceability)

  // ── Research Module 3 (optional) ──
  // Absent on every track analysed before the DSP pass shipped. They default to
  // 0.5, but a default is NOT the same as a measurement: a 0.5 default sitting
  // against a 0.5 anchor scores a *perfect match* on a dimension the track never
  // measured. So we also record whether real values arrived, and the scorer
  // skips these dimensions entirely when they did not — see `dspDims()`.
  //
  // Normalisation uses the research's own stated ranges, not invented constants:
  //   sub_bass_ratio    0..0.60 ratio  → used raw
  //   spectral_flatness 0..1 ratio     → used raw
  //   spectral_flux     0..1           → used raw (bounded at extraction)
  //   onset_rate        0..25 /sec     → divided by 25
  const hasSubBass = Number.isFinite(f.sub_bass_ratio)
  const hasFlatness = Number.isFinite(f.spectral_flatness)
  const hasFlux = Number.isFinite(f.spectral_flux)
  const hasOnset = Number.isFinite(f.onset_rate)

  const subBass = clamp01(num(f.sub_bass_ratio, 0.5))
  const spectralFlatness = clamp01(num(f.spectral_flatness, 0.5))
  const spectralFlux = clamp01(num(f.spectral_flux, 0.5))
  const onsetRate = clamp01(num(f.onset_rate, 12.5) / 25)

  return sanitizeVector({
    tempo, energy, danceability, valence, brightness, loudness,
    acousticness, speechiness, scaleMajor,
    aggression, warmth, darkness, intimacy, motion, grit, euphoria,
    subBass, spectralFlatness, spectralFlux, onsetRate,
    meta: {
      key: String(f.key || 'C'),
      scale: String(f.scale || 'major'),
      mood: String(f.mood || 'balanced'),
      genre: String(f.genre || 'contemporary'),
      seed: seedFromFeatures(f),
      // Which Module 3 axes are real measurements on THIS track. Anything absent
      // is excluded from scoring rather than silently defaulted.
      dsp: {
        subBass: hasSubBass, spectralFlatness: hasFlatness,
        spectralFlux: hasFlux, onsetRate: hasOnset,
      },
    },
  })
}

module.exports = {
  buildFeatureVector, seedFromFeatures, clamp01, sanitizeVector,
  FEATURE_KEYS, DSP_KEYS, dspDims,
}

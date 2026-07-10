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
const num = (v, d) => (typeof v === 'number' && !Number.isNaN(v) ? v : d)

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

  return {
    tempo, energy, danceability, valence, brightness, loudness,
    acousticness, speechiness, scaleMajor,
    aggression, warmth, darkness, intimacy, motion, grit, euphoria,
    meta: {
      key: String(f.key || 'C'),
      scale: String(f.scale || 'major'),
      mood: String(f.mood || 'balanced'),
      genre: String(f.genre || 'contemporary'),
      seed: seedFromFeatures(f),
    },
  }
}

module.exports = { buildFeatureVector, seedFromFeatures, clamp01 }

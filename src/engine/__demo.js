'use strict'
/**
 * Engine demo — `node src/engine/__demo.js`
 * Prints Visual DNA selections + an assembled prompt per sample track so you can
 * eyeball how the same technique produces different executions across tracks.
 */
const engine = require('./index')

const TRACKS = {
  'Afro-pop (bright, danceable)': { bpm: 112, energy: 68, valence: 72, danceability: 80, acousticness: 20, spectral_brightness: 70, speechiness: 14, loudness: -6, key: 'F', scale: 'major', mood: 'happy', genre: 'pop / afrobeat' },
  'Dark drill (aggressive)':      { bpm: 142, energy: 88, valence: 18, danceability: 66, acousticness: 8, spectral_brightness: 78, speechiness: 45, loudness: -4, key: 'A', scale: 'minor', mood: 'aggressive', genre: 'trap / drill' },
  'Neo-soul (slow, warm)':        { bpm: 74, energy: 30, valence: 64, danceability: 45, acousticness: 75, spectral_brightness: 52, speechiness: 12, loudness: -11, key: 'D', scale: 'major', mood: 'relaxed', genre: 'acoustic / neo-soul' },
  'Boom-bap (mid, moody)':        { bpm: 92, energy: 55, valence: 45, danceability: 60, acousticness: 35, spectral_brightness: 48, speechiness: 30, loudness: -8, key: 'E', scale: 'minor', mood: 'anxious', genre: 'boom bap / retro rap' },
}

const KEYS = ['artMedium', 'editorial', 'subject', 'environment', 'camera', 'lens', 'filmStock', 'lighting', 'motion', 'composition', 'color', 'texture', 'postProcessing', 'symbolism']

console.log(`Vocabulary concepts: ${engine.vocabulary.size()}\n`)

for (const [name, features] of Object.entries(TRACKS)) {
  const technique = 'SILHOUETTE_ATMOSPHERE'
  const dna = engine.computeVisualDNA(features, technique)
  console.log(`\n█ ${name}  (technique=${technique}, confidence=${dna.confidence})`)
  for (const k of KEYS) {
    const s = dna.selections[k]
    console.log(`   ${k.padEnd(15)} ${s.conceptId}${s.fallback ? ' [fallback]' : ''}`)
  }
  const { prompt } = engine.assembleFromScene({
    features, techniqueName: technique,
    sceneText: 'a single figure caught mid-thought, gaze off-frame',
  })
  console.log(`   ── prompt ──\n   ${prompt}`)
}

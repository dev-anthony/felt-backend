'use strict'
/**
 * Engine invariant tests. Zero dependencies — `node src/engine/__test.js`.
 *
 * These cover the properties that are expensive to notice when they break:
 * matrix completeness, corrupt-input handling, legacy-track stability and
 * determinism. Each one exists because the failure it guards against is silent
 * (a wrong cover, not a crash).
 */

const assert = require('assert')

const { ARCHETYPES, AESTHETIC_STATES, INTENSITY_TIERS } = require('./emotion/archetypes')
const { readEmotion, emotionalRegisterBlock } = require('./emotion')
const { buildFeatureVector, sanitizeVector, dspDims, FEATURE_KEYS, DSP_KEYS } = require('./dna/featureVector')
const { anchorScore } = require('./dna/scoring')
const { computeVisualDNA } = require('./dna')
const { assemblePrompt } = require('./assembler/promptAssembler')
const { TECHNIQUES, getAffinity, DEFAULT_TECHNIQUE } = require('./technique')
const { getCategory } = require('./vocabulary')

let passed = 0
const failures = []
function test(name, fn) {
  try { fn(); passed++ } catch (err) { failures.push(`${name}\n    ${err.message}`) }
}

const TRACK = {
  bpm: 140, energy: 85, valence: 25, danceability: 70, acousticness: 12,
  spectral_brightness: 62, speechiness: 45, loudness: -5, key: 'F', scale: 'minor', genre: 'drill',
}
const DSP = { sub_bass_ratio: 0.52, spectral_flatness: 0.3, spectral_flux: 0.75, onset_rate: 14 }

// ── 1. The 144-cell matrix ────────────────────────────────────────────────
test('matrix is 12 x 3 x 4 = 144 cells', () => {
  const keys = Object.keys(ARCHETYPES)
  assert.strictEqual(keys.length, 12, `expected 12 archetypes, got ${keys.length}`)
  let cells = 0
  for (const k of keys) {
    for (const s of Object.keys(AESTHETIC_STATES)) {
      for (const t of Object.keys(INTENSITY_TIERS)) {
        const v = ARCHETYPES[k].states[s][t]
        assert.ok(typeof v === 'string' && v.trim(), `${k}.${s}.${t} empty`)
        cells++
      }
    }
  }
  assert.strictEqual(cells, 144)
})

test('every cell is unique (no copy-paste between archetypes)', () => {
  const all = []
  for (const k of Object.keys(ARCHETYPES))
    for (const s of Object.keys(AESTHETIC_STATES))
      for (const t of Object.keys(INTENSITY_TIERS)) all.push(ARCHETYPES[k].states[s][t])
  assert.strictEqual(new Set(all).size, 144, 'duplicate cells found')
})

test('every archetype carries its scoring metadata', () => {
  for (const [k, a] of Object.entries(ARCHETYPES)) {
    for (const f of ['label', 'genres', 'register', 'anchor']) assert.ok(a[f], `${k} missing ${f}`)
    assert.strictEqual(typeof a.motionBias, 'number', `${k} motionBias not a number`)
    assert.ok(Object.keys(a.anchor).length > 0, `${k} has an empty anchor`)
  }
})

// ── 2. Corrupt input must degrade, never mis-select ───────────────────────
test('sanitizeVector neutralises non-finite and clamps out-of-range', () => {
  const v = {}
  for (const k of FEATURE_KEYS) v[k] = 0.5
  Object.assign(v, { energy: NaN, tempo: Infinity, valence: -3, motion: 2 })
  sanitizeVector(v)
  assert.strictEqual(v.energy, 0.5, 'NaN should become neutral 0.5')
  assert.strictEqual(v.tempo, 0.5, 'Infinity should become neutral 0.5')
  assert.strictEqual(v.valence, 0, 'negative should clamp to 0')
  assert.strictEqual(v.motion, 1, 'over-1 should clamp to 1')
})

test('every vector field is finite and in 0..1 for junk input', () => {
  const v = buildFeatureVector({ bpm: NaN, energy: Infinity, valence: 'x', loudness: null, scale: 'minor' })
  for (const k of FEATURE_KEYS) {
    assert.ok(Number.isFinite(v[k]), `${k} is ${v[k]}`)
    assert.ok(v[k] >= 0 && v[k] <= 1, `${k} out of range: ${v[k]}`)
  }
})

test('anchorScore never returns NaN even with a poisoned vector', () => {
  const s = anchorScore({ energy: NaN, grit: Infinity }, { energy: 0.5, grit: 0.5 })
  assert.ok(Number.isFinite(s), `score is ${s}`)
})

test('corrupt energy does not force the top intensity tier', () => {
  const bad = readEmotion(buildFeatureVector({ ...TRACK, energy: NaN, bpm: 70, loudness: -25 }), '', '')
  assert.notStrictEqual(bad.intensity, 'extreme',
    'a NaN feature must not fall through to the most dramatic tier')
})

// ── 3. Routing produces a real cell in every case ─────────────────────────
test('readEmotion always resolves to a real matrix cell', () => {
  const combos = []
  for (const e of [0, 0.25, 0.5, 0.75, 1])
    for (const g of [0, 0.5, 1])
      for (const d of [0, 0.5, 1]) combos.push({ e, g, d })
  for (const { e, g, d } of combos) {
    const v = buildFeatureVector({
      ...TRACK, energy: e * 100, speechiness: g * 100, valence: d * 100,
      acousticness: (1 - g) * 100, loudness: -60 + e * 60,
    })
    const r = readEmotion(v, '', '')
    assert.ok(AESTHETIC_STATES[r.state], `bad state ${r.state}`)
    assert.ok(INTENSITY_TIERS[r.intensity], `bad intensity ${r.intensity}`)
    assert.ok(typeof r.visualDirection === 'string' && r.visualDirection.trim(),
      `empty visualDirection at energy=${e} grit=${g}`)
    assert.strictEqual(r.visualDirection, r.archetype.states[r.state][r.intensity])
  }
})

test('register block contains no undefined/NaN', () => {
  const v = buildFeatureVector({ ...TRACK, ...DSP })
  const block = emotionalRegisterBlock(readEmotion(v, 'drill', ''), v)
  assert.ok(!/undefined|NaN|\[object/.test(block), `leaked: ${block}`)
  assert.ok(/VISUAL DIRECTION/.test(block), 'missing VISUAL DIRECTION line')
})

// ── 4. DSP: presence gating and legacy stability ──────────────────────────
test('dspDims skips every unmeasured axis on a legacy track', () => {
  const skip = dspDims(buildFeatureVector(TRACK))
  assert.ok(skip, 'legacy track should skip DSP dims')
  for (const k of DSP_KEYS) assert.ok(skip.has(k), `${k} should be skipped`)
})

test('dspDims skips nothing when all DSP values are present', () => {
  assert.strictEqual(dspDims(buildFeatureVector({ ...TRACK, ...DSP })), null)
})

test('partial DSP data skips only the missing axes', () => {
  const skip = dspDims(buildFeatureVector({ ...TRACK, sub_bass_ratio: 0.4 }))
  assert.ok(!skip.has('subBass'), 'measured axis must not be skipped')
  assert.ok(skip.has('spectralFlux'), 'unmeasured axis must be skipped')
})

test('an unmeasured DSP dim cannot earn a concept free points', () => {
  const v = buildFeatureVector(TRACK) // no DSP -> subBass defaults to 0.5
  const anchor = { energy: 0.7, subBass: 0.5 } // 0.5 would be a "perfect" match
  const withSkip = anchorScore(v, anchor, null, dspDims(v))
  const noSkip = anchorScore(v, anchor, null, null)
  assert.ok(withSkip < noSkip,
    `skipping must not inflate the score (skip=${withSkip} noskip=${noSkip})`)
})

// Sub-bass and flux both steer composition, so a flux test must hold sub-bass
// LOW or the 808 rule legitimately dominates and the test proves nothing.
test('spectral flux steers composition when sub-bass is not dominant', () => {
  const low = { ...TRACK, ...DSP, sub_bass_ratio: 0.10 }
  const calm = computeVisualDNA({ ...low, spectral_flux: 0.05 }, 'FLASH_DOCUMENTARY')
  const chaotic = computeVisualDNA({ ...low, spectral_flux: 0.95 }, 'FLASH_DOCUMENTARY')
  assert.notStrictEqual(calm.selections.composition.conceptId,
    chaotic.selections.composition.conceptId, 'spectral flux should steer composition')
})

// Research Module 3 #10: sub-bass >0.35 FORCES the low-angle perspective. That
// it outranks flux is the intended precedence, not a bug — lock it in.
test('heavy sub-bass forces the low-angle framing regardless of flux', () => {
  for (const spectral_flux of [0.05, 0.5, 0.95]) {
    const dna = computeVisualDNA({ ...TRACK, ...DSP, sub_bass_ratio: 0.52, spectral_flux }, 'FLASH_DOCUMENTARY')
    assert.strictEqual(dna.selections.composition.conceptId, 'comp_low_angle_hero',
      `808-heavy track at flux=${spectral_flux} should still frame low-angle`)
  }
})

test('legacy tracks are unaffected by the DSP anchors', () => {
  const a = computeVisualDNA(TRACK, 'FLASH_DOCUMENTARY')
  const b = computeVisualDNA(TRACK, 'FLASH_DOCUMENTARY')
  assert.strictEqual(JSON.stringify(a.selections), JSON.stringify(b.selections))
  // A no-DSP track must never select on a DSP dimension it never measured.
  const skip = dspDims(buildFeatureVector(TRACK))
  assert.strictEqual(skip.size, DSP_KEYS.length)
})

// ── 5. Determinism ────────────────────────────────────────────────────────
test('same input yields byte-identical DNA (pure function)', () => {
  const a = computeVisualDNA({ ...TRACK, ...DSP }, 'FLASH_DOCUMENTARY')
  const b = computeVisualDNA({ ...TRACK, ...DSP }, 'FLASH_DOCUMENTARY')
  assert.strictEqual(JSON.stringify(a.selections), JSON.stringify(b.selections))
})

// ── 6. Technique table integrity ──────────────────────────────────────────
test('every technique has affinity for every layer it needs', () => {
  const layers = ['composition', 'filmStock', 'texture', 'lighting', 'motion', 'camera', 'lens', 'color']
  for (const t of Object.keys(TECHNIQUES)) {
    for (const l of layers) {
      const a = getAffinity(t, l)
      assert.ok(Array.isArray(a), `${t}/${l} affinity is not an array`)
    }
  }
})

test('every affinity id refers to a real concept', () => {
  const layers = ['composition', 'filmStock', 'texture', 'lighting', 'motion', 'camera', 'lens', 'color']
  for (const t of Object.keys(TECHNIQUES)) {
    for (const l of layers) {
      const ids = new Set(getCategory(l).map((c) => c.id))
      for (const id of getAffinity(t, l)) {
        assert.ok(ids.has(id), `${t}/${l} references unknown concept "${id}"`)
      }
    }
  }
})

test('every concept anchor references a real vector dimension', () => {
  const valid = new Set(FEATURE_KEYS)
  const cats = ['composition', 'filmStock', 'texture', 'lighting', 'motion', 'camera',
    'lens', 'color', 'subject', 'editorial', 'artMedium', 'symbolism', 'environment',
    'graphic', 'typography']
  for (const cat of cats) {
    for (const c of getCategory(cat)) {
      for (const dim of Object.keys(c.anchor || {})) {
        assert.ok(valid.has(dim), `${c.id} anchors on unknown dimension "${dim}"`)
      }
    }
  }
})

// ── 7. Prompt assembly ────────────────────────────────────────────────────
test('assembled prompt is clean for every technique', () => {
  const dna = computeVisualDNA({ ...TRACK, ...DSP }, DEFAULT_TECHNIQUE)
  for (const t of Object.keys(TECHNIQUES)) {
    const d = computeVisualDNA({ ...TRACK, ...DSP }, t)
    const { prompt } = assemblePrompt({
      blueprint: { subject: 'a lone figure', environment: 'a rain-slick street', sceneAction: 'standing still' },
      dna: d,
    })
    assert.ok(!/undefined|NaN|\[object/.test(prompt), `${t} leaked into prompt`)
    assert.ok(prompt.length > 200, `${t} prompt suspiciously short`)
    assert.ok(!/,\s*,|\s{2,}/.test(prompt), `${t} has doubled punctuation/space`)
  }
  assert.ok(dna)
})

test('prompt stays within the image-provider budget', () => {
  for (const t of Object.keys(TECHNIQUES)) {
    const { prompt } = assemblePrompt({
      blueprint: { subject: 'a lone figure', environment: 'a rain-slick street', sceneAction: 'standing still' },
      dna: computeVisualDNA({ ...TRACK, ...DSP }, t),
    })
    assert.ok(prompt.length < 3000, `${t} prompt is ${prompt.length} chars (budget 3000)`)
  }
})

// ── 8. Front-to-back contract ─────────────────────────────────────────────
// The exact payload shape workspace-wizard.tsx sends to POST /uploads/:id/analysis.
// If the frontend renames a field, this fails here instead of silently storing
// null and degrading every future cover for that track.
const WIRE_PAYLOAD = {
  spectral_flux: 0.42, spectral_flatness: 0.31, sub_bass_ratio: 0.47, onset_rate: 8.4,
  bpm: 140, key: 'F', scale: 'minor',
  energy: 85, valence: 25, danceability: 70, acousticness: 12,
  spectral_brightness: 62, loudness: -5, mood: 'aggressive', speechiness: 45, genre: 'drill',
}

test('the wire payload survives into the feature vector', () => {
  const v = buildFeatureVector(WIRE_PAYLOAD)
  assert.strictEqual(v.subBass, 0.47, 'sub_bass_ratio did not reach the vector')
  assert.strictEqual(v.spectralFlatness, 0.31, 'spectral_flatness did not reach the vector')
  assert.strictEqual(v.spectralFlux, 0.42, 'spectral_flux did not reach the vector')
  assert.ok(Math.abs(v.onsetRate - 8.4 / 25) < 1e-9, 'onset_rate normalisation wrong')
  for (const k of DSP_KEYS) assert.strictEqual(v.meta.dsp[k], true, `${k} not marked present`)
  assert.strictEqual(dspDims(v), null, 'nothing should be skipped for a full payload')
})

test('the wire payload produces a complete, clean prompt', () => {
  const dna = computeVisualDNA(WIRE_PAYLOAD, DEFAULT_TECHNIQUE)
  const { prompt } = assemblePrompt({
    blueprint: { subject: 'a lone figure', environment: 'a rain-slick street', sceneAction: 'standing still' },
    dna,
  })
  assert.ok(!/undefined|NaN/.test(prompt))
  for (const layer of ['artMedium', 'composition', 'color', 'lighting', 'texture']) {
    assert.ok(dna.selections[layer], `layer ${layer} unselected`)
  }
})

test('a partial payload (older client) still works', () => {
  const { spectral_flux, onset_rate, ...partial } = WIRE_PAYLOAD
  void spectral_flux; void onset_rate
  const v = buildFeatureVector(partial)
  const skip = dspDims(v)
  assert.ok(skip.has('spectralFlux') && skip.has('onsetRate'))
  assert.ok(!skip.has('subBass') && !skip.has('spectralFlatness'))
  assert.ok(computeVisualDNA(partial, DEFAULT_TECHNIQUE).selections.composition)
})

// ── report ────────────────────────────────────────────────────────────────
console.log(`\n  ${passed} passed, ${failures.length} failed\n`)
if (failures.length) {
  for (const f of failures) console.log(`  ✗ ${f}\n`)
  process.exitCode = 1
} else {
  console.log('  All engine invariants hold.\n')
}

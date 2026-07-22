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
const { assemblePrompt, mediumFamily } = require('./assembler/promptAssembler')
const { TECHNIQUES, getAffinity, DEFAULT_TECHNIQUE } = require('./technique')
const { getCategory, getConcept } = require('./vocabulary')

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

// ── 9. Research Module 5 — the 3D CGI medium ──────────────────────────────
const CGI_TRACK = {
  bpm: 128, energy: 80, valence: 35, danceability: 75, acousticness: 8,
  spectral_brightness: 78, speechiness: 15, loudness: -5, key: 'A', scale: 'minor',
  genre: 'industrial techno',
}
const CGI_DSP = { sub_bass_ratio: 0.48, spectral_flatness: 0.10, spectral_flux: 0.4, onset_rate: 6 }

test('CGI medium is reachable in its research territory', () => {
  const dna = computeVisualDNA({ ...CGI_TRACK, ...CGI_DSP }, 'FLASH_DOCUMENTARY')
  assert.strictEqual(dna.selections.artMedium.conceptId, 'medium_3d_cgi',
    'sub-bass >0.40 with low flatness should reach the CGI medium')
})

test('CGI never hijacks an acoustic track that has no DSP data', () => {
  const ballad = {
    bpm: 82, energy: 25, valence: 60, danceability: 35, acousticness: 85,
    spectral_brightness: 25, speechiness: 8, loudness: -16, scale: 'major',
  }
  for (const t of Object.keys(TECHNIQUES)) {
    assert.notStrictEqual(computeVisualDNA(ballad, t).selections.artMedium.conceptId,
      'medium_3d_cgi', `${t}: acoustic ballad must not select CGI`)
  }
})

// ── 10. Module 3 Equation 1 — aperture tracks spectral centroid ───────────
test('Eq1: depth of field follows spectral centroid', () => {
  const dark = computeVisualDNA({ ...CGI_TRACK, ...CGI_DSP, spectral_brightness: 10 }, 'FLASH_DOCUMENTARY')
  const bright = computeVisualDNA({ ...CGI_TRACK, ...CGI_DSP, spectral_brightness: 95 }, 'FLASH_DOCUMENTARY')
  assert.strictEqual(bright.selections.lens.conceptId, 'lens_35mm_hyperfocal',
    'high centroid should reach the deep-focus (f/8-f/11) pole')
  assert.notStrictEqual(dark.selections.lens.conceptId, bright.selections.lens.conceptId)
})

test('Eq1: every lens declares brightness so the DoF axis is total', () => {
  for (const c of getCategory('lens')) {
    assert.ok(typeof c.anchor.brightness === 'number',
      `${c.id} has no brightness anchor, so centroid cannot rank it`)
  }
})

// ── 11. Module 3 Equation 2 — shutter regime is exhaustive ────────────────
test('Eq2: every motion concept declares all three shutter inputs', () => {
  for (const c of getCategory('motion')) {
    for (const dim of ['tempo', 'onsetRate', 'spectralFlux']) {
      assert.ok(typeof c.anchor[dim] === 'number', `${c.id} missing ${dim}`)
    }
  }
})

test('Eq2: the four shutter regimes are all reachable', () => {
  const base = { ...CGI_TRACK, ...CGI_DSP }
  const got = new Set([
    computeVisualDNA({ ...base, bpm: 62, spectral_flux: 0.80, onset_rate: 3 }, 'MOTION_BLUR_STROBE').selections.motion.conceptId,
    computeVisualDNA({ ...base, bpm: 168, spectral_flux: 0.55, onset_rate: 12 }, 'MOTION_BLUR_STROBE').selections.motion.conceptId,
    computeVisualDNA({ ...base, bpm: 64, spectral_flux: 0.08, onset_rate: 1, danceability: 20, energy: 20 }, 'VINTAGE_FILM_NOSTALGIA').selections.motion.conceptId,
    computeVisualDNA({ ...base, bpm: 170, spectral_flux: 0.6, onset_rate: 13, danceability: 85, energy: 90 }, 'VINTAGE_FILM_NOSTALGIA').selections.motion.conceptId,
  ])
  for (const id of ['motion_shutter_drag', 'motion_strobe_freeze', 'motion_still_meditative', 'motion_freeze']) {
    assert.ok(got.has(id), `shutter regime ${id} unreachable (got: ${[...got].join(', ')})`)
  }
})

test('Eq2: the 80-90 BPM gap in the published function now resolves', () => {
  // The research's piecewise Phi matched no case for 80 < BPM < 90 with SF < 0.7.
  for (let bpm = 78; bpm <= 92; bpm += 2) {
    const m = computeVisualDNA({ ...CGI_TRACK, ...CGI_DSP, bpm, spectral_flux: 0.5 }, DEFAULT_TECHNIQUE).selections.motion
    assert.ok(m && m.conceptId, `no motion resolved at ${bpm} BPM`)
  }
})

// ── 12. Emotional bias is wired and deterministic ─────────────────────────
test('emotionDnaBias reaches concept selection', () => {
  const { emotionDnaBias, readEmotion } = require('./emotion')
  const gritty = readEmotion(buildFeatureVector({ ...TRACK, speechiness: 95, acousticness: 3, energy: 95 }), '', '')
  const bias = emotionDnaBias(gritty)
  assert.ok(Object.keys(bias).length > 0, 'a gritty read should produce a non-empty bias')
  // and it must not break determinism
  const a = computeVisualDNA({ ...TRACK, ...DSP }, 'FLASH_DOCUMENTARY')
  const b = computeVisualDNA({ ...TRACK, ...DSP }, 'FLASH_DOCUMENTARY')
  assert.strictEqual(JSON.stringify(a.selections), JSON.stringify(b.selections))
})

test('bias application never pushes a dimension outside 0..1', () => {
  for (const extreme of [
    { energy: 100, speechiness: 100, acousticness: 0, loudness: 0, danceability: 100, bpm: 240 },
    { energy: 0, speechiness: 0, acousticness: 100, loudness: -60, danceability: 0, bpm: 40 },
  ]) {
    const dna = computeVisualDNA({ ...TRACK, ...extreme }, 'FLASH_DOCUMENTARY')
    for (const layer of Object.keys(dna.selections)) {
      const c = dna.selections[layer]
      assert.ok(c && typeof c.confidence === 'number' && Number.isFinite(c.confidence),
        `${layer} confidence is ${c && c.confidence}`)
      assert.ok(c.confidence >= 0 && c.confidence <= 1, `${layer} confidence out of range`)
    }
  }
})

// ── 13. Symbolism library ─────────────────────────────────────────────────
test('every symbol is fully specified', () => {
  const states = Object.keys(AESTHETIC_STATES)
  for (const s of getCategory('symbolism')) {
    for (const f of ['label', 'meaning', 'lineage', 'scope', 'staging', 'fragment']) {
      assert.ok(s[f], `${s.id} missing "${f}"`)
    }
    assert.ok(Array.isArray(s.archetypes), `${s.id}.archetypes is not an array`)
    assert.ok(['universal', 'cultural'].includes(s.scope), `${s.id} bad scope "${s.scope}"`)
    for (const st of states) {
      assert.ok(typeof s.staging[st] === 'string' && s.staging[st].trim(),
        `${s.id} has no "${st}" staging`)
    }
  }
})

test('every archetype a symbol claims actually exists', () => {
  const ids = new Set(Object.keys(ARCHETYPES))
  for (const s of getCategory('symbolism')) {
    for (const a of s.archetypes) assert.ok(ids.has(a), `${s.id} claims unknown archetype "${a}"`)
  }
})

test('all 12 archetypes have symbolic coverage', () => {
  const covered = new Set()
  for (const s of getCategory('symbolism')) for (const a of s.archetypes) covered.add(a)
  for (const a of Object.keys(ARCHETYPES)) {
    assert.ok(covered.has(a), `archetype ${a} has no symbol serving it`)
  }
})

test('symbol staging text is unique per state (no copy-paste)', () => {
  for (const s of getCategory('symbolism')) {
    if (s.id === 'sym_none') continue // intentionally identical: it is the absence of a motif
    const vals = Object.values(s.staging)
    assert.strictEqual(new Set(vals).size, vals.length, `${s.id} repeats a staging across states`)
  }
})

test('symbol fragment resolves from the aesthetic state', () => {
  const base = {
    bpm: 100, energy: 60, valence: 45, danceability: 55, acousticness: 40,
    spectral_brightness: 50, speechiness: 20, loudness: -10, key: 'C', scale: 'minor',
  }
  const luxury = computeVisualDNA(
    { ...base, spectral_brightness: 88, loudness: -3, speechiness: 2, acousticness: 30 },
    'SURREAL_PRACTICAL_METAPHOR')
  const gritty = computeVisualDNA(
    { ...base, speechiness: 92, acousticness: 3, energy: 95, loudness: -4 },
    'SURREAL_PRACTICAL_METAPHOR')
  const lc = getConcept(luxury.selections.symbolism.conceptId)
  const gc = getConcept(gritty.selections.symbolism.conceptId)
  assert.strictEqual(luxury.selections.symbolism.fragment, lc.staging.luxury)
  assert.strictEqual(gritty.selections.symbolism.fragment, gc.staging.gritty)
})

test('a staged symbol reaches the assembled prompt', () => {
  const dna = computeVisualDNA({ ...TRACK, ...DSP }, 'SURREAL_PRACTICAL_METAPHOR')
  const { prompt } = assemblePrompt({
    blueprint: { subject: 'a lone figure', environment: 'a rain-slick street', sceneAction: 'standing still' },
    dna, symbolismMinConfidence: 0,
  })
  const frag = dna.selections.symbolism.fragment
  if (dna.selections.symbolism.conceptId !== 'sym_none') {
    assert.ok(prompt.includes(frag.slice(0, 40)), 'staged symbol did not reach the prompt')
  }
})

// ── 14. DEAM calibration ──────────────────────────────────────────────────
// Measured on DEAM (1,802 human-rated songs): 95% of real music sits inside
// valence 0.195..0.781 and arousal 0.156..0.797. FELT's own valence formula can
// only emit 0.174..0.875. An anchor outside that band is not "more extreme" —
// it is unreachable, and it uniformly penalises its archetype against every
// track. These bounds guard against re-introducing that by hand.
const DEAM_VALENCE = [0.195, 0.781]
const DEAM_AROUSAL = [0.156, 0.797]

test('no archetype anchors outside the measured range of real music', () => {
  for (const [k, a] of Object.entries(ARCHETYPES)) {
    if (a.anchor.valence !== undefined) {
      const v = a.anchor.valence
      assert.ok(v >= DEAM_VALENCE[0] - 1e-9 && v <= DEAM_VALENCE[1] + 1e-9,
        `${k} valence ${v} is outside DEAM's measured ${DEAM_VALENCE.join('..')}`)
    }
    if (a.anchor.energy !== undefined) {
      const e = a.anchor.energy
      assert.ok(e >= DEAM_AROUSAL[0] - 1e-9 && e <= DEAM_AROUSAL[1] + 1e-9,
        `${k} energy ${e} is outside DEAM's measured ${DEAM_AROUSAL.join('..')}`)
    }
  }
})

test('calibration preserved the emotional ordering of the archetypes', () => {
  // The rescale was linear, so relative position must be unchanged. Melancholy
  // and Dread stay the bleakest; Joy the brightest; Serenity the calmest and
  // Power the most forceful. If a future edit reorders these, the taxonomy has
  // drifted from the research and this fails.
  const val = (k) => ARCHETYPES[k].anchor.valence
  const eng = (k) => ARCHETYPES[k].anchor.energy
  assert.ok(val('DREAD') < val('MELANCHOLY'), 'Dread should read bleaker than Melancholy')
  assert.ok(val('MELANCHOLY') < val('POWER'), 'Melancholy should read bleaker than Power')
  assert.ok(val('POWER') < val('TENSION'), 'Power should read darker than Tension')
  assert.ok(val('TENSION') < val('CEREBRAL'), 'Tension should read darker than Cerebral')
  assert.ok(val('CEREBRAL') < val('NOSTALGIA'), 'Cerebral should read darker than Nostalgia')
  assert.ok(val('NOSTALGIA') < val('TENDERNESS'), 'Nostalgia should read darker than Tenderness')
  assert.ok(val('TENDERNESS') < val('TRANSCENDENCE'), 'Tenderness below Transcendence')
  assert.ok(val('TRANSCENDENCE') < val('JOY'), 'Joy should be the brightest')
  assert.ok(eng('SERENITY') < eng('MELANCHOLY'), 'Serenity should be the stillest')
  assert.ok(eng('EUPHORIA') < eng('POWER'), 'Power should be the most forceful')
})

// ── 15. Medium agreement between scene and assembly ───────────────────────
// The scene is written BEFORE the technique is known, so it commits to a medium
// family up front ("you write ONE rendered moment"). If per-technique scoring
// then picked a different family, the prompt would describe a photograph and
// label it a 3D render. The constraint below is what makes that impossible.
test('computeVisualDNA honours a medium-family constraint', () => {
  const cgiTrack = {
    bpm: 130, energy: 82, valence: 50, danceability: 55, acousticness: 6,
    spectral_brightness: 80, speechiness: 15, loudness: -4, scale: 'minor',
    sub_bass_ratio: 0.48, spectral_flatness: 0.10, spectral_flux: 0.5, onset_rate: 7,
  }
  for (const family of ['photo', 'cgi', 'illustration']) {
    for (const t of Object.keys(TECHNIQUES)) {
      const dna = computeVisualDNA(cgiTrack, t, { mediumFamily: family })
      assert.strictEqual(mediumFamily(dna), family,
        `${t}: asked for "${family}" but assembled "${mediumFamily(dna)}"`)
    }
  }
})

test('a medium constraint never empties the selection', () => {
  for (const family of ['photo', 'cgi', 'illustration']) {
    const dna = computeVisualDNA(TRACK, DEFAULT_TECHNIQUE, { mediumFamily: family })
    assert.ok(dna.selections.artMedium && dna.selections.artMedium.conceptId,
      `${family} produced no artMedium`)
    assert.ok(dna.selections.artMedium.fragment, `${family} produced an empty fragment`)
  }
})

test('an unknown medium family degrades instead of breaking', () => {
  const dna = computeVisualDNA(TRACK, DEFAULT_TECHNIQUE, { mediumFamily: 'hologram' })
  assert.ok(dna.selections.artMedium.conceptId, 'unknown family should fall through, not crash')
})

test('constraining the medium leaves the rest of the DNA deterministic', () => {
  const a = computeVisualDNA(TRACK, DEFAULT_TECHNIQUE, { mediumFamily: 'photo' })
  const b = computeVisualDNA(TRACK, DEFAULT_TECHNIQUE, { mediumFamily: 'photo' })
  assert.strictEqual(JSON.stringify(a.selections), JSON.stringify(b.selections))
})

// ── report ────────────────────────────────────────────────────────────────
console.log(`\n  ${passed} passed, ${failures.length} failed\n`)
if (failures.length) {
  for (const f of failures) console.log(`  ✗ ${f}\n`)
  process.exitCode = 1
} else {
  console.log('  All engine invariants hold.\n')
}

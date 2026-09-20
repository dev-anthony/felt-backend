'use strict'
/**
 * Pipeline invariant tests. Zero dependencies, no network, no database, no API
 * key — `node src/engine/__test_pipeline.js`.
 *
 * Every test here guards a failure that was silent in production: a wrong
 * cover, not a crash. Each one traces to a real generation:
 *
 *   - the technique fragments never reached the image model (regex simplifier)
 *   - a screen-print declared to be "a real thermal-sensor capture"
 *   - "rendered in thermal false-color ... a network of glowing fissures" in
 *     the scene text itself
 *   - INFRARED_THERMAL (surveillance/dread) for a song about holding on to
 *     someone loved, because only the audio chose the technique
 *   - "no people" covers carrying skin/face/hand language
 */

const assert = require('assert')

const { buildFeatureVector } = require('./dna/featureVector')
const { readEmotion, emotionalRegisterBlock, ARCHETYPES } = require('./emotion')
const { computeVisualDNA } = require('./dna')
const { mediumFamily } = require('./assembler/promptAssembler')
const { TECHNIQUES, selectTechnique, getSuffix, WORDS_TECHNIQUE_WEIGHT } = require('./technique')
const { composeImagePrompt, DEFAULT_BUDGET } = require('./compose')
const { sceneQualityIssues, qualityRetryNote } = require('./scene/quality')
const { aestheticSystemPrompt } = require('./scene/prompt')
const {
  buildMetaphorPrompt, parseMetaphorResponse, pickCandidate, mentionsBody, RANK_WEIGHTS,
  buildKineticBlock,
} = require('./metaphor')
const { planCover, resolveTechnique, deriveSceneMode, resolveSubjectMode } = require('./plan')

let passed = 0
const failures = []
async function test(name, fn) {
  try { await fn(); passed++ } catch (err) { failures.push(`${name}\n    ${err.message}`) }
}

// Logs from the engine are useful in production and noise here.
const realLog = console.log
const realWarn = console.warn
function silenced(fn) {
  console.log = () => {}
  console.warn = () => {}
  try { return fn() } finally { console.log = realLog; console.warn = realWarn }
}
async function silencedAsync(fn) {
  console.log = () => {}
  console.warn = () => {}
  try { return await fn() } finally { console.log = realLog; console.warn = realWarn }
}

// ── fixtures: four very different tracks ──────────────────────────────────
const LOSE_YOU = {
  bpm: 123, key: 'E', scale: 'major', energy: 87, valence: 67, loudness: -12, speechiness: 12,
  acousticness: 90, danceability: 41, spectral_brightness: 12, genre: 'contemporary',
  onset_rate: 4.44, spectral_flux: 0.28, sub_bass_ratio: 0.607, spectral_flatness: 0.008,
}
const AFRO_HOPE = {
  bpm: 90, key: 'F', scale: 'minor', energy: 76, valence: 48, loudness: -16, speechiness: 20,
  acousticness: 81, danceability: 53, spectral_brightness: 28, genre: 'pop / afrobeat',
  onset_rate: 5.16, spectral_flux: 0.366, sub_bass_ratio: 0.47, spectral_flatness: 0.008,
}
const BALLAD = {
  bpm: 70, key: 'D', scale: 'minor', energy: 25, valence: 30, loudness: -18, speechiness: 5,
  acousticness: 90, danceability: 20, spectral_brightness: 20, genre: 'acoustic / neo-soul',
}
const DRILL = {
  bpm: 142, key: 'F', scale: 'minor', energy: 88, valence: 25, loudness: -5, speechiness: 45,
  acousticness: 10, danceability: 70, spectral_brightness: 60, genre: 'trap / drill',
  onset_rate: 12, spectral_flux: 0.7, sub_bass_ratio: 0.5, spectral_flatness: 0.3,
}
const TRACKS = { LOSE_YOU, AFRO_HOPE, BALLAD, DRILL }

const LOSE_YOU_WORDS = "i feel strong energy when i listen to this instrumental, Dont go, dont go...doing my best to hold on and make sure that special thing i have (girl, feeling, life) what ever dosent go."

const SCENE_OBJECT = 'A rusted steel crane hook hangs from a single frayed cable, three strands already parted, the drum above it stained orange where rain has run for years. Behind it a container yard sits empty in flat morning light.'
const SCENE_PERSON = 'A woman in a worn denim jacket grips the rear rail of a departing night bus, one foot already off the kerb, the driver not looking back.'

// ══ 1. Technique honours the artist's words ═══════════════════════════════
async function main() {
  await test('selectTechnique: no second reading is exactly the old behaviour', () => {
    const v = buildFeatureVector(LOSE_YOU)
    const r = readEmotion(v, null, LOSE_YOU_WORDS)
    for (const explore of [0, 0.3, 1]) {
      const base = selectTechnique(r.archetypeId, r.correctedVector, { intensity: r.intensity, explore })
      assert.strictEqual(selectTechnique(r.archetypeId, r.correctedVector, { intensity: r.intensity, explore, secondaryArchetypeId: undefined }), base)
      assert.strictEqual(selectTechnique(r.archetypeId, r.correctedVector, { intensity: r.intensity, explore, secondaryArchetypeId: r.archetypeId }), base,
        'a second reading equal to the first must be a no-op')
    }
  })

  await test('selectTechnique: the words move Lose You off INFRARED_THERMAL (technique poor for tenderness)', () => {
    const v = buildFeatureVector(LOSE_YOU)
    const r = readEmotion(v, null, LOSE_YOU_WORDS)
    assert.strictEqual(r.archetypeId, 'TENSION', 'fixture drifted: audio should read as Tension')
    const audioOnly = selectTechnique('TENSION', r.correctedVector, { intensity: r.intensity, explore: 0 })
    assert.strictEqual(audioOnly, 'INFRARED_THERMAL', 'fixture drifted: audio-only pick')
    for (const feeling of ['TENDERNESS', 'MELANCHOLY', 'NOSTALGIA']) {
      const t = selectTechnique('TENSION', r.correctedVector, { intensity: r.intensity, explore: 0, secondaryArchetypeId: feeling })
      assert.notStrictEqual(t, 'INFRARED_THERMAL', `words=${feeling} must not still pick the surveillance technique`)
    }
  })

  await test('selectTechnique: words that genuinely ARE dread keep the dread technique', () => {
    const v = buildFeatureVector(LOSE_YOU)
    const r = readEmotion(v, null, LOSE_YOU_WORDS)
    for (const feeling of ['DREAD', 'TENSION']) {
      assert.strictEqual(
        selectTechnique('TENSION', r.correctedVector, { intensity: r.intensity, explore: 0, secondaryArchetypeId: feeling }),
        'INFRARED_THERMAL', `words=${feeling} legitimately suits INFRARED_THERMAL`)
    }
  })

  await test('selectTechnique: the words weight is bounded — audio always keeps the majority say', () => {
    assert.ok(WORDS_TECHNIQUE_WEIGHT > 0 && WORDS_TECHNIQUE_WEIGHT < 0.5, `weight ${WORDS_TECHNIQUE_WEIGHT}`)
  })

  await test('readEmotion: words reading is carried alongside, never overriding the audio read', () => {
    const v = buildFeatureVector(LOSE_YOU)
    const base = readEmotion(v, null, LOSE_YOU_WORDS)
    const withWords = readEmotion(v, null, LOSE_YOU_WORDS, undefined, 'TENDERNESS')
    assert.strictEqual(withWords.archetypeId, base.archetypeId, 'audio archetype must not move')
    assert.strictEqual(JSON.stringify(withWords.correctedVector), JSON.stringify(base.correctedVector), 'vector must not move')
    assert.strictEqual(withWords.wordsReading.id, 'TENDERNESS')
    assert.ok(emotionalRegisterBlock(withWords, withWords.correctedVector).includes("WHAT THE ARTIST'S WORDS ARE ABOUT"))
    assert.ok(!emotionalRegisterBlock(base, base.correctedVector).includes("WHAT THE ARTIST'S WORDS ARE ABOUT"))
  })

  await test('readEmotion: unknown / same-as-audio words reading is ignored', () => {
    const v = buildFeatureVector(LOSE_YOU)
    assert.strictEqual(readEmotion(v, null, '', undefined, 'BANANA').wordsReading, null)
    assert.strictEqual(readEmotion(v, null, '', undefined, 'TENSION').wordsReading, null)
    assert.strictEqual(readEmotion(v, null, '', undefined, null).wordsReading, null)
  })

  // ── planCover end to end with a fake model ──────────────────────────────
  const reply = (feeling, images) => JSON.stringify({
    feeling,
    metaphors: images.map(([image, hasPerson]) => ({ image, hasPerson })),
  })
  const fakeModel = (feeling, images = [['a frayed steel cable under load', false], ['a wet boulder in a gorge', false], ['a worn glove on a rail', true], ['a tide line on a sea wall', false]]) =>
    async () => reply(feeling, images)
  const always0 = () => 0

  await test('planCover: the artist\'s words change the technique end to end', async () => {
    const audioOnly = await silencedAsync(() => planCover({
      generate: async () => { throw new Error('quota exhausted') },
      features: LOSE_YOU, genreLineage: null, intentText: LOSE_YOU_WORDS, metaphorWords: LOSE_YOU_WORDS,
    }))
    assert.strictEqual(audioOnly.technique, 'INFRARED_THERMAL', 'no model => audio-only behaviour, as before')
    assert.strictEqual(audioOnly.feeling, null)
    assert.strictEqual(audioOnly.metaphor, null)

    const heard = await silencedAsync(() => planCover({
      generate: fakeModel('TENDERNESS'), rand: always0,
      features: LOSE_YOU, genreLineage: null, intentText: LOSE_YOU_WORDS, metaphorWords: LOSE_YOU_WORDS,
    }))
    assert.strictEqual(heard.feeling, 'TENDERNESS')
    assert.notStrictEqual(heard.technique, 'INFRARED_THERMAL')
    assert.ok(heard.emotionalRegister.includes("WHAT THE ARTIST'S WORDS ARE ABOUT"), 'scene writer must be told')
    assert.strictEqual(heard.metaphor, 'a frayed steel cable under load')
    assert.strictEqual(heard.sceneMode.subjectMode, 'absent', 'object metaphor => no figure')
  })

  await test('planCover: an invalid feeling from the model degrades to audio-only, never breaks', async () => {
    const plan = await silencedAsync(() => planCover({
      generate: fakeModel('BANANA'), rand: always0,
      features: LOSE_YOU, genreLineage: null, intentText: LOSE_YOU_WORDS, metaphorWords: LOSE_YOU_WORDS,
    }))
    assert.strictEqual(plan.feeling, null)
    assert.strictEqual(plan.technique, 'INFRARED_THERMAL')
    assert.ok(plan.metaphor, 'the metaphor itself is still usable')
  })

  await test('planCover: malformed model output degrades cleanly', async () => {
    for (const bad of ['', 'not json', '{"metaphors": "nope"}', '```json\n{"feeling":1}\n```']) {
      const plan = await silencedAsync(() => planCover({
        generate: async () => bad, features: LOSE_YOU, genreLineage: null, intentText: LOSE_YOU_WORDS, metaphorWords: LOSE_YOU_WORDS,
      }))
      assert.ok(plan.technique && TECHNIQUES[plan.technique], `bad reply ${JSON.stringify(bad)} broke technique selection`)
      assert.strictEqual(plan.metaphor, null)
    }
  })

  await test('planCover: a locked technique (refine) is never re-rolled by the words', async () => {
    const plan = await silencedAsync(() => planCover({
      generate: fakeModel('TENDERNESS'), rand: always0, lockedTechnique: 'INFRARED_THERMAL',
      features: LOSE_YOU, genreLineage: null, intentText: LOSE_YOU_WORDS, metaphorWords: LOSE_YOU_WORDS,
    }))
    assert.strictEqual(plan.technique, 'INFRARED_THERMAL')
  })

  await test('planCover: the words only reach technique when they differ — other tracks stay sane', async () => {
    for (const [name, features] of Object.entries(TRACKS)) {
      for (const feeling of Object.keys(ARCHETYPES)) {
        const plan = await silencedAsync(() => planCover({
          generate: fakeModel(feeling), rand: always0, features, genreLineage: null, intentText: 'a song', metaphorWords: 'a song',
        }))
        assert.ok(TECHNIQUES[plan.technique], `${name}/${feeling}: invalid technique ${plan.technique}`)
      }
    }
  })

  await test('planCover: a person-tagged metaphor routes to person mode, object to absent', async () => {
    const person = await silencedAsync(() => planCover({
      generate: fakeModel('TENDERNESS', [['a hand pressed flat against wet glass', true], ['a tide line', false], ['a cable', false], ['a stone', false]]), rand: always0,
      features: BALLAD, genreLineage: null, intentText: 'x', metaphorWords: 'x',
    }))
    assert.strictEqual(person.sceneMode.subjectMode, 'person')
    assert.strictEqual(resolveSubjectMode({ subjectMode: 'person' }, false).subjectMode, 'absent')
    assert.strictEqual(resolveSubjectMode({ subjectMode: 'absent' }, null).subjectMode, 'absent', 'null tag keeps the audio guess')
  })

  await test('resolveTechnique: same inputs, same technique (deterministic per song)', () => {
    const a = silenced(() => resolveTechnique(LOSE_YOU, null, LOSE_YOU_WORDS, undefined, 'TENDERNESS'))
    const b = silenced(() => resolveTechnique(LOSE_YOU, null, LOSE_YOU_WORDS, undefined, 'TENDERNESS'))
    assert.strictEqual(a, b)
  })

  // ══ 2. Metaphor stage ═══════════════════════════════════════════════════
  await test('metaphor prompt: asks for the feeling, from the closed set of twelve', () => {
    const p = buildMetaphorPrompt({ userFeeling: 'x', context: '', kinetics: null })
    for (const id of Object.keys(ARCHETYPES)) assert.ok(p.includes(id), `menu is missing ${id}`)
    assert.ok(p.includes('"feeling"'))
    assert.ok(/thumbnail/i.test(p), 'cover-craft legibility rule missing')
  })

  await test('metaphor prompt: no thumb on the scale — persons and objects are treated the same', () => {
    const p = buildMetaphorPrompt({ userFeeling: 'x', context: '', kinetics: null })
    assert.ok(!/object-only image should beat/i.test(p), 'the object-over-person bias is back')
    assert.ok(/never avoid one out of habit/i.test(p))
    assert.ok(!/"hasPerson": false\}, \{"image": "\.\.\.", "hasPerson": false\}, \{"image": "\.\.\.", "hasPerson": false/.test(p),
      'the JSON example must not pre-load three no-person answers')
  })

  await test('metaphor prompt: reality rules name the AI-tells the reviews found', () => {
    const p = buildMetaphorPrompt({ userFeeling: 'x', context: '', kinetics: null })
    for (const w of ['Glowing cracks', 'spiderweb', 'floating particles', 'photographer']) assert.ok(p.includes(w), `reality rule missing "${w}"`)
  })

  await test('parseMetaphorResponse: validates feeling, tolerates fences', () => {
    const ok = parseMetaphorResponse('```json\n' + reply('melancholy', [['a tide line', false]]) + '\n```')
    assert.strictEqual(ok.feeling, 'MELANCHOLY', 'case-insensitive, normalised')
    assert.strictEqual(ok.candidates.length, 1)
    assert.strictEqual(parseMetaphorResponse(reply('NOT_A_FEELING', [['a tide line', false]])).feeling, null)
    assert.deepStrictEqual(parseMetaphorResponse('garbage'), { feeling: null, candidates: [] })
  })

  await test('parseMetaphorResponse: a body word overrides a wrong hasPerson:false tag', () => {
    const r = parseMetaphorResponse(reply('TENDERNESS', [
      ['a hand pressed against fogged glass', false],
      ['a foot slipping on a wet railing', false],
      ['a weathered face at a bus window', false],
      ['a frayed cable under load', false],
    ]))
    assert.deepStrictEqual(r.candidates.map((c) => c.hasPerson), [true, true, true, false])
    assert.ok(r.candidates[0].corrected)
  })

  await test('mentionsBody: craft terms and instruments are not bodies', () => {
    for (const t of ['a hand-thrown porcelain vessel', 'hand-dyed indigo cloth', 'a hand drum mid-strike', 'a clock face with one hand stopped'.replace(' with one hand stopped', '')]) {
      assert.strictEqual(mentionsBody(t), t.includes('clock face') ? true : false, t)
    }
    assert.strictEqual(mentionsBody('a crane hook on a frayed cable'), false)
    assert.strictEqual(mentionsBody('a woman at a bus stop'), true)
  })

  await test('pickCandidate: every rank can win, favouring the best, never out of range', () => {
    const c = [{}, {}, {}, {}]
    assert.strictEqual(pickCandidate([]).candidate, null)
    const counts = [0, 0, 0, 0]
    for (let i = 0; i < 1000; i++) counts[pickCandidate(c, () => i / 1000).index]++
    assert.ok(counts.every((n) => n > 0), `some rank never wins: ${counts}`)
    assert.ok(counts[0] > counts[1] && counts[1] > counts[2] && counts[2] > counts[3], `not monotone: ${counts}`)
    assert.strictEqual(pickCandidate(c, () => 0.999999).index, 3)
    assert.strictEqual(pickCandidate([{}], () => 0.9).index, 0)
    assert.ok(Math.abs(RANK_WEIGHTS.reduce((a, b) => a + b, 0) - 1) < 1e-9)
  })

  await test('kinetic block: energy is pressure, danceability is flavour', () => {
    const strain = buildKineticBlock({ energy: 87, danceability: 41, bpm: 123, kinetic: 0.54 })
    assert.ok(/Force \/ pressure: HIGH/.test(strain) && /ACTIVE STRAIN/.test(strain))
    assert.ok(/RELEASE/.test(buildKineticBlock({ energy: 85, danceability: 78, bpm: 124, kinetic: 0.8 })))
    assert.ok(/STILL/.test(buildKineticBlock({ energy: 25, danceability: 20, bpm: 70, kinetic: 0.2 })))
    assert.strictEqual(buildKineticBlock(null), '')
  })

  // ══ 3. Scene quality guard ══════════════════════════════════════════════
  await test('scene guard: flags every scene the reviews rejected', () => {
    const rejected = [
      'A colossal concrete bridge pier strains under the roadway. A spiderweb of hairline cracks, rendered in thermal false-color as a network of glowing fissures, radiates across its surface.',
      'A single, heavy droplet of mercury, a cool blue thermal signature, is poised on the edge of a razor blade.',
      "The long-exposure thermal signature of a car's tail lights terminates mid-frame at a night intersection.",
      'A masculine hand, its skin rendered in vibrant thermal orange and yellow, presses hard against the cold glass.',
      'Light leaks from the cracks in a veins of light pattern across the stone, ethereal and otherworldly.',
    ]
    for (const t of rejected) assert.ok(sceneQualityIssues(t).length > 0, `not flagged: ${t.slice(0, 60)}`)
  })

  await test('scene guard: ordinary physical description is never flagged', () => {
    const fine = [
      SCENE_OBJECT, SCENE_PERSON,
      'A cracked ceramic mug on a windowsill at 3am, its handle glued back twice, steam rising from cold tea reheated too many times.',
      'A dented thermal flask on a workbench beside a coil of copper wire.',
      'Morning light on a wet concrete stairwell, a single rust stain running down from the handrail bracket.',
      'A single sodium streetlamp above a bus shelter, moths circling under the yellow light.',
    ]
    for (const t of fine) assert.deepStrictEqual(sceneQualityIssues(t), [], `false positive: ${t.slice(0, 60)}`)
  })

  await test('scene guard: the retry note names the exact offending words', () => {
    const note = qualityRetryNote(sceneQualityIssues('a network of glowing fissures rendered in thermal false-color'))
    assert.ok(/glowing/.test(note) && /thermal/.test(note) && /REWRITE REQUIRED/.test(note))
  })

  // ══ 4. The scene writer's own brief ═════════════════════════════════════
  await test('scene prompt: never invites the writer to describe the technique\'s look', () => {
    for (const technique of Object.keys(TECHNIQUES)) {
      const p = aestheticSystemPrompt({ mediumFamily: 'photo', subjectMode: 'absent', technique, metaphor: 'a frayed cable' })
      assert.ok(!/Use its vocabulary for sensory detail/i.test(p), `${technique}: contradiction is back`)
      assert.ok(!p.includes(TECHNIQUES[technique].visualSignature), `${technique}: the rendering signature leaked into the scene brief`)
      assert.ok(p.includes('THE TECHNIQUE IS APPLIED BY A SEPARATE RENDERING SYSTEM'), `${technique}: boundary rule missing`)
      assert.ok(p.includes('REAL, NOT RENDERED'), `${technique}: reality block missing`)
    }
  })

  await test('scene prompt: no corrupted characters, and both subject modes stay coherent', () => {
    for (const subjectMode of ['person', 'absent']) {
      const p = aestheticSystemPrompt({ mediumFamily: 'photo', subjectMode, technique: 'INFRARED_THERMAL', metaphor: 'a frayed cable' })
      assert.ok(!/â|Ã|�/.test(p), `${subjectMode}: mojibake in the prompt`)
      if (subjectMode === 'absent') {
        assert.ok(!p.includes('SUBJECT COUNT'), 'absent mode must not carry the person-count rules')
        assert.ok(p.includes('NO human figure'))
      } else {
        assert.ok(p.includes('SUBJECT COUNT'))
      }
      assert.ok(p.includes('a frayed cable'), 'the metaphor must be handed over verbatim')
    }
  })

  // ══ 5. The image prompt: every technique x subject mode x track ═════════
  const ILLUSTRATION_WORDS = /\b(screen-?print|riso(?:graph)?|collage|halftone|torn-edge|cut-outs?|painterly|impasto|cel-shaded|anime|comic)\b/i
  const PERSON_LANGUAGE = /\b(skin tone|natural skin|lit skin|catchlight in the eyes|the face|faces reading|facial|pores|complexion|mugshot)\b/i

  await test('composed prompt: invariants hold for every technique x subject mode x track', () => {
    let checked = 0
    for (const [trackName, features] of Object.entries(TRACKS)) {
      for (const technique of Object.keys(TECHNIQUES)) {
        for (const noPeople of [true, false]) {
          const scene = noPeople ? SCENE_OBJECT : SCENE_PERSON
          const dna = silenced(() => computeVisualDNA(features, technique, { noPeople, intentText: scene, quiet: true }))
          const { prompt, parts, length } = composeImagePrompt({ scene, dna, technique, noPeople })
          const tag = `${trackName}/${technique}/${noPeople ? 'object' : 'person'}`

          // the story survives whole and comes first (after the medium)
          assert.ok(prompt.includes(scene.replace(/\.+$/, '')), `${tag}: scene was altered or cut`)
          const idx = prompt.indexOf(scene.slice(0, 40))
          assert.ok(idx >= 0 && idx < 60, `${tag}: scene is not near the front (at ${idx})`)

          // medium and technique agree: photographic, no illustration language outside the suffix's own negation
          assert.strictEqual(mediumFamily(dna), 'photo', `${tag}: non-photographic medium`)
          const suffix = getSuffix(technique, { noPeople })
          const withoutSuffix = prompt.replace(suffix, '')
          assert.ok(!ILLUSTRATION_WORDS.test(withoutSuffix), `${tag}: illustration language in a photographic prompt: ${withoutSuffix.match(ILLUSTRATION_WORDS)}`)

          // the technique's identity reaches the model
          assert.ok(prompt.includes(suffix.replace(/\.$/, '')), `${tag}: technique suffix missing`)
          for (const layer of ['lighting', 'color', 'camera']) {
            const frag = dna.selections[layer] && dna.selections[layer].fragment
            if (frag) assert.ok(prompt.includes(frag.replace(/\.$/, '')), `${tag}: ${layer} fragment missing from the prompt`)
          }

          // boilerplate that hurts image models is gone
          assert.ok(!/stacked typography|lower-third band|column of quiet space/i.test(prompt), `${tag}: typography boilerplate leaked`)
          assert.strictEqual((prompt.match(/1:1 square/g) || []).length, 1, `${tag}: format stated more than once`)
          assert.ok(length <= DEFAULT_BUDGET + 250, `${tag}: ${length} chars is over the budget`)
          assert.ok(parts.rendering.length >= 3, `${tag}: too few rendering layers survived`)

          // subject guard matches the mode, and object covers carry no body language
          if (noPeople) {
            assert.ok(prompt.includes('No people at all in frame'), `${tag}: missing no-people guard`)
            assert.ok(!PERSON_LANGUAGE.test(prompt), `${tag}: person language on an object cover: ${prompt.match(PERSON_LANGUAGE)}`)
            assert.ok(!/malformed hands|waxy plastic skin/.test(prompt), `${tag}: skin/hand negatives re-introduce the body`)
          } else {
            assert.ok(prompt.includes('Exactly one person in frame'), `${tag}: missing single-subject guard`)
          }
          checked++
        }
      }
    }
    assert.strictEqual(checked, Object.keys(TRACKS).length * Object.keys(TECHNIQUES).length * 2)
  })

  await test('technique suffixes: no-people variants carry no body language; default suffix is unchanged', () => {
    for (const [name, t] of Object.entries(TECHNIQUES)) {
      assert.strictEqual(getSuffix(name), t.suffix, `${name}: person-mode suffix must be untouched`)
      assert.ok(!mentionsBody(getSuffix(name, { noPeople: true })), `${name}: no-people suffix mentions a body: "${getSuffix(name, { noPeople: true })}"`)
    }
    assert.ok(TECHNIQUES.SILHOUETTE_ATMOSPHERE.noPeopleSuffix && TECHNIQUES.ENVIRONMENTAL_WIDE_DOCUMENTARY.noPeopleSuffix)
  })

  await test('composed prompt: the two motion techniques never lose their motion layer to the budget', () => {
    for (const technique of ['MOTION_BLUR_STROBE', 'LONG_EXPOSURE_LIGHT_PAINTING']) {
      const dna = silenced(() => computeVisualDNA(DRILL, technique, { noPeople: true, quiet: true }))
      const motion = dna.selections.motion && dna.selections.motion.fragment
      assert.ok(motion, `${technique}: fixture has no motion fragment`)
      const { prompt, parts } = composeImagePrompt({ scene: SCENE_OBJECT, dna, technique, noPeople: true, budget: 500 })
      assert.ok(prompt.includes(motion.replace(/\.$/, '')), `${technique}: motion fragment dropped`)
      assert.ok(!parts.dropped.includes('motion'))
    }
  })

  await test('composed prompt: film techniques keep their film stock, the old composer dropped it', () => {
    const dna = silenced(() => computeVisualDNA(AFRO_HOPE, 'VINTAGE_FILM_NOSTALGIA', { noPeople: true, quiet: true }))
    const film = dna.selections.filmStock && dna.selections.filmStock.fragment
    assert.ok(film, 'fixture has no film stock')
    const { prompt } = composeImagePrompt({ scene: SCENE_OBJECT, dna, technique: 'VINTAGE_FILM_NOSTALGIA', noPeople: true })
    assert.ok(prompt.includes(film.replace(/\.$/, '').replace(/warm, true skin tones/, 'true-to-life')) || /Kodak|CineStill|Ektachrome|Tri-X|digital/i.test(prompt), 'film stock missing')
  })

  await test('composed prompt: over budget drops the least important layers first, never the look', () => {
    const dna = silenced(() => computeVisualDNA(LOSE_YOU, 'FLASH_DOCUMENTARY', { noPeople: true, quiet: true }))
    const { parts } = composeImagePrompt({ scene: SCENE_OBJECT, dna, technique: 'FLASH_DOCUMENTARY', noPeople: true, budget: 450 })
    assert.strictEqual(parts.dropped[0], 'postProcessing', `first drop was ${parts.dropped[0]}`)
    for (const keep of ['camera', 'lighting', 'color']) assert.ok(!parts.dropped.includes(keep), `${keep} must never be dropped`)
  })

  await test('composed prompt: no DNA (engine failure) still yields scene + technique + guards', () => {
    const { prompt } = composeImagePrompt({ scene: SCENE_OBJECT, dna: null, technique: 'INFRARED_THERMAL', noPeople: true })
    assert.ok(prompt.startsWith('A rusted steel crane hook'))
    assert.ok(prompt.includes(TECHNIQUES.INFRARED_THERMAL.suffix))
    assert.ok(prompt.includes('No people at all'))
  })

  // ══ 6. Technique authority ══════════════════════════════════════════════
  await test('technique authority: INFRARED_THERMAL can never receive a collage/print graphic or medium', () => {
    for (const features of Object.values(TRACKS)) {
      for (let i = 0; i < 5; i++) {
        const f = { ...features, energy: features.energy - i * 3 } // vary the seed
        const dna = silenced(() => computeVisualDNA(f, 'INFRARED_THERMAL', { mediumFamily: 'illustration', quiet: true }))
        assert.strictEqual(mediumFamily(dna), 'photo')
        assert.ok(!['graphic_collage', 'graphic_riso_print', 'graphic_vinyl_sleeve', 'graphic_panel_grid'].includes(dna.selections.graphic.conceptId))
      }
    }
  })

  await test('technique authority: the mugshot layout never wins on a clearly positive track', () => {
    for (const technique of Object.keys(TECHNIQUES)) {
      const dna = silenced(() => computeVisualDNA(AFRO_HOPE, technique, { intentText: 'i just feel hope, everything is gonna be alright', quiet: true }))
      assert.notStrictEqual(dna.selections.graphic.conceptId, 'graphic_panel_grid', `${technique}: mugshot-style lineup on a hopeful song`)
    }
  })

  // ══ 7. Logging discipline ═══════════════════════════════════════════════
  await test('quiet option really silences per-selection DNA logs', () => {
    const lines = []
    console.log = (...a) => lines.push(a.join(' '))
    try { computeVisualDNA(LOSE_YOU, 'INFRARED_THERMAL', { quiet: true }) } finally { console.log = realLog }
    assert.deepStrictEqual(lines.filter((l) => /DNA-(SELECT|TECHNIQUE)/.test(l)), [])
  })

  await test('deriveSceneMode runs 15 marginalisation passes without logging', () => {
    const lines = []
    console.log = (...a) => lines.push(a.join(' '))
    let mode
    try { mode = deriveSceneMode(LOSE_YOU) } finally { console.log = realLog }
    assert.deepStrictEqual(lines.filter((l) => /DNA-/.test(l)), [], 'the marginalisation loop is spamming the logs again')
    assert.ok(mode.mediumFamily && mode.subjectMode)
  })

  // ── report ──────────────────────────────────────────────────────────────
  console.log(`\n  ${passed} passed, ${failures.length} failed\n`)
  if (failures.length) {
    for (const f of failures) console.log(`  ✗ ${f}\n`)
    process.exitCode = 1
  } else {
    console.log('  All pipeline invariants hold.\n')
  }
}

main().catch((err) => { console.error(err); process.exitCode = 1 })

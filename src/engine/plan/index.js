'use strict'
/**
 * COVER PLAN — the orchestration that runs before any scene is written.
 *
 * Reads the audio, asks the metaphor stage what the artist's WORDS are about
 * and for the image that carries it, chooses the technique from both readings,
 * and returns everything the scene writer needs (planCover).
 *
 * Lives in the engine, with the Gemini call injected, for one reason: this is
 * the code that decides whether the artist is actually heard, and it must be
 * testable without a network, a database or an API key. It used to sit inside
 * the route file, where it could only be observed through a live generation.
 */

const { readEmotion, emotionalRegisterBlock } = require('../emotion')
const { buildFeatureVector } = require('../dna/featureVector')
const { computeVisualDNA } = require('../dna')
const { mediumFamily } = require('../assembler/promptAssembler')
const { TECHNIQUES, selectTechnique, getFallbackTechnique } = require('../technique')
const { generateVisualMetaphors } = require('../metaphor')

/**
 * MATH-DRIVEN TECHNIQUE SELECTION.
 *
 * Technique is no longer something Gemini picks from a text menu. Emotion
 * interprets the audio (archetype + intensity), then selectTechnique() scores
 * all 15 techniques against that read via the affinity matrix + the track's
 * own movement/chaos signal. Gemini's job is only to write the scene for
 * whichever technique this returns — it never sees a menu.
 */
function resolveTechnique(features, declaredGenre, intentText, declaredEmotionId, wordsArchetypeId) {
  try {
    const vector = buildFeatureVector(features)
    // read.archetypeId ('MELANCHOLY' etc.) and read.intensity ('low'|'medium'
    // |'high'|'extreme') are both plain strings directly on the return object
    // — confirmed against engine/emotion/index.js.
    const read = readEmotion(vector, declaredGenre, intentText, declaredEmotionId, wordsArchetypeId)
    // A SECOND reading of the feeling when there is one: the artist's explicit
    // pick from the taxonomy, else what their words are about (read by the
    // metaphor stage). Audio alone chose INFRARED_THERMAL — a technique whose
    // own definition says "poor for warmth or tenderness" — for a track whose
    // words were about holding on to someone loved, every time, because the
    // audio measured Tension. selectTechnique blends the two readings.
    const secondary = [read.declaredEmotion?.archetype, read.wordsReading?.id]
      .find((a) => a && a !== read.archetypeId)
    const technique = selectTechnique(read.archetypeId, read.correctedVector, {
      intensity: read.intensity,
      secondaryArchetypeId: secondary,
    })
    console.log(`[TECHNIQUE SELECT] audio=${read.archetypeId} secondary=${secondary || '-'} intensity=${read.intensity} kinetic=${read.kinetic} -> ${technique}`)
    return technique
  } catch (err) {
    console.warn(`[TECHNIQUE SELECT] scoring failed, using fallback: ${err?.message || err}`)
    return getFallbackTechnique(features ? buildFeatureVector(features) : undefined)
  }
}

/** Builds the labeled register block for a track + the artist's own words. */
function buildEmotionalRegister(features, declaredGenre, intentText, declaredEmotionId, { wordsArchetypeId, quiet = false, mode = 'full' } = {}) {
  try {
    const vector = buildFeatureVector(features)
    const read = readEmotion(vector, declaredGenre, intentText, declaredEmotionId, wordsArchetypeId)
    if (quiet) {
      // caller logs once, for the final read
    } else if (read.semanticCorrections.length) {
      console.log(`[EMOTION] ${read.archetype.label} | ${read.stateLabel} | ${read.intensityLabel} | kinetic=${read.kinetic} | corrections: ${read.semanticCorrections.join('; ')}`)
    } else {
      console.log(`[EMOTION] ${read.archetype.label} | ${read.stateLabel} | ${read.intensityLabel} | kinetic=${read.kinetic}` + (read.declaredEmotion ? ` | artist declared "${read.declaredEmotion.label}"` : '') + (read.wordsReading ? ` | words read as "${read.wordsReading.label}"` : ''))
    }
    return emotionalRegisterBlock(read, read.correctedVector, { mode })
  } catch (err) {
    console.warn(`[EMOTION] read failed, continuing without register: ${err?.message || err}`)
    return ''
  }
}

/**
 * Structured kinetic facts for the metaphor generator.
 *
 * `buildEmotionalRegister` already runs `readEmotion` and renders a prose block,
 * but that block's MOVEMENT line is written for the scene writer in body terms
 * ("the body must read as physically in motion"), which is the wrong instruction
 * for an object/material metaphor. Rather than have the metaphor generator parse
 * prose meant for someone else, this hands it the numbers directly.
 *
 * Uses `correctedVector`, so the artist's own words (e.g. "hope") have already
 * moved these values before the metaphor sees them. Deterministic and cheap —
 * readEmotion is pure arithmetic, no API call — so recomputing here rather than
 * threading a second return value through five call sites is the safer trade.
 */
function buildKinetics(features, declaredGenre, intentText, declaredEmotionId) {
  try {
    const vector = buildFeatureVector(features)
    const read = readEmotion(vector, declaredGenre, intentText, declaredEmotionId)
    const v = read.correctedVector
    return {
      energy: Math.round(v.energy * 100),
      danceability: Math.round(v.danceability * 100),
      bpm: Math.round((v.tempo * 120) + 60),
      kinetic: read.kinetic,
      intensityLabel: read.intensityLabel,
    }
  } catch (err) {
    console.warn(`[KINETICS] read failed, metaphor will run without physical-state guidance: ${err?.message || err}`)
    return null
  }
}

/**
 * Ask the Visual DNA, before the scene is written, whether this cover most
 * likely has a human subject at all, and which medium family it lands in.
 *
 * Marginalises over every technique and takes the modal answer, so the answer
 * does not depend on which technique happens to win later. Note what this is
 * NOT any more: the medium is no longer decided here. Techniques are chosen
 * BEFORE the scene and every technique is a real capture, so technique
 * authority (dna/index.js) forces a photographic medium regardless of this
 * guess — `mediumFamily` below is photographic for every current technique and
 * is kept only so a technique that opts into CGI/illustration still briefs the
 * scene writer correctly. The subject guess is a FALLBACK: the winning
 * metaphor's own `hasPerson` tag overrides it (resolveSubjectMode).
 *
 * Best-effort: any failure returns photographic-with-a-person, so a fault here
 * can never block a generation.
 */
function deriveSceneMode(features) {
  try {
    const mediums = {}
    const subjects = {}
    for (const t of Object.keys(TECHNIQUES)) {
      const dna = computeVisualDNA(features, t, { quiet: true })
      const fam = mediumFamily(dna)
      mediums[fam] = (mediums[fam] || 0) + 1
      const sub = dna.selections.subject.conceptId === 'subj_absent' ? 'absent' : 'person'
      subjects[sub] = (subjects[sub] || 0) + 1
    }
    // Photography is FELT's default thesis, so a non-photo medium needs a clear
    // MAJORITY, not a plurality. A 4/3/3 split is an ambiguous track, and
    // committing the scene writer to "you write ONE rendered moment" on a
    // one-technique edge would be a coin flip with a very visible outcome.
    const total = Object.values(mediums).reduce((a, b) => a + b, 0)
    const top = Object.entries(mediums).sort((a, b) => b[1] - a[1])[0]
    const decisive = top && top[1] > total / 2 ? top[0] : 'photo'
    return {
      mediumFamily: decisive,
      // A person is the safe default, so `absent` must win outright rather than
      // merely tie — a faceless cover is right for a Cerebral IDM record and
      // wrong for an Afrobeats single.
      subjectMode: (subjects.absent || 0) > (subjects.person || 0) ? 'absent' : 'person',
    }
  } catch (err) {
    console.warn(`[SCENE MODE] falling back to photo/person: ${err?.message || err}`)
    return { mediumFamily: 'photo', subjectMode: 'person' }
  }
}

/**
 * The winning visual metaphor's own `hasPerson` tag overrides the audio-only
 * subject guess from `deriveSceneMode` — whether a figure belongs in the
 * frame is now a property of the chosen image, not a separate coin flip from
 * the feature vector. Falls back to the audio-derived guess only when the
 * metaphor call produced nothing usable (`hasPerson` is null).
 */
function resolveSubjectMode(sceneMode, hasPerson) {
  if (hasPerson === true) return { ...sceneMode, subjectMode: 'person' }
  if (hasPerson === false) return { ...sceneMode, subjectMode: 'absent' }
  return sceneMode
}

/**
 * The shared front half of every route that writes a scene: read the audio,
 * ask the metaphor stage what the artist's WORDS are about and for the image
 * that carries it, choose the technique from BOTH readings, then hand back
 * everything the scene writer needs.
 *
 * This sequence used to be copy-pasted into five call sites (synthesizeSceneBrief,
 * /expand, both /transcribe branches, /refine), and every fix had to be
 * re-applied five times — which is how the technique/words fix, the kinetic
 * block and the subject-mode override each landed in some places and not
 * others. One function means one place.
 *
 * Order matters: the metaphor call comes BEFORE technique selection, because
 * it is the only stage that reads the artist's words as language, and the
 * technique now depends on what it finds. It is one Gemini call either way.
 * If that call fails (quota, outage), `feeling` is null and technique falls
 * back to the audio read alone — exactly the previous behaviour.
 *
 * @param {object} args
 * @param {(promptText:string)=>Promise<string>} args.generate injected Gemini text call
 * @param {object} args.features audio features for the upload
 * @param {string|null} args.genreLineage the artist's declared lane
 * @param {string} args.intentText text the emotion layer's semantic cues read
 * @param {string} args.metaphorWords the artist's words handed to the metaphor stage
 * @param {string|null} [args.declaredEmotionId] the artist's pick from the taxonomy
 * @param {string} [args.lockedTechnique] skip technique selection (refine keeps the original look)
 * @param {string} [args.contextFallback] metaphor context if no register can be built
 * @param {()=>number} [args.rand] injectable RNG for the metaphor pick (tests)
 */
async function planCover({ generate, features, genreLineage: lineage, intentText, metaphorWords, declaredEmotionId, lockedTechnique, contextFallback, rand }) {
  const kinetics = buildKinetics(features, lineage, intentText, declaredEmotionId)
  // Audio-only register: context for the metaphor stage. Logged once, below,
  // for the final read.
  // Audio FACTS only (mode 'metaphor'): the metaphor stage is asked what the
  // artist's WORDS are about, and must not be told the audio's archetype first.
  const audioRegister = buildEmotionalRegister(features, lineage, intentText, declaredEmotionId, { quiet: true, mode: 'metaphor' })

  const meta = await generateVisualMetaphors({
    generate,
    userFeeling: metaphorWords,
    context: audioRegister || contextFallback,
    kinetics,
    rand,
  })

  const technique = lockedTechnique || resolveTechnique(features, lineage, intentText, declaredEmotionId, meta.feeling)
  // The register the scene writer sees also carries what the words are about.
  // With a metaphor in hand, the scene writer gets the register WITHOUT the
  // matrix's fixed scenery/movement lines (mode 'scene'); without one (model
  // failed) it still needs the full register as its only brief.
  const emotionalRegister = buildEmotionalRegister(features, lineage, intentText, declaredEmotionId, {
    wordsArchetypeId: meta.feeling,
    mode: meta.metaphor ? 'scene' : 'full',
  })
  const sceneMode = resolveSubjectMode(deriveSceneMode(features), meta.hasPerson)

  return { technique, metaphor: meta.metaphor, hasPerson: meta.hasPerson, feeling: meta.feeling, emotionalRegister, sceneMode }
}

module.exports = {
  resolveTechnique,
  buildEmotionalRegister,
  buildKinetics,
  deriveSceneMode,
  resolveSubjectMode,
  planCover,
}

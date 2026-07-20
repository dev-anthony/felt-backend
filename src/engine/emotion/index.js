'use strict'
/**
 * EMOTIONAL INTELLIGENCE LAYER — FELT's "what does this track FEEL like" engine.
 *
 * Implements the research architecture:
 *
 *   [SONIC DNA] → [EMOTIONAL ARCHETYPE MATRIX]
 *              → [AESTHETIC STATE ROUTER]  (Normal / Luxury / Gritty)
 *              → [VISUAL INTENSITY SCALER] (Low / Medium / High / Extra High)
 *              → [PHOTOGRAPHIC SPECIFICATION]   ← the existing Visual DNA engine
 *
 * This sits BETWEEN the raw feature vector and the Visual DNA. It does not pick
 * cameras or lighting — the DNA already does that. It answers the question the
 * pipeline was previously skipping: *what is this track's emotional register,
 * how polished is its world, and how hard should that feeling be pushed?*
 *
 * Two consumers:
 *   1. The scene writer gets a labeled EMOTIONAL REGISTER block. Previously the
 *      mood was one clinical line ("Kinetic Profile: Overarching romantic
 *      acoustic state") buried among five technical lines, so it never steered
 *      anything.
 *   2. The Visual DNA gets a soft bias, so a Gritty/Luxury world and a high
 *      intensity actually change which vocabulary wins.
 *
 * Deterministic: same features → same emotional read.
 */

const { ARCHETYPES, AESTHETIC_STATES, INTENSITY_TIERS } = require('./archetypes')
const { anchorScore } = require('../dna/scoring')

const clamp01 = (n) => Math.max(0, Math.min(1, n))
const round3 = (n) => Math.round(n * 1000) / 1000

/**
 * Scores all 12 archetypes against the vector and returns the best match plus
 * the runner-up (tracks are rarely one pure feeling — the secondary read is
 * genuinely useful context for the scene writer).
 */
function matchArchetypes(vector) {
  const scored = Object.entries(ARCHETYPES)
    .map(([id, a]) => ({ id, archetype: a, score: anchorScore(vector, a.anchor) }))
    .sort((x, y) => y.score - x.score)
  return { primary: scored[0], secondary: scored[1], ranked: scored }
}

/**
 * AESTHETIC STATE ROUTER.
 * Derived from the signals the frontend actually gives us:
 *   gritty  — raw, speech-forward, low-fidelity, aggressive
 *   luxury  — polished, bright, controlled, low grit
 *   normal  — everything else
 */
function routeAestheticState(v) {
  const grittyScore =
    0.40 * v.grit +
    0.25 * v.speechiness +
    0.20 * v.aggression +
    0.15 * (1 - v.acousticness)

  const luxuryScore =
    0.35 * v.brightness +
    0.25 * (1 - v.grit) +
    0.20 * (1 - v.speechiness) +
    0.20 * v.loudness

  // Deliberately conservative thresholds: "normal" is the honest default, and
  // over-routing to Luxury was a real source of glossy, generic results.
  if (grittyScore >= 0.62 && grittyScore > luxuryScore) return { id: 'gritty', score: round3(grittyScore) }
  if (luxuryScore >= 0.68 && luxuryScore > grittyScore) return { id: 'luxury', score: round3(luxuryScore) }
  return { id: 'normal', score: round3(Math.max(grittyScore, luxuryScore)) }
}

/**
 * VISUAL INTENSITY SCALER — how hard to push the register.
 * Combines raw force (energy/loudness/tempo) with emotional extremity, so a
 * very quiet but devastatingly sad track can still read as high intensity.
 */
function scaleIntensity(v) {
  const force = 0.40 * v.energy + 0.25 * v.loudness + 0.20 * v.motion + 0.15 * v.tempo
  const extremity = Math.max(v.aggression, v.darkness, v.euphoria, v.intimacy)
  const raw = clamp01(0.65 * force + 0.35 * extremity)

  let id = 'medium'
  if (raw < 0.34) id = 'low'
  else if (raw < 0.58) id = 'medium'
  else if (raw < 0.80) id = 'high'
  else id = 'extreme'

  return { id, score: round3(raw) }
}

/**
 * SEMANTIC CORRECTION LAYER.
 *
 * Essentia cannot actually measure valence — the research is explicit that real
 * valence needs a model trained on chord progressions and consonance, which we
 * do not have client-side. Our valence is a weighted guess dominated by mode, so
 * an upbeat minor-key Afrobeats record still under-reads as sombre.
 *
 * The artist, however, TELLS us what the track feels like ("an upbeat, feel-good
 * song about chemistry through dance"). When their words clearly contradict the
 * maths, the words win — this is the same user-metadata fail-safe the research
 * recommends for genre. Keyword-based and deterministic, applied as a bounded
 * nudge so it corrects rather than overwrites.
 */
const POSITIVE_CUES = /\b(upbeat|feel[- ]?good|joy|joyful|happy|celebrat\w*|party|fun|playful|bright|uplift\w*|triumph\w*|victory|sweet|love|romantic|vibe\w*|groove\w*)\b/i
const KINETIC_CUES = /\b(danc\w*|dancefloor|dance[- ]?floor|move\w*|movement|motion|energy|energetic|bounce|bouncy|jump\w*|rave|club|sweaty|kinetic|gyrat\w*|shake|wine|whine|turn[- ]?up)\b/i
const NEGATIVE_CUES = /\b(sad|sorrow|grief|griev\w*|lonely|loneliness|heartbreak|broken|pain\w*|hurt|cry\w*|tears|depress\w*|dark|empty|loss|lost|mourn\w*|regret)\b/i
const CALM_CUES = /\b(calm|peace\w*|still\w*|quiet|serene|gentle|soft|slow|meditat\w*|reflect\w*|introspect\w*)\b/i

function readSemanticCues(text) {
  const t = String(text || '')
  if (!t.trim()) return null
  return {
    positive: POSITIVE_CUES.test(t),
    kinetic: KINETIC_CUES.test(t),
    negative: NEGATIVE_CUES.test(t),
    calm: CALM_CUES.test(t),
  }
}

/** Applies bounded semantic corrections to a copy of the vector. */
function applySemanticCorrection(vector, cues) {
  if (!cues) return { vector, applied: [] }
  const v = { ...vector, meta: vector.meta }
  const applied = []

  // Only correct when the words and the maths actually disagree.
  if (cues.positive && !cues.negative && v.valence < 0.55) {
    v.valence = clamp01(v.valence + 0.30); applied.push('valence↑ (artist describes it as positive)')
  }
  if (cues.negative && !cues.positive && v.valence > 0.45) {
    v.valence = clamp01(v.valence - 0.30); applied.push('valence↓ (artist describes it as sombre)')
  }
  if (cues.kinetic) {
    v.danceability = clamp01(v.danceability + 0.25)
    v.motion = clamp01(v.motion + 0.30)
    v.energy = clamp01(v.energy + 0.12)
    applied.push('motion↑ (artist describes physical movement)')
  }
  if (cues.calm && !cues.kinetic) {
    v.motion = clamp01(v.motion - 0.25); applied.push('motion↓ (artist describes stillness)')
  }

  // Recompute the derived axes that depend on what we just changed.
  v.euphoria = clamp01(0.45 * v.valence + 0.30 * v.energy + 0.25 * v.danceability)
  v.darkness = clamp01(0.45 * (1 - v.valence) + 0.30 * (1 - v.brightness) + 0.25 * (1 - v.scaleMajor))
  v.warmth = clamp01(0.45 * v.valence + 0.30 * v.acousticness + 0.25 * v.scaleMajor)

  return { vector: v, applied }
}

/**
 * Full emotional read for a track.
 * @param {import('../types').FeatureVector} vector
 * @param {string} [declaredGenre] the artist's own declared lane, if any
 * @param {string} [intentText] the artist's own description / distilled lyric theme
 */
function readEmotion(vector, declaredGenre, intentText) {
  const cues = readSemanticCues(intentText)
  const corrected = applySemanticCorrection(vector, cues)
  vector = corrected.vector

  const { primary, secondary } = matchArchetypes(vector)
  const state = routeAestheticState(vector)
  const intensity = scaleIntensity(vector)

  const a = primary.archetype
  const stateInfo = AESTHETIC_STATES[state.id]
  const tierInfo = INTENSITY_TIERS[intensity.id]

  // How kinetic the frame must read. Blends the archetype's inherent motion
  // with the track's measured motion — this is the signal that prevents an
  // energetic dance record resolving into a still, pensive portrait.
  const kinetic = clamp01(0.55 * a.motionBias + 0.45 * vector.motion)

  return {
    archetypeId: primary.id,
    archetype: a,
    archetypeConfidence: round3(primary.score),
    secondaryId: secondary.id,
    secondary: secondary.archetype,
    state: state.id,
    stateLabel: stateInfo.label,
    stateDirective: stateInfo.directive,
    intensity: intensity.id,
    intensityLabel: tierInfo.label,
    intensityDirective: tierInfo.directive,
    kinetic: round3(kinetic),
    visualDirection: a.states[state.id],
    declaredGenre: declaredGenre || null,
    semanticCorrections: corrected.applied,
    correctedVector: vector,
  }
}

/**
 * The labeled EMOTIONAL REGISTER block handed to the scene writer.
 * Its own clearly-flagged input — not buried among technical metrics.
 */
function emotionalRegisterBlock(read, vector) {
  const m = vector.meta
  const kineticLine =
    read.kinetic >= 0.65
      ? `MOVEMENT: HIGH — the body must read as physically in motion (mid-step, mid-turn, mid-sway, fabric and hair moving). A still, posed portrait is WRONG for this track.`
      : read.kinetic >= 0.4
        ? `MOVEMENT: MODERATE — the subject is doing something active, caught between two moments rather than posing.`
        : `MOVEMENT: LOW — stillness is correct here; let quiet hold the frame.`

  return [
    `EMOTIONAL REGISTER: ${read.archetype.register}`,
    `ARCHETYPE: ${read.archetype.label}${read.secondary ? ` (with an undercurrent of ${read.secondary.label})` : ''}`,
    `AESTHETIC WORLD: ${read.stateLabel} — ${read.stateDirective}`,
    `INTENSITY: ${read.intensityLabel} — ${read.intensityDirective}`,
    kineticLine,
    `VISUAL DIRECTION FOR THIS COMBINATION: ${read.visualDirection}`,
    `DERIVED FROM: ${m.genre ? m.genre + ', ' : ''}${Math.round((vector.tempo * 120) + 60)} BPM, energy ${Math.round(vector.energy * 100)}/100, valence ${Math.round(vector.valence * 100)}/100, danceability ${Math.round(vector.danceability * 100)}/100, ${m.key} ${m.scale}`,
  ].join('\n')
}

/**
 * Soft bias the emotional read applies to the Visual DNA vector, so the
 * aesthetic world and intensity actually change which vocabulary wins.
 * Bounded and additive — never inverts a signal.
 */
function emotionDnaBias(read) {
  const bias = {}
  if (read.state === 'gritty') { bias.grit = +0.14; bias.brightness = -0.06 }
  if (read.state === 'luxury') { bias.grit = -0.14; bias.brightness = +0.08 }

  if (read.intensity === 'low') { bias.energy = -0.10 }
  if (read.intensity === 'high') { bias.energy = +0.08 }
  if (read.intensity === 'extreme') { bias.energy = +0.15; bias.aggression = +0.08 }

  if (read.kinetic >= 0.65) bias.motion = +0.15
  else if (read.kinetic < 0.30) bias.motion = -0.12

  return bias
}

module.exports = {
  readEmotion,
  emotionalRegisterBlock,
  emotionDnaBias,
  matchArchetypes,
  routeAestheticState,
  scaleIntensity,
  ARCHETYPES,
  AESTHETIC_STATES,
  INTENSITY_TIERS,
}

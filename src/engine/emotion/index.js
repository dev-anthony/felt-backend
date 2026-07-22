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
const { getEmotion } = require('./taxonomy')
const { anchorScore } = require('../dna/scoring')

const clamp01 = (n) => Math.max(0, Math.min(1, n))
const round3 = (n) => Math.round(n * 1000) / 1000
// Neutral fallback for a single axis. Vectors from buildFeatureVector are
// already sanitised; this covers vectors assembled by hand (tests, scripts) so
// the state/intensity routers can never be steered by a NaN.
const f01 = (n) => (Number.isFinite(n) ? clamp01(n) : 0.5)

/**
 * Scores all 12 archetypes against the vector and returns the best match plus
 * the runner-up (tracks are rarely one pure feeling — the secondary read is
 * genuinely useful context for the scene writer).
 */
function matchArchetypes(vector, declaredEmotion) {
  const favoured = declaredEmotion ? declaredEmotion.archetype : null
  const scored = Object.entries(ARCHETYPES)
    .map(([id, a]) => ({
      id,
      archetype: a,
      // Bounded advantage, not a override: a strongly contrary audio read can
      // still win, which is what keeps a mis-click recoverable.
      score: anchorScore(vector, a.anchor) + (id === favoured ? EMOTION_ARCHETYPE_BONUS : 0),
    }))
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
    0.40 * f01(v.grit) +
    0.25 * f01(v.speechiness) +
    0.20 * f01(v.aggression) +
    0.15 * (1 - f01(v.acousticness))

  const luxuryScore =
    0.35 * f01(v.brightness) +
    0.25 * (1 - f01(v.grit)) +
    0.20 * (1 - f01(v.speechiness)) +
    0.20 * f01(v.loudness)

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
  const force =
    0.40 * f01(v.energy) + 0.25 * f01(v.loudness) + 0.20 * f01(v.motion) + 0.15 * f01(v.tempo)
  const extremity = Math.max(f01(v.aggression), f01(v.darkness), f01(v.euphoria), f01(v.intimacy))
  const raw = clamp01(0.65 * force + 0.35 * extremity)

  // Ladder written so the FALL-THROUGH case is the top tier only when the score
  // genuinely earns it. `raw` is finite by construction above, but the ordering
  // matters: an unguarded NaN would fail every `<` and land on the final `else`,
  // which is why "Extra High" must never be the accidental default.
  let id = 'medium'
  if (raw >= 0.80) id = 'extreme'
  else if (raw >= 0.58) id = 'high'
  else if (raw >= 0.34) id = 'medium'
  else id = 'low'

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
/**
 * ARTIST-DECLARED EMOTION — the third source.
 *
 * FELT reads a track three ways: the audio maths, the artist's words, and now an
 * explicit selection from the emotion taxonomy. None of them overwrites another.
 *
 * This is a BOUNDED nudge, deliberately. The alternative — letting the selection
 * win outright — sounds respectful of the artist but throws away the analysis on
 * that track, and a mis-click then produces a confidently wrong cover. It also
 * flattens the most interesting case: an upbeat Afrobeats breakup record is
 * SUPPOSED to read as two things at once, and forcing agreement destroys exactly
 * the tension that makes it worth looking at.
 *
 * So the selection pulls the vector toward its coordinates by at most
 * EMOTION_PULL, and gives its archetype a bounded scoring advantage. A track
 * whose audio already agrees barely moves; one that disagrees ends up genuinely
 * between the two readings, which is the honest answer.
 */
const EMOTION_PULL = 0.22        // max shift on valence / energy
const EMOTION_ARCHETYPE_BONUS = 0.10 // additive, applied in matchArchetypes

function applyDeclaredEmotion(vector, emotion) {
  if (!emotion) return { vector, applied: [] }
  const v = { ...vector, meta: vector.meta }
  const applied = []

  const pull = (axis, target, label) => {
    const before = v[axis]
    if (!Number.isFinite(before) || !Number.isFinite(target)) return
    const delta = Math.max(-EMOTION_PULL, Math.min(EMOTION_PULL, target - before))
    v[axis] = clamp01(before + delta)
    if (Math.abs(delta) >= 0.02) {
      applied.push(`${label}${delta > 0 ? '↑' : '↓'} (artist selected "${emotion.label}")`)
    }
  }
  pull('valence', emotion.valence, 'valence')
  pull('energy', emotion.arousal, 'energy')

  // Recompute the axes derived from what just moved, exactly as the semantic
  // correction does — otherwise darkness/warmth/euphoria describe the old vector.
  v.euphoria = clamp01(0.45 * v.valence + 0.30 * v.energy + 0.25 * v.danceability)
  v.darkness = clamp01(0.45 * (1 - v.valence) + 0.30 * (1 - v.brightness) + 0.25 * (1 - v.scaleMajor))
  v.warmth = clamp01(0.45 * v.valence + 0.30 * v.acousticness + 0.25 * v.scaleMajor)

  return { vector: v, applied }
}

function readEmotion(vector, declaredGenre, intentText, declaredEmotionId) {
  const cues = readSemanticCues(intentText)
  const corrected = applySemanticCorrection(vector, cues)
  vector = corrected.vector

  const emotion = getEmotion(declaredEmotionId)

  // The archetype is chosen from the AUDIO's own reading, before the artist's
  // selection moves the vector. This matters: nudging valence down to honour
  // "grief" penalises every valence-anchored archetype, and an archetype that
  // does not anchor valence at all (Euphoria, Primal) can then win by default —
  // producing a third reading that neither the audio nor the artist asked for.
  // A blend must resolve to ONE OF THE TWO readings, never to a stranger.
  const audioRanked = matchArchetypes(vector).ranked

  const declared = applyDeclaredEmotion(vector, emotion)
  vector = declared.vector

  // The nudged vector still drives aesthetic state, visual intensity and the DNA
  // bias — that is where blending genuinely helps and cannot go non-sequitur.
  let { primary, secondary } = matchArchetypes(vector, emotion)
  if (emotion) {
    const audioTop = audioRanked[0]
    const declaredEntry = audioRanked.find((r) => r.id === emotion.archetype)
    const candidates = [audioTop, declaredEntry].filter(Boolean)
    // Bounded advantage for the artist's pick, so a strongly contrary audio read
    // can still win and a mis-click stays recoverable.
    const scoreOf = (c) => c.score + (c.id === emotion.archetype ? EMOTION_ARCHETYPE_BONUS : 0)
    candidates.sort((a, b) => scoreOf(b) - scoreOf(a))
    primary = candidates[0]
    secondary = candidates[1] || secondary
  }
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
    // Research Module 1: the visual direction is a 144-cell matrix lookup —
    // archetype × aesthetic state × visual intensity. Both axes matter: a
    // Gritty/Low melancholy and a Gritty/Extra High melancholy are different
    // photographs, not the same photograph turned up.
    visualDirection: a.states[state.id][intensity.id],
    declaredGenre: declaredGenre || null,
    semanticCorrections: corrected.applied.concat(declared.applied),
    declaredEmotion: emotion
      ? { id: emotion.id, label: emotion.label, definition: emotion.definition, archetype: emotion.archetype }
      : null,
    archetypeId: primary.id,
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
    // The artist's own word for the track. It reaches the scene writer even when
    // it did not move the archetype — on a strongly-read track the audio rightly
    // wins the register, but the feeling the artist named should still be
    // findable in the frame. This is the channel where an "upbeat record about
    // heartbreak" stays about heartbreak.
    read.declaredEmotion
      ? `THE ARTIST CALLS THIS: "${read.declaredEmotion.label}" — ${read.declaredEmotion.definition}` +
        (read.declaredEmotion.archetype !== read.archetypeId
          ? ' The audio reads differently, and BOTH are true: build a scene where the artist's'
            + ' feeling is what the person in it is actually experiencing, inside the world the'
            + ' audio describes. Do not resolve the contradiction — it is the point.'
          : '')
      : '',
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

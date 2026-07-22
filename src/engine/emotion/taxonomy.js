'use strict'
/**
 * EMOTION TAXONOMY — the artist-facing vocabulary of feeling.
 *
 * A front door to the 12-archetype matrix, NOT a parallel system. Every entry
 * resolves to an existing archetype plus a coordinate; nothing here invents a
 * new emotional model.
 *
 * WHY A LIST AND NOT A FREE-TEXT BOX
 * The beat pipeline already asks how a track feels, but a typed word can only
 * ever reach a regex and a prose prompt — it can never enter `anchorScore`,
 * because a string has no position. These entries carry measured coordinates,
 * so the artist's answer finally participates in the same scoring the audio
 * does. The free-text sentence stays alongside it: a label carries the FEELING,
 * a sentence carries the EPISODE ("driving home after my dad's funeral"), and
 * only the sentence can put a specific place and object in the frame.
 *
 * COORDINATES
 * `valence` and `arousal` sit on the DEAM-calibrated 0..1 scale used everywhere
 * else in the engine — real music occupies valence 0.195..0.781 and arousal
 * 0.156..0.797 (1,802 human-rated songs), so no entry is placed outside that
 * band. An emotion at 0.02 would be unreachable rather than expressive, exactly
 * as the archetype anchors were before calibration.
 *
 * SOURCES
 * - Geneva Emotional Music Scale (GEMS; Zentner, Grandjean & Scherer) — the
 *   only framework validated specifically for emotions *evoked by music*, and
 *   the origin of the nine factors the 12 archetypes extend.
 * - Plutchik's wheel — the intensity families (annoyance/anger/rage).
 * - Geneva Emotion Wheel — the valence x control layout.
 * - Russell's circumplex — the valence/arousal plane these coordinates live on.
 * Untranslatable terms (saudade, sehnsucht, hiraeth, han) are kept in their own
 * language with the origin recorded, because the whole premise is that a near
 * synonym is not the same feeling.
 */

const { ARCHETYPES } = require('./archetypes')

/**
 * @typedef {object} EmotionEntry
 * @property {string} id
 * @property {string} label      shown in the dropdown
 * @property {string} definition shown on hover — the artist must be able to tell
 *                               two near-synonyms apart before choosing
 * @property {string} archetype  which of the 12 it routes to
 * @property {number} valence    0..1, DEAM-calibrated
 * @property {number} arousal    0..1, DEAM-calibrated
 * @property {string} [origin]   for terms with no English equivalent
 */

/** @type {EmotionEntry[]} */
const EMOTIONS = [
  // ── TRANSCENDENCE ────────────────────────────────────────────────────────
  { id: 'awe', label: 'Awe', archetype: 'TRANSCENDENCE', valence: 0.66, arousal: 0.58,
    definition: 'Overwhelmed by something vast enough that your own scale changes.' },
  { id: 'wonder', label: 'Wonder', archetype: 'TRANSCENDENCE', valence: 0.72, arousal: 0.50,
    definition: 'Delighted curiosity at something you cannot fully explain.' },
  { id: 'reverence', label: 'Reverence', archetype: 'TRANSCENDENCE', valence: 0.63, arousal: 0.38,
    definition: 'Deep respect that quiets you rather than exciting you.' },
  { id: 'spiritual_elevation', label: 'Spiritual elevation', archetype: 'TRANSCENDENCE', valence: 0.70, arousal: 0.52,
    definition: 'Lifted beyond yourself; the sense of being part of something larger.' },
  { id: 'sublimity', label: 'Sublimity', archetype: 'TRANSCENDENCE', valence: 0.58, arousal: 0.55,
    definition: 'Beauty with an edge of terror in it — magnificence that could crush you.' },
  { id: 'epiphany', label: 'Epiphany', archetype: 'TRANSCENDENCE', valence: 0.68, arousal: 0.62,
    definition: 'The instant something long-hidden becomes obvious.' },
  { id: 'grace', label: 'Grace', archetype: 'TRANSCENDENCE', valence: 0.69, arousal: 0.34,
    definition: 'Receiving something good you did not earn.' },
  { id: 'humility', label: 'Humility', archetype: 'TRANSCENDENCE', valence: 0.56, arousal: 0.30,
    definition: 'Rightly small, and at peace with being small.' },

  // ── SERENITY ─────────────────────────────────────────────────────────────
  { id: 'serenity', label: 'Serenity', archetype: 'SERENITY', valence: 0.62, arousal: 0.20,
    definition: 'Calm that runs deep enough that nothing can disturb it.' },
  { id: 'stillness', label: 'Stillness', archetype: 'SERENITY', valence: 0.55, arousal: 0.17,
    definition: 'Not motionless — unhurried. Nothing is being chased.' },
  { id: 'contentment', label: 'Contentment', archetype: 'SERENITY', valence: 0.66, arousal: 0.28,
    definition: 'Wanting nothing other than what is already here.' },
  { id: 'relief', label: 'Relief', archetype: 'SERENITY', valence: 0.63, arousal: 0.35,
    definition: 'The body releasing a weight it had stopped noticing.' },
  { id: 'acceptance', label: 'Acceptance', archetype: 'SERENITY', valence: 0.54, arousal: 0.26,
    definition: 'No longer arguing with what happened.' },
  { id: 'solitude', label: 'Solitude', archetype: 'SERENITY', valence: 0.52, arousal: 0.22,
    definition: 'Alone by choice, and better for it — the opposite of loneliness.' },
  { id: 'meditative_focus', label: 'Meditative focus', archetype: 'SERENITY', valence: 0.56, arousal: 0.24,
    definition: 'Attention resting on one thing without strain.' },
  { id: 'safety', label: 'Safety', archetype: 'SERENITY', valence: 0.64, arousal: 0.25,
    definition: 'Nothing here can reach you.' },

  // ── TENDERNESS ───────────────────────────────────────────────────────────
  { id: 'tenderness', label: 'Tenderness', archetype: 'TENDERNESS', valence: 0.65, arousal: 0.32,
    definition: 'Careful, protective warmth toward someone breakable.' },
  { id: 'intimacy', label: 'Intimacy', archetype: 'TENDERNESS', valence: 0.63, arousal: 0.36,
    definition: 'Close enough to be seen accurately, and staying anyway.' },
  { id: 'vulnerability', label: 'Vulnerability', archetype: 'TENDERNESS', valence: 0.46, arousal: 0.38,
    definition: 'Unguarded on purpose, knowing it costs something.' },
  { id: 'limerence', label: 'Limerence', archetype: 'TENDERNESS', valence: 0.60, arousal: 0.58,
    definition: 'Infatuation as an involuntary state — intrusive, consuming, not yet love.' },
  { id: 'devotion', label: 'Devotion', archetype: 'TENDERNESS', valence: 0.64, arousal: 0.40,
    definition: 'Love that has become a decision rather than a feeling.' },
  { id: 'gratitude', label: 'Gratitude', archetype: 'TENDERNESS', valence: 0.70, arousal: 0.36,
    definition: 'Aware that someone chose to give you something.' },
  { id: 'compassion', label: 'Compassion', archetype: 'TENDERNESS', valence: 0.55, arousal: 0.34,
    definition: 'Another persons pain landing in your own body.' },
  { id: 'desire', label: 'Desire', archetype: 'TENDERNESS', valence: 0.62, arousal: 0.62,
    definition: 'Wanting, with the body leading.' },
  { id: 'forgiveness', label: 'Forgiveness', archetype: 'TENDERNESS', valence: 0.58, arousal: 0.30,
    definition: 'Setting down a debt you were entitled to keep collecting.' },

  // ── NOSTALGIA ────────────────────────────────────────────────────────────
  { id: 'nostalgia', label: 'Nostalgia', archetype: 'NOSTALGIA', valence: 0.52, arousal: 0.32,
    definition: 'Warmth toward a past you cannot re-enter.' },
  { id: 'saudade', label: 'Saudade', archetype: 'NOSTALGIA', valence: 0.44, arousal: 0.30, origin: 'Portuguese',
    definition: 'Longing for something absent that may never return — and a quiet pleasure in the longing itself.' },
  { id: 'sehnsucht', label: 'Sehnsucht', archetype: 'NOSTALGIA', valence: 0.46, arousal: 0.36, origin: 'German',
    definition: 'Yearning for a life or a place you have never actually had.' },
  { id: 'hiraeth', label: 'Hiraeth', archetype: 'NOSTALGIA', valence: 0.42, arousal: 0.28, origin: 'Welsh',
    definition: 'Homesickness for a home you cannot return to, or that never existed.' },
  { id: 'yearning', label: 'Yearning', archetype: 'NOSTALGIA', valence: 0.44, arousal: 0.42,
    definition: 'Reaching for something at a distance you cannot close.' },
  { id: 'bittersweet', label: 'Bittersweet', archetype: 'NOSTALGIA', valence: 0.50, arousal: 0.34,
    definition: 'Two opposite feelings held at once, neither cancelling the other.' },
  { id: 'wistfulness', label: 'Wistfulness', archetype: 'NOSTALGIA', valence: 0.48, arousal: 0.26,
    definition: 'Gentle sadness about what might have been, without bitterness.' },
  { id: 'anemoia', label: 'Anemoia', archetype: 'NOSTALGIA', valence: 0.50, arousal: 0.30,
    definition: 'Nostalgia for a time you were never alive for.' },
  { id: 'homesickness', label: 'Homesickness', archetype: 'NOSTALGIA', valence: 0.38, arousal: 0.36,
    definition: 'The specific ache of being far from where you belong.' },

  // ── MELANCHOLY ───────────────────────────────────────────────────────────
  { id: 'melancholy', label: 'Melancholy', archetype: 'MELANCHOLY', valence: 0.30, arousal: 0.28,
    definition: 'Sadness you have grown used to, and would half miss.' },
  { id: 'grief', label: 'Grief', archetype: 'MELANCHOLY', valence: 0.21, arousal: 0.36,
    definition: 'Loss that reorganises everything around it.' },
  { id: 'despair', label: 'Despair', archetype: 'MELANCHOLY', valence: 0.20, arousal: 0.30,
    definition: 'Sadness with the exit removed.' },
  { id: 'loneliness', label: 'Loneliness', archetype: 'MELANCHOLY', valence: 0.28, arousal: 0.30,
    definition: 'Alone against your will — the opposite of solitude.' },
  { id: 'regret', label: 'Regret', archetype: 'MELANCHOLY', valence: 0.29, arousal: 0.38,
    definition: 'Turning over the version where you chose differently.' },
  { id: 'heartbreak', label: 'Heartbreak', archetype: 'MELANCHOLY', valence: 0.24, arousal: 0.44,
    definition: 'Love with nowhere left to go.' },
  { id: 'resignation', label: 'Resignation', archetype: 'MELANCHOLY', valence: 0.34, arousal: 0.22,
    definition: 'Having stopped fighting — not peace, just the end of effort.' },
  { id: 'han', label: 'Han', archetype: 'MELANCHOLY', valence: 0.26, arousal: 0.32, origin: 'Korean',
    definition: 'Accumulated sorrow and unresolved injustice carried collectively, over generations.' },
  { id: 'numbness', label: 'Numbness', archetype: 'MELANCHOLY', valence: 0.35, arousal: 0.20,
    definition: 'Feeling switched off rather than absent.' },
  { id: 'dissociation', label: 'Dissociation', archetype: 'MELANCHOLY', valence: 0.38, arousal: 0.24,
    definition: 'Watching your own life from slightly outside it.' },
  { id: 'catharsis', label: 'Catharsis', archetype: 'MELANCHOLY', valence: 0.46, arousal: 0.58,
    definition: 'Pain finally moving — release through the feeling, not around it.' },

  // ── DREAD ────────────────────────────────────────────────────────────────
  { id: 'dread', label: 'Dread', archetype: 'DREAD', valence: 0.22, arousal: 0.48,
    definition: 'Certainty that something bad is coming, without knowing what.' },
  { id: 'paranoia', label: 'Paranoia', archetype: 'DREAD', valence: 0.23, arousal: 0.60,
    definition: 'Convinced you are being watched, and unable to prove otherwise.' },
  { id: 'terror', label: 'Terror', archetype: 'DREAD', valence: 0.20, arousal: 0.75,
    definition: 'Fear at the point where thinking stops.' },
  { id: 'unease', label: 'Unease', archetype: 'DREAD', valence: 0.34, arousal: 0.42,
    definition: 'Something is wrong here and you cannot name it.' },
  { id: 'claustrophobia', label: 'Claustrophobia', archetype: 'DREAD', valence: 0.22, arousal: 0.66,
    definition: 'The walls of a situation closing faster than you can move.' },
  { id: 'menace', label: 'Menace', archetype: 'DREAD', valence: 0.24, arousal: 0.56,
    definition: 'Threat that has not moved yet.' },
  { id: 'hypervigilance', label: 'Hypervigilance', archetype: 'DREAD', valence: 0.28, arousal: 0.68,
    definition: 'Exhausted from watching every exit.' },
  { id: 'existential_horror', label: 'Existential horror', archetype: 'DREAD', valence: 0.21, arousal: 0.44,
    definition: 'The scale of the universe registering as a threat rather than a wonder.' },

  // ── TENSION ──────────────────────────────────────────────────────────────
  { id: 'tension', label: 'Tension', archetype: 'TENSION', valence: 0.40, arousal: 0.62,
    definition: 'Held tight, waiting for something to give.' },
  { id: 'anticipation', label: 'Anticipation', archetype: 'TENSION', valence: 0.55, arousal: 0.60,
    definition: 'Leaning toward something that has not arrived.' },
  { id: 'suspense', label: 'Suspense', archetype: 'TENSION', valence: 0.42, arousal: 0.58,
    definition: 'The outcome is decided but not yet revealed.' },
  { id: 'restlessness', label: 'Restlessness', archetype: 'TENSION', valence: 0.42, arousal: 0.64,
    definition: 'Energy with nowhere to go.' },
  { id: 'urgency', label: 'Urgency', archetype: 'TENSION', valence: 0.45, arousal: 0.72,
    definition: 'Time is running out and the body knows first.' },
  { id: 'obsession', label: 'Obsession', archetype: 'TENSION', valence: 0.38, arousal: 0.62,
    definition: 'One thought that will not release its grip.' },
  { id: 'frustration', label: 'Frustration', archetype: 'TENSION', valence: 0.32, arousal: 0.62,
    definition: 'Blocked repeatedly from something within reach.' },
  { id: 'ambivalence', label: 'Ambivalence', archetype: 'TENSION', valence: 0.45, arousal: 0.44,
    definition: 'Wanting two incompatible things equally.' },

  // ── POWER ────────────────────────────────────────────────────────────────
  { id: 'defiance', label: 'Defiance', archetype: 'POWER', valence: 0.42, arousal: 0.76,
    definition: 'Refusing, in full view, on purpose.' },
  { id: 'dominance', label: 'Dominance', archetype: 'POWER', valence: 0.46, arousal: 0.74,
    definition: 'The room arranges itself around you.' },
  { id: 'rage', label: 'Rage', archetype: 'POWER', valence: 0.22, arousal: 0.79,
    definition: 'Anger past the point of control.' },
  { id: 'aggression', label: 'Aggression', archetype: 'POWER', valence: 0.28, arousal: 0.76,
    definition: 'Forward force, aimed at something.' },
  { id: 'confidence', label: 'Confidence', archetype: 'POWER', valence: 0.62, arousal: 0.62,
    definition: 'No need to prove it.' },
  { id: 'triumph', label: 'Triumph', archetype: 'POWER', valence: 0.75, arousal: 0.74,
    definition: 'Won, and letting it be seen.' },
  { id: 'vengeance', label: 'Vengeance', archetype: 'POWER', valence: 0.30, arousal: 0.70,
    definition: 'Cold, patient intent to settle it.' },
  { id: 'empowerment', label: 'Empowerment', archetype: 'POWER', valence: 0.68, arousal: 0.66,
    definition: 'Coming into strength you did not previously have.' },
  { id: 'rebellion', label: 'Rebellion', archetype: 'POWER', valence: 0.48, arousal: 0.72,
    definition: 'Against the structure itself, not one person.' },
  { id: 'resilience', label: 'Resilience', archetype: 'POWER', valence: 0.56, arousal: 0.54,
    definition: 'Still standing, and that is the whole statement.' },

  // ── JOY ──────────────────────────────────────────────────────────────────
  { id: 'joy', label: 'Joy', archetype: 'JOY', valence: 0.76, arousal: 0.66,
    definition: 'Uncomplicated happiness, fully present.' },
  { id: 'playfulness', label: 'Playfulness', archetype: 'JOY', valence: 0.72, arousal: 0.62,
    definition: 'Doing it because it is fun, not because it matters.' },
  { id: 'whimsy', label: 'Whimsy', archetype: 'JOY', valence: 0.70, arousal: 0.52,
    definition: 'Lightly strange, and pleased about it.' },
  { id: 'exuberance', label: 'Exuberance', archetype: 'JOY', valence: 0.78, arousal: 0.74,
    definition: 'Joy that will not stay inside the body.' },
  { id: 'freedom', label: 'Freedom', archetype: 'JOY', valence: 0.74, arousal: 0.58,
    definition: 'Nothing holding you in place.' },
  { id: 'hope', label: 'Hope', archetype: 'JOY', valence: 0.68, arousal: 0.48,
    definition: 'Expecting good, without proof yet.' },
  { id: 'mischief', label: 'Mischief', archetype: 'JOY', valence: 0.66, arousal: 0.62,
    definition: 'Enjoying a rule you are about to break.' },
  { id: 'silliness', label: 'Silliness', archetype: 'JOY', valence: 0.72, arousal: 0.60,
    definition: 'Refusing to be serious for a while.' },
  { id: 'warm_pride', label: 'Pride', archetype: 'JOY', valence: 0.73, arousal: 0.58,
    definition: 'Standing in something you or your people made.' },

  // ── EUPHORIA ─────────────────────────────────────────────────────────────
  { id: 'euphoria', label: 'Euphoria', archetype: 'EUPHORIA', valence: 0.78, arousal: 0.76,
    definition: 'Joy past the point of containment.' },
  { id: 'ecstasy', label: 'Ecstasy', archetype: 'EUPHORIA', valence: 0.74, arousal: 0.79,
    definition: 'Outside yourself — the literal meaning of the word.' },
  { id: 'trance', label: 'Trance', archetype: 'EUPHORIA', valence: 0.58, arousal: 0.62,
    definition: 'Repetition carrying you somewhere thinking cannot.' },
  { id: 'communion', label: 'Communion', archetype: 'EUPHORIA', valence: 0.72, arousal: 0.68,
    definition: 'Dissolved into a crowd and glad of it.' },
  { id: 'abandon', label: 'Abandon', archetype: 'EUPHORIA', valence: 0.68, arousal: 0.77,
    definition: 'Having stopped managing yourself.' },
  { id: 'rapture', label: 'Rapture', archetype: 'EUPHORIA', valence: 0.75, arousal: 0.72,
    definition: 'Seized by joy rather than choosing it.' },
  { id: 'flow', label: 'Flow', archetype: 'EUPHORIA', valence: 0.66, arousal: 0.58,
    definition: 'Effort without friction; time stops reporting.' },
  { id: 'release', label: 'Release', archetype: 'EUPHORIA', valence: 0.64, arousal: 0.66,
    definition: 'The moment the held thing is finally let go.' },

  // ── CEREBRAL ─────────────────────────────────────────────────────────────
  { id: 'cerebral', label: 'Cerebral', archetype: 'CEREBRAL', valence: 0.48, arousal: 0.46,
    definition: 'Engaged by structure rather than moved by it.' },
  { id: 'curiosity', label: 'Curiosity', archetype: 'CEREBRAL', valence: 0.60, arousal: 0.52,
    definition: 'Pulled toward a thing you do not yet understand.' },
  { id: 'detachment', label: 'Detachment', archetype: 'CEREBRAL', valence: 0.44, arousal: 0.34,
    definition: 'Watching clearly because you are not involved.' },
  { id: 'precision', label: 'Precision', archetype: 'CEREBRAL', valence: 0.52, arousal: 0.46,
    definition: 'Satisfaction in something being exactly right.' },
  { id: 'disorientation', label: 'Disorientation', archetype: 'CEREBRAL', valence: 0.38, arousal: 0.56,
    definition: 'The rules changed and nobody said which ones.' },
  { id: 'alienation', label: 'Alienation', archetype: 'CEREBRAL', valence: 0.32, arousal: 0.40,
    definition: 'Among people, belonging to none of it.' },
  { id: 'fascination', label: 'Fascination', archetype: 'CEREBRAL', valence: 0.58, arousal: 0.50,
    definition: 'Unable to look away from the mechanism.' },
  { id: 'clarity', label: 'Clarity', archetype: 'CEREBRAL', valence: 0.62, arousal: 0.44,
    definition: 'The noise drops and the shape is visible.' },

  // ── PRIMAL ───────────────────────────────────────────────────────────────
  { id: 'primal', label: 'Primal', archetype: 'PRIMAL', valence: 0.50, arousal: 0.66,
    definition: 'Older than language; the body answering first.' },
  { id: 'ritual', label: 'Ritual', archetype: 'PRIMAL', valence: 0.54, arousal: 0.56,
    definition: 'Doing the thing the way it has always been done.' },
  { id: 'ancestral_pride', label: 'Ancestral pride', archetype: 'PRIMAL', valence: 0.68, arousal: 0.58,
    definition: 'Carrying people who came before you into the room.' },
  { id: 'groundedness', label: 'Groundedness', archetype: 'PRIMAL', valence: 0.58, arousal: 0.40,
    definition: 'Weight through the feet; belonging to a place.' },
  { id: 'hunger', label: 'Hunger', archetype: 'PRIMAL', valence: 0.42, arousal: 0.68,
    definition: 'Wanting at the level of survival, not preference.' },
  { id: 'wildness', label: 'Wildness', archetype: 'PRIMAL', valence: 0.55, arousal: 0.72,
    definition: 'Untamed and unembarrassed about it.' },
  { id: 'endurance', label: 'Endurance', archetype: 'PRIMAL', valence: 0.48, arousal: 0.52,
    definition: 'Continuing past the point where it stopped being a choice.' },
  { id: 'communal_joy', label: 'Communal joy', archetype: 'PRIMAL', valence: 0.74, arousal: 0.68,
    definition: 'Happiness that only exists because everyone is here.' },
]

// ── validation ────────────────────────────────────────────────────────────
// Measured band from DEAM: an entry outside it is unreachable, not expressive.
const VALENCE_RANGE = [0.195, 0.781]
const AROUSAL_RANGE = [0.156, 0.797]

const byId = new Map()
for (const e of EMOTIONS) {
  if (byId.has(e.id)) throw new Error(`[TAXONOMY] duplicate emotion id "${e.id}"`)
  if (!ARCHETYPES[e.archetype]) {
    throw new Error(`[TAXONOMY] "${e.id}" routes to unknown archetype "${e.archetype}"`)
  }
  for (const [k, range] of [['valence', VALENCE_RANGE], ['arousal', AROUSAL_RANGE]]) {
    const v = e[k]
    if (typeof v !== 'number' || v < range[0] || v > range[1]) {
      throw new Error(`[TAXONOMY] "${e.id}" ${k}=${v} is outside the measured ${range.join('..')}`)
    }
  }
  if (!e.definition || !e.label) throw new Error(`[TAXONOMY] "${e.id}" needs a label and a definition`)
  byId.set(e.id, e)
}

/** Grouped for the UI: 12 families, each with its emotions. */
function groupedByArchetype() {
  return Object.entries(ARCHETYPES).map(([id, a]) => ({
    archetype: id,
    label: a.label,
    register: a.register,
    emotions: EMOTIONS.filter((e) => e.archetype === id).map((e) => ({
      id: e.id, label: e.label, definition: e.definition, origin: e.origin || null,
    })),
  }))
}

const getEmotion = (id) => byId.get(String(id || '').trim().toLowerCase()) || null

module.exports = { EMOTIONS, groupedByArchetype, getEmotion, VALENCE_RANGE, AROUSAL_RANGE }

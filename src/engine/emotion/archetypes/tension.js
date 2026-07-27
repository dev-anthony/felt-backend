'use strict'
/**
 * ARCHETYPE 7 — Tension, Suspense & Anticipation (The Visual Manifesto)
 *
 * The voice is that of a gambler who has learned that meaning lives in the
 * instant before the outcome, never in the outcome itself. Certainty, to
 * this narrator, is the enemy of feeling — the held breath is the only truth
 * worth photographing. Recurring vocabulary: the held breath, the coil, the
 * countdown, the threshold before, suspended weight, the unresolved beat.
 * Anchor and motionBias are DEAM-calibrated and unchanged; only the twelve
 * cells were rewritten.
 */
module.exports = {
  label: 'Tension, Suspense & Anticipation',
  genres: 'Tech-house, thriller score, progressive, minimal techno, post-punk',
  register: 'a gambler\'s held breath — meaning kept coiled in the instant before it resolves',
  anchor: { tempo: 0.55, energy: 0.551, valence: 0.4, darkness: 0.55, danceability: 0.5 },
  motionBias: 0.55,
  states: {
    normal: {
      low: 'The gambler\'s first coil is patience disguised as landscape. A straight highway runs into a distant storm across pale desert ochre, the horizon holding its outcome just out of frame, the wait already longer than most people could bear.',
      medium: 'A breath held mid-effort tells more than one already released. Hard side-light catches sweat on an athlete\'s brow, frozen a beat before the motion completes, the coil visibly wound but not yet let go.',
      high: 'The countdown becomes visible once the city itself starts keeping time. Long-exposure headlights streak red across a night intersection, the orthographic height turning traffic into a ticking, unresolved pattern.',
      extreme: 'At the furthest coil, perspective itself refuses to resolve into one clean answer. Multiple exposures collide at conflicting angles, the geometry locking into a dense, interlocking pattern that never quite completes its own sentence.',
    },
    luxury: {
      low: 'Even stillness can be built with precision, each pillar a held beat in a longer sentence. Tone-on-tone grey repeats down a colonnade of unbroken pillars, the alignment so exact it feels like a countdown that has not yet reached zero.',
      medium: 'A mechanism mid-tick is the gambler\'s favourite kind of luxury — value suspended, not yet spent. Macro focus finds a tourbillon\'s ruby bearings frozen between beats, the precision itself the entire tension.',
      high: 'The coil tightens further once a body is caught mid-stride across a blade of shadow. Razor-sharp light divides a model against a hard geometric line, the fashion editorial holding the pose one beat before it breaks.',
      extreme: 'The gambler\'s final wager: a perspective so vertical it removes the ground to bet on entirely. Titanium and mirror glass rise into black sky, the upward angle suspending the viewer in a held breath with nothing left beneath it.',
    },
    gritty: {
      low: 'An empty track is still a countdown, if something is known to be arriving eventually. Weathered steel and dull iron stretch toward a flat horizon, the straight perspective holding a wait that has clearly outlasted its patience.',
      medium: 'A clock on a stained wall keeps the coil wound whether or not anyone is watching. Single-window light casts sharp shadow across an old wall clock, the asymmetry a reminder that time does not care where it is kept.',
      high: 'The gambler\'s nerve is tested hardest at the platform\'s edge, motion blurring everything except the wait itself. High shutter speed holds one static figure sharp while a train streaks past in grain and colour, the moment before arrival stretched taut.',
      extreme: 'At its most volatile, the coil finally releases — a door bursting open, dust and light thrown loose at once. Direct flash freezes airborne concrete debris mid-explosion, the countdown finally, violently, reaching zero.',
    },
  },
}

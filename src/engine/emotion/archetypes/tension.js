'use strict'
/**
 * ARCHETYPE 7 — Tension, Suspense & Anticipation
 *
 * Research Module 1. Visual directions are distilled from the research's
 * per-cell tables (lighting / colour / composition / texture) into one dense
 * phrase per Aesthetic State × Visual Intensity — 12 cells per archetype.
 */
module.exports = {
  label: 'Tension, Suspense & Anticipation',
  genres: 'Tech-house, thriller score, progressive, minimal techno, post-punk',
  register: 'restless anticipation — coiled, waiting, unresolved',
  // Anchor calibrated against DEAM (1,802 songs, human valence/arousal ratings,
  // CC-licensed; Aljanaki et al., PLOS ONE 2017). The original values sat on an
  // intuitive 0..1 scale, but real music does not use its ends: DEAM puts 95% of
  // songs inside valence 0.195..0.781 / arousal 0.156..0.797, and FELT's own valence
  // formula can only emit 0.174..0.875 -- so an anchor at 0.08 was unreachable
  // rather than expressive, and uniformly penalised its archetype. Rescaled
  // linearly: every archetype keeps its exact position relative to the others,
  // only the span changed. Measured effect: dead archetypes 1 -> 0, selection
  // concentration (Gini) 0.598 -> 0.501 across the 1,802 songs.
  anchor: { tempo: 0.55, energy: 0.551, valence: 0.4, darkness: 0.55, danceability: 0.5 },
  motionBias: 0.55,
  states: {
    normal: {
      low: 'distant clearing storm light over a vast span, pale desert sand ochre against deep purple distant storm, a linear highway running perfectly straight into the horizon, clean parched earth in crystalline distant detail',
      medium: 'directional stadium side-lighting, sharp highlight sweeps across natural skin undertones, a profile on a focused athlete frozen mid-breath, micro perspiration droplets over clean clothing fibre',
      high: 'a long time-exposure of night traffic, long red tail-light lines against cool streetlamp white, a top-down orthographic view of a dense city intersection, sharp building boundary lines and asphalt texture',
      extreme: 'multi-exposure spatial convergence, aggressive layered colour in hard geometric scales, conflicting lines of linear perspective intersecting in frame, interlocking grid mechanics at high pattern density',
    },
    luxury: {
      low: 'linear shadow tracking across modern structural pillars, tone-on-tone architectural greys with platinum highlight, perfect geometric alignment down repeating luxury columns, high-grade smooth limestone with precise joints',
      medium: 'high-precision macro instrument lighting, brushed steel grey with high-end ruby jewel bearings, macro focus on a mechanical watch movement, flawless gear-tooth detail and micro mechanical finishing',
      high: 'razor-sharp structural silhouette studio lighting, deep luxury emerald fabric against hard geometric shadow blocks, a fashion editorial on a model mid-stride across the shadows, crisp material divisions with zero surface dust',
      extreme: 'an ultramodern upward perspective on a high-rise, polished titanium and mirror glass against deep sky black, perfect structural convergence looking straight up the tower, frictionless glass panels in flawless metal framing',
    },
    gritty: {
      low: 'desaturated industrial transit-line lighting, weathered steel brown and dull iron grey under overcast sky, a central perspective down empty train tracks, corrugated iron fencing and heavy gravel bed grain',
      medium: 'a single window lighting an aged brick wall, rusted iron-oxide red and soot black against cold window white, an asymmetric composition around an old ticking wall clock, flaking brick mortar and deep wood-frame cracks',
      high: 'a dynamic high-speed pan in a transit station, high-contrast platform yellow lines over motion-blurred track, one static human figure as subways blur past, high-ISO grain and safety-tread texture',
      extreme: 'a forced-breach snapshot capture, blown highlights and chaotic sudden drop shadows, action framing on a door bursting open, airborne concrete dust and shattered wood splinters',
    },
  },
}

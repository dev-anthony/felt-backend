'use strict'
/**
 * ARCHETYPE 10 — Euphoria, Ecstasy & Trance
 *
 * Research Module 1. Visual directions are distilled from the research's
 * per-cell tables (lighting / colour / composition / texture) into one dense
 * phrase per Aesthetic State × Visual Intensity — 12 cells per archetype.
 */
module.exports = {
  label: 'Euphoria, Ecstasy & Trance',
  genres: 'EDM, Afrobeats, Amapiano, house, garage, synthpop, trance',
  register: 'kinetic release and communal ecstasy — bodies moving, ego dissolving',
  // Anchor calibrated against DEAM (1,802 songs, human valence/arousal ratings,
  // CC-licensed; Aljanaki et al., PLOS ONE 2017). The original values sat on an
  // intuitive 0..1 scale, but real music does not use its ends: DEAM puts 95% of
  // songs inside valence 0.195..0.781 / arousal 0.156..0.797, and FELT's own valence
  // formula can only emit 0.174..0.875 -- so an anchor at 0.08 was unreachable
  // rather than expressive, and uniformly penalised its archetype. Rescaled
  // linearly: every archetype keeps its exact position relative to the others,
  // only the span changed. Measured effect: dead archetypes 1 -> 0, selection
  // concentration (Gini) 0.598 -> 0.501 across the 1,802 songs.
  anchor: { danceability: 0.85, energy: 0.683, tempo: 0.6, motion: 0.85, euphoria: 0.7 },
  motionBias: 0.95,
  states: {
    normal: {
      low: 'a twilight festival horizon bleeding into sunset, deep evening magenta and electric violet behind stage silhouettes, a wide perspective on distant festival structures, soft atmospheric heat haze in clear evening air',
      medium: 'a dynamic camera pan holding motion blur, vibrant neon cyan bands cutting deep purple space, a panning shot fixing one dancer sharply against streaked ground, smooth background motion streaks over crisp facial detail',
      high: 'a high-density concert laser array, intense laser green and hot pink lines through heavy haze, geometric laser grids cutting a deep dark room, thick artificial fog catching every directional beam',
      extreme: 'long-exposure kinetic light painting, interlocking neon wire tracks around bright white cores, abstract spatial mapping of electronic light lines, fluid light tracks with all object weight eliminated',
    },
    luxury: {
      low: 'hidden neon channels in a premium club lounge, soft ambient violet wash over deep dark concrete grey, a minimalist club interior framing a clean modern bar, flawless polished concrete and satin metal fixtures',
      medium: 'saturated studio colour gels on a fashion profile, deep cyan key against intense magenta rim blocks, high-gloss framing holding the facial structure sharp, flawless gloss makeup under clean digital capture',
      high: 'studio strobe firing off metallic mesh clothing, liquid silver mesh against crisp strobe points, a high-dynamic studio setup tracking reflective metal fabric, thousands of tiny mesh link reflections on clean paper',
      extreme: 'high-frequency strobe on fluid mercury in macro, hyper-reflective liquid chrome under stark white strobe lines, an abstract macro study of moving liquid metal, frictionless fluid dynamics with micro surface lines',
    },
    gritty: {
      low: 'a single red laser line raking warehouse brick, crimson laser vectors through industrial brick dust brown, a low angle on an empty warehouse rave before the crowd, coarse old masonry and exposed conduit piping',
      medium: 'an underground packed basement rave snapshot, saturated red light washing dark sweaty space, claustrophobic wide-angle framing deep inside the crowd, thick humidity on the walls and airborne sweat particles',
      high: 'direct on-camera flash into crowd spray, overexposed skin highlights against airborne silver water, a fast snapshot freezing water thrown mid-air, frozen droplets under high-ISO digital noise',
      extreme: 'a heavily overdriven chemical film burn, extreme cross-processed colour with solarized highlights, chaotic movement tracking absolute crowd ecstasy, physically melting film edges and severe silver-halide clumping',
    },
  },
}

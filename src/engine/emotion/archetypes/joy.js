'use strict'
/**
 * ARCHETYPE 9 — Joyful Activation, Whimsy & Playfulness
 *
 * Research Module 1. Visual directions are distilled from the research's
 * per-cell tables (lighting / colour / composition / texture) into one dense
 * phrase per Aesthetic State × Visual Intensity — 12 cells per archetype.
 */
module.exports = {
  label: 'Joyful Activation, Whimsy & Playfulness',
  genres: 'Pop, funk, indie pop, calypso, ska, disco',
  register: 'exuberance and lightness — bouncing, open, unselfconscious',
  // Anchor calibrated against DEAM (1,802 songs, human valence/arousal ratings,
  // CC-licensed; Aljanaki et al., PLOS ONE 2017). The original values sat on an
  // intuitive 0..1 scale, but real music does not use its ends: DEAM puts 95% of
  // songs inside valence 0.195..0.781 / arousal 0.156..0.797, and FELT's own valence
  // formula can only emit 0.174..0.875 -- so an anchor at 0.08 was unreachable
  // rather than expressive, and uniformly penalised its archetype. Rescaled
  // linearly: every archetype keeps its exact position relative to the others,
  // only the span changed. Measured effect: dead archetypes 1 -> 0, selection
  // concentration (Gini) 0.598 -> 0.501 across the 1,802 songs.
  anchor: { euphoria: 0.8, valence: 0.781, brightness: 0.75, tempo: 0.6, danceability: 0.7, scaleMajor: 1 },
  motionBias: 0.75,
  states: {
    normal: {
      low: 'even midday daylight through thin white cloud, soft pastel blue and light mint over pale canary yellow, an approachable eye-level composition across open space, clean natural grass and flat smooth cotton',
      medium: 'hard dynamic sunlight catching fast action, saturated primary red and vibrant sky blue with sunflower yellow, dynamic framing of a figure mid-air over an urban space, crisp clothing folds and wind-swept hair',
      high: 'a freeze-frame of a multi-coloured powder explosion, hyper-saturated neon pink and electric cyan with bright yellow, a high-speed shutter catching the pigment cloud, millions of airborne colour particles',
      extreme: 'a long-exposure dynamic camera pan through colour, swirling light tracks in rainbow gradient ribbons, abstract camera-painting across bright objects, fluid motion light with no hard object boundary left',
    },
    luxury: {
      low: 'sun-drenched high-ceiling interior light, pristine architectural ivory over soft travertine sand, airy open framing of a clean luxury resort property, polished travertine pores and soft premium silk',
      medium: 'a high-end poolside sunset editorial setup, crisp resort white and luxury pool turquoise through crystal glass, a lifestyle editorial framing crystal glassware, intricate glass refraction and clean water ripple',
      high: 'an avant-garde studio wind-machine setup, saturated luxury magenta silk against electric orange, volumetric framing of a massive silk gown suspended mid-air, fine fabric weave over hyper-clean glossy studio paper',
      extreme: 'prismatic diamond light dispersion in macro, full spectral rainbow fracture across pure white marble, macro studio focus on a diamond facet splitting light, hyper-sharp refraction vectors in absolute crystal clarity',
    },
    gritty: {
      low: 'bright direct sun on an aged urban property, faded brick orange and weathered sky blue over asphalt grey, a casual snapshot of an old community playground, coarse peeling paint on iron and worn wood planks',
      medium: 'an authentic candid city-street snapshot, saturated clothing tones against natural pavement grey, street photography catching genuine laughter, rough sidewalk aggregate and authentic clothing flaws',
      high: 'an internal festival crowd flash-freeze, saturated neon eyewear and stage-flare pink against dark space, immersive wide-angle framing inside a high-energy crowd, dynamic flash sheen on sweat and loose glitter',
      extreme: 'experimental cross-processed film collage prints, saturated chemical pink and intense analog dye, overlapping multi-print street collage structure, halftone dot grids and torn paper print margins',
    },
  },
}

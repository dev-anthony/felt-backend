'use strict'
/**
 * THE 12 SONIC-EMOTIONAL ARCHETYPES — knowledge only, no logic.
 *
 * Taken directly from the FELT research (Module 1, expanded), which builds on
 * the Geneva Emotional Music Scale (GEMS) and Juslin's BRECVEMA model rather
 * than flat "happy/sad" buckets.
 *
 * Each archetype declares:
 *   - `anchor`     ideal values on the 0..1 signals in dna/featureVector.js.
 *                  ONLY signals the frontend actually extracts are used
 *                  (bpm/energy/valence/danceability/acousticness/brightness/
 *                  speechiness/scale) — no invented DSP features.
 *   - `register`   the plain-language EMOTIONAL REGISTER handed to the scene
 *                  writer. The research showed this must be its own labeled,
 *                  weighted input — buried in a jargon block it gets ignored.
 *   - `states`     visual direction per Aesthetic State (normal/luxury/gritty),
 *                  condensed from the research's per-archetype tables.
 *   - `motionBias` how physically kinetic this archetype should read. This is
 *                  what stops an energetic dance track resolving to a still,
 *                  pensive portrait.
 */

/** @type {Record<string, object>} */
const ARCHETYPES = {
  TRANSCENDENCE: {
    label: 'Transcendence, Awe & Sublimity',
    genres: 'Gospel, choral, orchestral, cinematic, ambient, post-rock',
    register: 'awe and spiritual elevation — vast, humbling, lifted',
    anchor: { valence: 0.72, energy: 0.55, acousticness: 0.6, brightness: 0.68, scaleMajor: 1, tempo: 0.35 },
    motionBias: 0.25,
    states: {
      normal: 'volumetric god-rays through cloud, a figure dwarfed by an immense sky, vast open horizon',
      luxury: 'a single spotlight on flawless marble in a dark gallery, alabaster and gold leaf, extreme negative space',
      gritty: 'a hard sunbeam cutting through a derelict warehouse, dust motes suspended in the shaft of light',
    },
  },
  SERENITY: {
    label: 'Serenity, Peacefulness & Meditativeness',
    genres: 'New age, minimalist ambient, lo-fi chillhop, Celtic folk',
    register: 'stillness and grounded calm — unhurried, weightless, settled',
    anchor: { energy: 0.15, tempo: 0.15, acousticness: 0.75, valence: 0.6, brightness: 0.3, speechiness: 0.08 },
    motionBias: 0.05,
    states: {
      normal: 'flat overcast light on a glassy undisturbed lake, monochrome greys and muted teal, perfect horizontal calm',
      luxury: 'minimalist spa architecture, matte oak and raw quartz, vast negative space, diffused indirect light',
      gritty: 'fog low over a damp country lane at dawn, soft optics, heavy atmospheric damp',
    },
  },
  TENDERNESS: {
    label: 'Tenderness, Intimacy & Vulnerability',
    genres: 'Indie folk, singer-songwriter, contemporary R&B, acoustic soul',
    register: 'closeness and emotional transparency — warm, unguarded, near',
    anchor: { intimacy: 0.75, acousticness: 0.65, energy: 0.32, valence: 0.6, brightness: 0.45 },
    motionBias: 0.15,
    states: {
      normal: 'soft window light through a sheer curtain, warm cream and true skin tones, close and unposed',
      luxury: 'candlelit low-key interior, espresso and warm gold, fine cashmere and silk against skin',
      gritty: 'a warm flashlight in a dark bedroom catching a raw unposed expression, heavy grain',
    },
  },
  NOSTALGIA: {
    label: 'Nostalgia, Yearning & Saudade',
    genres: 'Lo-fi hip-hop, dream pop, shoegaze, synthwave, blues',
    register: 'bittersweet remembrance — longing for something already gone',
    anchor: { warmth: 0.65, tempo: 0.28, acousticness: 0.55, valence: 0.5, brightness: 0.4 },
    motionBias: 0.2,
    states: {
      normal: 'golden hour across an old car dashboard, faded amber and washed denim, frame-within-a-frame',
      luxury: 'a vintage car outside a modernist desert villa at dusk, mid-century restraint',
      gritty: 'a lonely diner neon sign reflected in a rain puddle on dark asphalt',
    },
  },
  MELANCHOLY: {
    label: 'Melancholy, Grief & Despair',
    genres: 'Doom, dark ambient, minimalist classical, emo rap',
    register: 'sorrow and isolation — heavy, still, inward',
    anchor: { valence: 0.1, darkness: 0.8, energy: 0.28, scaleMajor: 0, brightness: 0.25 },
    motionBias: 0.08,
    states: {
      normal: 'a lone tree in a barren winter field under flat pale grey, deeply desaturated',
      luxury: 'a solitary figure in heavy matte black fabric, face lost to shadow, chiaroscuro',
      gritty: 'a dim room under a flickering green fluorescent tube, wet trash-strewn alley outside',
    },
  },
  DREAD: {
    label: 'Dread, Terror & Paranoia',
    genres: 'Death industrial, dark techno, horror score, noise',
    register: 'hyper-vigilance and impending threat — claustrophobic, watched',
    anchor: { darkness: 0.85, aggression: 0.6, valence: 0.08, brightness: 0.35, acousticness: 0.15 },
    motionBias: 0.35,
    states: {
      normal: 'a long corridor with uneven light and deep shadow at the far end, uncomfortable symmetry',
      luxury: 'a pitch-black boardroom lit only by one glowing terminal, sharp leather and steel',
      gritty: 'sodium-vapour parking garage at night, low-resolution surveillance grain, sickly orange and black voids',
    },
  },
  TENSION: {
    label: 'Tension, Suspense & Anticipation',
    genres: 'Tech-house, thriller score, progressive, minimal techno',
    register: 'restless anticipation — coiled, waiting, unresolved',
    anchor: { tempo: 0.55, energy: 0.6, valence: 0.35, darkness: 0.55, danceability: 0.5 },
    motionBias: 0.55,
    states: {
      normal: 'a straight highway running toward a distant dark thunderstorm, extreme perspective',
      luxury: 'a model frozen mid-stride across a razor-sharp shadow plane, high contrast',
      gritty: 'a figure at the edge of a subway platform as a train blurs into frame',
    },
  },
  POWER: {
    label: 'Power, Dominance & Aggression',
    genres: 'Trap, drill, hardcore hip-hop, metal, industrial techno',
    register: 'defiance and physical dominance — confrontational, immovable',
    anchor: { aggression: 0.85, energy: 0.88, valence: 0.2, speechiness: 0.5, scaleMajor: 0, brightness: 0.6 },
    motionBias: 0.6,
    states: {
      normal: 'low angle looking up at a figure on concrete, crimson and charcoal, rim-lit against smoke',
      luxury: 'matte-black supercar panels under hard strip light, gunmetal and platinum, brutalist symmetry',
      gritty: 'direct ring-flash on wet asphalt, chain-link and spray paint, sweat sheen and concrete dust',
    },
  },
  JOY: {
    label: 'Joyful Activation, Whimsy & Playfulness',
    genres: 'Pop, funk, indie pop, calypso, ska',
    register: 'exuberance and lightness — bouncing, open, unselfconscious',
    anchor: { euphoria: 0.8, valence: 0.85, brightness: 0.75, tempo: 0.6, danceability: 0.7, scaleMajor: 1 },
    motionBias: 0.75,
    states: {
      normal: 'a person caught mid-air on a sunlit street, saturated primaries, action-frozen',
      luxury: 'sun-drenched resort whites and pool turquoise, crystal refractions, airy high ceilings',
      gritty: 'real laughter on a crowded sunlit sidewalk, worn brick, candid and unposed',
    },
  },
  EUPHORIA: {
    label: 'Euphoria, Ecstasy & Trance',
    genres: 'EDM, Afrobeats, Amapiano, house, garage, synthpop',
    register: 'kinetic release and communal ecstasy — bodies moving, ego dissolving',
    anchor: { danceability: 0.85, energy: 0.75, tempo: 0.6, motion: 0.85, euphoria: 0.7 },
    motionBias: 0.95,
    states: {
      normal: 'a dancer mid-motion under colour-washed light, limbs trailing blur, face sharp',
      luxury: 'metallic mesh catching strobe in a premium lounge, deep violet ambient wash',
      gritty: 'direct flash freezing sweat and spray over a packed basement crowd, haze and heat',
    },
  },
  CEREBRAL: {
    label: 'Cerebral, Complex & Analytical',
    genres: 'IDM, avant-garde jazz, math rock, glitch, microtonal',
    register: 'cold fascination and precision — detached, structural, exacting',
    anchor: { brightness: 0.8, acousticness: 0.2, valence: 0.4, energy: 0.5, danceability: 0.35 },
    motionBias: 0.3,
    states: {
      normal: 'top-down orthographic grid of city infrastructure at night, razor-sharp lines',
      luxury: 'intersecting planes of glass, mirror and matte steel, flawless alignment',
      gritty: 'macro of a glitched monitor showing dense code, individual RGB subpixels',
    },
  },
  PRIMAL: {
    label: 'Primal, Ritualistic & Tribal',
    genres: 'Afro-house, traditional percussion, pagan folk, roots reggae, desert blues',
    register: 'ancient grounding and bodily rhythm — earthed, hypnotic, instinctive',
    anchor: { danceability: 0.7, acousticness: 0.6, energy: 0.6, warmth: 0.6, tempo: 0.45 },
    motionBias: 0.7,
    states: {
      normal: 'fire dancers at night, sparks frozen into streaks, deep ochre and shadow',
      luxury: 'hand-carved slate on limestone, raw linen and unpolished bronze, deep shadow',
      gritty: 'a performer lit by a single torch, sweat and ash, cracked mud-brick walls',
    },
  },
}

/** Aesthetic States — the research's router between three visual worlds. */
const AESTHETIC_STATES = {
  normal: {
    label: 'Normal',
    directive: 'grounded real-world realism — believable places, natural materials, nothing staged or stylised beyond what a documentary photographer would find',
  },
  luxury: {
    label: 'Luxury',
    directive: 'high-end editorial polish — premium materials, flawless surfaces, deliberate restraint, expensive light',
  },
  gritty: {
    label: 'Gritty / Raw',
    directive: 'raw and unpolished — visible wear, real dirt and sweat, uncorrected light, imperfection kept in',
  },
}

/** Visual Intensity tiers — how hard the emotional register is pushed. */
const INTENSITY_TIERS = {
  low: { label: 'Low', directive: 'restrained and quiet — understated, minimal, held back' },
  medium: { label: 'Medium', directive: 'clearly present and legible — confident but not extreme' },
  high: { label: 'High', directive: 'bold and dominant — strong contrast, decisive gesture, the feeling is unmistakable' },
  extreme: { label: 'Extra High', directive: 'pushed to the edge — overwhelming, near-abstract, the feeling consumes the frame' },
}

module.exports = { ARCHETYPES, AESTHETIC_STATES, INTENSITY_TIERS }

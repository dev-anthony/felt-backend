'use strict'
/**
 * ARCHETYPE 3 — Tenderness, Intimacy & Vulnerability
 *
 * Research Module 1. Visual directions are distilled from the research's
 * per-cell tables (lighting / colour / composition / texture) into one dense
 * phrase per Aesthetic State × Visual Intensity — 12 cells per archetype.
 */
module.exports = {
  label: 'Tenderness, Intimacy & Vulnerability',
  genres: 'Indie folk, singer-songwriter, contemporary R&B, acoustic soul, romantic classical',
  register: 'closeness and emotional transparency — warm, unguarded, near',
  // Anchor calibrated against DEAM (1,802 songs, human valence/arousal ratings,
  // CC-licensed; Aljanaki et al., PLOS ONE 2017). The original values sat on an
  // intuitive 0..1 scale, but real music does not use its ends: DEAM puts 95% of
  // songs inside valence 0.195..0.781 / arousal 0.156..0.797, and FELT's own valence
  // formula can only emit 0.174..0.875 -- so an anchor at 0.08 was unreachable
  // rather than expressive, and uniformly penalised its archetype. Rescaled
  // linearly: every archetype keeps its exact position relative to the others,
  // only the span changed. Measured effect: dead archetypes 1 -> 0, selection
  // concentration (Gini) 0.598 -> 0.501 across the 1,802 songs.
  anchor: { intimacy: 0.75, acousticness: 0.65, energy: 0.306, valence: 0.591, brightness: 0.45 },
  motionBias: 0.15,
  states: {
    normal: {
      low: 'soft natural window light through a sheer curtain, warm beige and light cream against organic skin tones, a close profile composition on shallow depth of field, soft fabric weave and smooth skin at low grain',
      medium: 'late afternoon sun casting long soft shadows across the space, burnt sienna and warm ochre with soft violet shadow, rule of thirds with comfortable negative room, warm wood grain and floating dust',
      high: 'critical macro lighting on one personal detail, rich amber highlight over deep warm brown midtone, extreme close-up portraiture at f/1.2 tracking the iris, flawless focus on highly tactile skin pores',
      extreme: 'a double exposure balancing a human profile against nature, dreamlike pastel overlays with bleeding highlights, overlapping visual boundaries in organic double imagery, translucent leaf veins blended into hair and bark',
    },
    luxury: {
      low: 'curated high-end residential accent glow, premium ivory and soft cashmere over muted sand, a minimalist bedroom set in elegant geometry, ultra-fine cotton sheets and matte silk sheen',
      medium: 'low-key warm candlelight tracing smooth facial vectors, deep espresso and dark plum lifted by warm gold, an intimate restaurant layout holding soft facial detail, heavy velvet drapery and crystal refraction',
      high: 'a high-contrast studio fashion editorial setup, midnight blue and dark mahogany with sharp platinum accents, a moody geometric crop blocking part of the body, fine high-fashion knitwear and structural heavy wool',
      extreme: 'an abstract studio study of organic form intersections, liquid gold highlight against rich monochromatic black, macro abstract framing of fine jewellery against skin lines, hyper-sharp refraction in absolute polish',
    },
    gritty: {
      low: 'natural uncorrected daylight filling a small space, desaturated denim and raw skin tones over wood grey, a casual snapshot at conversational distance, authentic analog grain across uncurated interior clutter',
      medium: 'harsh window light set against raw room shadow, cold window daylight clashing with warm indoor lamps, a portrait shot through rain-streaked window panels, crisp water droplets on glass over soft-focus human form',
      high: 'direct flashlight illumination inside a dark space, bleached skin tones and hard flash white with deep drop shadow, intimate confrontational portrait distance, high-ISO analog grain over sweat sheen and raw backgrounds',
      extreme: 'a degraded instant-polaroid chemical output, shifted magenta and cyan highlights over a lifted black floor, unbalanced accidental cropping around raw human interaction, chemical developer stains and physical handling wear',
    },
  },
}

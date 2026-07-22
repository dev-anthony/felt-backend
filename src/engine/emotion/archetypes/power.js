'use strict'
/**
 * ARCHETYPE 8 — Power, Dominance & Aggression
 *
 * Research Module 1. Visual directions are distilled from the research's
 * per-cell tables (lighting / colour / composition / texture) into one dense
 * phrase per Aesthetic State × Visual Intensity — 12 cells per archetype.
 */
module.exports = {
  label: 'Power, Dominance & Aggression',
  genres: 'Trap, drill, hardcore hip-hop, metal, industrial techno',
  register: 'defiance and physical dominance — confrontational, immovable',
  // Anchor calibrated against DEAM (1,802 songs, human valence/arousal ratings,
  // CC-licensed; Aljanaki et al., PLOS ONE 2017). The original values sat on an
  // intuitive 0..1 scale, but real music does not use its ends: DEAM puts 95% of
  // songs inside valence 0.195..0.781 / arousal 0.156..0.797, and FELT's own valence
  // formula can only emit 0.174..0.875 -- so an anchor at 0.08 was unreachable
  // rather than expressive, and uniformly penalised its archetype. Rescaled
  // linearly: every archetype keeps its exact position relative to the others,
  // only the span changed. Measured effect: dead archetypes 1 -> 0, selection
  // concentration (Gini) 0.598 -> 0.501 across the 1,802 songs.
  anchor: { aggression: 0.85, energy: 0.797, valence: 0.286, speechiness: 0.5, scaleMajor: 0, brightness: 0.6 },
  motionBias: 0.6,
  states: {
    normal: {
      low: 'direct hard front lighting under a low overcast sky, monochromatic steel grey over flat concrete tone, imposing frontal portraiture on a static solid stance, coarse fabric and heavy utility-jacket weave',
      medium: 'a low-angle streetlamp throwing high contrast, crimson red highlight against deep asphalt charcoal, a low angle on a figure standing atop concrete blocks, coarse urban brick and wet pavement reflection',
      high: 'blazing structural fire backlighting the night, intense fire orange against pure absolute silhouette black, the figure dead centre blocking the burning element behind, heavy floating ash and dense soot particles',
      extreme: 'fast-shutter macro capture of fragmentation, searing concrete white and shattered glass silver against black, high-velocity framing as concrete fractures open, airborne gravel fragments and sharp glass shards',
    },
    luxury: {
      low: 'monolithic brutalist architectural lighting, structural concrete grey with clean bronze panel channels, symmetrical low-angle framing of a monumental facade, perfect raw concrete formwork with zero flaws',
      medium: 'a high-end automotive studio key grid, matte automotive black and dark slate lit by chrome rim highlight, a low-profile track along sleek performance car panels, flawless metallic paint under clear-coat reflection',
      high: 'asymmetrical high-couture high-contrast editorial light, deep emerald velvet against rich high-gloss leather black, a bold aggressive low angle on a structured fashion model, heavy exotic leather pores and velvet shadow traps',
      extreme: 'surreal high-contrast gold-leaf studio void lighting, mirror-polished liquid gold against absolute void black, abstract geometry as liquid metal shifts through frame, frictionless mercury pools with perfect absolute lines',
    },
    gritty: {
      low: 'low-key ambient light in a basement boxing gym, faded leather brown and sweat grey over iron-oxide rust, a conversational portrait of a fighter with wrapped hands, coarse canvas heavy-bag texture and scarred skin',
      medium: 'hard direct on-camera flash at an urban perimeter, high-contrast chain-link grey against a dark industrial ground, a diagonal composition cutting the frame with wire fencing, rough galvanized steel and spray-paint grain',
      high: 'direct ring-flash in a concrete alleyway, bleached skin highlights against wet asphalt black, aggressive close-proximity framing on raw street styling, intense sweat sheen and cracked asphalt debris',
      extreme: 'high-contrast film push processing, pure silver highlight blowouts over dense grain black, chaotic motion framing inside an underground moshpit, heavy silver-halide grain and flying liquid droplets',
    },
  },
}

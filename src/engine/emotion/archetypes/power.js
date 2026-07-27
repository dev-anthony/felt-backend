'use strict'
/**
 * ARCHETYPE 8 — Power, Dominance & Aggression (The Visual Manifesto)
 *
 * The voice is that of a conqueror for whom stillness is a throne, not
 * passivity — dominance is the only language left once negotiation has
 * already failed. Nothing here asks permission. Recurring vocabulary: the
 * throne, territory, the unmoved stance, conquest, the claimed ground, the
 * immovable. Anchor and motionBias are DEAM-calibrated and unchanged; only
 * the twelve cells were rewritten.
 */
module.exports = {
  label: 'Power, Dominance & Aggression',
  genres: 'Trap, drill, hardcore hip-hop, metal, industrial techno',
  register: 'a conqueror\'s stillness — dominance so total it no longer needs to move',
  anchor: { aggression: 0.85, energy: 0.797, valence: 0.286, speechiness: 0.5, scaleMajor: 0, brightness: 0.6 },
  motionBias: 0.6,
  states: {
    normal: {
      low: 'Territory is claimed first by simply refusing to leave. Hard front light meets an overcast sky in monochrome steel grey, the frontal stance static, solid, coarse fabric holding a shape that does not shift under scrutiny.',
      medium: 'The throne, at street level, is whatever ground a figure chooses to stand on. A low streetlamp throws crimson highlight against asphalt charcoal, the low angle turning concrete blocks into a dais no one granted permission to build.',
      high: 'Fire behind the body is the conqueror\'s oldest signature — silhouette as the only detail worth keeping. Structural flame burns orange against pure black, the figure blocking the light entirely, ash falling like the aftermath already decided.',
      extreme: 'At its furthest reach, conquest becomes visible violence against the material world itself. Concrete fractures under a fast shutter, gravel and glass suspended mid-air, the frame proving that dominance was never only metaphor.',
    },
    luxury: {
      low: 'A monolith requires no ornament to communicate its terms. Structural concrete grey meets clean bronze channels in perfect symmetry, the brutalist facade a throne built from mass alone, immovable by design.',
      medium: 'Dominion, garaged — a machine built purely to outclass whatever stands beside it. Matte black paint catches chrome rim light in a high-end studio grid, the low profile making clear that this territory was never contested.',
      high: 'Conquest dressed formally is still conquest, only slower to reveal its teeth. Deep emerald velvet meets high-gloss leather under razor studio light, the aggressive low angle proving elegance and dominance share the same posture.',
      extreme: 'The conqueror\'s final throne is made of liquid gold and nothing else — abstraction as the ultimate flex. Mirror-polished metal fills a void-black frame, mercury pools holding no shape but the one power chooses to give it.',
    },
    gritty: {
      low: 'Dominion is first proven in the gym, where no one is watching and the claim still holds. Low ambient light finds faded leather and iron-oxide rust, a fighter\'s wrapped hands resting in a room built entirely on repetition.',
      medium: 'Territory, marked plainly — a fence, a wall, a line drawn without asking. Hard flash meets chain-link grey against dark industrial ground, the diagonal composition a boundary the frame refuses to soften.',
      high: 'The claimed ground gets closer the harder it has to be defended. Direct ring-flash bleaches skin against wet asphalt black, the framing pressed close, sweat and cracked pavement proof that this territory was earned, not given.',
      extreme: 'At its most volatile, conquest becomes indistinguishable from chaos — the throne finally shaking. High-contrast film grain floods a moshpit mid-motion, bodies and light colliding in a frame too dense to hold a single winner.',
    },
  },
}

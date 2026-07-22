'use strict'
/**
 * ARCHETYPE 4 — Nostalgia, Yearning & Saudade
 *
 * Research Module 1. Visual directions are distilled from the research's
 * per-cell tables (lighting / colour / composition / texture) into one dense
 * phrase per Aesthetic State × Visual Intensity — 12 cells per archetype.
 */
module.exports = {
  label: 'Nostalgia, Yearning & Saudade',
  genres: 'Lo-fi hip-hop, dream pop, shoegaze, vaporwave, synthwave, blues',
  register: 'bittersweet remembrance — longing for something already gone',
  // Anchor calibrated against DEAM (1,802 songs, human valence/arousal ratings,
  // CC-licensed; Aljanaki et al., PLOS ONE 2017). The original values sat on an
  // intuitive 0..1 scale, but real music does not use its ends: DEAM puts 95% of
  // songs inside valence 0.195..0.781 / arousal 0.156..0.797, and FELT's own valence
  // formula can only emit 0.174..0.875 -- so an anchor at 0.08 was unreachable
  // rather than expressive, and uniformly penalised its archetype. Rescaled
  // linearly: every archetype keeps its exact position relative to the others,
  // only the span changed. Measured effect: dead archetypes 1 -> 0, selection
  // concentration (Gini) 0.598 -> 0.501 across the 1,802 songs.
  anchor: { warmth: 0.65, tempo: 0.28, acousticness: 0.55, valence: 0.515, brightness: 0.4 },
  motionBias: 0.2,
  states: {
    normal: {
      low: 'faded vintage light with warm highlight spaces, faded sepia and pale gold under cyan-tinted shadow, one solitary structural element centred against a vast sky, soft vintage lens rendering at muted contrast',
      medium: 'golden-hour sun striking an old dashboard, saturated amber and burnt orange against faded denim blue, a frame within a frame seen through old car glass, visible lens flare and dust across the surfaces',
      high: 'intense atmospheric fog lit at twilight, deep twilight indigo and violet haze pierced by neon amber lamps, rule of thirds on a solitary figure inside heavy fog, thick condensation and wet concrete reflection',
      extreme: 'surreal dreamlike double exposures of historical spaces, heavily cross-processed analog colour, blended layers of human silhouette and aged landscape, optical light-leak artifacts and chemical processing marks',
    },
    luxury: {
      low: 'long mid-century modern afternoon light through a window, warm walnut and premium cream over muted ochre, a sleek architectural layout holding high-end retro design, polished vintage wood grain and matte linen',
      medium: 'high-end editorial dusk illumination, metallic silver reflection and rich twilight blue over slate, a premium vintage sports car set outside a desert villa, flawless vintage paint gloss and pristine leather upholstery',
      high: 'cinematic high-contrast monochrome studio light, pure deep charcoal against rich silver highlight, striking fashion editorial framing a timeless overcoat, heavy premium wool and thick heritage fabric',
      extreme: 'surrealist architectural geometry at sunset, monochromatic black cut by a single platinum ray, a sleek marble staircase ascending into a stylised sky, hyper-real mirror reflection on pristine architectural lines',
    },
    gritty: {
      low: 'low ambient light filtering into a small attic, dusty brown and tarnished silver over age-yellowed paper, an uncurated view of old cardboard boxes filled with vinyl, heavy analog grain and prominent dust',
      medium: 'corrupted neon signage bleeding across the street, sodium-vapour yellow and saturated neon red against asphalt black, a low street-level snapshot of worn urban assets, scratched plastic signage and wet pavement grain',
      high: 'high-ISO night transit lighting, sickly green train-interior light over deep track shadow, a shaky view through dirty passenger windows, intense compression noise and heavy grease marks on the glass',
      extreme: 'hardware tape damage and physical tracking failure, bleached colour space in violent analog shift, glitched elements and slipped image tracking frames, magnetic VHS tracking lines and chemical emulsion burn',
    },
  },
}

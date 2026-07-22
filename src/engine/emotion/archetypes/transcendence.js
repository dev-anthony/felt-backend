'use strict'
/**
 * ARCHETYPE 1 — Transcendence, Awe & Sublimity
 *
 * Research Module 1. Visual directions are distilled from the research's
 * per-cell tables (lighting / colour / composition / texture) into one dense
 * phrase per Aesthetic State × Visual Intensity — 12 cells per archetype.
 */
module.exports = {
  label: 'Transcendence, Awe & Sublimity',
  genres: 'Gospel, choral, orchestral, cinematic, ambient, Indian ragas, post-rock',
  register: 'awe and spiritual elevation — vast, humbling, lifted',
  anchor: { valence: 0.72, energy: 0.55, acousticness: 0.6, brightness: 0.68, scaleMajor: 1, tempo: 0.35 },
  motionBias: 0.25,
  states: {
    normal: {
      low: 'soft morning golden-hour light, warm whites and desaturated gold, vast sky filling the top two-thirds, clear air with faint haze',
      medium: 'volumetric god-rays breaking through storm cloud, amber and deep sky blue, low angle looking up at one solitary element, dust motes in the beams',
      high: 'hard directional backlight throwing a glowing rim, intense gold against deep navy shadow, ultra-wide with the figure dwarfed twenty to one, crisp foreground texture',
      extreme: 'a blinding overexposed source consuming the centre, pure white and searing platinum, dead symmetry staring into the light, heavy bloom and lens flare',
    },
    luxury: {
      low: 'muted indirect architectural light, matte white and brushed champagne gold, extreme minimalism on a single structural curve, polished marble and bone china',
      medium: 'a sharp spotlight on one object in chiaroscuro, obsidian black with gold leaf and ivory, rule of thirds against eighty percent negative space, polished lacquer and liquid gold',
      high: 'hard editorial light with razor shadows, emerald and burgundy with metallic gold, asymmetric fashion crop on a structural silhouette, heavy velvet and silk sheen',
      extreme: 'hyper-reflective high-gloss studio setup, liquid platinum and diamond white chrome, geometric abstraction in macro, frictionless surfaces with hyper-real micro-detail',
    },
    gritty: {
      low: 'harsh overhead fluorescent, uncorrected greenish-white over slate and industrial beige, off-centre with a tilted horizon, ISO-800 grain on rough concrete',
      medium: 'one bare hanging bulb cutting deep eye shadow, industrial rust and washed denim over ash, tight crop on hands, peeling paint and dust on the lens',
      high: 'brutal direct flash dropping the background to black, searing flash-white against asphalt black and blood red, aggressive wide-angle close-up, ISO-3200 noise and wet asphalt',
      extreme: 'flickering strobe caught mid-flash, high-contrast black and white pushed two stops, fractured overlapping layers, heavy silver-halide grain and chemical marks',
    },
  },
}

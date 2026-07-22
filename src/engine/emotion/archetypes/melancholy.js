'use strict'
/**
 * ARCHETYPE 5 — Melancholy, Grief & Despair
 *
 * Research Module 1. Visual directions are distilled from the research's
 * per-cell tables (lighting / colour / composition / texture) into one dense
 * phrase per Aesthetic State × Visual Intensity — 12 cells per archetype.
 */
module.exports = {
  label: 'Melancholy, Grief & Despair',
  genres: 'Doom, dark ambient, minimalist classical, emo rap, sad ballads',
  register: 'sorrow and isolation — heavy, still, inward',
  // Anchor calibrated against DEAM (1,802 songs, human valence/arousal ratings,
  // CC-licensed; Aljanaki et al., PLOS ONE 2017). The original values sat on an
  // intuitive 0..1 scale, but real music does not use its ends: DEAM puts 95% of
  // songs inside valence 0.195..0.781 / arousal 0.156..0.797, and FELT's own valence
  // formula can only emit 0.174..0.875 -- so an anchor at 0.08 was unreachable
  // rather than expressive, and uniformly penalised its archetype. Rescaled
  // linearly: every archetype keeps its exact position relative to the others,
  // only the span changed. Measured effect: dead archetypes 1 -> 0, selection
  // concentration (Gini) 0.598 -> 0.501 across the 1,802 songs.
  anchor: { valence: 0.21, darkness: 0.8, energy: 0.27, scaleMajor: 0, brightness: 0.25 },
  motionBias: 0.08,
  states: {
    normal: {
      low: 'flat desaturated white overcast winter light, muted pale grey and cold bone white over desaturated ash, a barren winter landscape holding one solitary leafless tree, minimal texture contrast across uniform flat surfaces',
      medium: 'heavy rain light against a dark window, deep slate blue and midnight indigo over muddy charcoal, an interior perspective looking out at the downpour, crisp water droplets running down the glass',
      high: 'stark high-contrast light on a volcanic coast, pitch-black basalt against frothing cold white spray, rugged vertical cliff faces meeting violent ocean, highly tactile rock and coarse volcanic sand',
      extreme: 'oppressive minimal illumination consuming the frame, ninety-five percent absolute black with a tiny cold grey highlight, the subject abstracted entirely into vast shadow, soft atmospheric density in heavy dark cloud layers',
    },
    luxury: {
      low: 'monochromatic daylight filtered through architectural concrete slits, flat industrial concrete grey against absolute shadow black, an empty structural chamber of minimal sharp lines, flawless smooth cast concrete with no surface damage',
      medium: 'high-fashion mournful editorial lighting, deep rich matte black fabric against pale skin, a solitary model draped in massive fine wool, dense premium weave with heavy velvet shadow traps',
      high: 'high-contrast studio chiaroscuro on a material study, polished obsidian black split by raw cracked platinum, a flawless black volcanic vase cleanly divided by the light, high-gloss reflection clashing with sharp fracture',
      extreme: 'hyper-minimalist void geometry, the deepest luxury matte black with individual silver-leaf accents, abstract lines mapping a mathematical void separation, frictionless material rendering with perfect absolute borders',
    },
    gritty: {
      low: 'dismal urban daylight on a neglected space, dirty industrial beige and concrete grey over rusted steel, a back-alley perspective onto piled refuse, coarse stone debris and peeling wall texture',
      medium: 'flickering uncorrected industrial fluorescent tubes, a sickly green-yellow hum over muddy brown shadow, a cramped apartment interior framing raw empty space, ISO-1600 grain with visible lens dust',
      high: 'direct phone flash on raw physical stress, bruised purple and raw skin red against hard flash white, an extreme facial close-up on bloodshot eyes, intense high-ISO noise over sweat pores and raw skin grain',
      extreme: 'a destroyed physical film negative conversion, chemical stain artifacts across an erratic monochrome scale, a fractured human profile warped by the tearing film, slashed emulsion and chemical corrosion marks',
    },
  },
}

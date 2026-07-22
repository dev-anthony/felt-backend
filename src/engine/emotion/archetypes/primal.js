'use strict'
/**
 * ARCHETYPE 12 — Primal, Ritualistic & Tribal
 *
 * Research Module 1. Visual directions are distilled from the research's
 * per-cell tables (lighting / colour / composition / texture) into one dense
 * phrase per Aesthetic State × Visual Intensity — 12 cells per archetype.
 */
module.exports = {
  label: 'Primal, Ritualistic & Tribal',
  genres: 'Afro-house, traditional percussion, pagan folk, roots reggae, desert blues',
  register: 'ancient grounding and bodily rhythm — earthed, hypnotic, instinctive',
  // Anchor calibrated against DEAM (1,802 songs, human valence/arousal ratings,
  // CC-licensed; Aljanaki et al., PLOS ONE 2017). The original values sat on an
  // intuitive 0..1 scale, but real music does not use its ends: DEAM puts 95% of
  // songs inside valence 0.195..0.781 / arousal 0.156..0.797, and FELT's own valence
  // formula can only emit 0.174..0.875 -- so an anchor at 0.08 was unreachable
  // rather than expressive, and uniformly penalised its archetype. Rescaled
  // linearly: every archetype keeps its exact position relative to the others,
  // only the span changed. Measured effect: dead archetypes 1 -> 0, selection
  // concentration (Gini) 0.598 -> 0.501 across the 1,802 songs.
  anchor: { danceability: 0.7, acousticness: 0.6, energy: 0.551, warmth: 0.6, tempo: 0.45 },
  motionBias: 0.7,
  states: {
    normal: {
      low: 'harsh vertical unshaded desert daylight, deep parched clay ochre and terracotta sand over slate, an expansive flat view across cracked clay earth, severe sun-baked fissures in coarse sand',
      medium: 'a single pinpoint campfire in wilderness night, deep fire amber against absolute night shadow, a low framing on vertical smoke plumes rising, floating ember spark lines over coarse ground gravel',
      high: 'a fast shutter on a wilderness fire dancer, liquid flame gold against dense body silhouette, a low angle freezing the spinning fire ring sharply, wood ash suspended in air over raw charcoal dust',
      extreme: 'a slow shutter panning across live flame, liquid swirling fire streams over deep earthen black, hypnotic camera movement turning fire into pure line, continuous hot fluid energy with no fixed shape left',
    },
    luxury: {
      low: 'monolithic lighting on a modern stone installation, deep natural split slate grey beside polished white limestone, a symmetrical gallery layout around hand-carved slabs, coarse split stone faces on a pristine floor',
      medium: 'premium editorial light on heritage organic material, raw unspun linen cream with hammered dark bronze, a high-fashion profile in structured organic clothing, deep linen fibre weave against matte bronze',
      high: 'studio lighting on geometric clay body paint, earth clay red ochre and white ash paste over shadow black, a high-contrast studio portrait tracing the painted lines, drying clay fracture networks across skin',
      extreme: 'macro documentation of cooling volcanic magma, molten rock red glow inside obsidian black glass shells, a macro close-up on volcanic rock cooling in motion, blistering rock bubbles and high-gloss fresh obsidian',
    },
    gritty: {
      low: 'ambient workshop light in a primitive pottery space, damp clay brown and wet slip grey over aged wood, a textured close-up on hands working an old wheel, slurry-coated skin and deeply grooved wood grain',
      medium: 'sun and shadow across ancient mud masonry, raw mud-brick ochre under irregular hand-packed wall shadow, an asymmetric layout down a narrow settlement corridor, straw fragments in clay blocks and crumbling earth',
      high: 'close-proximity organic torchlight portraiture, searing resin-torch amber against dark sweating skin, immersive close framing on a ritual performer, dense perspiration layers and coarse ash soot',
      extreme: 'a multi-exposure deep-wilderness analog conversion, muddy forest-floor brown and animal-hide grey through leaf veins, complex layers combining hide texture with motion blur, animal fur detail over coarse bark and grain',
    },
  },
}

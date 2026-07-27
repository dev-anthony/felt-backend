'use strict'
/**
 * ARCHETYPE 4 — Nostalgia, Yearning & Saudade (The Visual Manifesto)
 *
 * The voice is that of an archivist who has come to believe that nothing is
 * ever truly lost — only relocated into a softer, more forgiving light. The
 * past, to this narrator, is a country you are always welcome to visit and
 * never permitted to stay in. Recurring vocabulary: the archive, relocation,
 * the return, faded light, the threshold of memory, artefact, the country of
 * before. Anchor and motionBias are DEAM-calibrated and unchanged; only the
 * twelve cells were rewritten.
 */
module.exports = {
  label: 'Nostalgia, Yearning & Saudade',
  genres: 'Lo-fi hip-hop, dream pop, shoegaze, vaporwave, synthwave, blues',
  register: 'an archivist\'s ache — the past filed carefully away, visited often, never fully returned to',
  anchor: { warmth: 0.65, tempo: 0.28, acousticness: 0.55, valence: 0.515, brightness: 0.4 },
  motionBias: 0.2,
  states: {
    normal: {
      low: 'The archive\'s first paradox: the more faded a memory, the more precisely it is kept. Sepia light settles over a single structure against a vast sky, cyan shadow tinting the edges, the vintage lens softening detail the way distance softens a name.',
      medium: 'A country revisited but never entered — the return arrives at exactly the speed of a moving car. Golden-hour light strikes a dashboard through old glass, amber and faded denim framing the world at one remove, dust catching in the beam like the memory\'s own grain.',
      high: 'Fog thickens the further back the archivist reaches, each layer of atmosphere another year passed through. Twilight indigo pierced by neon amber holds a solitary figure at the edge of visibility, condensation on glass standing in for the years that will not quite resolve.',
      extreme: 'At the furthest edge of longing, the archive stops sorting and starts bleeding — one memory laid directly over another. Cross-processed colour blends a human silhouette into an aged landscape, light-leak artefacts marking the exact seam where the past refused to stay separate.',
    },
    luxury: {
      low: 'Even memory can be well-kept, if the room was built to hold it properly. Warm walnut and muted ochre catch a long mid-century afternoon, the retro design polished rather than preserved, matte linen suggesting comfort that was never accidental.',
      medium: 'The archivist\'s finest artefacts are the ones still allowed to be used. Metallic silver and twilight blue frame a vintage car outside a desert villa at dusk, the paint flawless, the leather pristine, nostalgia rendered as something still worth owning.',
      high: 'A memory becomes monumental once it is lit like an institution rather than a photograph. High-contrast monochrome holds a timeless overcoat in deep charcoal and silver, heavy wool carrying the weight of a decade the frame refuses to name.',
      extreme: 'The archive\'s final vanity: architecture built to look as though the past constructed it on purpose. A marble staircase ascends into a stylised, platinum-cut sky, mirror reflections doubling the structure until the building and the memory of it are the same object.',
    },
    gritty: {
      low: 'Not every artefact makes it to the display case — most are simply left in the attic. Dusty brown light finds age-yellowed paper in cardboard boxes of old vinyl, heavy grain and settled dust proof that some things are kept without ever being curated.',
      medium: 'The country of before has its own neon, and it does not care whether anyone still visits. Sodium-vapour yellow and neon red bleed across wet asphalt, a low street-level view holding worn signage the way a scar holds a story.',
      high: 'Transit has always been the archivist\'s favourite metaphor — moving forward while looking only backward. Sickly green train light falls over deep track shadow, the view shaky through a dirty window, compression noise standing in for the unreliability of the memory itself.',
      extreme: 'At its most damaged, the archive is not organised at all — only surviving. Bleached colour and violent tracking distortion tear through the frame, VHS lines and chemical burn proving that even a ruined recollection is still, technically, a record.',
    },
  },
}

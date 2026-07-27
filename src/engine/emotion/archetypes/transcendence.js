'use strict'
/**
 * ARCHETYPE 1 — Transcendence, Awe & Sublimity (The Visual Manifesto)
 *
 * The voice is that of a pilgrim who has stopped believing the self is the
 * centre of anything. To this narrator, scale is a mercy: the smaller a
 * person is made to look against the light, the vast, the ancient, the more
 * clearly they can be seen at all. Awe is not decoration — it is evidence
 * that something larger than the ego is still watching. Recurring
 * vocabulary: threshold, ascent, vastness, offering, elevation, horizon,
 * dwarfing. Anchor and motionBias are DEAM-calibrated and unchanged; only
 * the twelve cells were rewritten.
 */
module.exports = {
  label: 'Transcendence, Awe & Sublimity',
  genres: 'Gospel, choral, orchestral, cinematic, ambient, Indian ragas, post-rock',
  register: 'a pilgrim\'s vertigo before something larger than the self — humbled, lifted, dwarfed into clarity',
  anchor: { valence: 0.682, energy: 0.507, acousticness: 0.6, brightness: 0.68, scaleMajor: 1, tempo: 0.35 },
  motionBias: 0.25,
  states: {
    normal: {
      low: 'A pilgrim\'s first paradox: the sky grows larger precisely as the self grows quiet. Soft morning gold spills across a horizon filling two-thirds of the frame, one small figure standing at its edge, already smaller than the light he came looking for.',
      medium: 'Volumetric shafts break through cloud like a doorway that only opens from above, the vast made suddenly, briefly personal. Amber light falls on a solitary tree or figure far below, the low angle confessing that the ground has surrendered its claim to importance.',
      high: 'Scale becomes a form of mercy — the wider the frame, the smaller the ego, the more room left for wonder. A hard rim of gold burns around a silhouette dwarfed twenty to one against a navy sky, crisp foreground detail insisting the moment is real, not imagined.',
      extreme: 'The pilgrim reaches the threshold where sight becomes belief: a light too bright to look at directly, offering nothing back but itself. Pure white consumes the centre of the frame in perfect symmetry, the eye offered no escape but surrender.',
    },
    luxury: {
      low: 'Elevation without ornament — the discipline of a room that refuses to compete with what it houses. Alabaster and brushed gold hold one unbroken curve in absolute minimalism, proving restraint can be its own form of reverence.',
      medium: 'A single object raised to the status of relic simply by the attention paid to it. One spotlight finds one flawless surface in eighty percent black, gold leaf catching the only light left in the room, negative space doing the work of a cathedral ceiling.',
      high: 'Grandeur staged as inheritance rather than excess — the pilgrim understands true luxury as what outlives its owner. Emerald and burgundy meet metallic gold across an asymmetrical silhouette, velvet and silk holding weight the way stone holds history.',
      extreme: 'The final vanity: a surface so perfect it erases its own materiality, becoming pure light with no texture left to touch. Liquid platinum and diamond white collapse into geometric abstraction, the frame frictionless, the object indistinguishable from its own glow.',
    },
    gritty: {
      low: 'Even in ruin, the light insists on arriving somewhere. Uncorrected fluorescent hum falls sideways across a tilted horizon, sickly green-white finding one small clear space in the wreck, proof that grace does not require permission to enter.',
      medium: 'A single bulb in a condemned room becomes the last altar left standing. Harsh overhead light drops deep shadows across peeling paint and raw brick, the frame tight on hands or a face, dust catching the beam like incense in a church no one built on purpose.',
      high: 'The pilgrim finds the sacred in what should have already been abandoned. Brutal on-camera flash drops the background to pure black, a wide-angle distortion pressing close on a face lit like a confession, wet asphalt behind it doubling as scripture.',
      extreme: 'Faith at its most exposed: a strobe caught mid-flash, the image torn between revelation and collapse. High-contrast monochrome fractures the frame into overlapping planes, heavy grain and motion streaks proving the sacred was never meant to hold still.',
    },
  },
}

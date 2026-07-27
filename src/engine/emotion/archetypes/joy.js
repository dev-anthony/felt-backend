'use strict'
/**
 * ARCHETYPE 9 — Joyful Activation, Whimsy & Playfulness (The Visual Manifesto)
 *
 * The voice is that of a carnival barker who never grew out of believing
 * gravity was negotiable. To this narrator, seriousness is simply a failure
 * of imagination, and the body is a celebration that requires no permission
 * to begin. Recurring vocabulary: gravity defied, the carnival, the
 * unrehearsed leap, colour as noise, the open invitation. Anchor and
 * motionBias are DEAM-calibrated and unchanged; only the twelve cells were
 * rewritten.
 */
module.exports = {
  label: 'Joyful Activation, Whimsy & Playfulness',
  genres: 'Pop, funk, indie pop, calypso, ska, disco',
  register: 'a carnival barker\'s daylight — gravity treated as optional, the body already celebrating',
  anchor: { euphoria: 0.8, valence: 0.781, brightness: 0.75, tempo: 0.6, danceability: 0.7, scaleMajor: 1 },
  motionBias: 0.75,
  states: {
    normal: {
      low: 'The carnival opens quietly, colour arriving before the crowd does. Thin white cloud softens midday light into pastel blue and canary yellow, an approachable eye-level frame holding open space that is clearly waiting to be filled.',
      medium: 'Gravity gets its first genuine challenge mid-jump, and nobody involved looks concerned about landing. Hard sunlight catches a figure airborne over an urban street, saturated primary colour and wind-swept fabric proof that the leap was worth it before it even lands.',
      high: 'The invitation gets louder once colour stops behaving and starts exploding. A powder cloud freezes mid-burst in hyper-saturated pink and cyan, the high-speed shutter catching millions of particles mid-celebration, none of them following any particular rule.',
      extreme: 'At its furthest reach, the carnival stops being a place and becomes a motion — colour with no object left to land on. A long exposure smears rainbow ribbons across the frame, gravity entirely abandoned, the image pure unrehearsed joy in motion.',
    },
    luxury: {
      low: 'Even a well-appointed room can host a celebration, if it lets enough light in to notice. Sun floods a high-ceilinged interior in soft ivory and travertine sand, the space airy enough that joy needs no further invitation.',
      medium: 'The carnival, dressed for a resort, still refuses to take itself too seriously. Crisp white and pool turquoise catch a golden sunset, crystal glassware and rippling water framing a celebration in no particular hurry to end.',
      high: 'Whimsy becomes couture the moment fabric is asked to move as freely as the body wearing it. Magenta silk billows in a studio wind machine against electric orange, the gown suspended mid-air the way laughter is suspended mid-breath.',
      extreme: 'The barker\'s final flourish: light itself made to perform, splitting into colour purely for the pleasure of it. A diamond facet fractures white light into full spectrum across pristine marble, celebration reduced to its purest optical form.',
    },
    gritty: {
      low: 'Joy needs no permission and even less maintenance — a faded playground still does its job. Bright sun catches weathered brick and worn wood on an old community structure, the candid frame proof that celebration does not require upkeep.',
      medium: 'The best invitations are the ones nobody staged. An authentic street snapshot catches real laughter between two people, saturated clothing against ordinary pavement, the imperfection part of what makes it believable.',
      high: 'Inside the crowd, gravity finally loses the argument completely. Neon eyewear and stage flares wash pink across a packed festival floor, the wide angle immersing the frame in sweat, glitter, and unrehearsed noise.',
      extreme: 'At its rawest, the carnival becomes collage — too much joy for one frame to hold in order. Cross-processed prints overlap in saturated chemical pink, halftone dots and torn paper edges proving even celebration eventually needs more than one photograph.',
    },
  },
}

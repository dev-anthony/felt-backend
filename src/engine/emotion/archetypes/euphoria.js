'use strict'
/**
 * ARCHETYPE 10 — Euphoria, Ecstasy & Trance (The Visual Manifesto)
 *
 * The voice is that of a dancer dissolving on purpose — someone who has
 * learned the self is a costume worth losing, and that a crowd, given
 * enough rhythm, becomes a single organism breathing together. The point is
 * never to be seen; it is to disappear into the pulse. Recurring vocabulary:
 * dissolution, the shared pulse, the costume of self, the crowd-body,
 * surrender. Anchor and motionBias are DEAM-calibrated and unchanged; only
 * the twelve cells were rewritten.
 */
module.exports = {
  label: 'Euphoria, Ecstasy & Trance',
  genres: 'EDM, Afrobeats, Amapiano, house, garage, synthpop, trance',
  register: 'a dancer\'s dissolution — the self surrendered to a rhythm bigger than any one body',
  anchor: { danceability: 0.85, energy: 0.683, tempo: 0.6, motion: 0.85, euphoria: 0.7 },
  motionBias: 0.95,
  states: {
    normal: {
      low: 'Dissolution begins at the horizon, before the body even starts moving. Evening magenta bleeds into violet behind distant stage silhouettes, the wide frame holding a pulse the crowd has not yet answered.',
      medium: 'One body separates from the crowd just long enough to be witnessed dissolving. A panning shot holds a dancer sharp against streaked neon cyan, motion blur turning everyone else into pure colour and rhythm.',
      high: 'The pulse becomes visible once light starts moving faster than any single dancer could. Laser green and hot pink cut through heavy haze in geometric grids, the room itself now moving in time with the crowd-body.',
      extreme: 'At full dissolution, the dancer disappears entirely into the light they were dancing inside. Long-exposure neon tracks interlock around bright cores, every trace of individual weight erased, the frame pure shared motion.',
    },
    luxury: {
      low: 'Even a private surrender needs a room built to hold it. Soft violet wash settles over polished concrete in a minimalist lounge, the space quiet enough that dissolving here still feels like a choice.',
      medium: 'The costume of self is easiest to shed under studio-grade colour. Deep cyan and magenta gels frame a face still sharp enough to recognise, gloss makeup catching light the instant before it lets go.',
      high: 'Metal mesh moves the way skin does once the rhythm takes over completely. Liquid silver fabric catches strobe light mid-motion, thousands of small reflections standing in for a thousand small surrenders.',
      extreme: 'The dancer\'s final costume is liquid metal with no fixed shape left to it. High-frequency strobes catch mercury mid-flow under stark white light, the abstraction complete, the self entirely, finally, dissolved.',
    },
    gritty: {
      low: 'A single laser line across brick is enough to start the dissolving. Crimson light rakes an empty warehouse before the crowd arrives, the low angle proof that the pulse begins before the body does.',
      medium: 'The crowd-body forms fastest in rooms too packed to allow individual space. Saturated red light washes a basement rave, the wide angle immersing the frame entirely inside a shared, sweating organism.',
      high: 'Water thrown skyward becomes the clearest picture of surrender a camera can freeze. Direct flash catches airborne droplets over an ecstatic crowd, each one a small, separate act of letting go.',
      extreme: 'At its most consumed, the record of ecstasy starts destroying itself along with the dancer. Overdriven film burn solarises the frame, chaotic motion tracking absolute crowd dissolution until self and image collapse together.',
    },
  },
}

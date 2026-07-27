'use strict'
/**
 * ARCHETYPE 3 — Tenderness, Intimacy & Vulnerability (The Visual Manifesto)
 *
 * The voice is that of a witness to the body — someone who has learned that
 * proximity tells the truth language is too slow to catch. Nothing here is
 * performed; everything is simply close enough to be believed. Recurring
 * vocabulary: proximity, skin, the unguarded moment, warmth, the held breath,
 * nearness, weight of a hand. Anchor and motionBias are DEAM-calibrated and
 * unchanged; only the twelve cells were rewritten.
 */
module.exports = {
  label: 'Tenderness, Intimacy & Vulnerability',
  genres: 'Indie folk, singer-songwriter, contemporary R&B, acoustic soul, romantic classical',
  register: 'a witness\'s closeness — proximity as the only honest language the body has left',
  anchor: { intimacy: 0.75, acousticness: 0.65, energy: 0.306, valence: 0.591, brightness: 0.45 },
  motionBias: 0.15,
  states: {
    normal: {
      low: 'Proximity begins with permission, not performance. Soft window light filters through a sheer curtain, warm beige and cream settling on organic skin tones, the frame close and unhurried, shallow focus keeping the moment private even in plain sight.',
      medium: 'Tenderness deepens the longer it is allowed to go unnoticed. Late afternoon sun draws long, soft shadows across the room, burnt sienna warming into violet, the comfortable negative space around the subject proof that nearness does not require crowding.',
      high: 'The witness moves closer until the whole world reduces to one detail worth trusting. Critical macro light finds a single feature — an iris, a scar, a line at the mouth — rich amber falling across warm brown, the rest of the frame surrendered entirely to focus.',
      extreme: 'At its furthest reach, intimacy stops being one thing observed and becomes two things merging. A double exposure blends a human profile with wood grain or leaf vein, pastel light bleeding across the boundary until skin and nature share a single texture.',
    },
    luxury: {
      low: 'Comfort as its own quiet luxury — nothing displayed, everything simply well-made. Premium ivory and soft cashmere hold a minimalist room in elegant geometry, ultra-fine linen catching light the way skin catches warmth.',
      medium: 'Candlelight has always known how to make a room complicit. Low, warm light traces smooth facial contours against deep espresso and plum, an intimate space built for exactly two kinds of attention: the one being paid, and the one being returned.',
      high: 'Even desire dresses formally when it wants to be taken seriously. High-contrast studio light meets midnight blue and dark mahogany, a moody geometric crop obscuring part of the body, fine knitwear holding its shape the way restraint holds a feeling.',
      extreme: 'The witness\'s furthest intimacy is abstraction — form and skin refined until the two are indistinguishable. Liquid gold highlights fall across monochrome black in extreme macro, jewellery and skin sharing one surface, one light, one unbroken line.',
    },
    gritty: {
      low: 'Unpolished proximity is still proximity — perhaps the most honest kind. Uncorrected daylight fills a small, ordinary room, desaturated denim and raw skin tones caught at conversational distance, the grain authentic, the clutter left exactly where it was.',
      medium: 'Glass has a way of letting two truths exist in the same frame. Harsh window light meets rain streaking down the pane, cold daylight clashing gently with a warm interior lamp, the portrait held soft while the water stays sharp.',
      high: 'The witness closes the last distance, and the light no longer softens what it finds. A direct flashlight in a dark room bleaches skin tones white, hard shadows dropping fast, the portrait confrontational, close, and entirely unguarded.',
      extreme: 'Even the photograph itself begins to show its age at the furthest edge of intimacy. A degraded instant print shifts toward magenta and cyan, the black floor lifted, the crop accidental, chemical stains standing in for everything language could not hold.',
    },
  },
}

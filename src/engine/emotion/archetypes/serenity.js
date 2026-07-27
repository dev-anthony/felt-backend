'use strict'
/**
 * ARCHETYPE 2 — Serenity, Peacefulness & Meditativeness (The Visual Manifesto)
 *
 * The voice is that of a hermit who has come to believe that stillness is the
 * only thing a person can truly own — that the more a scene is emptied, the
 * more clearly it can be seen. Nothing here is achieved; everything is simply
 * allowed to settle. Recurring vocabulary: stillness, emptying, surface,
 * unclaimed space, the held breath, horizon, weightlessness. Anchor and
 * motionBias are DEAM-calibrated and unchanged; only the twelve cells were
 * rewritten.
 */
module.exports = {
  label: 'Serenity, Peacefulness & Meditativeness',
  genres: 'New age, minimalist ambient, lo-fi chillhop, Celtic folk',
  register: 'a hermit\'s stillness — the world emptied until only calm is left standing',
  anchor: { energy: 0.156, tempo: 0.15, acousticness: 0.75, valence: 0.591, brightness: 0.3, speechiness: 0.08 },
  motionBias: 0.05,
  states: {
    normal: {
      low: 'The first paradox of stillness: a lake so undisturbed it feels louder than any wave could. Flat overcast light lays soft grey and pale teal across a symmetrical horizon, the surface glassy enough to hold the sky without asking anything of it.',
      medium: 'Silence made visible — the blue hour after sunset, when the day has finished asking questions. Pale lavender fades into deep twilight indigo across a wide, uncluttered field, thin mist softening every edge that daylight would have sharpened.',
      high: 'Deeper stillness requires deeper cover: a canopy the light must earn its way through. Filtered warm shafts cut through moss green and earthen brown, vertical trunks holding the frame quiet the way pillars hold a room, the floor beyond dissolving into soft, forgiving blur.',
      extreme: 'The hermit\'s final teaching: stillness carried far enough stops being a place and becomes a colour. Borderless gradients shift through soft monochrome tone, every literal object dissolved, the frame opening into a sky with no measurable depth left to it.',
    },
    luxury: {
      low: 'Wealth expressed as absence — a room so certain of itself it needs nothing extra to prove the point. Hidden light warms pale stone grey and soft bone white against matte oak, geometric lines left clean of anything that was not essential.',
      medium: 'Restraint as its own material — taupe and warm cream meeting unpolished bronze in a room built around what it chose not to include. Diffused wash light settles across fine linen weave and matte ceramic, the asymmetry deliberate, unhurried, entirely at ease with itself.',
      high: 'One object, fully attended to, becomes worth more than a room full of many. A single museum-grade spotlight isolates deep espresso wood and emerald velvet trimmed in soft gold leaf, aged leather grain the only history the frame permits itself to hold.',
      extreme: 'The hermit\'s luxury, taken to its edge: white on white, until even colour has agreed to stop competing. Perfect indirect light casts the faintest shadow lines across raw silver, one structural intersection reduced to pure geometric crystal, flawless and entirely without weight.',
    },
    gritty: {
      low: 'Even a neglected room can hold a kind of peace, if nothing in it is asked to perform. Weak morning sun finds one bare wall, faded beige and flat eggshell catching natural shadow, the camera stationary, unposed, content to simply witness.',
      medium: 'Stillness does not require cleanliness — only the absence of demand. Overcast light filters through dirty glass, muted industrial blue meeting rusted iron trim, the frame looking outward through a window into dead, undemanding space.',
      high: 'The world grows quieter the further it drifts from anyone\'s attention. Low fog rolls across an unpaved road, charcoal and slate settling over muddy earth, the horizon disoriented on purpose, soft focus letting the road disappear before it has to end.',
      extreme: 'The hermit\'s last lesson in letting go: even focus is something that can be released. A night landscape dissolves into distant streetlight bokeh, the lens entirely defocused, camera off-axis, the frame content to hold nothing but colour and dark.',
    },
  },
}

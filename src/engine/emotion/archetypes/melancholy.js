'use strict'
/**
 * ARCHETYPE 5 — Melancholy, Grief & Despair (The Visual Manifesto)
 *
 * The voice is that of a mourner who has come to understand grief as
 * architecture, not absence — a structure built specifically to hold the
 * shape of what is gone. Sorrow, given enough time, stops being a wound and
 * becomes a room a person can actually live in. Recurring vocabulary:
 * architecture of grief, the vigil, weight, shelter, the unanswered, the kept
 * absence. Anchor and motionBias are DEAM-calibrated and unchanged; only the
 * twelve cells were rewritten.
 */
module.exports = {
  label: 'Melancholy, Grief & Despair',
  genres: 'Doom, dark ambient, minimalist classical, emo rap, sad ballads',
  register: 'a mourner\'s architecture — grief built into a shelter, not left as a wound',
  anchor: { valence: 0.21, darkness: 0.8, energy: 0.27, scaleMajor: 0, brightness: 0.25 },
  motionBias: 0.08,
  states: {
    normal: {
      low: 'The mourner\'s first structure is the simplest: a single tree left standing where everything else has already fallen. Flat winter light drains colour into pale grey and cold bone white, the barren field holding its one shape the way a vigil holds its silence.',
      medium: 'Grief has weather, and the weather this time is rain against glass that will not be opened. Deep slate blue and midnight indigo pool across a window, the interior view holding the downpour at exactly the distance where watching becomes its own form of mourning.',
      high: 'The architecture grows harder the longer the vigil is kept — stone against water, water against stone. Basalt cliffs meet frothing cold spray in stark contrast, the coastline\'s violence a shelter of its own kind, indifferent, permanent, entirely unmoved.',
      extreme: 'At its furthest reach, the shelter becomes almost nothing at all — one small grey light in ninety-five percent black. The frame abstracts entirely into shadow, heavy cloud pressing down like a roof built from the absence itself.',
    },
    luxury: {
      low: 'Even mourning can be built with precision, if the room understands its own purpose. Flat concrete grey meets absolute shadow in a chamber with no unnecessary lines, the smooth cast surface refusing every flaw the way grief refuses to be rushed.',
      medium: 'A single figure draped in fine wool becomes a monument before the frame even asks it to. Deep matte black gathers around pale skin, heavy fabric holding its shape like a shelter cut specifically to one silhouette\'s measurements.',
      high: 'The vigil, staged formally, still cracks exactly where it always would. Polished obsidian splits under a single blade of platinum light, the fracture line precise, the shelter\'s failure made deliberately, expensively visible.',
      extreme: 'The mourner\'s final architecture: a void so complete that even luxury cannot decorate it. Matte black meets a single silver-leaf line in an abstract, near-mathematical separation, the shelter reduced to its last, most honest wall.',
    },
    gritty: {
      low: 'Not every shelter was built to be seen — most were simply left where they collapsed. Industrial beige and concrete grey frame a back alley of piled refuse, the coarse debris asking for nothing, offering nothing, holding its ground regardless.',
      medium: 'A flickering tube light is still a vigil, if someone is still sitting beneath it. Sickly green fluorescent hum falls across a cramped room, muddy shadow and visible grain proof that grief does not require good lighting to be kept faithfully.',
      high: 'The mourner\'s closest architecture is the body itself, examined without mercy. A direct flash finds bloodshot eyes and bruised shadow in extreme close-up, high-ISO grain refusing to soften what the vigil has already cost.',
      extreme: 'At its most ruined, even the record of grief begins to fail. A destroyed film negative fractures a human profile through chemical stains and erratic tearing, the shelter\'s last wall finally giving way to the weather it was built against.',
    },
  },
}

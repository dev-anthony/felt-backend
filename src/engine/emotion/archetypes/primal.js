'use strict'
/**
 * ARCHETYPE 12 — Primal, Ritualistic & Tribal (The Visual Manifesto)
 *
 * The voice is that of an earthbound ancestor for whom the body is older
 * than language and rhythm is the first law, predating every instrument
 * built to imitate it. The earth, to this narrator, remembers everyone who
 * forgets it. Recurring vocabulary: the earthbound, the first rhythm, the
 * remembered body, ritual fire, the ground's memory, the drum as pulse.
 * Anchor and motionBias are DEAM-calibrated and unchanged; only the twelve
 * cells were rewritten.
 */
module.exports = {
  label: 'Primal, Ritualistic & Tribal',
  genres: 'Afro-house, traditional percussion, pagan folk, roots reggae, desert blues',
  register: 'an ancestor\'s pulse — rhythm as the first law, older than language, remembered in the body',
  anchor: { danceability: 0.7, acousticness: 0.6, energy: 0.551, warmth: 0.6, tempo: 0.45 },
  motionBias: 0.7,
  states: {
    normal: {
      low: 'The ground remembers long before any body arrives to stand on it. Harsh vertical desert light bakes clay ochre and terracotta sand into cracked, sun-fissured earth, the flat horizon holding a memory older than whoever is looking at it now.',
      medium: 'Fire is the first rhythm, and a single flame keeps better time than any instrument built since. One pinpoint campfire burns amber against absolute night, smoke rising in a vertical column the ancestor reads the way others read a clock.',
      high: 'The remembered body moves fastest closest to the flame that first taught it rhythm. A fast shutter freezes a fire dancer mid-spin, liquid gold light wrapping a dense silhouette, ash suspended in the air like punctuation on an old sentence.',
      extreme: 'At the furthest reach of ritual, fire stops being watched and becomes the only shape left in the frame. A slow pan turns flame into pure liquid line against earthen black, the body dissolved entirely into continuous, hot, formless motion.',
    },
    luxury: {
      low: 'Even stone remembers, if it is cut and arranged with enough patience. Deep slate meets polished limestone in a symmetrical gallery of hand-carved slabs, the coarse stone face proof that the earth\'s memory can still be curated without being erased.',
      medium: 'Cloth carries the ancestor\'s memory the way skin carries a scar. Raw unspun linen meets hammered bronze in a structured, organic silhouette, the fine fibre weave a record of hands that worked long before fashion gave it a name.',
      high: 'The body becomes its own monument once earth is painted directly onto skin. Studio light traces geometric clay body paint in red ochre and white ash, drying fracture lines forming across the skin like a map only the ancestor can read.',
      extreme: 'The earth\'s final ritual is patience measured in temperature — rock remembering its own becoming. Macro light finds molten magma cooling inside obsidian glass, blistering bubbles frozen at the exact moment memory turns to stone.',
    },
    gritty: {
      low: 'The oldest rhythm is still kept by hands working clay at a wheel no one questions. Damp browns and wet grey slip cover a primitive workshop, deeply grooved wood grain holding the same repetition the potter\'s hands have always known.',
      medium: 'Mud remembers every hand that ever shaped it into a wall. Raw ochre brick catches irregular shadow down a narrow settlement corridor, straw fragments and crumbling earth proof that the ground was always the first material.',
      high: 'Closest to the ritual, torchlight replaces every other kind of truth. Searing resin-amber light finds sweat-dark skin in immersive close-up, coarse ash and perspiration the only record a performer needs of what the fire asked of them.',
      extreme: 'At its most unbroken, the ancestor\'s memory blurs hide, bark, and body into one continuous surface. Multi-exposure layers combine animal hide, leaf vein, and motion blur, the ground\'s memory finally indistinguishable from the body that carries it.',
    },
  },
}

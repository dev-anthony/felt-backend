'use strict'
/**
 * VISUAL VOCABULARY — Creative domain (knowledge only, no logic).
 * Subject archetypes (styling/wardrobe — NOT named celebrities, which trip
 * image-model safety filters), editorial styles, art mediums and symbolism,
 * reverse-engineered from the research archetype matrices + editorial theory.
 */

/**
 * Subject archetypes describe STYLING and PRESENCE only. Gemini fills in the
 * specific pose/expression/action within this styling constraint.
 * @type {import('../types').VocabularyConcept[]}
 */
const SUBJECT_ARCHETYPES = [
  { id: 'subj_afro_luxe', category: 'subject', tags: ['warm-skin', 'earth-tone', 'structured'],
    fragment: 'a poised figure with rich warm skin tones in structured earth-toned fabrics with visible textile weave',
    anchor: { warmth: 0.7, danceability: 0.6, valence: 0.6, euphoria: 0.55 } },
  { id: 'subj_techwear_shadow', category: 'subject', tags: ['dark', 'techwear', 'mysterious'],
    fragment: 'a shadowed figure in heavy technical outerwear and dark wrap-around eyewear',
    anchor: { aggression: 0.7, grit: 0.65, darkness: 0.6 },
    techniques: ['SILHOUETTE_ATMOSPHERE', 'FLASH_DOCUMENTARY'] },
  { id: 'subj_vintage_candid', category: 'subject', tags: ['vintage', 'natural-hair', 'timeless'],
    fragment: 'an unposed character with natural hair texture in timeless vintage knitwear',
    anchor: { acousticness: 0.65, warmth: 0.6, intimacy: 0.55 },
    techniques: ['VINTAGE_FILM_NOSTALGIA'] },
  { id: 'subj_editorial_minimal', category: 'subject', tags: ['high-fashion', 'clean', 'sculptural'],
    fragment: 'a sculptural high-fashion figure in a single strong tailored silhouette',
    anchor: { brightness: 0.6, euphoria: 0.55, energy: 0.55 },
    techniques: ['STUDIO_SEAMLESS_EDITORIAL'] },
  { id: 'subj_silhouette_form', category: 'subject', tags: ['silhouette', 'shape', 'anonymous'],
    fragment: 'a figure reduced to a shape, features lost to shadow, read as form before person',
    anchor: { darkness: 0.7, intimacy: 0.4, brightness: 0.35 },
    techniques: ['SILHOUETTE_ATMOSPHERE', 'MONUMENTAL_SCALE_ISOLATION'] },
  { id: 'subj_intimate_detail', category: 'subject', tags: ['skin', 'tender', 'close'],
    fragment: 'a single feature — a hand, lips, an eye — standing in for the whole person',
    anchor: { intimacy: 0.8, acousticness: 0.5, energy: 0.3 },
    techniques: ['MACRO_INTIMATE_DETAIL'] },
  { id: 'subj_absent', category: 'subject', tags: ['no-figure', 'object', 'memory'],
    fragment: 'no human figure at all — a single object or empty scene carrying the emotion',
    // Broadened anchor and dropped the single-technique restriction — this was
    // starved the same way non-photo mediums were. A cracked terrazzo stairwell
    // or a half-drunk glass of palm wine is right for far more than one archetype.
    anchor: { darkness: 0.45, intimacy: 0.4, energy: 0.3, acousticness: 0.4 } },
  { id: 'subj_crowd', category: 'subject', tags: ['crowd', 'anonymous', 'communion'],
    fragment: 'a real crowd of distinguishable people, no single face resolving as the subject — raised arms, packed bodies, natural variety',
    anchor: { danceability: 0.75, euphoria: 0.7, motion: 0.75, energy: 0.7 } },
  { id: 'subj_object_as_head', category: 'subject', tags: ['object-substitute', 'surreal', 'identity'],
    fragment: 'a figure whose head is physically replaced or obscured by one meaningful burning, held, or worn object — the object carries the identity, not the face',
    anchor: { darkness: 0.5, aggression: 0.35, intimacy: 0.35, valence: 0.35 } },
  { id: 'subj_duo_group', category: 'subject', tags: ['duo', 'group', 'multi-subject'],
    fragment: 'two or more distinct subjects, each built with full individual rigor, sharing one frame or one panel layout',
    anchor: { euphoria: 0.5, energy: 0.55, valence: 0.5 } },
]

/** @type {import('../types').VocabularyConcept[]} */
const EDITORIAL_STYLES = [
  { id: 'edit_fashion', category: 'editorial', tags: ['fashion', 'campaign', 'high-end'],
    fragment: 'high-fashion editorial campaign styling',
    anchor: { euphoria: 0.6, brightness: 0.6, energy: 0.55 },
    techniques: ['STUDIO_SEAMLESS_EDITORIAL', 'MOTION_BLUR_STROBE'] },
  { id: 'edit_street', category: 'editorial', tags: ['street', 'documentary', 'candid'],
    fragment: 'raw street realism',
    anchor: { grit: 0.7, aggression: 0.55, energy: 0.6 },
    techniques: ['FLASH_DOCUMENTARY'] },
  { id: 'edit_fine_art', category: 'editorial', tags: ['fine-art', 'gallery', 'considered'],
    fragment: 'a considered fine-art sensibility',
    anchor: { darkness: 0.55, intimacy: 0.55, valence: 0.4 },
    techniques: ['SURREAL_PRACTICAL_METAPHOR', 'SILHOUETTE_ATMOSPHERE'] },
  { id: 'edit_documentary', category: 'editorial', tags: ['documentary', 'honest', 'unstyled'],
    fragment: 'honest unstyled documentary framing',
    anchor: { acousticness: 0.55, grit: 0.5, intimacy: 0.5 },
    techniques: ['VINTAGE_FILM_NOSTALGIA', 'FLASH_DOCUMENTARY'] },
  { id: 'edit_luxury', category: 'editorial', tags: ['luxury', 'restraint', 'premium'],
    fragment: 'restrained luxury-campaign minimalism',
    anchor: { brightness: 0.6, intimacy: 0.5, valence: 0.55 },
    techniques: ['STUDIO_SEAMLESS_EDITORIAL', 'MONUMENTAL_SCALE_ISOLATION'] },
]

/** @type {import('../types').VocabularyConcept[]} */
const ART_MEDIUMS = [
  { id: 'medium_photography', category: 'artMedium', tags: ['photo', 'default'],
    fragment: 'a real photograph',
    anchor: { grit: 0.45, brightness: 0.5, energy: 0.5, intimacy: 0.5 },
    // No longer carries a blanket technique bonus (see dna/index.js LAYERS —
    // artMedium now scores like every other layer). Photography still wins
    // the plurality of tracks because most anchors legitimately point at it,
    // but it no longer wins by construction.
  },
  { id: 'medium_riso', category: 'artMedium', tags: ['risograph', 'print', 'illustration'],
    fragment: 'a risograph print illustration with textured ink layers',
    anchor: { valence: 0.6, acousticness: 0.55, energy: 0.4 } },
  { id: 'medium_screenprint', category: 'artMedium', tags: ['screenprint', 'halftone', 'pop'],
    fragment: 'a bold screen-print with flat color blocking and halftone dots',
    anchor: { euphoria: 0.65, valence: 0.65, danceability: 0.6 } },
  { id: 'medium_collage', category: 'artMedium', tags: ['collage', 'mixed-media'],
    fragment: 'a physical mixed-media collage of cut paper and photographs',
    anchor: { grit: 0.6, aggression: 0.5, speechiness: 0.5 } },
  { id: 'medium_oil_texture', category: 'artMedium', tags: ['painterly', 'oil', 'texture'],
    fragment: 'a painterly surface with visible oil-paint impasto texture',
    anchor: { warmth: 0.6, darkness: 0.5, intimacy: 0.55 } },

  // ── Research Module 5 mediums 2 and 3 ────────────────────────────────────
  // Neither declares `techniques`, deliberately: `medium_photography` is the
  // only medium with technique affinity (all 10), which is what keeps
  // photographic realism the default. An illustrated medium must be a
  // decisively better anchor match to win — that restraint is intentional.

  // Module 5 / Medium 2. Research triggers: faded analog texture (vinyl
  // crackle, tape hiss), detuned melodic lines, low-pass filtering, mid-tempo
  // groove. Genres: lo-fi hip-hop, emo rap, hyperpop, synthwave, indie pop —
  // which overlaps the NOSTALGIA archetype's territory almost exactly.
  { id: 'medium_cel_shaded_anime', category: 'artMedium', tags: ['cel-shaded', 'anime', 'comic', 'illustration'],
    fragment: 'a cel-shaded comic illustration with clean ink linework, flat shadow blocks and halftone screentone',
    anchor: { warmth: 0.6, acousticness: 0.5, brightness: 0.35, tempo: 0.42, valence: 0.55 } },
  { id: 'medium_painterly_moody', category: 'artMedium', tags: ['painterly', 'illustration', 'digital-painting', 'moody'],
    fragment: 'a moody digital painting with visible brushwork, soft atmospheric color blending and painted light',
    anchor: { darkness: 0.55, intimacy: 0.6, acousticness: 0.5, valence: 0.4 } },
  { id: 'medium_narrative_illustration', category: 'artMedium', tags: ['illustration', 'environmental', 'scene', 'narrative'],
    fragment: 'a full narrative illustration where the environment itself tells the story, figures small within a detailed painted scene',
    anchor: { warmth: 0.55, valence: 0.55, acousticness: 0.45, energy: 0.4 } },

  // Module 5 / Medium 3. The research names this medium's defining triggers
  // explicitly: "heavy sub-bass energy ratios (>0.40), low spectral flatness
  // scores" (clinically clean digital synthesis, zero organic reverb).
  //
  // Both are now measured, and both are gated by `dspDims`: a track analysed
  // before the DSP pass shipped skips these dimensions entirely rather than
  // defaulting them. That gating is what makes the anchor safe — without it a
  // neutral 0.5 default would sit a perfect distance from a 0.45 anchor and
  // hand CGI free points on evidence the track never carried (measured: it
  // lifted an acoustic ballad's CGI score 0.427 -> 0.517).
  { id: 'medium_3d_cgi', category: 'artMedium', tags: ['3d-cgi', 'cgi', 'render', 'cybernetic'],
    fragment: 'a hyper-glossy 3D render with ray-traced reflections, pristine geometry and emissive neon surfacing',
    anchor: {
      acousticness: 0.12, brightness: 0.75, energy: 0.72, warmth: 0.22,
      subBass: 0.45,          // Module 5: ">0.40"
      spectralFlatness: 0.15, // Module 5: "low spectral flatness scores"
    } },
]

module.exports = { SUBJECT_ARCHETYPES, EDITORIAL_STYLES, ART_MEDIUMS }

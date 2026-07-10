'use strict'
/**
 * VISUAL VOCABULARY — Design domain (knowledge only, no logic).
 * Composition, color harmony systems, environments, graphic treatments and
 * typography safe zones, reverse-engineered from the research + standard
 * graphic-design / cover-art layout theory.
 */

/** @type {import('../types').VocabularyConcept[]} */
const COMPOSITION = [
  { id: 'comp_centered_symmetry', category: 'composition', tags: ['symmetry', 'centered', 'iconic'],
    fragment: 'a symmetrical centered composition with the subject anchored on the vertical axis',
    anchor: { intimacy: 0.55, valence: 0.5, motion: 0.3 },
    techniques: ['MIRROR_DOUBLE_EXPOSURE', 'DUOTONE_COLOR_WASH', 'MACRO_INTIMATE_DETAIL'] },
  { id: 'comp_rule_of_thirds', category: 'composition', tags: ['thirds', 'balanced', 'editorial'],
    fragment: 'the subject placed on a rule-of-thirds line with balanced negative space beside them',
    anchor: { valence: 0.55, energy: 0.5, brightness: 0.55 } },
  { id: 'comp_extreme_closeup', category: 'composition', tags: ['close-up', 'crop', 'detail'],
    fragment: 'an extreme close crop filling the frame with a single feature',
    anchor: { intimacy: 0.8, energy: 0.4 },
    techniques: ['MACRO_INTIMATE_DETAIL'] },
  { id: 'comp_offcenter_negative', category: 'composition', tags: ['asymmetry', 'negative-space', 'tension'],
    fragment: 'an off-center subject pushed to one edge with a dominant field of negative space',
    anchor: { darkness: 0.5, aggression: 0.5, motion: 0.55 },
    techniques: ['FLASH_DOCUMENTARY', 'STUDIO_SEAMLESS_EDITORIAL'] },
  { id: 'comp_monumental_scale', category: 'composition', tags: ['scale', 'tiny-subject', 'isolation'],
    fragment: 'a tiny subject dwarfed at the bottom edge by one massive dominant element filling the frame',
    anchor: { darkness: 0.55, intimacy: 0.4, energy: 0.35 },
    techniques: ['MONUMENTAL_SCALE_ISOLATION', 'SILHOUETTE_ATMOSPHERE'] },
  { id: 'comp_low_angle_hero', category: 'composition', tags: ['low-angle', 'power', 'hero'],
    fragment: 'a low camera angle looking up at the subject for a dominant, heroic stance',
    anchor: { aggression: 0.6, energy: 0.65, euphoria: 0.5 },
    techniques: ['FLASH_DOCUMENTARY', 'STUDIO_SEAMLESS_EDITORIAL'] },
  { id: 'comp_tight_enclosure', category: 'composition', tags: ['claustrophobic', 'enclosed', 'tight'],
    fragment: 'a claustrophobic tight frame with the subject boxed in by enclosing geometry',
    anchor: { darkness: 0.65, intimacy: 0.55, valence: 0.25 },
    techniques: ['SURREAL_PRACTICAL_METAPHOR', 'DUOTONE_COLOR_WASH'] },
]

/** @type {import('../types').VocabularyConcept[]} */
const COLOR_SYSTEMS = [
  { id: 'color_warm_tropical', category: 'color', tags: ['warm', 'saturated', 'tropical'],
    fragment: 'a vibrant warm palette of amber, terracotta and sun-orange with rich saturated accents',
    anchor: { warmth: 0.75, valence: 0.7, brightness: 0.65, euphoria: 0.65 } },
  { id: 'color_muted_earth', category: 'color', tags: ['muted', 'earth', 'neutral'],
    fragment: 'a muted earth-tone palette of olive, clay and warm grey with gentle desaturation',
    anchor: { acousticness: 0.6, warmth: 0.55, energy: 0.4 } },
  { id: 'color_monochrome_dark', category: 'color', tags: ['monochrome', 'dark', 'ink-black'],
    fragment: 'a near-monochrome grade with dense ink-black levels and a single restrained accent',
    anchor: { darkness: 0.75, aggression: 0.55, valence: 0.2 },
    techniques: ['SILHOUETTE_ATMOSPHERE', 'SURREAL_PRACTICAL_METAPHOR'] },
  { id: 'color_duotone_crimson', category: 'color', tags: ['duotone', 'crimson', 'wash'],
    fragment: 'a duotone wash of deep crimson red against obsidian black',
    anchor: { darkness: 0.6, aggression: 0.5, motion: 0.5 },
    techniques: ['DUOTONE_COLOR_WASH'] },
  { id: 'color_duotone_cobalt', category: 'color', tags: ['duotone', 'cobalt', 'night'],
    fragment: 'a cool cobalt-and-indigo duotone wash evoking a night interior',
    anchor: { darkness: 0.6, intimacy: 0.55, valence: 0.35 },
    techniques: ['DUOTONE_COLOR_WASH'] },
  { id: 'color_cross_processed', category: 'color', tags: ['cross-process', 'shifted', 'filmic'],
    fragment: 'a cross-processed grade with cool greenish shadows and warm amber highlights',
    anchor: { motion: 0.5, brightness: 0.5, valence: 0.45 },
    techniques: ['VINTAGE_FILM_NOSTALGIA'] },
  { id: 'color_high_key_pastel', category: 'color', tags: ['pastel', 'bright', 'soft'],
    fragment: 'a soft high-key pastel palette with airy, lifted whites',
    anchor: { euphoria: 0.6, brightness: 0.75, intimacy: 0.5, valence: 0.65 },
    techniques: ['MACRO_INTIMATE_DETAIL', 'STUDIO_SEAMLESS_EDITORIAL'] },
  { id: 'color_bold_seamless', category: 'color', tags: ['bold', 'saturated', 'single-color'],
    fragment: 'one bold saturated seamless color field filling the entire background',
    anchor: { euphoria: 0.65, energy: 0.6, valence: 0.6 },
    techniques: ['STUDIO_SEAMLESS_EDITORIAL'] },
]

/** @type {import('../types').VocabularyConcept[]} */
const ENVIRONMENTS = [
  { id: 'env_seamless_studio', category: 'environment', tags: ['studio', 'seamless', 'clean'],
    fragment: 'a solid seamless-paper studio backdrop with no competing detail',
    anchor: { energy: 0.55, brightness: 0.6, acousticness: 0.3 },
    techniques: ['STUDIO_SEAMLESS_EDITORIAL', 'DUOTONE_COLOR_WASH'] },
  { id: 'env_night_street', category: 'environment', tags: ['street', 'night', 'urban', 'gritty'],
    fragment: 'a night street corner under a flickering lamp with cluttered urban texture',
    anchor: { grit: 0.7, aggression: 0.6, darkness: 0.6 },
    techniques: ['FLASH_DOCUMENTARY'] },
  { id: 'env_car_interior', category: 'environment', tags: ['car', 'interior', 'nostalgic', 'cruising'],
    fragment: 'a worn car interior at dusk, seatbelt and dashboard catching low light',
    anchor: { warmth: 0.6, valence: 0.55, intimacy: 0.55, motion: 0.5 },
    techniques: ['VINTAGE_FILM_NOSTALGIA'] },
  { id: 'env_domestic_room', category: 'environment', tags: ['interior', 'domestic', 'candid', 'lived-in'],
    fragment: 'a lived-in domestic room with scattered real-world props at floor level',
    anchor: { intimacy: 0.6, acousticness: 0.5, energy: 0.45 },
    techniques: ['FLASH_DOCUMENTARY', 'VINTAGE_FILM_NOSTALGIA'] },
  { id: 'env_vast_landscape', category: 'environment', tags: ['landscape', 'horizon', 'empty', 'scale'],
    fragment: 'a vast empty landscape with a flat low horizon and enormous sky',
    anchor: { darkness: 0.45, intimacy: 0.4, energy: 0.3 },
    techniques: ['MONUMENTAL_SCALE_ISOLATION', 'SILHOUETTE_ATMOSPHERE'] },
  { id: 'env_haze_smoke', category: 'environment', tags: ['haze', 'smoke', 'atmosphere'],
    fragment: 'a haze- and smoke-filled void where atmosphere is the only backdrop',
    anchor: { darkness: 0.6, intimacy: 0.45, brightness: 0.4 },
    techniques: ['SILHOUETTE_ATMOSPHERE'] },
  { id: 'env_textile_enclosure', category: 'environment', tags: ['enclosure', 'texture', 'material'],
    fragment: 'walls entirely composed of one repeating material — newsprint, concrete or raw timber — enclosing the subject',
    anchor: { darkness: 0.55, grit: 0.5, intimacy: 0.5 },
    techniques: ['SURREAL_PRACTICAL_METAPHOR', 'DUOTONE_COLOR_WASH'] },
  { id: 'env_brick_exterior', category: 'environment', tags: ['exterior', 'brick', 'stoop', 'documentary'],
    fragment: 'the exterior of a weathered brick building beside a parked car, curb-level and real',
    anchor: { warmth: 0.55, acousticness: 0.5, grit: 0.5 },
    techniques: ['VINTAGE_FILM_NOSTALGIA', 'FLASH_DOCUMENTARY'] },
]

/**
 * Graphic treatments — the print/design surface language.
 * @type {import('../types').VocabularyConcept[]}
 */
const GRAPHIC_TREATMENTS = [
  { id: 'graphic_clean_photo', category: 'graphic', tags: ['photographic', 'unadorned'],
    fragment: 'presented as a straight photograph with no graphic overlay',
    anchor: { brightness: 0.55, grit: 0.35, energy: 0.5, valence: 0.5 },
    // Default graphic treatment — compatible with every technique so niche
    // treatments (mixtape, vinyl, collage) only win on a decisively better match.
    techniques: ['FLASH_DOCUMENTARY', 'VINTAGE_FILM_NOSTALGIA', 'SILHOUETTE_ATMOSPHERE',
      'SURREAL_PRACTICAL_METAPHOR', 'DUOTONE_COLOR_WASH', 'MACRO_INTIMATE_DETAIL',
      'MOTION_BLUR_STROBE', 'MIRROR_DOUBLE_EXPOSURE', 'STUDIO_SEAMLESS_EDITORIAL',
      'MONUMENTAL_SCALE_ISOLATION'] },
  { id: 'graphic_parental_advisory', category: 'graphic', tags: ['mixtape', 'stamp', 'street'],
    fragment: 'a gritty mixtape layout leaving room for a parental-advisory stamp',
    anchor: { grit: 0.75, aggression: 0.7, speechiness: 0.55 },
    techniques: ['FLASH_DOCUMENTARY'] },
  { id: 'graphic_collage', category: 'graphic', tags: ['collage', 'mixed-media', 'cutout'],
    fragment: 'a mixed-media collage feel with torn-edge cut-outs and layered paper',
    anchor: { grit: 0.6, aggression: 0.5, energy: 0.55 } },
  { id: 'graphic_riso_print', category: 'graphic', tags: ['risograph', 'misregistration', 'ink'],
    fragment: 'a risograph screen-print treatment with slight color misregistration and flat ink layers',
    anchor: { warmth: 0.55, valence: 0.6, acousticness: 0.5 } },
  { id: 'graphic_vinyl_sleeve', category: 'graphic', tags: ['vinyl', 'gatefold', 'retro'],
    fragment: 'the framing of a 1970s vinyl gatefold sleeve with soft edge wear',
    anchor: { warmth: 0.6, acousticness: 0.6, energy: 0.4 },
    techniques: ['VINTAGE_FILM_NOSTALGIA'] },
  { id: 'graphic_minimal_luxury', category: 'graphic', tags: ['minimal', 'luxury', 'restraint'],
    fragment: 'a restrained luxury-editorial layout built on emptiness and precision',
    anchor: { intimacy: 0.55, brightness: 0.6, valence: 0.5 },
    techniques: ['STUDIO_SEAMLESS_EDITORIAL', 'MONUMENTAL_SCALE_ISOLATION'] },
]

/**
 * Typography safe zones — where the layout intentionally reserves clean space
 * so a title can be set later. The DNA never renders text; it only preserves
 * the region.
 * @type {import('../types').VocabularyConcept[]}
 */
const TYPOGRAPHY_ZONES = [
  { id: 'type_top_third', category: 'typography', tags: ['top', 'header'],
    fragment: 'clean negative space reserved across the top third for title typography',
    anchor: { darkness: 0.5, energy: 0.5 } },
  { id: 'type_lower_third', category: 'typography', tags: ['lower', 'footer'],
    fragment: 'an uncluttered lower-third band reserved for title and artist typography',
    anchor: { valence: 0.55, intimacy: 0.5 } },
  { id: 'type_left_column', category: 'typography', tags: ['left', 'sidebar'],
    fragment: 'a vertical column of quiet space along one edge for stacked typography',
    anchor: { aggression: 0.5, motion: 0.55 } },
  { id: 'type_center_void', category: 'typography', tags: ['center', 'minimal'],
    fragment: 'a calm central void kept free of detail for centered typography',
    anchor: { intimacy: 0.55, darkness: 0.45 },
    techniques: ['MONUMENTAL_SCALE_ISOLATION'] },
]

module.exports = { COMPOSITION, COLOR_SYSTEMS, ENVIRONMENTS, GRAPHIC_TREATMENTS, TYPOGRAPHY_ZONES }

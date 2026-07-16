'use strict'
/**
 * TECHNIQUE LAYER — FELT's storytelling method.
 *
 * This is the modular home of what used to live inline in generation.js as
 * TECHNIQUE_SUFFIXES. Nothing about the 10 techniques or their FLUX suffixes
 * changed — they are re-exported verbatim so the existing routes keep behaving
 * identically. What's NEW is that each technique now also declares how it
 * SOFT-BIASES the Visual DNA:
 *
 *   - `dnaBias`: a small additive nudge to specific music signals before the
 *     DNA scores vocabulary (e.g. a duotone story leans the color layer darker),
 *     never a hard override.
 *
 * The technique still NEVER picks cameras/lenses/lighting/etc. directly — it
 * only tilts the reasoning. The Visual DNA Engine makes the actual selections,
 * and any vocabulary concept that lists this technique gets a scoring bonus
 * (see scoring.js `techniqueBonus`).
 */

/** @type {Record<string, { suffix: string, dnaBias: Record<string, number> }>} */
// NOTE on `suffix` (see Fix 3): the suffix must add exactly ONE thing the DNA
// fragments do NOT already emit. Camera bodies, lighting setups, colour, grain
// and composition are all stated by their own DNA layers — repeating them here
// meant the same instruction appeared twice in one prompt. Each suffix below is
// now the single idea only the technique knows: what KIND of act the photograph
// was. Any suffix that claims "film" is only used where the technique's
// filmStock affinity is an actual film stock (never where digital may be picked).
const TECHNIQUES = {
  FLASH_DOCUMENTARY: {
    suffix: 'An unstaged frame — the kind a friend takes at 2am, nothing arranged for the camera.',
    dnaBias: { grit: +0.12, energy: +0.08 },
  },
  VINTAGE_FILM_NOSTALGIA: {
    suffix: 'A real film photograph that has physically aged, not a digital imitation of film.',
    dnaBias: { warmth: +0.12, acousticness: +0.08 },
  },
  SILHOUETTE_ATMOSPHERE: {
    suffix: 'The light source, not the face, is the subject of the photograph.',
    dnaBias: { darkness: +0.12, intimacy: +0.05 },
  },
  SURREAL_PRACTICAL_METAPHOR: {
    suffix: 'The impossible element is a real prop, physically built and shot in camera.',
    dnaBias: { darkness: +0.08, aggression: +0.06 },
  },
  DUOTONE_COLOR_WASH: {
    suffix: 'The colour lives in the emulsion of a real print, not a flat digital filter laid on top.',
    dnaBias: { darkness: +0.10, intimacy: +0.06 },
  },
  MACRO_INTIMATE_DETAIL: {
    suffix: 'Uncomfortably close and completely unretouched.',
    dnaBias: { intimacy: +0.15 },
  },
  MOTION_BLUR_STROBE: {
    suffix: 'The blur is a real long-exposure artifact of the moment, not an added effect.',
    dnaBias: { motion: +0.15, danceability: +0.06 },
  },
  MIRROR_DOUBLE_EXPOSURE: {
    suffix: 'Both layers were exposed onto the same physical frame in camera.',
    dnaBias: { darkness: +0.06, intimacy: +0.06 },
  },
  STUDIO_SEAMLESS_EDITORIAL: {
    suffix: 'A real physical studio shoot, nothing retouched afterward.',
    dnaBias: { euphoria: +0.08, brightness: +0.06 },
  },
  MONUMENTAL_SCALE_ISOLATION: {
    suffix: 'Real atmospheric haze separates the layers of distance.',
    dnaBias: { darkness: +0.06, intimacy: +0.04, energy: -0.06 },
  },
}

// Fallback technique when the model returns none. Deliberately NOT a silhouette
// technique — silhouettes hide identity and are the main cause of generic
// fallbacks. DUOTONE reveals a lit face while staying moody and scene-flexible.
const DEFAULT_TECHNIQUE = 'DUOTONE_COLOR_WASH'

// Techniques that intentionally hide the face. Everything else must keep the
// subject's face lit and readable (enforced by the Reality Engine tail).
const SILHOUETTE_TECHNIQUES = new Set(['SILHOUETTE_ATMOSPHERE', 'MONUMENTAL_SCALE_ISOLATION'])
function techniqueHidesFace(name) {
  return SILHOUETTE_TECHNIQUES.has(name)
}

/**
 * ART-DIRECTION AFFINITY — each technique behaves like a creative director,
 * naming the vocabulary it wants per layer so camera + lens + film + lighting +
 * composition + color + motion + texture all speak ONE photographic language.
 * The scoring engine gives these a strong (still soft) bonus; the anchor still
 * chooses AMONG a technique's preferred set, so different songs diverge.
 * @type {Record<string, Record<string, string[]>>}
 */
const TECHNIQUE_AFFINITY = {
  FLASH_DOCUMENTARY: {
    camera: ['cam_35mm_point_shoot', 'cam_disposable'], lens: ['lens_35mm_hyperfocal', 'lens_50mm_f14'],
    lighting: ['light_direct_flash', 'light_practical_haze'], composition: ['comp_offcenter_negative', 'comp_low_angle_hero'],
    motion: ['motion_freeze', 'motion_strobe_freeze'], texture: ['tex_heavy_grain', 'tex_fine_film_grain'],
    color: ['color_warm_tropical', 'color_muted_earth'], postProcessing: ['post_huji_filter', 'post_light_leak'],
    // candid/unstyled editorial agrees with the off-center, low-angle framing
    editorial: ['edit_street', 'edit_documentary'],
    // a staged symbolic object would contradict "nothing arranged for the camera"
    symbolism: ['sym_none'],
  },
  VINTAGE_FILM_NOSTALGIA: {
    camera: ['cam_mamiya_rz67', 'cam_leica_m10'], lens: ['lens_110mm_f35', 'lens_50mm_f14'],
    filmStock: ['film_portra_400', 'film_gold_200'], lighting: ['light_golden_hour', 'light_north_window'],
    composition: ['comp_rule_of_thirds'], motion: ['motion_still_meditative', 'motion_freeze'],
    texture: ['tex_dust_scratches', 'tex_fine_film_grain'],
    // Fix 2: dropped color_cross_processed — its "cool greenish shadows" fought
    // film_gold_200's "lifted amber shadows" (two claims about shadow colour).
    color: ['color_muted_earth'],
    postProcessing: ['post_light_leak', 'post_huji_filter'],
    editorial: ['edit_documentary'],
    symbolism: ['sym_none'],
  },
  SILHOUETTE_ATMOSPHERE: {
    camera: ['cam_anamorphic_cine'], lens: ['lens_24mm_wide', 'lens_85mm_portrait'],
    lighting: ['light_rim_backlight', 'light_spotlight_halo'], composition: ['comp_monumental_scale', 'comp_offcenter_negative'],
    color: ['color_monochrome_dark', 'color_duotone_cobalt'], texture: ['tex_fine_film_grain'], postProcessing: ['post_vignette'],
    editorial: ['edit_fine_art', 'edit_luxury'],
    symbolism: ['sym_monolith', 'sym_solar_halo'],
  },
  SURREAL_PRACTICAL_METAPHOR: {
    camera: ['cam_35mm_point_shoot', 'cam_hasselblad_h6d'], lens: ['lens_80mm_f28'],
    lighting: ['light_chiaroscuro', 'light_direct_flash'], composition: ['comp_tight_enclosure', 'comp_centered_symmetry'],
    filmStock: ['film_trix_400'], texture: ['tex_heavy_grain'], color: ['color_monochrome_dark'],
    // fine-art agrees with the deliberately staged, centered/enclosed framing
    editorial: ['edit_fine_art'],
    // the staged physical object IS this technique's identity
    symbolism: ['sym_piercing_object'],
  },
  DUOTONE_COLOR_WASH: {
    camera: ['cam_leica_m10', 'cam_anamorphic_cine'], lens: ['lens_85mm_portrait', 'lens_50mm_f14'],
    lighting: ['light_single_gel', 'light_spotlight_halo'], filmStock: ['film_cinestill_800t'],
    composition: ['comp_centered_symmetry', 'comp_extreme_closeup'],
    // Fix 2: dropped color_duotone_cobalt — a cool blue wash contradicted
    // film_cinestill_800t's warm tungsten palette / red halation. Crimson agrees
    // with it. (Cobalt remains available under SILHOUETTE and MIRROR.)
    color: ['color_duotone_crimson'],
    motion: ['motion_still_meditative'], postProcessing: ['post_vignette'],
    // Fix 1: was picking edit_documentary ("unstyled/candid") against
    // comp_centered_symmetry ("symmetrical centered") — opposite approaches.
    editorial: ['edit_fine_art', 'edit_luxury'],
    symbolism: ['sym_none'],
  },
  MACRO_INTIMATE_DETAIL: {
    camera: ['cam_hasselblad_h6d', 'cam_mamiya_rz67'], lens: ['lens_100mm_macro', 'lens_85mm_portrait'],
    lighting: ['light_north_window', 'light_high_key_wrap'], composition: ['comp_extreme_closeup'],
    texture: ['tex_clean_detail'], color: ['color_high_key_pastel', 'color_muted_earth'], motion: ['motion_still_meditative'],
    editorial: ['edit_fine_art', 'edit_luxury'],
    symbolism: ['sym_none'],
  },
  MOTION_BLUR_STROBE: {
    camera: ['cam_leica_m10'], lens: ['lens_50mm_f14', 'lens_35mm_hyperfocal'],
    lighting: ['light_direct_flash', 'light_practical_haze'], composition: ['comp_offcenter_negative', 'comp_low_angle_hero'],
    motion: ['motion_shutter_drag', 'motion_strobe_freeze'], texture: ['tex_fine_film_grain'],
    color: ['color_warm_tropical', 'color_duotone_crimson'], postProcessing: ['post_light_leak'],
    editorial: ['edit_fashion', 'edit_street'],
    symbolism: ['sym_none'],
  },
  MIRROR_DOUBLE_EXPOSURE: {
    camera: ['cam_leica_m10', 'cam_hasselblad_h6d'], lens: ['lens_85mm_portrait', 'lens_50mm_f14'],
    lighting: ['light_chiaroscuro', 'light_single_gel'], composition: ['comp_centered_symmetry'],
    motion: ['motion_double_exposure'],
    // Fix 2: dropped color_cross_processed — its two-hue shift ("greenish
    // shadows AND warm amber highlights") fought light_single_gel's "one
    // dominant hue". Both remaining options are single-hue/near-mono.
    color: ['color_duotone_cobalt', 'color_monochrome_dark'],
    postProcessing: ['post_scan_glitch'],
    editorial: ['edit_fine_art'],
    symbolism: ['sym_mirror_self'],
  },
  STUDIO_SEAMLESS_EDITORIAL: {
    camera: ['cam_hasselblad_h6d', 'cam_leica_m10'], lens: ['lens_85mm_portrait', 'lens_80mm_f28'],
    lighting: ['light_high_key_wrap', 'light_direct_flash', 'light_spotlight_halo'],
    composition: ['comp_centered_symmetry', 'comp_offcenter_negative'], filmStock: ['film_ektachrome', 'film_digital_clean'],
    // Fix 2: dropped color_high_key_pastel — "soft airy pastel" fought
    // film_ektachrome's "punchy, clean primaries" saturation.
    color: ['color_bold_seamless'],
    texture: ['tex_clean_detail'], postProcessing: ['post_none'],
    editorial: ['edit_fashion', 'edit_luxury'],
    symbolism: ['sym_none'],
  },
  MONUMENTAL_SCALE_ISOLATION: {
    camera: ['cam_anamorphic_cine'], lens: ['lens_24mm_wide'],
    lighting: ['light_golden_hour', 'light_rim_backlight'], composition: ['comp_monumental_scale'],
    color: ['color_muted_earth', 'color_monochrome_dark'], motion: ['motion_still_meditative'], texture: ['tex_fine_film_grain'],
    editorial: ['edit_fine_art', 'edit_luxury'],
    symbolism: ['sym_monolith', 'sym_open_road'],
  },
}

/** Preferred concept ids for one technique + layer (empty if none). */
function getAffinity(name, layerKey) {
  const profile = TECHNIQUE_AFFINITY[name] || TECHNIQUE_AFFINITY[DEFAULT_TECHNIQUE] || {}
  return profile[layerKey] || []
}

// Backward-compatible flat map: exactly the old TECHNIQUE_SUFFIXES shape so the
// existing parse/build helpers in generation.js can import it unchanged.
const TECHNIQUE_SUFFIXES = Object.fromEntries(
  Object.entries(TECHNIQUES).map(([name, t]) => [name, t.suffix])
)

function isValidTechnique(name) {
  return Object.prototype.hasOwnProperty.call(TECHNIQUES, name)
}

function getSuffix(name) {
  return (TECHNIQUES[name] || TECHNIQUES[DEFAULT_TECHNIQUE]).suffix
}

function getDnaBias(name) {
  return (TECHNIQUES[name] || TECHNIQUES[DEFAULT_TECHNIQUE]).dnaBias || {}
}

/**
 * Applies a technique's soft bias to a copy of the feature vector. Bounded to
 * 0..1 so a bias can nudge but never invert a signal. Pure — returns a new
 * vector, leaving the DNA's canonical vector intact for storage/debug.
 */
function applyTechniqueBias(vector, techniqueName) {
  const bias = getDnaBias(techniqueName)
  const biased = { ...vector, meta: vector.meta }
  for (const [dim, delta] of Object.entries(bias)) {
    if (typeof biased[dim] === 'number') {
      biased[dim] = Math.max(0, Math.min(1, biased[dim] + delta))
    }
  }
  return biased
}

module.exports = {
  TECHNIQUES,
  TECHNIQUE_SUFFIXES,
  TECHNIQUE_AFFINITY,
  DEFAULT_TECHNIQUE,
  isValidTechnique,
  getSuffix,
  getDnaBias,
  getAffinity,
  techniqueHidesFace,
  applyTechniqueBias,
}

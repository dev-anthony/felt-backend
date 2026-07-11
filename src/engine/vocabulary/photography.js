'use strict'
/**
 * VISUAL VOCABULARY — Photographic domain (knowledge only, no logic).
 *
 * Every entry is a reusable concept reverse-engineered from the FELT research
 * (camera rigs, film stocks, lighting matrices, motion techniques, anti-AI
 * texture notes) — NOT a stored prompt. `anchor` encodes the music signals the
 * concept naturally expresses so the Visual DNA Engine can select it; `fragment`
 * is the camera-crew-grade phrase it contributes to the final FLUX prompt.
 *
 * anchors speak in the 0..1 signals from featureVector.js (raw + derived).
 */

/** @type {import('../types').VocabularyConcept[]} */
const CAMERAS = [
  { id: 'cam_hasselblad_h6d', category: 'camera', tags: ['medium-format', 'crisp', 'editorial', 'clean'],
    fragment: 'shot on a Hasselblad H6D-100c medium-format camera',
    anchor: { grit: 0.2, brightness: 0.65, energy: 0.55, acousticness: 0.35 },
    techniques: ['STUDIO_SEAMLESS_EDITORIAL', 'MACRO_INTIMATE_DETAIL'], source: 'research: premium clean rig' },
  { id: 'cam_leica_m10', category: 'camera', tags: ['analog', 'rangefinder', 'street', 'organic'],
    fragment: 'shot on a Leica M10 rangefinder',
    anchor: { motion: 0.7, danceability: 0.7, energy: 0.6, grit: 0.5 },
    techniques: ['MOTION_BLUR_STROBE', 'FLASH_DOCUMENTARY'], source: 'research: motion / afro-pop rig' },
  { id: 'cam_mamiya_rz67', category: 'camera', tags: ['medium-format', 'film', 'vintage', 'soft'],
    fragment: 'shot on a vintage Mamiya RZ67 medium-format film camera',
    anchor: { acousticness: 0.7, energy: 0.3, warmth: 0.65, intimacy: 0.6 },
    techniques: ['VINTAGE_FILM_NOSTALGIA', 'MACRO_INTIMATE_DETAIL'], source: 'research: vintage soul rig' },
  { id: 'cam_35mm_point_shoot', category: 'camera', tags: ['35mm', 'gritty', 'flash', 'street', 'compact'],
    fragment: 'shot on a rugged 35mm point-and-shoot compact',
    anchor: { grit: 0.75, aggression: 0.65, energy: 0.7, acousticness: 0.15 },
    techniques: ['FLASH_DOCUMENTARY', 'STUDIO_SEAMLESS_EDITORIAL'], source: 'research: gritty/trap rig' },
  { id: 'cam_disposable', category: 'camera', tags: ['disposable', 'candid', 'lofi', 'party'],
    fragment: 'shot on a single-use disposable film camera',
    anchor: { euphoria: 0.7, danceability: 0.65, grit: 0.55, energy: 0.6 },
    techniques: ['FLASH_DOCUMENTARY', 'VINTAGE_FILM_NOSTALGIA'], source: 'research: 2am party photo aesthetic' },
  { id: 'cam_anamorphic_cine', category: 'camera', tags: ['cinema', 'anamorphic', 'wide', 'atmospheric'],
    fragment: 'shot on an anamorphic cinema lens with horizontal flare',
    anchor: { darkness: 0.6, intimacy: 0.45, brightness: 0.4 },
    techniques: ['SILHOUETTE_ATMOSPHERE', 'MONUMENTAL_SCALE_ISOLATION'], source: 'research: cinematic anamorphic' },
]

/** @type {import('../types').VocabularyConcept[]} */
const LENSES = [
  { id: 'lens_80mm_f28', category: 'lens', tags: ['normal', 'clean', 'portrait'],
    fragment: '80mm prime lens at f/2.8 with a sharp focal plane',
    anchor: { brightness: 0.6, energy: 0.55, grit: 0.25 } },
  { id: 'lens_50mm_f14', category: 'lens', tags: ['fast', 'organic', 'edge-falloff'],
    fragment: '50mm lens wide open at f/1.4 with organic vintage edge falloff',
    anchor: { motion: 0.65, intimacy: 0.5, danceability: 0.6 },
    techniques: ['MOTION_BLUR_STROBE', 'MACRO_INTIMATE_DETAIL'] },
  { id: 'lens_85mm_portrait', category: 'lens', tags: ['portrait', 'telephoto', 'bokeh', 'flattering'],
    fragment: '85mm portrait lens at f/1.4, shallow depth of field, creamy background bokeh and flattering facial compression',
    anchor: { intimacy: 0.55, warmth: 0.5, valence: 0.5, brightness: 0.5 },
    techniques: ['STUDIO_SEAMLESS_EDITORIAL', 'MACRO_INTIMATE_DETAIL', 'DUOTONE_COLOR_WASH', 'SILHOUETTE_ATMOSPHERE'],
    source: 'research: /PROMT reference — 85mm, soft bokeh, shallow DOF editorial portrait' },
  { id: 'lens_110mm_f35', category: 'lens', tags: ['short-tele', 'soft', 'medium-format'],
    fragment: '110mm lens at f/3.5 with soft rolling-focus bokeh',
    anchor: { acousticness: 0.65, intimacy: 0.6, energy: 0.3 } },
  { id: 'lens_35mm_hyperfocal', category: 'lens', tags: ['wide-normal', 'deep-focus', 'documentary'],
    fragment: '35mm lens set to hyperfocal distance, everything in gritty focus',
    anchor: { grit: 0.7, energy: 0.65, aggression: 0.55 },
    techniques: ['FLASH_DOCUMENTARY'] },
  { id: 'lens_24mm_wide', category: 'lens', tags: ['wide', 'scale', 'environmental'],
    fragment: '24mm wide lens exaggerating the scale of the environment',
    anchor: { darkness: 0.5, intimacy: 0.35, brightness: 0.45 },
    techniques: ['MONUMENTAL_SCALE_ISOLATION', 'SILHOUETTE_ATMOSPHERE'] },
  { id: 'lens_100mm_macro', category: 'lens', tags: ['macro', 'detail', 'shallow'],
    fragment: '100mm macro lens with razor-thin depth of field and soft falloff',
    anchor: { intimacy: 0.8, acousticness: 0.55, energy: 0.3 },
    techniques: ['MACRO_INTIMATE_DETAIL'] },
]

/** @type {import('../types').VocabularyConcept[]} */
const FILM_STOCKS = [
  { id: 'film_portra_400', category: 'filmStock', tags: ['warm', 'natural-skin', 'analog'],
    fragment: 'Kodak Portra 400 color rendition with warm, true skin tones',
    anchor: { warmth: 0.7, acousticness: 0.55, valence: 0.6 },
    techniques: ['VINTAGE_FILM_NOSTALGIA'] },
  { id: 'film_cinestill_800t', category: 'filmStock', tags: ['tungsten', 'night', 'halation'],
    fragment: 'CineStill 800T tungsten palette with red halation blooming around lights',
    anchor: { darkness: 0.6, brightness: 0.45, motion: 0.5 },
    techniques: ['DUOTONE_COLOR_WASH', 'SILHOUETTE_ATMOSPHERE'] },
  { id: 'film_trix_400', category: 'filmStock', tags: ['b&w', 'grainy', 'contrast', 'gritty'],
    fragment: 'high-contrast Kodak Tri-X 400 black-and-white with coarse grain',
    anchor: { grit: 0.7, aggression: 0.6, darkness: 0.55, scaleMajor: 0.2 },
    techniques: ['FLASH_DOCUMENTARY', 'SURREAL_PRACTICAL_METAPHOR'] },
  { id: 'film_ektachrome', category: 'filmStock', tags: ['slide', 'saturated', 'punchy'],
    fragment: 'Ektachrome slide-film saturation with punchy, clean primaries',
    anchor: { euphoria: 0.7, brightness: 0.7, valence: 0.7 },
    techniques: ['STUDIO_SEAMLESS_EDITORIAL'] },
  { id: 'film_gold_200', category: 'filmStock', tags: ['warm', 'nostalgic', 'consumer'],
    fragment: 'Kodak Gold 200 nostalgic warm cast with lifted amber shadows',
    anchor: { warmth: 0.65, valence: 0.6, energy: 0.45 },
    techniques: ['VINTAGE_FILM_NOSTALGIA', 'FLASH_DOCUMENTARY'] },
  { id: 'film_digital_clean', category: 'filmStock', tags: ['digital', 'clean', 'sharp'],
    fragment: 'clean digital medium-format capture with fine un-airbrushed detail',
    anchor: { brightness: 0.65, energy: 0.55, acousticness: 0.3, grit: 0.2 },
    techniques: ['STUDIO_SEAMLESS_EDITORIAL', 'MACRO_INTIMATE_DETAIL'] },
]

/**
 * Lighting concepts are written as real photographic SETUPS — key direction,
 * fill, rim/edge, practicals, gel, haze and where the catchlight lands — because
 * naming an actual lighting diagram (not "warm light") is what separates a
 * studio photograph from a generic AI render. Each keeps ONE coherent key so the
 * shadows never contradict.
 * @type {import('../types').VocabularyConcept[]}
 */
const LIGHTING = [
  { id: 'light_direct_flash', category: 'lighting', tags: ['flash', 'hard', 'overexposed'],
    fragment: 'harsh direct on-camera flash, slightly overexposed skin highlights, a hard graphic shadow cast on the wall behind, a sharp specular catchlight in the eyes',
    anchor: { grit: 0.7, aggression: 0.6, energy: 0.7, euphoria: 0.5 },
    techniques: ['FLASH_DOCUMENTARY', 'STUDIO_SEAMLESS_EDITORIAL'] },
  { id: 'light_chiaroscuro', category: 'lighting', tags: ['low-key', 'dramatic', 'contrast', 'rim'],
    fragment: 'dramatic low-key chiaroscuro: a single hard key from one side, deep shadow falloff across the face, a crisp rim light peeling the subject off a near-black background, and a bright catchlight in the eyes',
    anchor: { darkness: 0.75, valence: 0.25, intimacy: 0.55 },
    techniques: ['SILHOUETTE_ATMOSPHERE', 'SURREAL_PRACTICAL_METAPHOR', 'DUOTONE_COLOR_WASH'] },
  { id: 'light_high_key_wrap', category: 'lighting', tags: ['high-key', 'soft', 'bright'],
    fragment: 'a large soft key from camera-left with gentle fill for an airy high-key wrap, clean bright reflections and soft catchlights in the eyes',
    anchor: { euphoria: 0.7, brightness: 0.75, valence: 0.7 },
    techniques: ['STUDIO_SEAMLESS_EDITORIAL'] },
  { id: 'light_golden_hour', category: 'lighting', tags: ['warm', 'natural', 'directional'],
    fragment: 'warm low golden-hour sun raking across the subject from the side, long soft shadows and a warm catchlight in the eyes',
    anchor: { warmth: 0.75, valence: 0.65, brightness: 0.6 },
    techniques: ['VINTAGE_FILM_NOSTALGIA', 'MONUMENTAL_SCALE_ISOLATION'] },
  { id: 'light_north_window', category: 'lighting', tags: ['soft', 'diffuse', 'natural'],
    fragment: 'soft diffused north-window daylight from camera-left, gentle wrap-around shadows and a soft catchlight in the eyes',
    anchor: { intimacy: 0.6, acousticness: 0.6, energy: 0.35 },
    techniques: ['MACRO_INTIMATE_DETAIL', 'VINTAGE_FILM_NOSTALGIA'] },
  { id: 'light_rim_backlight', category: 'lighting', tags: ['rim', 'backlight', 'silhouette'],
    fragment: 'a strong rim/edge backlight tracing the subject against a hazy background, minimal ambient fill, deep crushed shadow on the face',
    anchor: { darkness: 0.6, intimacy: 0.4, brightness: 0.4 },
    techniques: ['SILHOUETTE_ATMOSPHERE', 'MONUMENTAL_SCALE_ISOLATION'] },
  { id: 'light_spotlight_halo', category: 'lighting', tags: ['spotlight', 'projection', 'halo', 'circular', 'gel'],
    // Learned as a CONCEPT (a projected spotlight halo behind the head), not a
    // copy of the reference's orange — the hue is left to the color DNA layer so
    // a cold song gets a cold halo and a warm song a warm one.
    fragment: 'a gelled key colored to the scene palette, a circular spotlight projected on the wall behind the head forming a glowing halo disc in that same colour, dramatic chiaroscuro on the face, a soft rim light and a bright catchlight in the eyes',
    anchor: { darkness: 0.5, valence: 0.4, intimacy: 0.5, brightness: 0.4 },
    techniques: ['SILHOUETTE_ATMOSPHERE', 'STUDIO_SEAMLESS_EDITORIAL', 'DUOTONE_COLOR_WASH'],
    source: 'research: /PROMT + Tems sun-orb halo reference — concept (projected halo + gel + rim + catchlight), hue left to the palette' },
  { id: 'light_practical_haze', category: 'lighting', tags: ['practical', 'club', 'haze', 'volumetric', 'night'],
    fragment: 'glowing practical bulbs behind the subject, one soft key from camera-left, atmospheric haze catching volumetric light beams, an edge light outlining the figure',
    anchor: { darkness: 0.55, motion: 0.5, intimacy: 0.45 },
    techniques: ['DUOTONE_COLOR_WASH', 'SILHOUETTE_ATMOSPHERE', 'FLASH_DOCUMENTARY'],
    source: 'research: nightlife practical + volumetric haze lighting diagram' },
  { id: 'light_single_gel', category: 'lighting', tags: ['gel', 'colored', 'moody'],
    fragment: 'the frame lit through a single colored gel for one dominant hue, a contrasting rim of color separating the subject from the background',
    anchor: { darkness: 0.55, intimacy: 0.45, motion: 0.4 },
    techniques: ['DUOTONE_COLOR_WASH'] },
]

/** @type {import('../types').VocabularyConcept[]} */
const MOTION = [
  { id: 'motion_freeze', category: 'motion', tags: ['sharp', 'frozen', 'still'],
    fragment: 'tack-sharp frozen instant, no motion blur',
    anchor: { motion: 0.2, energy: 0.4, danceability: 0.3 } },
  { id: 'motion_shutter_drag', category: 'motion', tags: ['long-exposure', 'blur-trails', 'rhythm'],
    fragment: 'shutter-drag technique, a 1/15s long exposure trailing organic horizontal motion blur across the subject',
    anchor: { motion: 0.8, danceability: 0.75, energy: 0.6 },
    techniques: ['MOTION_BLUR_STROBE'],
    source: 'research: Tems shutter-drag editorial motion' },
  { id: 'motion_strobe_freeze', category: 'motion', tags: ['strobe', 'blur+sharp', 'mania'],
    fragment: 'a slow shutter with one strobe pop, directional blur trails frozen at a single sharp instant',
    anchor: { motion: 0.7, aggression: 0.6, energy: 0.7 },
    techniques: ['MOTION_BLUR_STROBE'] },
  { id: 'motion_double_exposure', category: 'motion', tags: ['double-exposure', 'ghosting', 'duality'],
    fragment: 'a real in-camera double exposure, the second layer slightly misaligned and ghosted',
    anchor: { darkness: 0.5, intimacy: 0.5, motion: 0.4 },
    techniques: ['MIRROR_DOUBLE_EXPOSURE'] },
  { id: 'motion_still_meditative', category: 'motion', tags: ['static', 'calm', 'serene'],
    fragment: 'complete stillness, a calm slow-exposure with the subject perfectly motionless',
    anchor: { intimacy: 0.65, energy: 0.25, motion: 0.2 },
    techniques: ['MONUMENTAL_SCALE_ISOLATION', 'MACRO_INTIMATE_DETAIL'] },
]

/** @type {import('../types').VocabularyConcept[]} */
const TEXTURE = [
  { id: 'tex_fine_film_grain', category: 'texture', tags: ['grain', 'analog', 'fine'],
    fragment: 'fine visible 35mm film grain throughout',
    anchor: { acousticness: 0.5, grit: 0.45, warmth: 0.5 } },
  { id: 'tex_heavy_grain', category: 'texture', tags: ['grain', 'coarse', 'gritty'],
    fragment: 'heavy coarse film grain and lifted blacks',
    anchor: { grit: 0.75, aggression: 0.6, darkness: 0.55 },
    techniques: ['FLASH_DOCUMENTARY', 'SURREAL_PRACTICAL_METAPHOR'] },
  { id: 'tex_xerox_halftone', category: 'texture', tags: ['xerox', 'photocopy', 'halftone', 'ink'],
    fragment: 'coarse high-contrast xerox photocopy grain with subtle ink bleed and a halftone dot pattern',
    anchor: { grit: 0.8, aggression: 0.7, speechiness: 0.6 },
    techniques: ['FLASH_DOCUMENTARY'],
    source: 'research: parental-advisory / mixtape xerox texture' },
  { id: 'tex_dust_scratches', category: 'texture', tags: ['dust', 'scratches', 'wear', 'analog'],
    fragment: 'subtle dust, hairline scratches and paper-tooth texture as if scanned from an old print',
    anchor: { acousticness: 0.65, warmth: 0.55, energy: 0.35 },
    techniques: ['VINTAGE_FILM_NOSTALGIA'] },
  { id: 'tex_clean_detail', category: 'texture', tags: ['clean', 'detail', 'pores'],
    fragment: 'pristine sensor clarity resolving real un-airbrushed skin pores and textile weave',
    anchor: { brightness: 0.65, grit: 0.2, intimacy: 0.5 },
    techniques: ['MACRO_INTIMATE_DETAIL', 'STUDIO_SEAMLESS_EDITORIAL'] },
]

/** @type {import('../types').VocabularyConcept[]} */
const POST_PROCESSING = [
  { id: 'post_light_leak', category: 'postProcessing', tags: ['light-leak', 'overlay', 'analog-edit'],
    fragment: 'a translucent circular light-leak ghost applied as a visible edit pass on top of the photo',
    anchor: { warmth: 0.6, valence: 0.55, motion: 0.45 },
    techniques: ['VINTAGE_FILM_NOSTALGIA', 'FLASH_DOCUMENTARY'] },
  { id: 'post_vignette', category: 'postProcessing', tags: ['vignette', 'uneven', 'edit'],
    fragment: 'a subtle uneven vignette darkening the frame edges',
    anchor: { darkness: 0.55, intimacy: 0.5 },
    techniques: ['SILHOUETTE_ATMOSPHERE', 'DUOTONE_COLOR_WASH'] },
  { id: 'post_huji_filter', category: 'postProcessing', tags: ['app-filter', 'retro', 'date-stamp'],
    fragment: 'an all-over retro camera-app color shift like a Huji/disposable filter, faint and obviously applied afterward',
    anchor: { euphoria: 0.6, danceability: 0.6, warmth: 0.55 },
    techniques: ['FLASH_DOCUMENTARY', 'VINTAGE_FILM_NOSTALGIA'] },
  { id: 'post_scan_glitch', category: 'postProcessing', tags: ['scanline', 'glitch', 'distortion'],
    fragment: 'faint scan-line artifacts and a hint of glitch distortion sitting on top of the image',
    anchor: { aggression: 0.55, brightness: 0.55, motion: 0.5 },
    techniques: ['DUOTONE_COLOR_WASH', 'MIRROR_DOUBLE_EXPOSURE'] },
  { id: 'post_none', category: 'postProcessing', tags: ['clean', 'in-camera'],
    fragment: 'clean in-camera finish with no added overlay',
    anchor: { brightness: 0.6, grit: 0.25, energy: 0.5 },
    techniques: ['STUDIO_SEAMLESS_EDITORIAL', 'MACRO_INTIMATE_DETAIL'] },
]

module.exports = { CAMERAS, LENSES, FILM_STOCKS, LIGHTING, MOTION, TEXTURE, POST_PROCESSING }

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
  { id: 'cam_drone_orthographic', category: 'camera', tags: ['drone', 'aerial', 'overhead', 'orthographic'],
    fragment: 'shot from a drone directly overhead, a true ninety-degree orthographic view with zero perspective distortion',
    anchor: { intimacy: 0.15, brightness: 0.55, energy: 0.4, grit: 0.25 },
    techniques: ['AERIAL_TOP_DOWN'], source: 'FELT technique library v2: orthographic overhead rig' },
  { id: 'cam_thermal_sensor', category: 'camera', tags: ['thermal', 'infrared', 'sensor', 'surveillance'],
    fragment: 'captured on a thermal-imaging sensor rather than a conventional lens',
    anchor: { darkness: 0.7, aggression: 0.45, intimacy: 0.1, valence: 0.2 },
    techniques: ['INFRARED_THERMAL'], source: 'FELT technique library v2: infrared/thermal rig' },
]

/** @type {import('../types').VocabularyConcept[]} */
const LENSES = [
  { id: 'lens_80mm_f28', category: 'lens', tags: ['normal', 'clean', 'portrait'],
    fragment: '80mm prime lens at f/2.8 with a sharp focal plane',
    anchor: { brightness: 0.6, energy: 0.55, grit: 0.25 } },
  { id: 'lens_50mm_f14', category: 'lens', tags: ['fast', 'organic', 'edge-falloff'],
    fragment: '50mm lens wide open at f/1.4 with organic vintage edge falloff',
    // Eq 1: f/1.4 is the shallow pole -> low spectral centroid.
    anchor: { motion: 0.65, intimacy: 0.5, danceability: 0.6, brightness: 0.30 },
    techniques: ['MOTION_BLUR_STROBE', 'MACRO_INTIMATE_DETAIL'] },
  { id: 'lens_85mm_portrait', category: 'lens', tags: ['portrait', 'telephoto', 'bokeh', 'flattering'],
    fragment: '85mm portrait lens at f/1.4, shallow depth of field, creamy background bokeh and flattering facial compression',
    noPeopleFragment: '85mm portrait lens at f/1.4, shallow depth of field, creamy background bokeh compressing the object\'s own surface detail into sharp, isolated focus',
    anchor: { intimacy: 0.55, warmth: 0.5, valence: 0.5, brightness: 0.5 },
    techniques: ['STUDIO_SEAMLESS_EDITORIAL', 'MACRO_INTIMATE_DETAIL', 'DUOTONE_COLOR_WASH', 'SILHOUETTE_ATMOSPHERE'],
    source: 'research: /PROMT reference — 85mm, soft bokeh, shallow DOF editorial portrait' },
  { id: 'lens_110mm_f35', category: 'lens', tags: ['short-tele', 'soft', 'medium-format'],
    fragment: '110mm lens at f/3.5 with soft rolling-focus bokeh',
    // Eq 1: f/3.5 sits between the shallow and deep poles.
    anchor: { acousticness: 0.65, intimacy: 0.6, energy: 0.3, brightness: 0.42 } },
  { id: 'lens_35mm_hyperfocal', category: 'lens', tags: ['wide-normal', 'deep-focus', 'documentary'],
    fragment: '35mm lens set to hyperfocal distance, everything in gritty focus',
    // Eq 1: hyperfocal is f/8-f/11, the deep-focus pole -> high centroid.
    anchor: { grit: 0.7, energy: 0.65, aggression: 0.55, brightness: 0.80 },
    techniques: ['FLASH_DOCUMENTARY'] },
  { id: 'lens_24mm_wide', category: 'lens', tags: ['wide', 'scale', 'environmental'],
    fragment: '24mm wide lens exaggerating the scale of the environment',
    anchor: { darkness: 0.5, intimacy: 0.35, brightness: 0.45 },
    techniques: ['MONUMENTAL_SCALE_ISOLATION', 'SILHOUETTE_ATMOSPHERE'] },
  // Added to break up lens monoculture: 50mm and 85mm were each the preferred
  // optic for five of ten techniques, so covers that were meant to look
  // different were being shot through the same glass.
  { id: 'lens_18mm_ultrawide', category: 'lens', tags: ['ultra-wide', 'scale', 'distortion'],
    fragment: '18mm ultra-wide lens stretching the foreground and dwarfing the subject against the space',
    // Eq 1: an 18mm carries enormous depth of field at any practical stop, so
    // it sits near the deep-focus pole (just short of true hyperfocal).
    anchor: { darkness: 0.5, intimacy: 0.25, energy: 0.4, brightness: 0.68 },
    techniques: ['MONUMENTAL_SCALE_ISOLATION'] },
  { id: 'lens_28mm_reportage', category: 'lens', tags: ['wide-normal', 'reportage', 'candid', 'close-in'],
    fragment: '28mm reportage lens working close in, immersive with a slight edge stretch',
    // Eq 1: mid-stopped reportage aperture.
    anchor: { grit: 0.65, energy: 0.65, motion: 0.55, brightness: 0.58 },
    techniques: ['FLASH_DOCUMENTARY'] },
  { id: 'lens_135mm_f2', category: 'lens', tags: ['telephoto', 'compression', 'isolation'],
    fragment: '135mm f/2 telephoto compressing the background into a soft wash behind the subject',
    // Eq 1: f/2, shallow.
    anchor: { intimacy: 0.6, darkness: 0.55, motion: 0.3, brightness: 0.35 },
    techniques: ['DUOTONE_COLOR_WASH'] },
  { id: 'lens_100mm_macro', category: 'lens', tags: ['macro', 'detail', 'shallow'],
    fragment: '100mm macro lens with razor-thin depth of field and soft falloff',
    // Eq 1: razor-thin DoF is the shallowest end of the scale.
    anchor: { intimacy: 0.8, acousticness: 0.55, energy: 0.3, brightness: 0.30 },
    techniques: ['MACRO_INTIMATE_DETAIL'] },
]

/** @type {import('../types').VocabularyConcept[]} */
const FILM_STOCKS = [
  { id: 'film_portra_400', category: 'filmStock', tags: ['warm', 'natural-skin', 'analog'],
    fragment: 'Kodak Portra 400 color rendition with warm, true skin tones',
    noPeopleFragment: 'Kodak Portra 400 color rendition with warm, true-to-life tones across every material in frame',
    anchor: { warmth: 0.7, acousticness: 0.55, valence: 0.6 },
    techniques: ['VINTAGE_FILM_NOSTALGIA'] },
  { id: 'film_cinestill_800t', category: 'filmStock', tags: ['tungsten', 'night', 'halation'],
    fragment: 'CineStill 800T tungsten palette with red halation blooming around lights',
    anchor: { darkness: 0.6, brightness: 0.45, motion: 0.5 },
    techniques: ['DUOTONE_COLOR_WASH', 'SILHOUETTE_ATMOSPHERE'] },
  { id: 'film_trix_400', category: 'filmStock', tags: ['b&w', 'grainy', 'contrast', 'gritty'],
    fragment: 'high-contrast Kodak Tri-X 400 black-and-white with coarse grain',
    // Module 3 #8 — Spectral Flatness >0.65 maps to pushed analog film stock.
    anchor: { grit: 0.7, aggression: 0.6, darkness: 0.55, scaleMajor: 0.2, spectralFlatness: 0.72 },
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
    // Module 3 #8 — low flatness (clean digital synthesis) forces digital precision.
    anchor: { brightness: 0.65, energy: 0.55, acousticness: 0.3, grit: 0.2, spectralFlatness: 0.18 },
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
    fragment: 'direct on-camera flash, slightly overexposed skin highlights, a hard-edged shadow cast on the wall behind, a small specular catchlight in the eyes',
    noPeopleFragment: 'direct on-camera flash, slightly overexposed highlights on the object\'s own surface, a hard-edged shadow cast on the wall behind, a small specular catchlight at its brightest point',
    anchor: { grit: 0.7, aggression: 0.6, energy: 0.7, euphoria: 0.5 },
    techniques: ['FLASH_DOCUMENTARY', 'STUDIO_SEAMLESS_EDITORIAL'] },
  { id: 'light_chiaroscuro', category: 'lighting', tags: ['low-key', 'dramatic', 'contrast', 'rim'],
    fragment: 'low-key chiaroscuro: a single soft key at 45 degrees that clearly lights and reveals the face and eyes, shadow falling off toward the far cheek, a thin rim light separating the subject from a near-black background, a catchlight in the eyes',
    noPeopleFragment: 'low-key chiaroscuro: a single soft key at 45 degrees that clearly lights and reveals the object\'s form and texture, shadow falling off across its far side, a thin rim light separating it from a near-black background, a catchlight on its brightest edge',
    anchor: { darkness: 0.75, valence: 0.25, intimacy: 0.55 },
    techniques: ['SILHOUETTE_ATMOSPHERE', 'SURREAL_PRACTICAL_METAPHOR', 'DUOTONE_COLOR_WASH'] },
  { id: 'light_high_key_wrap', category: 'lighting', tags: ['high-key', 'soft', 'bright'],
    fragment: 'a large soft key from camera-left with gentle fill for an airy high-key wrap, clean bright reflections and soft catchlights in the eyes',
    noPeopleFragment: 'a large soft key from camera-left with gentle fill for an airy high-key wrap, clean bright reflections and soft catchlights across the object\'s own surface',
    anchor: { euphoria: 0.7, brightness: 0.75, valence: 0.7 },
    techniques: ['STUDIO_SEAMLESS_EDITORIAL'] },
  { id: 'light_golden_hour', category: 'lighting', tags: ['warm', 'natural', 'directional'],
    fragment: 'warm low golden-hour sun raking across the subject from the side, long soft shadows and a warm catchlight in the eyes',
    noPeopleFragment: 'warm low golden-hour sun raking across the object from the side, long soft shadows and a warm catchlight along its brightest edge',
    anchor: { warmth: 0.75, valence: 0.65, brightness: 0.6 },
    techniques: ['VINTAGE_FILM_NOSTALGIA', 'MONUMENTAL_SCALE_ISOLATION'] },
  { id: 'light_north_window', category: 'lighting', tags: ['soft', 'diffuse', 'natural'],
    fragment: 'soft diffused north-window daylight from camera-left, gentle wrap-around shadows and a soft catchlight in the eyes',
    noPeopleFragment: 'soft diffused north-window daylight from camera-left, gentle wrap-around shadows and a soft catchlight on the object\'s most reflective point',
    anchor: { intimacy: 0.6, acousticness: 0.6, energy: 0.35 },
    techniques: ['MACRO_INTIMATE_DETAIL', 'VINTAGE_FILM_NOSTALGIA'] },
  { id: 'light_rim_backlight', category: 'lighting', tags: ['rim', 'backlight', 'silhouette'],
    fragment: 'a strong rim/edge backlight tracing the subject against a hazy background, plus a soft frontal fill that keeps the face clearly lit and readable',
    noPeopleFragment: 'a strong rim/edge backlight tracing the object\'s silhouette against a hazy background, plus a soft frontal fill that keeps its form clearly lit and readable',
    anchor: { darkness: 0.6, intimacy: 0.4, brightness: 0.4 },
    techniques: ['SILHOUETTE_ATMOSPHERE', 'MONUMENTAL_SCALE_ISOLATION'] },
  { id: 'light_spotlight_halo', category: 'lighting', tags: ['spotlight', 'projection', 'halo', 'circular', 'gel'],
    // Learned as a CONCEPT (projected halo behind the head), not a copy of the
    // reference's orange — the hue comes from the color DNA layer, and the front
    // key keeps the face lit rather than silhouetting it.
    fragment: 'a gelled key colored to the scene palette lighting the face clearly from the front, a circular spotlight projected on the wall behind the head forming a glowing halo disc in that same colour, a soft rim light and a bright catchlight in the eyes',
    noPeopleFragment: 'a gelled key colored to the scene palette lighting the object clearly from the front, a circular spotlight projected on the wall behind it forming a glowing halo disc in that same colour, a soft rim light and a bright catchlight on its highest point',
    anchor: { darkness: 0.5, valence: 0.4, intimacy: 0.5, brightness: 0.4 },
    techniques: ['SILHOUETTE_ATMOSPHERE', 'STUDIO_SEAMLESS_EDITORIAL', 'DUOTONE_COLOR_WASH'],
    source: 'research: /PROMT + Tems sun-orb halo — concept (projected halo + gel + rim + catchlight), hue left to palette, face kept lit' },
  { id: 'light_practical_haze', category: 'lighting', tags: ['practical', 'club', 'haze', 'volumetric', 'night'],
    fragment: 'glowing practical bulbs behind the subject, one soft key from camera-left clearly lighting the face, atmospheric haze catching volumetric light beams, an edge light tracing the figure',
    noPeopleFragment: 'glowing practical bulbs behind the object, one soft key from camera-left clearly lighting its surface, atmospheric haze catching volumetric light beams, an edge light tracing its silhouette',
    anchor: { darkness: 0.55, motion: 0.5, intimacy: 0.45 },
    techniques: ['DUOTONE_COLOR_WASH', 'SILHOUETTE_ATMOSPHERE', 'FLASH_DOCUMENTARY'],
    source: 'research: nightlife practical + volumetric haze lighting diagram' },
  { id: 'light_single_gel', category: 'lighting', tags: ['gel', 'colored', 'moody'],
    fragment: 'the frame lit through a single colored gel for one dominant hue, a contrasting rim of color separating the subject from the background',
    anchor: { darkness: 0.55, intimacy: 0.45, motion: 0.4 },
    techniques: ['DUOTONE_COLOR_WASH'] },
  { id: 'light_infrared_sensor', category: 'lighting', tags: ['infrared', 'thermal', 'false-color', 'night-vision'],
    // See color_infrared_false for the verified reasoning: name the real
    // imaging genre (FLIR footage), not an abstract technical instruction.
    fragment: 'no visible-spectrum lighting at all — a real FLIR thermal camera reads the scene\'s own heat instead, faces reading as bright false-color thermal blooms rather than lit skin',
    noPeopleFragment: 'no visible-spectrum lighting at all — a real FLIR thermal camera reads the scene\'s own heat instead, the object\'s own warmth reading as a bright false-color thermal bloom against a cold ambient field rather than any lit surface',
    anchor: { darkness: 0.75, aggression: 0.5, valence: 0.15, brightness: 0.3 },
    techniques: ['INFRARED_THERMAL'], source: 'FELT technique library v2' },
]

/** @type {import('../types').VocabularyConcept[]} */
const MOTION = [
  { id: 'motion_freeze', category: 'motion', tags: ['sharp', 'frozen', 'still'],
    fragment: 'tack-sharp frozen instant, no motion blur',
    // Eq 2 High-Speed Transient Freeze: fast and percussively dense.
    anchor: { motion: 0.2, energy: 0.4, danceability: 0.3,
      tempo: 0.72, onsetRate: 0.42, spectralFlux: 0.55 } },
  { id: 'motion_shutter_drag', category: 'motion', tags: ['long-exposure', 'blur-trails', 'rhythm'],
    fragment: 'shutter-drag technique, a 1/15s long exposure trailing organic horizontal motion blur across the subject',
    // Eq 2 Intentional Camera Motion: slow tempo with high structural flux.
    anchor: { motion: 0.8, danceability: 0.75, energy: 0.6,
      tempo: 0.25, onsetRate: 0.20, spectralFlux: 0.75 },
    techniques: ['MOTION_BLUR_STROBE'],
    source: 'research: Tems shutter-drag editorial motion' },
  { id: 'motion_strobe_freeze', category: 'motion', tags: ['strobe', 'blur+sharp', 'mania'],
    fragment: 'a slow shutter with one strobe pop, directional blur trails frozen at a single sharp instant',
    // Eq 2 Stroboscopic Capture: dense onsets AND violent spectral change.
    anchor: { motion: 0.7, aggression: 0.6, energy: 0.7,
      tempo: 0.60, onsetRate: 0.50, spectralFlux: 0.85 },
    techniques: ['MOTION_BLUR_STROBE'] },
  { id: 'motion_double_exposure', category: 'motion', tags: ['double-exposure', 'ghosting', 'duality'],
    fragment: 'a real in-camera double exposure, the second layer slightly misaligned and ghosted',
    // Eq 2 Standard Documentary mid-band - the region the research left as a gap
    // (80-90 BPM matched no case in the published piecewise function).
    anchor: { darkness: 0.5, intimacy: 0.5, motion: 0.4,
      tempo: 0.45, onsetRate: 0.28, spectralFlux: 0.45 },
    techniques: ['MIRROR_DOUBLE_EXPOSURE'] },
  { id: 'motion_still_meditative', category: 'motion', tags: ['static', 'calm', 'serene'],
    fragment: 'complete stillness, a calm slow-exposure with the subject perfectly motionless',
    // Eq 2 Long-Exposure Static Glass: slow, sparse and spectrally static.
    anchor: { intimacy: 0.65, energy: 0.25, motion: 0.2,
      tempo: 0.15, onsetRate: 0.06, spectralFlux: 0.12 },
    techniques: ['MONUMENTAL_SCALE_ISOLATION', 'MACRO_INTIMATE_DETAIL'] },
  { id: 'motion_light_trail', category: 'motion', tags: ['light-trail', 'long-exposure', 'static-subject'],
    fragment: 'a genuine long-exposure light trail tracing the path of a moving light source, the subject itself held still',
    anchor: { motion: 0.6, energy: 0.55, euphoria: 0.6,
      tempo: 0.5, onsetRate: 0.3, spectralFlux: 0.6 },
    techniques: ['LONG_EXPOSURE_LIGHT_PAINTING'], source: 'FELT technique library v2' },
]

/** @type {import('../types').VocabularyConcept[]} */
const TEXTURE = [
  { id: 'tex_fine_film_grain', category: 'texture', tags: ['grain', 'analog', 'fine'],
    fragment: 'fine visible 35mm film grain throughout',
    // Module 3 #8 — mid flatness: organic analog texture without heavy distortion.
    anchor: { acousticness: 0.5, grit: 0.45, warmth: 0.5, spectralFlatness: 0.45 } },
  { id: 'tex_heavy_grain', category: 'texture', tags: ['grain', 'coarse', 'gritty'],
    fragment: 'heavy coarse film grain and lifted blacks',
    // Module 3 #8 — high flatness loads coarse silver-halide grain.
    anchor: { grit: 0.75, aggression: 0.6, darkness: 0.55, spectralFlatness: 0.7 },
    techniques: ['FLASH_DOCUMENTARY', 'SURREAL_PRACTICAL_METAPHOR'] },
  { id: 'tex_xerox_halftone', category: 'texture', tags: ['xerox', 'photocopy', 'halftone', 'ink'],
    fragment: 'coarse high-contrast xerox photocopy grain with subtle ink bleed and a halftone dot pattern',
    anchor: { grit: 0.8, aggression: 0.7, speechiness: 0.6, spectralFlatness: 0.85 },
    techniques: ['FLASH_DOCUMENTARY'],
    source: 'research: parental-advisory / mixtape xerox texture' },
  { id: 'tex_dust_scratches', category: 'texture', tags: ['dust', 'scratches', 'wear', 'analog'],
    fragment: 'subtle dust, hairline scratches and paper-tooth texture as if scanned from an old print',
    // Module 3 #7 - high onset density floods the frame with airborne
    // particulate. Calibrated to the MEASURED mean stroke density of dense hand
    // percussion (10.62 onsets/sec, median 10.38, SD 3.9): 10.62/25 = 0.42.
    // The previous 0.55 (13.75/sec) sat more than an SD above that mean, so
    // almost no real track could reach it.
    anchor: { acousticness: 0.65, warmth: 0.55, energy: 0.35, onsetRate: 0.42 },
    techniques: ['VINTAGE_FILM_NOSTALGIA'] },
  { id: 'tex_clean_detail', category: 'texture', tags: ['clean', 'detail', 'pores'],
    fragment: 'pristine sensor clarity resolving real un-airbrushed skin pores and textile weave',
    noPeopleFragment: 'pristine sensor clarity resolving the object\'s own real material grain — wood pore, metal brush marks, fabric weave, worn edges',
    // Module 3 #7 - low onset density produces hyper-clean, barren spaces.
    // 0.10 = 2.5 onsets/sec, the published boundary between slow (0.2-2.5 Hz)
    // and fast (>2.5 Hz) musical event rates.
    anchor: { brightness: 0.65, grit: 0.2, intimacy: 0.5, onsetRate: 0.10, spectralFlatness: 0.2 },
    techniques: ['MACRO_INTIMATE_DETAIL', 'STUDIO_SEAMLESS_EDITORIAL'] },
  { id: 'tex_sensor_noise', category: 'texture', tags: ['thermal', 'sensor-noise', 'infrared'],
    fragment: 'coarse thermal-sensor noise and false-color banding instead of natural film or digital grain',
    anchor: { grit: 0.6, darkness: 0.65, spectralFlatness: 0.6 },
    techniques: ['INFRARED_THERMAL'], source: 'FELT technique library v2' },
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

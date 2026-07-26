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
const { mulberry32 } = require('../dna/scoring')

const TECHNIQUES = {
  FLASH_DOCUMENTARY: {
    suffix: 'An unstaged frame — the kind a friend takes at 2am, nothing arranged for the camera.',
    dnaBias: { grit: +0.12, energy: +0.08 },
    graphic: ['graphic_clean_photo', 'graphic_parental_advisory'],
    purpose: 'Capture a moment as if the camera happened to be there — nothing composed, nothing waiting for its mark.',
    // 0-10 per axis. This is the technique's OWN visual language, independent
    // of any emotion — it's what lets the affinity matrix below stay honest
    // instead of collapsing every axis toward whichever emotion got written first.
    axes: { movement: 9, energy: 9, intimacy: 6, grandeur: 2, luxury: 3, isolation: 2, chaos: 9, stillness: 1 },
    bestFor: ['clubs and backstage', 'street and concert crowds', 'raw confession or celebration', 'friends, not strangers'],
    poorFor: ['meditative or quiet subjects', 'epic scale/landscape', 'anything requiring precision or restraint'],
    commonMistakes: 'Forcing it onto slow, interior songs just because the register is "dark" — flash-documentary needs kinetic subject matter, not just low valence.',
    visualSignature: 'Direct on-camera flash, off-kilter framing, motion caught mid-happening, nothing retouched.',
  },
  VINTAGE_FILM_NOSTALGIA: {
    suffix: 'A real film photograph that has physically aged, not a digital imitation of film.',
    dnaBias: { warmth: +0.12, acousticness: +0.08 },
    graphic: ['graphic_clean_photo', 'graphic_vinyl_sleeve'],
    purpose: 'Locate the subject in a specific remembered past through the physical artifacts of an old print.',
    axes: { movement: 3, energy: 4, intimacy: 6, grandeur: 3, luxury: 4, isolation: 3, chaos: 2, stillness: 6 },
    bestFor: ['memory, longing, cruising', 'family/heritage imagery', 'warm retro pride', 'objects with a history'],
    poorFor: ['anything that needs to feel current or urgent', 'high-aggression or high-chaos material'],
    commonMistakes: 'Defaulting to it for every "warm" song — warmth alone isn\'t nostalgia; it needs a sense of elapsed time.',
    visualSignature: 'True film grain and dust, warm shadow lift, an image that reads as found rather than made today.',
  },
  SILHOUETTE_ATMOSPHERE: {
    suffix: 'The light source, not the face, is the subject of the photograph.',
    dnaBias: { darkness: +0.12, intimacy: +0.05 },
    graphic: ['graphic_clean_photo'],
    purpose: 'Trade identity for form — the shape and the light around it carry the meaning instead of the face.',
    axes: { movement: 3, energy: 4, intimacy: 3, grandeur: 8, luxury: 5, isolation: 7, chaos: 2, stillness: 7 },
    bestFor: ['scale, mystery, spiritual searching', 'victory or freedom framed against a horizon', 'anonymity that is a CHOICE, not a hiding place'],
    poorFor: ['songs that need a specific, memorable person', 'intimacy or tenderness (the face is the whole point there)'],
    commonMistakes: 'Reaching for it whenever a song is "dark" or "sad" — silhouette hides identity, which is the wrong move for most melancholy (grief usually wants a face).',
    visualSignature: 'A dominant light source behind or beside the subject; the figure reads as shape before person.',
  },
  SURREAL_PRACTICAL_METAPHOR: {
    suffix: 'The impossible element is a real prop, physically built and shot in camera.',
    dnaBias: { darkness: +0.08, aggression: +0.06 },
    graphic: ['graphic_clean_photo'],
    purpose: 'Externalize an internal state as one real, physically staged object the body has to contend with.',
    axes: { movement: 1, energy: 3, intimacy: 6, grandeur: 3, luxury: 3, isolation: 5, chaos: 3, stillness: 8 },
    bestFor: ['internal conflict, addiction, existential weight', 'a single strong metaphor the song keeps returning to'],
    poorFor: ['party/celebration energy', 'anything that needs to feel spontaneous rather than staged'],
    commonMistakes: 'Using it without a genuinely strong, specific object — a vague "surreal prop" reads as random rather than meaningful.',
    visualSignature: 'One deliberately staged, physically real object interacting with the body under tension.',
  },
  DUOTONE_COLOR_WASH: {
    suffix: 'The colour lives in the emulsion of a real print, not a flat digital filter laid on top.',
    dnaBias: { darkness: +0.10, intimacy: +0.06 },
    graphic: ['graphic_clean_photo'],
    purpose: 'A single dominant hue unifies the frame — this is fundamentally a COLOR decision, not an emotion, and it can carry almost any register.',
    axes: { movement: 2, energy: 4, intimacy: 6, grandeur: 3, luxury: 6, isolation: 4, chaos: 2, stillness: 7 },
    bestFor: ['obsession, longing, night driving', 'confident single-color branding moments', 'restrained luxury or moody elegance'],
    poorFor: ['high-chaos or crowd scenes', 'anything that needs multiple competing colors to read'],
    commonMistakes: 'Treating it as exclusively "sad" — duotone is a palette technique first; a warm-red duotone reads as confident or dangerous just as easily as melancholic.',
    visualSignature: 'One dominant hue running through the entire frame, grain visible beneath the wash.',
  },
  MACRO_INTIMATE_DETAIL: {
    suffix: 'Uncomfortably close and completely unretouched.',
    dnaBias: { intimacy: +0.15 },
    graphic: ['graphic_clean_photo'],
    purpose: 'Magnify one small detail until it carries the whole frame — proximity is the technique, not any single feeling.',
    axes: { movement: 1, energy: 3, intimacy: 9, grandeur: 1, luxury: 5, isolation: 2, chaos: 2, stillness: 8 },
    bestFor: ['vulnerability and sensuality', 'craftsmanship, texture, material honesty', 'a single object or detail loaded with meaning'],
    poorFor: ['scale, journey, or crowd-based songs', 'anything that needs environmental context to read'],
    commonMistakes: 'Assuming it only serves softness — extreme macro on a scar, a clenched fist, or cracked skin reads as fear or violence just as legibly.',
    visualSignature: 'Extreme close crop on one feature, razor-thin focus, nothing else in frame.',
  },
  MOTION_BLUR_STROBE: {
    suffix: 'The blur is a real long-exposure artifact of the moment, not an added effect.',
    dnaBias: { motion: +0.15, danceability: +0.06 },
    graphic: ['graphic_clean_photo'],
    purpose: 'Register physical release through a real long-exposure or strobe artifact — the body in motion is the subject.',
    axes: { movement: 10, energy: 8, intimacy: 3, grandeur: 2, luxury: 3, isolation: 1, chaos: 7, stillness: 0 },
    bestFor: ['dancing, mania, spiraling energy', 'physical release, ecstatic movement', 'high-tempo, high-danceability tracks'],
    poorFor: ['quiet, contemplative, or acoustic material', 'anything needing a legible still portrait'],
    commonMistakes: 'Using it on a track that is emotionally intense but physically STILL (grief, dread) — blur communicates movement, not intensity.',
    visualSignature: 'Real shutter-drag or strobe-freeze trails, a sharp instant caught inside genuine motion blur.',
  },
  MIRROR_DOUBLE_EXPOSURE: {
    // No film claim: this technique's stock is film_digital_clean (the only
    // palette-neutral option, needed to keep its cobalt duotone coherent).
    suffix: 'Both layers are one single in-camera exposure, not two images blended afterward.',
    dnaBias: { darkness: +0.06, intimacy: +0.06 },
    graphic: ['graphic_clean_photo'],
    purpose: 'Layer two realities in one frame — the technique for anything that is genuinely two things at once.',
    axes: { movement: 2, energy: 3, intimacy: 5, grandeur: 3, luxury: 4, isolation: 4, chaos: 3, stillness: 6 },
    bestFor: ['duality, identity conflict, self-confrontation', 'memory bleeding into the present', 'analytical/structural songs about a split self'],
    poorFor: ['single, unambiguous emotional statements', 'party or physical-release energy'],
    commonMistakes: 'Reaching for it whenever a song is "complex" — it specifically needs TWO distinct layers in tension, not just general intensity.',
    visualSignature: 'One real in-camera double exposure, the second layer visibly misaligned and ghosted.',
  },
  STUDIO_SEAMLESS_EDITORIAL: {
    suffix: 'A real physical studio shoot, nothing retouched afterward.',
    dnaBias: { euphoria: +0.08, brightness: +0.06 },
    graphic: ['graphic_clean_photo', 'graphic_minimal_luxury'],
    purpose: 'Remove the environment entirely so nothing competes with the subject and one controlled color — a statement of confidence via total control.',
    axes: { movement: 2, energy: 6, intimacy: 3, grandeur: 4, luxury: 8, isolation: 2, chaos: 1, stillness: 6 },
    bestFor: ['confidence, boldness, a single strong emotional color', 'fashion-forward or high-production statements'],
    poorFor: ['raw, unpolished, or documentary-feeling songs', 'grief, fragility, or anything needing environmental context'],
    commonMistakes: 'Treating "confidence" as the only mode — a seamless studio setup can also read as fragile, minimal or soft depending on lighting and color choice, not just bold.',
    visualSignature: 'Solid seamless backdrop, one controlled studio light setup, nothing in frame but the subject and color.',
  },
MONUMENTAL_SCALE_ISOLATION: {
    suffix: 'Real atmospheric haze separates the layers of distance.',
    dnaBias: { darkness: +0.06, intimacy: +0.04, energy: -0.06 },
    graphic: ['graphic_clean_photo', 'graphic_minimal_luxury'],
    purpose: 'Dwarf the subject against something vast — a statement about scale, not automatically about loneliness.',
    axes: { movement: 1, energy: 3, intimacy: 1, grandeur: 10, luxury: 4, isolation: 6, chaos: 1, stillness: 8 },
    bestFor: ['awe, ambition, discovery, exploration', 'loneliness or absence when that IS the point', 'survival against something bigger than the self'],
    poorFor: ['intimate, close, or fast-moving songs', 'anything needing a legible, specific person'],
    commonMistakes: 'Defaulting to it for every quiet or low-energy song — scale communicates vastness/insignificance specifically, not just "calm."',
    visualSignature: 'A tiny figure dwarfed by one massive dominant element, real atmospheric haze separating the depth layers.',
  },

  AERIAL_TOP_DOWN: {
    suffix: 'A true orthographic overhead — the ground reads as pattern, not scenery.',
    dnaBias: { intimacy: -0.10, brightness: +0.06 },
    graphic: ['graphic_clean_photo', 'graphic_minimal_luxury'],
    purpose: 'Remove the human eye-level entirely — from directly above, everything becomes structure, pattern and scale relationships.',
    axes: { movement: 2, energy: 4, intimacy: 0, grandeur: 8, luxury: 5, isolation: 5, chaos: 3, stillness: 7 },
    bestFor: ['systems, cities, order vs disorder', 'a single figure read as one element in a larger pattern', 'analytical or structural songs'],
    poorFor: ['anything needing facial expression or emotional read', 'intimacy, romance, or tenderness'],
    commonMistakes: 'Confusing it with MONUMENTAL_SCALE — that technique looks UP at something vast; this looks straight DOWN at pattern. Do not use for awe or grandeur that needs a horizon.',
    visualSignature: 'A direct ninety-degree top-down view, the subject and environment read as flat graphic pattern.',
  },
  LONG_EXPOSURE_LIGHT_PAINTING: {
    // Distinct from MOTION_BLUR_STROBE: that technique tracks a moving BODY.
    // This tracks LIGHT ITSELF moving — the body is often static or absent.
    suffix: 'The light trail is a real long-exposure record of light moving through space, not an added glow effect.',
    dnaBias: { motion: +0.10, darkness: +0.08 },
    graphic: ['graphic_clean_photo'],
    purpose: 'Record the path of light itself over time — fire, traffic, glow — while the subject (if present) stays still.',
    axes: { movement: 8, energy: 5, intimacy: 2, grandeur: 5, luxury: 4, isolation: 4, chaos: 5, stillness: 3 },
    bestFor: ['pure energy or trance states', 'ritual, fire, night driving', 'abstract euphoria with no legible dancer'],
    poorFor: ['songs needing a specific, readable person', 'quiet or acoustic material'],
    commonMistakes: 'Confusing it with MOTION_BLUR_STROBE — that technique blurs a moving PERSON; this technique keeps the person (if any) still and blurs the LIGHT around them instead.',
    visualSignature: 'Long-exposure light trails — fire, traffic, glow-sticks — tracing continuous lines through a mostly static frame.',
  },
  ENVIRONMENTAL_WIDE_DOCUMENTARY: {
    // The gap between FLASH_DOCUMENTARY (candid chaos, close) and
    // MONUMENTAL_SCALE_ISOLATION (dwarfed to near-abstraction). Here the person
    // stays legible and specific, just placed inside a large truthful place.
    suffix: 'A wide, truthful view of a real place with a real person inside it — nothing staged, nothing abstracted.',
    dnaBias: { grit: +0.06, warmth: +0.04 },
    graphic: ['graphic_clean_photo'],
    purpose: 'Place a specific, identifiable person inside a large, truthful environment — the place tells as much of the story as the person does.',
    axes: { movement: 4, energy: 4, intimacy: 4, grandeur: 6, luxury: 3, isolation: 3, chaos: 3, stillness: 6 },
    bestFor: ['narrative or place-driven songs', 'home, city, journey, belonging', 'a specific person defined by where they stand'],
    poorFor: ['pure abstraction or symbolism-led songs', 'extreme intimacy that needs a tight crop'],
    commonMistakes: 'Letting the environment swallow the person entirely — unlike MONUMENTAL_SCALE, the subject here must stay identifiable, not reduced to a speck.',
    visualSignature: 'A wide, deep frame holding a real environment with one legible person inside it, true to scale.',
  },
  GRAPHIC_PANEL_COMPOSITE: {
    // Owns the mugshot-lineup / stacked-panel layout — multiple subjects each
    // get full rigor, composed as distinct panels rather than one shared frame.
    suffix: 'A real panel or grid layout — each frame its own exposure, not a digital collage effect.',
    dnaBias: { euphoria: +0.05, aggression: +0.05 },
    graphic: ['graphic_panel_grid', 'graphic_clean_photo', 'graphic_parental_advisory'],
    purpose: 'Present multiple subjects as distinct panels in one grid or lineup — built for crews, comps and features, not a single shared moment.',
    axes: { movement: 2, energy: 6, intimacy: 2, grandeur: 3, luxury: 3, isolation: 1, chaos: 4, stillness: 5 },
    bestFor: ['collabs, crews, comps, boastful tracks', 'documentary-style multi-subject covers', 'street/mixtape culture'],
    poorFor: ['solo, intimate, or single-mood songs', 'anything needing one continuous scene'],
    commonMistakes: 'Using it for a single subject — the panel structure only earns its place when there are genuinely multiple distinct subjects to separate.',
    visualSignature: 'A structured multi-panel or grid layout, each cell its own clean exposure, real seams between panels.',
  },
  INFRARED_THERMAL: {
    suffix: 'A real infrared or thermal-sensor capture, not a color-graded imitation of one.',
    dnaBias: { darkness: +0.10, aggression: +0.05 },
    graphic: ['graphic_clean_photo'],
    purpose: 'See via a non-visible spectrum — heat or infrared — so the image reads as surveilled, othered, or inhuman rather than simply dark.',
    axes: { movement: 2, energy: 4, intimacy: 1, grandeur: 3, luxury: 1, isolation: 6, chaos: 4, stillness: 6 },
    bestFor: ['paranoia, surveillance, being watched', 'dehumanization, threat, the uncanny', 'cold, clinical dread'],
    poorFor: ['warmth, tenderness, or celebration', 'anything needing accurate, readable skin tone'],
    commonMistakes: 'Using it for generic "dark" or "moody" songs — infrared specifically signals being WATCHED or SENSED, not just low light.',
    visualSignature: 'False-color or monochrome infrared/thermal rendering — heat signatures or green night-vision, not natural color.',
  },

}
  

// Used ONLY as a validation guard (an unrecognized technique name coming in —
// getSuffix/getDnaBias/getAffinity must always return something rather than
// crash). This is NOT a creative fallback — see getFallbackTechnique() below
// for the case where we actually need to pick a look for a track. Keeping this
// name unexported-adjacent would be nicer, but existing call sites (generation.js
// TECHNIQUE_SUFFIXES lookups, isValidTechnique) depend on it staying a stable id.
const DEFAULT_TECHNIQUE = 'DUOTONE_COLOR_WASH'

// Techniques that intentionally hide, obscure, or make illegible the subject's
// face — the Reality Engine's "face front-lit and readable" demand would
// directly contradict these techniques' own visual signature. Everything NOT
// in this set must keep the face lit and readable (enforced in promptAssembler
// via photographicRealityTail's faceVisible flag).
const SILHOUETTE_TECHNIQUES = new Set([
  'SILHOUETTE_ATMOSPHERE',
  'MONUMENTAL_SCALE_ISOLATION',
  // No facial detail is physically coherent from a true 90° overhead —
  // AERIAL_TOP_DOWN's whole signature is looking straight down at pattern.
  'AERIAL_TOP_DOWN',
  // False-color/thermal rendering doesn't carry normal facial detail by
  // definition — demanding "front-lit, readable" contradicts the technique.
  'INFRARED_THERMAL',
])
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
    camera: ['cam_35mm_point_shoot', 'cam_disposable'], lens: ['lens_28mm_reportage', 'lens_35mm_hyperfocal'],
    // Consumer/night film — agrees with the warm colours, the flash, the grain
    // and the huji/light-leak overlays. Ektachrome's "punchy primaries" would
    // fight color_muted_earth; Tri-X's B&W would fight both colour options.
    filmStock: ['film_gold_200', 'film_cinestill_800t'],
    lighting: ['light_direct_flash', 'light_practical_haze'], composition: ['comp_offcenter_negative', 'comp_low_angle_hero'],
    motion: ['motion_freeze', 'motion_strobe_freeze'], texture: ['tex_heavy_grain', 'tex_fine_film_grain'],
    color: ['color_warm_tropical', 'color_muted_earth'], postProcessing: ['post_huji_filter', 'post_light_leak'],
    // candid/unstyled editorial agrees with the off-center, low-angle framing
    editorial: ['edit_street', 'edit_documentary'],
    // a staged symbolic object would contradict "nothing arranged for the camera"
    symbolism: ['sym_none'],
  },
  VINTAGE_FILM_NOSTALGIA: {
    camera: ['cam_mamiya_rz67', 'cam_leica_m10'], lens: ['lens_110mm_f35'],
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
    camera: ['cam_anamorphic_cine'], lens: ['lens_24mm_wide'],
    // CineStill 800T's "red halation blooming around lights" is the literal
    // subject of this technique ("the light source, not the face"). It also ends
    // the confirmed demo bug where an anchor-free filmStock pulled Ektachrome's
    // "punchy, clean primaries" against a "near-monochrome" grade.
    filmStock: ['film_cinestill_800t'],
    lighting: ['light_rim_backlight', 'light_spotlight_halo'], composition: ['comp_monumental_scale', 'comp_offcenter_negative'],
    // color_duotone_cobalt dropped: a cool blue wash contradicts CineStill's warm
    // tungsten palette. monochrome_dark's "single restrained accent" IS that warm
    // light. (Cobalt still lives in MIRROR, which uses a palette-neutral stock.)
    color: ['color_monochrome_dark'],
    // Held, silent and atmospheric — without this the anchor could pull
    // motion_shutter_drag's "blur trails" into a technique built on stillness.
    motion: ['motion_still_meditative', 'motion_freeze'],
    texture: ['tex_fine_film_grain'], postProcessing: ['post_vignette'],
    editorial: ['edit_fine_art', 'edit_luxury'],
    symbolism: ['sym_monolith', 'sym_solar_halo'],
  },
  SURREAL_PRACTICAL_METAPHOR: {
    camera: ['cam_35mm_point_shoot', 'cam_hasselblad_h6d'], lens: ['lens_80mm_f28'],
    lighting: ['light_chiaroscuro', 'light_direct_flash'], composition: ['comp_tight_enclosure', 'comp_centered_symmetry'],
    filmStock: ['film_trix_400'], texture: ['tex_heavy_grain'], color: ['color_monochrome_dark'],
    // The staged prop must read clearly — blur would destroy the whole point.
    motion: ['motion_freeze'],
    // "Shot in camera" realism: no added overlay, or at most a vignette that
    // agrees with the chiaroscuro/monochrome darkness.
    postProcessing: ['post_none', 'post_vignette'],
    // fine-art agrees with the deliberately staged, centered/enclosed framing
    editorial: ['edit_fine_art'],
    // the staged physical object IS this technique's identity
    symbolism: ['sym_piercing_object'],
  },
  DUOTONE_COLOR_WASH: {
    camera: ['cam_leica_m10', 'cam_anamorphic_cine'], lens: ['lens_135mm_f2'],
    lighting: ['light_single_gel', 'light_spotlight_halo'], filmStock: ['film_cinestill_800t'],
    composition: ['comp_centered_symmetry', 'comp_extreme_closeup'],
    // Fix 2: dropped color_duotone_cobalt — a cool blue wash contradicted
    // film_cinestill_800t's warm tungsten palette / red halation. Crimson agrees
    // with it. (Cobalt remains available under SILHOUETTE and MIRROR.)
    color: ['color_duotone_crimson'],
    // This technique's identity is grain visible UNDERNEATH the colour wash —
    // "the colour lives in the emulsion", so the emulsion has to be visible.
    texture: ['tex_fine_film_grain'],
    motion: ['motion_still_meditative'], postProcessing: ['post_vignette'],
    // Fix 1: was picking edit_documentary ("unstyled/candid") against
    // comp_centered_symmetry ("symmetrical centered") — opposite approaches.
    editorial: ['edit_fine_art', 'edit_luxury'],
    symbolism: ['sym_none'],
  },
  MACRO_INTIMATE_DETAIL: {
    // cam_mamiya_rz67 dropped: it is a FILM camera, which contradicts both
    // tex_clean_detail's "pristine sensor clarity" and the digital stock below.
    // The Hasselblad is a digital medium-format back — they agree.
    camera: ['cam_hasselblad_h6d'], lens: ['lens_100mm_macro', 'lens_85mm_portrait'],
    // Palette-neutral and sharp — agrees with "pristine sensor clarity" and with
    // both pastel/muted colour options. A warm film stock would fight the pastel.
    filmStock: ['film_digital_clean'],
    lighting: ['light_north_window', 'light_high_key_wrap'], composition: ['comp_extreme_closeup'],
    texture: ['tex_clean_detail'], color: ['color_high_key_pastel', 'color_muted_earth'], motion: ['motion_still_meditative'],
    // "Completely unretouched" — no overlay pass.
    postProcessing: ['post_none'],
    editorial: ['edit_fine_art', 'edit_luxury'],
    symbolism: ['sym_none'],
  },
  MOTION_BLUR_STROBE: {
    camera: ['cam_leica_m10'], lens: ['lens_35mm_hyperfocal'],
    // Night/tungsten film: CineStill's red halation around lights suits the
    // flash-and-practicals club setting and agrees with BOTH colour options
    // (warm tropical, crimson duotone). Also keeps it analog, matching the Leica.
    filmStock: ['film_cinestill_800t', 'film_gold_200'],
    lighting: ['light_direct_flash', 'light_practical_haze'], composition: ['comp_offcenter_negative', 'comp_low_angle_hero'],
    motion: ['motion_shutter_drag', 'motion_strobe_freeze'], texture: ['tex_fine_film_grain'],
    color: ['color_warm_tropical', 'color_duotone_crimson'], postProcessing: ['post_light_leak'],
    editorial: ['edit_fashion', 'edit_street'],
    symbolism: ['sym_none'],
  },
  MIRROR_DOUBLE_EXPOSURE: {
    camera: ['cam_leica_m10', 'cam_hasselblad_h6d'], lens: ['lens_50mm_f14'],
    // Palette-neutral by necessity: this is the one technique that must keep the
    // cool cobalt duotone available, and every other stock makes a colour claim
    // (warm/B&W/saturated) that would fight it.
    filmStock: ['film_digital_clean'],
    // Agrees with the clean digital capture above.
    texture: ['tex_clean_detail'],
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
    camera: ['cam_hasselblad_h6d', 'cam_leica_m10'], lens: ['lens_85mm_portrait'],
    lighting: ['light_high_key_wrap', 'light_direct_flash', 'light_spotlight_halo'],
    composition: ['comp_centered_symmetry', 'comp_offcenter_negative'], filmStock: ['film_ektachrome', 'film_digital_clean'],
    // Fix 2: dropped color_high_key_pastel — "soft airy pastel" fought
    // film_ektachrome's "punchy, clean primaries" saturation.
    color: ['color_bold_seamless'],
    // Posed studio editorial — sharp. Blur would contradict the whole setup.
    motion: ['motion_freeze'],
    texture: ['tex_clean_detail'], postProcessing: ['post_none'],
    editorial: ['edit_fashion', 'edit_luxury'],
    symbolism: ['sym_none'],
  },
MONUMENTAL_SCALE_ISOLATION: {
    camera: ['cam_anamorphic_cine'], lens: ['lens_18mm_ultrawide'],
    filmStock: ['film_portra_400', 'film_gold_200'],
    lighting: ['light_golden_hour', 'light_rim_backlight'], composition: ['comp_monumental_scale'],
    color: ['color_muted_earth', 'color_monochrome_dark'], motion: ['motion_still_meditative'], texture: ['tex_fine_film_grain'],
    postProcessing: ['post_vignette', 'post_none'],
    editorial: ['edit_fine_art', 'edit_luxury'],
    symbolism: ['sym_monolith', 'sym_open_road'],
  },
  AERIAL_TOP_DOWN: {
    camera: ['cam_drone_orthographic'], lens: ['lens_24mm_wide', 'lens_18mm_ultrawide'],
    filmStock: ['film_digital_clean'],
    lighting: ['light_high_key_wrap', 'light_north_window'],
    composition: ['comp_orthographic_overhead'],
    color: ['color_muted_earth', 'color_monochrome_dark'],
    motion: ['motion_freeze', 'motion_still_meditative'],
    texture: ['tex_clean_detail'],
    postProcessing: ['post_none'],
    editorial: ['edit_fine_art', 'edit_documentary'],
    symbolism: ['sym_grid', 'sym_none'],
  },
  LONG_EXPOSURE_LIGHT_PAINTING: {
    camera: ['cam_leica_m10', 'cam_anamorphic_cine'], lens: ['lens_35mm_hyperfocal', 'lens_24mm_wide'],
    filmStock: ['film_cinestill_800t'],
    lighting: ['light_practical_haze', 'light_single_gel'],
    composition: ['comp_offcenter_negative', 'comp_centered_symmetry'],
    color: ['color_duotone_crimson', 'color_duotone_cobalt', 'color_bold_seamless'],
    motion: ['motion_light_trail'],
    texture: ['tex_fine_film_grain'],
    postProcessing: ['post_light_leak'],
    editorial: ['edit_fine_art'],
    symbolism: ['sym_fire', 'sym_none'],
  },
  ENVIRONMENTAL_WIDE_DOCUMENTARY: {
    camera: ['cam_35mm_point_shoot', 'cam_leica_m10'], lens: ['lens_28mm_reportage', 'lens_24mm_wide'],
    filmStock: ['film_portra_400', 'film_gold_200'],
    lighting: ['light_golden_hour', 'light_north_window', 'light_practical_haze'],
    composition: ['comp_rule_of_thirds'],
    color: ['color_muted_earth', 'color_warm_tropical'],
    motion: ['motion_freeze'],
    texture: ['tex_fine_film_grain', 'tex_dust_scratches'],
    postProcessing: ['post_none', 'post_light_leak'],
    editorial: ['edit_documentary', 'edit_street'],
    symbolism: ['sym_open_road', 'sym_none'],
  },
  GRAPHIC_PANEL_COMPOSITE: {
    camera: ['cam_35mm_point_shoot', 'cam_disposable'], lens: ['lens_28mm_reportage', 'lens_35mm_hyperfocal'],
    filmStock: ['film_trix_400', 'film_gold_200'],
    lighting: ['light_direct_flash'],
    composition: ['comp_panel_grid'],
    color: ['color_monochrome_dark', 'color_warm_tropical'],
    motion: ['motion_freeze'],
    texture: ['tex_xerox_halftone', 'tex_heavy_grain'],
    postProcessing: ['post_none'],
    editorial: ['edit_street', 'edit_documentary'],
    symbolism: ['sym_none'],
  },
  INFRARED_THERMAL: {
    camera: ['cam_thermal_sensor'], lens: ['lens_35mm_hyperfocal'],
    filmStock: ['film_digital_clean'],
    lighting: ['light_infrared_sensor'],
    composition: ['comp_offcenter_negative', 'comp_centered_symmetry'],
    color: ['color_infrared_false'],
    motion: ['motion_freeze', 'motion_still_meditative'],
    texture: ['tex_sensor_noise'],
    postProcessing: ['post_none'],
    editorial: ['edit_fine_art'],
    symbolism: ['sym_watching_eye', 'sym_none'],
  },

}

/**
 * TECHNIQUE → EMOTION AFFINITY — how naturally each technique serves each of
 * the 12 archetypes (0..1). This is deliberately NOT 1:1. Every technique has
 * a real, non-zero score against every archetype, because a technique is a
 * way of seeing, not a feeling — Flash Documentary can shoot grief, it just
 * does it worse than Macro or Silhouette do. Scores were calibrated by asking,
 * for each technique/archetype pair: "would a working photographer actually
 * reach for this?" — not by inheriting whatever the old one-line description
 * happened to say.
 *
 * Selection uses this as the PRIMARY signal (70%), with the technique's own
 * movement/chaos axes checked against the track's continuous vector for the
 * remaining 30% — so two songs sharing an archetype can still land on
 * different techniques if their energy differs.
 *
 * Archetype keys match engine/emotion/archetypes' ARCHETYPES object exactly.
 * @type {Record<string, Record<string, number>>}
 */
const TECHNIQUE_EMOTION_AFFINITY = {
  FLASH_DOCUMENTARY: {
    TRANSCENDENCE: 0.20, SERENITY: 0.10, TENDERNESS: 0.40, NOSTALGIA: 0.50,
    MELANCHOLY: 0.30, DREAD: 0.35, TENSION: 0.55, POWER: 0.70,
    JOY: 0.85, EUPHORIA: 0.85, CEREBRAL: 0.15, PRIMAL: 0.60,
  },
  VINTAGE_FILM_NOSTALGIA: {
    TRANSCENDENCE: 0.35, SERENITY: 0.40, TENDERNESS: 0.65, NOSTALGIA: 0.95,
    MELANCHOLY: 0.55, DREAD: 0.15, TENSION: 0.20, POWER: 0.25,
    JOY: 0.50, EUPHORIA: 0.30, CEREBRAL: 0.15, PRIMAL: 0.40,
  },
  SILHOUETTE_ATMOSPHERE: {
    TRANSCENDENCE: 0.85, SERENITY: 0.60, TENDERNESS: 0.35, NOSTALGIA: 0.40,
    MELANCHOLY: 0.65, DREAD: 0.55, TENSION: 0.50, POWER: 0.55,
    JOY: 0.30, EUPHORIA: 0.45, CEREBRAL: 0.30, PRIMAL: 0.60,
  },
  SURREAL_PRACTICAL_METAPHOR: {
    TRANSCENDENCE: 0.40, SERENITY: 0.15, TENDERNESS: 0.40, NOSTALGIA: 0.30,
    MELANCHOLY: 0.75, DREAD: 0.75, TENSION: 0.60, POWER: 0.45,
    JOY: 0.15, EUPHORIA: 0.15, CEREBRAL: 0.55, PRIMAL: 0.35,
  },
  DUOTONE_COLOR_WASH: {
    TRANSCENDENCE: 0.40, SERENITY: 0.45, TENDERNESS: 0.55, NOSTALGIA: 0.50,
    MELANCHOLY: 0.75, DREAD: 0.45, TENSION: 0.50, POWER: 0.50,
    JOY: 0.40, EUPHORIA: 0.55, CEREBRAL: 0.40, PRIMAL: 0.35,
  },
  MACRO_INTIMATE_DETAIL: {
    TRANSCENDENCE: 0.30, SERENITY: 0.55, TENDERNESS: 0.85, NOSTALGIA: 0.40,
    MELANCHOLY: 0.50, DREAD: 0.40, TENSION: 0.35, POWER: 0.30,
    JOY: 0.30, EUPHORIA: 0.25, CEREBRAL: 0.50, PRIMAL: 0.45,
  },
  MOTION_BLUR_STROBE: {
    TRANSCENDENCE: 0.35, SERENITY: 0.10, TENDERNESS: 0.20, NOSTALGIA: 0.30,
    MELANCHOLY: 0.30, DREAD: 0.40, TENSION: 0.50, POWER: 0.55,
    JOY: 0.65, EUPHORIA: 0.90, CEREBRAL: 0.20, PRIMAL: 0.60,
  },
  MIRROR_DOUBLE_EXPOSURE: {
    TRANSCENDENCE: 0.50, SERENITY: 0.35, TENDERNESS: 0.45, NOSTALGIA: 0.55,
    MELANCHOLY: 0.65, DREAD: 0.55, TENSION: 0.45, POWER: 0.30,
    JOY: 0.30, EUPHORIA: 0.35, CEREBRAL: 0.65, PRIMAL: 0.30,
  },
  STUDIO_SEAMLESS_EDITORIAL: {
    TRANSCENDENCE: 0.40, SERENITY: 0.35, TENDERNESS: 0.40, NOSTALGIA: 0.30,
    MELANCHOLY: 0.35, DREAD: 0.20, TENSION: 0.35, POWER: 0.70,
    JOY: 0.65, EUPHORIA: 0.55, CEREBRAL: 0.45, PRIMAL: 0.25,
  },
  MONUMENTAL_SCALE_ISOLATION: {
    TRANSCENDENCE: 0.85, SERENITY: 0.65, TENDERNESS: 0.25, NOSTALGIA: 0.45,
    MELANCHOLY: 0.60, DREAD: 0.45, TENSION: 0.40, POWER: 0.50,
    JOY: 0.35, EUPHORIA: 0.35, CEREBRAL: 0.45, PRIMAL: 0.55,
  },
  AERIAL_TOP_DOWN: {
    TRANSCENDENCE: 0.45, SERENITY: 0.40, TENDERNESS: 0.10, NOSTALGIA: 0.20,
    MELANCHOLY: 0.30, DREAD: 0.40, TENSION: 0.55, POWER: 0.45,
    JOY: 0.30, EUPHORIA: 0.30, CEREBRAL: 0.80, PRIMAL: 0.25,
  },
  LONG_EXPOSURE_LIGHT_PAINTING: {
    TRANSCENDENCE: 0.55, SERENITY: 0.25, TENDERNESS: 0.15, NOSTALGIA: 0.30,
    MELANCHOLY: 0.25, DREAD: 0.30, TENSION: 0.40, POWER: 0.40,
    JOY: 0.55, EUPHORIA: 0.85, CEREBRAL: 0.35, PRIMAL: 0.65,
  },
  ENVIRONMENTAL_WIDE_DOCUMENTARY: {
    TRANSCENDENCE: 0.40, SERENITY: 0.45, TENDERNESS: 0.45, NOSTALGIA: 0.65,
    MELANCHOLY: 0.40, DREAD: 0.25, TENSION: 0.35, POWER: 0.40,
    JOY: 0.55, EUPHORIA: 0.35, CEREBRAL: 0.30, PRIMAL: 0.50,
  },
  GRAPHIC_PANEL_COMPOSITE: {
    TRANSCENDENCE: 0.10, SERENITY: 0.05, TENDERNESS: 0.15, NOSTALGIA: 0.35,
    MELANCHOLY: 0.15, DREAD: 0.25, TENSION: 0.35, POWER: 0.75,
    JOY: 0.55, EUPHORIA: 0.45, CEREBRAL: 0.25, PRIMAL: 0.40,
  },
  INFRARED_THERMAL: {
    TRANSCENDENCE: 0.20, SERENITY: 0.10, TENDERNESS: 0.05, NOSTALGIA: 0.10,
    MELANCHOLY: 0.35, DREAD: 0.90, TENSION: 0.65, POWER: 0.40,
    JOY: 0.05, EUPHORIA: 0.10, CEREBRAL: 0.45, PRIMAL: 0.30,
  },
}



/**
 * Mathematically select a technique from the track's emotion read — NOT from
 * raw audio, per the architecture agreed earlier (emotion is the interpreter).
 * Deterministic per song (seeded), varied across songs (near-tie exploration).
 *
 * @param {string} archetypeId  one of the 12 ARCHETYPES keys, e.g. 'MELANCHOLY'
 * @param {import('../types').FeatureVector} vector
 * @param {object} [opts]
 * @param {'low'|'medium'|'high'|'extreme'} [opts.intensity]
 * @param {number} [opts.explore] probability of picking a near-tie runner-up (default 0.30)
 * @returns {string} technique name
 */
function selectTechnique(archetypeId, vector, opts = {}) {
  const { intensity = 'medium', explore = 0.30 } = opts
  const intensityWeight = { low: 0.2, medium: 0.45, high: 0.75, extreme: 1 }[intensity] ?? 0.45

  const scored = Object.entries(TECHNIQUES).map(([name, t]) => {
    const affinity = (TECHNIQUE_EMOTION_AFFINITY[name] || {})[archetypeId] ?? 0.4
    const movementAxis = (t.axes?.movement ?? 5) / 10
    const movementAgreement = 1 - Math.abs(movementAxis - (vector.motion ?? 0.5))
    const chaosAxis = (t.axes?.chaos ?? 5) / 10
    const chaosAgreement = 1 - Math.abs(chaosAxis - intensityWeight)
    const score = affinity * 0.70 + movementAgreement * 0.18 + chaosAgreement * 0.12
    return { name, score }
  })

  scored.sort((a, b) => b.score - a.score)

  const rand = mulberry32((vector.meta?.seed ?? 0) ^ hashArchetype(archetypeId))
  const top = scored[0]
  const nearTies = scored.filter((s) => top.score - s.score <= 0.04)
  const winner = (nearTies.length > 1 && rand() < explore)
    ? nearTies[Math.floor(rand() * nearTies.length)]
    : top

  return winner.name
}

function hashArchetype(id) {
  let h = 0
  const s = String(id || '')
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h >>> 0
}

/** Preferred concept ids for one technique + layer (empty if none). */
function getAffinity(name, layerKey) {
  const profile = TECHNIQUE_AFFINITY[name] || TECHNIQUE_AFFINITY[DEFAULT_TECHNIQUE] || {}
  return profile[layerKey] || []
}

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

/**
 * The real fallback: when Gemini returns nothing usable, or a stored brief is
 * corrupt, this reasons from whatever the caller DOES have — a feature vector
 * if available, otherwise nothing but still avoids a fixed default by falling
 * back to a genre-neutral scored pick across ALL archetypes rather than always
 * returning the same technique.
 *
 * @param {import('../types').FeatureVector} [vector] track vector if available
 * @param {string} [archetypeId] emotion archetype if already known
 * @returns {string} technique name
 */
function getFallbackTechnique(vector, archetypeId) {
  if (vector && archetypeId) {
    // Best case: we know the song's emotion, so reason exactly like a normal
    // selection would — this is not really a "fallback" at all, just the
    // technique pipeline running with default intensity.
    return selectTechnique(archetypeId, vector, { explore: 0.30 })
  }
  if (vector) {
    // We have the track's numbers but no archetype read (e.g. emotion engine
    // itself failed) — average this vector's affinity-relevant score across
    // all 12 archetypes and let movement/chaos agreement do the deciding work,
    // rather than defaulting to one named archetype's bias.
    const archetypeIds = Object.keys(Object.values(TECHNIQUE_EMOTION_AFFINITY)[0])
    const scored = Object.entries(TECHNIQUES).map(([name, t]) => {
      const rows = archetypeIds.map((a) => (TECHNIQUE_EMOTION_AFFINITY[name] || {})[a] ?? 0.4)
      const meanAffinity = rows.reduce((a, b) => a + b, 0) / rows.length
      const movementAxis = (t.axes?.movement ?? 5) / 10
      const movementAgreement = 1 - Math.abs(movementAxis - (vector.motion ?? 0.5))
      return { name, score: meanAffinity * 0.6 + movementAgreement * 0.4 }
    })
    scored.sort((a, b) => b.score - a.score)
    return scored[0].name
  }
  // Truly nothing to reason from (no audio features at all). This is the only
  // case that still returns a fixed technique, and it should be vanishingly
  // rare — every route in generation.js has upload.audio_features by the time
  // a technique is needed.
  return DEFAULT_TECHNIQUE
}

module.exports = {
  TECHNIQUES,
  TECHNIQUE_SUFFIXES,
  TECHNIQUE_AFFINITY,
  TECHNIQUE_EMOTION_AFFINITY,
  DEFAULT_TECHNIQUE,
  isValidTechnique,
  getSuffix,
  getDnaBias,
  getAffinity,
  techniqueHidesFace,
  applyTechniqueBias,
  selectTechnique,
  getFallbackTechnique,
}



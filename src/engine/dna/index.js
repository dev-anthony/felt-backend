'use strict'
/**
 * VISUAL DNA ENGINE — FELT's reasoning engine.
 *
 * Computes the full visual execution for a track from its analyzed music.
 * It NEVER invents visual concepts — every layer selects from the Visual
 * Vocabulary via the shared weighted scoring engine. Given the same song it
 * always returns the same DNA (pure over the feature vector); given different
 * songs it diverges across the continuous signals, so the same genre yields
 * many different executions.
 *
 * Each layer is independent (it scores vocabulary against the vector on its
 * own). The only cross-layer influence is a SOFT bias from the active
 * Technique, applied once to a copy of the vector before any layer runs.
 */

const { buildFeatureVector, dspDims } = require('./featureVector')
const { selectConcept } = require('./scoring')
const { getCategory, getConcept } = require('../vocabulary')
const { conceptMediumFamily } = require('../assembler/promptAssembler')
const { TECHNIQUES } = require('../technique')
const { applyTechniqueBias, getAffinity, DEFAULT_TECHNIQUE, isValidTechnique } = require('../technique')
// Safe require order: emotion/index pulls in dna/scoring only, never dna/index,
// so this is a tree rather than a cycle.
const { readEmotion, emotionDnaBias } = require('../emotion')

/**
 * Layer registry. `priority` orders fragments in the assembled prompt and
 * weights the mean-confidence rollup. `fallbackId` is used only when scoring
 * yields nothing (empty category — should never happen in practice).
 * `explore`/`bonus` tune the seeded variety vs. the technique pull per layer.
 */
const LAYERS = [
  // artMedium: photographic realism is FELT's default, so give the technique
  // bonus (which only medium_photography carries) extra weight — an illustrated
  // medium must be a decisively better anchor match to win.
  // No longer a special case — true even competition across mediums. Was
  // explore:0.12/bonus:0.22 (near-argmax, huge technique bonus only photography
  // could ever earn), which meant illustration/CGI were mathematically starved
  // regardless of how well their anchors actually matched a track.
  { key: 'artMedium',      category: 'artMedium',      priority: 1,  fallbackId: 'medium_photography',    explore: 0.32 },
  { key: 'editorial',      category: 'editorial',      priority: 2,  fallbackId: 'edit_documentary',      explore: 0.30 },
  { key: 'subject',        category: 'subject',        priority: 3,  fallbackId: 'subj_editorial_minimal',explore: 0.30 },
  { key: 'pose',           category: 'pose',           priority: 3.5,fallbackId: 'pose_glancing_back',    explore: 0.35 },
  { key: 'environment',    category: 'environment',    priority: 4,  fallbackId: 'env_seamless_studio',   explore: 0.35 },
  { key: 'camera',         category: 'camera',         priority: 5,  fallbackId: 'cam_hasselblad_h6d',    explore: 0.30 },
  { key: 'lens',           category: 'lens',           priority: 6,  fallbackId: 'lens_80mm_f28',         explore: 0.30 },
  { key: 'filmStock',      category: 'filmStock',      priority: 7,  fallbackId: 'film_digital_clean',    explore: 0.35 },
  { key: 'lighting',       category: 'lighting',       priority: 8,  fallbackId: 'light_north_window',    explore: 0.30 },
  { key: 'motion',         category: 'motion',         priority: 9,  fallbackId: 'motion_freeze',         explore: 0.25 },
  { key: 'composition',    category: 'composition',    priority: 10, fallbackId: 'comp_rule_of_thirds',   explore: 0.35 },
  { key: 'color',          category: 'color',          priority: 11, fallbackId: 'color_muted_earth',     explore: 0.35 },
  { key: 'texture',        category: 'texture',        priority: 12, fallbackId: 'tex_fine_film_grain',   explore: 0.25 },
  { key: 'postProcessing', category: 'postProcessing', priority: 13, fallbackId: 'post_none',             explore: 0.30 },
  { key: 'typography',     category: 'typography',     priority: 14, fallbackId: 'type_lower_third',      explore: 0.35 },
  { key: 'symbolism',      category: 'symbolism',      priority: 15, fallbackId: 'sym_none',              explore: 0.30 },
  { key: 'graphic',        category: 'graphic',        priority: 16, fallbackId: 'graphic_clean_photo',   explore: 0.25, bonus: 0.12 },
]

function fallbackSelection(layer) {
  const concept = getCategory(layer.category).find((c) => c.id === layer.fallbackId)
  return {
    layer: layer.key,
    conceptId: concept ? concept.id : layer.fallbackId,
    fragment: concept ? concept.fragment : '',
    confidence: 0,
    fallback: true,
    alternatives: [],
  }
}

/**
 * @param {import('../types').RawAudioFeatures} rawFeatures
 * @param {string} [techniqueName]
 * @returns {import('../types').VisualDNA}
 */
/**
 * Additive, clamped bias over the numeric dimensions of a vector. Same
 * semantics as applyTechniqueBias so the two compose predictably; `meta` is
 * carried by reference because it holds the PRNG seed and DSP presence flags.
 */
function applyBias(vector, bias) {
  if (!bias) return vector
  const out = { ...vector, meta: vector.meta }
  for (const [dim, delta] of Object.entries(bias)) {
    if (typeof out[dim] === 'number') {
      out[dim] = Math.max(0, Math.min(1, out[dim] + delta))
    }
  }
  return out
}

function computeVisualDNA(rawFeatures, techniqueName, opts = {}) {
  const technique = isValidTechnique(techniqueName) ? techniqueName : DEFAULT_TECHNIQUE
  const vector = buildFeatureVector(rawFeatures)

  // EMOTIONAL BIAS — the emotion layer's read of the track (aesthetic state,
  // visual intensity, kinetic level) nudges the vector before any concept is
  // scored, so a Gritty/Luxury world and a High/Low intensity actually change
  // WHICH vocabulary wins rather than only what the prompt text says. Applied
  // before the technique bias so an explicit art direction still has the last
  // word.
  //
  // `intentText` used to be hardcoded to '' here, which silently discarded the
  // semantic-correction layer for this entire call — a track described as "I
  // feel hope, everything is gonna be alright" got its VALENCE CORRECTED for
  // technique selection (resolveTechnique, elsewhere) but the graphic/color/
  // lighting/composition choices made right here still scored against the raw,
  // uncorrected audio valence, because this function re-derives its own emotion
  // read from scratch instead of receiving the corrected one. A real generation
  // ended up with `graphic_panel_grid` (anchored for low-valence, gritty,
  // aggressive tracks — "a mugshot-style lineup") on a song about hope, purely
  // because this one call never saw the words that corrected the read
  // everywhere else. Passing the same text through here closes that split.
  const emotion = readEmotion(vector, vector.meta.genre, opts.intentText || '')
  // `emotion.correctedVector` is what readEmotion() actually corrected against
  // intentText (valence/motion/danceability/energy) — bias from the ORIGINAL
  // `vector` here would silently discard that correction a second time, right
  // after the previous fix went to the trouble of letting intentText reach
  // this function at all. This is the vector every layer below scores against.
  const biased = applyTechniqueBias(applyBias(emotion.correctedVector, emotionDnaBias(emotion)), technique)

  // Module 3 axes this track has no real measurement for. Excluded from
  // scoring so a legacy track cannot earn points on evidence it never had.
  const skipDims = dspDims(vector)

  const selections = {}
  const fragments = {}
  let confSum = 0
  let confWeight = 0

  for (const layer of LAYERS) {
    const all = getCategory(layer.category)

    // ART DIRECTION IS A SHORTLIST, NOT A NUDGE.
    // When the technique names the concepts it wants for this layer, the music
    // chooses AMONG those — it cannot leave the set. This was previously only a
    // +0.30 scoring bonus, which an extreme track could outvote: an aggressive
    // drill song pulled `motion_strobe_freeze` (0.878) over the art-directed
    // `motion_freeze` (0.854) inside SILHOUETTE_ATMOSPHERE — a technique built
    // on stillness. A soft bonus can always lose by a hair, which silently
    // reintroduces exactly the cross-layer contradictions the affinity table
    // exists to prevent.
    //
    // Variety is preserved: the anchor still picks between the technique's
    // options (plus seeded near-tie exploration), so different songs under the
    // same technique still diverge. Layers with no affinity (subject,
    // environment, artMedium, graphic, typography) score freely as before.
    const shortlist = getAffinity(technique, layer.key)
    let candidates = shortlist.length
      ? all.filter((c) => shortlist.includes(c.id))
      : all

    // MEDIUM AGREEMENT.
    // The scene is written BEFORE the technique is known, so it has already
    // committed to a medium family ("you write ONE rendered moment"). If the
    // per-technique scoring here then picked a different family, the prompt
    // would describe a photograph and label it a 3D render — the exact
    // contradiction this constraint exists to prevent. When the caller states
    // the family the scene was written for, the medium layer must stay inside it.
    if (layer.key === 'artMedium' && opts.mediumFamily) {
      const inFamily = candidates.filter((c) => conceptMediumFamily(c) === opts.mediumFamily)
      if (inFamily.length) candidates = inFamily
    }

    // GRAPHIC/MEDIUM AGREEMENT.
    // `graphic` scores independently of `artMedium` with no cross-check, and a
    // real generation surfaced the result: artMedium picked `medium_screenprint`
    // ("a bold screen-print with flat color blocking and halftone dots") while
    // graphic independently picked `graphic_clean_photo` ("presented as a
    // straight photograph with no graphic overlay") — a screen-print declared
    // to be a straight photograph in the same sentence. Unlike artMedium, most
    // `graphic` concepts (parental-advisory stamp, vinyl sleeve framing, collage,
    // minimal-luxury layout) are genuinely medium-agnostic and must stay
    // eligible everywhere — only the few that make an explicit competing medium
    // claim need excluding, not the whole category.
    if (layer.key === 'graphic' && opts.mediumFamily) {
      const compatible = candidates.filter((c) => {
        const t = c.tags || []
        if (t.includes('photographic') && opts.mediumFamily !== 'photo') return false
        if (t.includes('risograph') && opts.mediumFamily === 'photo') return false
        return true
      })
      if (compatible.length) candidates = compatible
    }

    // TECHNIQUE AUTHORITY.
    // The selected technique may declare certain graphic mediums as fundamentally
    // incompatible with its visual language. For example, INFRARED_THERMAL is a
    // photographic technique — illustration mediums like collage or screen-print
    // directly contradict it. Check the technique's graphicForbidden list and
    // exclude those concepts entirely, preventing the DNA from undermining the
    // already-chosen technique.
    if (layer.key === 'graphic' && technique) {
      const t = TECHNIQUES[technique]
      if (t && t.graphicForbidden && t.graphicForbidden.length > 0) {
        const compatible = candidates.filter((c) => !t.graphicForbidden.includes(c.id))
        if (compatible.length > 0) {
          console.log(`[DNA-TECHNIQUE] ${technique} forbids [${t.graphicForbidden.join(', ')}], filtered to ${compatible.length} candidates`)
          candidates = compatible
        }
      }
    }

    // TONAL AGREEMENT.
    // `graphic_panel_grid`'s anchor is { grit: 0.55, aggression: 0.55, energy:
    // 0.55, valence: 0.4 } — four dimensions, only one of which (valence) the
    // semantic-correction layer ever touches. A track described as "I feel
    // hope, everything's gonna be alright" gets its valence corrected from
    // 0.48 to 0.78, but that alone isn't enough to outweigh a grit/aggression/
    // energy match, so a "mugshot-style lineup" — a specifically negative,
    // institutional image — still won on a genuinely hopeful track. No amount
    // of sonic grit makes a police-booking-photo layout the right read for
    // "everything is gonna be alright", so this excludes it outright once the
    // corrected valence is clearly positive, rather than leaving it to an
    // anchor-score tug-of-war it can still win on other axes.
    if (layer.key === 'graphic' && biased.valence >= 0.65) {
      const tonal = candidates.filter((c) => !(c.tags || []).includes('mugshot'))
      if (tonal.length) candidates = tonal
    }

    // NO-PEOPLE AGREEMENT.
    // `graphic_panel_grid` ("a mugshot-style lineup or stacked-portrait grid")
    // was winning on tracks the metaphor/scene had already decided were
    // people-free — a real generation ended up with that portrait-grid
    // framing plus "correct hands" in the reality tail on a cover about a
    // mooring rope with no person anywhere in the scene. The graphic layer has
    // no technique affinity to filter through (see the comment above), so it
    // needs its own guard: when the caller says this cover has no person,
    // concepts explicitly tagged for portraiture are excluded from selection
    // entirely rather than merely discouraged.
    if (layer.key === 'graphic' && opts.noPeople) {
      const peopleFree = candidates.filter((c) => !(c.tags || []).includes('mugshot'))
      if (peopleFree.length) candidates = peopleFree
    }

    // Same reasoning applies to symbolism — `sym_hands` ("a close study of one
    // pair of hands at rest") and `sym_crowd_surge` ("many raised arms filling
    // the frame") are symbols where a body part IS the entire image, not a
    // reference that can be reworded onto an object the way a lighting
    // fragment can. No sensible object-only version of "a pair of hands"
    // exists, so these are excluded rather than rewritten.
    if (layer.key === 'symbolism' && opts.noPeople) {
      const peopleFree = candidates.filter((c) => {
        const t = c.tags || []
        return !t.includes('hands') && !t.includes('bodies')
      })
      if (peopleFree.length) candidates = peopleFree
    }

    const { selection } = selectConcept(candidates.length ? candidates : all, biased, {
      technique,
      explore: layer.explore,
      techniqueBonus: layer.bonus,
      skipDims,
    })
    const chosen = selection || fallbackSelection(layer)
    chosen.layer = layer.key
    chosen.priority = layer.priority

    // Log the selection so we can audit what's actually being chosen
    if (layer.key === 'graphic' || layer.key === 'lighting' || layer.key === 'color') {
      console.log(`[DNA-SELECT] ${layer.key}: ${chosen.conceptId} → "${chosen.fragment.substring(0, 70)}..."`)
    }

    // STATE-AWARE STAGING.
    // A symbol carries one meaning but is a different physical object in a
    // different world — the open road is a coastal highway from a supercar in
    // Luxury and a cracked two-lane with weeds through it in Gritty. Concepts
    // that declare `staging` resolve their fragment from the aesthetic state the
    // emotion layer just read, exactly as an archetype resolves its cell.
    // Concepts without `staging` are untouched.
    const concept = getConcept(chosen.conceptId)
    const staged = concept && concept.staging && concept.staging[emotion.state]
    if (staged) chosen.fragment = staged

    // NO-PEOPLE AWARE FRAGMENTS.
    // A handful of technique-locked concepts (infrared's "faces reading as
    // thermal blooms rather than lit skin", etc.) describe how the technique
    // renders a PERSON specifically. On a no-people cover that reference has
    // nothing to point at, so concepts that declare `noPeopleFragment` swap in
    // their own creative read of the same technique applied to whatever IS in
    // frame instead — the technique doesn't disappear, it just stops assuming
    // a face. Concepts without one are untouched (most don't mention a person
    // at all and don't need this).
    if (opts.noPeople && concept && concept.noPeopleFragment) chosen.fragment = concept.noPeopleFragment

    selections[layer.key] = chosen
    fragments[layer.key] = chosen.fragment

    // Higher-priority (lower number) layers weigh a little more in the rollup.
    const w = 1 / layer.priority
    confSum += chosen.confidence * w
    confWeight += w
  }

  return {
    technique,
    vector,
    selections,
    fragments,
    confidence: confWeight > 0 ? Math.round((confSum / confWeight) * 1000) / 1000 : 0,
  }
}

/** Fragments in assembler priority order — used by the Prompt Assembler. */
function orderedFragments(dna) {
  return LAYERS
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map((l) => ({ key: l.key, fragment: dna.fragments[l.key] }))
    .filter((f) => f.fragment)
}

module.exports = { computeVisualDNA, orderedFragments, LAYERS }

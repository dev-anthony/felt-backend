'use strict'
/**
 * VISUAL VOCABULARY — public index.
 *
 * FELT's complete visual language, aggregated from every domain file. This is
 * KNOWLEDGE: no logic, no prompts, no scenes. The Visual DNA Engine imports
 * `VOCABULARY` and selects concepts from it; it may never invent concepts that
 * do not exist here.
 *
 * Each category maps to one DNA layer. `byId` gives O(1) lookup for the
 * assembler and for debugging a stored DNA.
 */

const photo = require('./photography')
const design = require('./design')
const creative = require('./creative')
const symbolism = require('./symbolism')

/** category → concept[] */
const VOCABULARY = {
  camera: photo.CAMERAS,
  lens: photo.LENSES,
  filmStock: photo.FILM_STOCKS,
  lighting: photo.LIGHTING,
  motion: photo.MOTION,
  texture: photo.TEXTURE,
  postProcessing: photo.POST_PROCESSING,
  composition: design.COMPOSITION,
  color: design.COLOR_SYSTEMS,
  environment: design.ENVIRONMENTS,
  graphic: design.GRAPHIC_TREATMENTS,
  typography: design.TYPOGRAPHY_ZONES,
  subject: creative.SUBJECT_ARCHETYPES,
  editorial: creative.EDITORIAL_STYLES,
  artMedium: creative.ART_MEDIUMS,
  symbolism: symbolism.SYMBOLISM,
}

// Flat id → concept index across all categories.
const byId = new Map()
for (const [category, concepts] of Object.entries(VOCABULARY)) {
  for (const c of concepts) {
    if (byId.has(c.id)) {
      throw new Error(`[VOCABULARY] duplicate concept id "${c.id}" — ids must be globally unique`)
    }
    if (c.category !== category) {
      throw new Error(`[VOCABULARY] concept "${c.id}" declares category "${c.category}" but lives under "${category}"`)
    }
    byId.set(c.id, c)
  }
}

function getConcept(id) {
  return byId.get(id) || null
}

function getCategory(category) {
  return VOCABULARY[category] || []
}

/** Total concept count — handy for a startup sanity log. */
function size() {
  return byId.size
}

module.exports = { VOCABULARY, getConcept, getCategory, size }

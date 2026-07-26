'use strict'
/**
 * POSE / GESTURE — scored the same way as every other DNA layer, replacing
 * the old BANNED_POSES prompt-level approach (a list of "don't"s is the
 * weakest lever on an LLM; a scored concrete suggestion is the strongest).
 *
 * Anchored against BOTH the emotion vector and — via technique affinity —
 * the active technique's own movement/chaos axes, so a high-movement
 * technique (MOTION_BLUR_STROBE) and a still one (MACRO_INTIMATE_DETAIL)
 * pull toward genuinely different gestures.
 */

/** @type {import('../types').VocabularyConcept[]} */
const POSE = [
  { id: 'pose_mid_dance', category: 'pose', tags: ['dance', 'motion'],
    fragment: 'caught mid-dance, weight shifted onto one foot, hair and fabric still moving from the last beat',
    anchor: { danceability: 0.75, motion: 0.7, energy: 0.65 },
    techniques: ['MOTION_BLUR_STROBE', 'FLASH_DOCUMENTARY'] },
  { id: 'pose_reaching_edge', category: 'pose', tags: ['implication', 'action'],
    fragment: 'reaching toward the edge of frame as if toward someone just out of shot',
    anchor: { intimacy: 0.5, motion: 0.4, valence: 0.5 } },
  { id: 'pose_glancing_back', category: 'pose', tags: ['implication', 'candid'],
    fragment: 'glancing back over one shoulder mid-step, caught rather than posed',
    anchor: { motion: 0.5, grit: 0.4, energy: 0.45 },
    techniques: ['FLASH_DOCUMENTARY', 'ENVIRONMENTAL_WIDE_DOCUMENTARY'] },
  { id: 'pose_object_held_to_face', category: 'pose', tags: ['object-substitute', 'partial-occlusion'],
    fragment: 'holding one meaningful object up against part of the face — not hiding it in shadow, but occluding it with something that carries the meaning',
    anchor: { intimacy: 0.5, darkness: 0.4, aggression: 0.3 } },
  { id: 'pose_low_stance_dominant', category: 'pose', tags: ['power', 'action'],
    fragment: 'a low, grounded stance with weight forward, an object or gesture aimed rather than held passively',
    anchor: { aggression: 0.6, energy: 0.6, euphoria: 0.4 },
    techniques: ['STUDIO_SEAMLESS_EDITORIAL', 'GRAPHIC_PANEL_COMPOSITE'] },
  { id: 'pose_working_hands', category: 'pose', tags: ['craft', 'labor'],
    fragment: 'hands actively working an object — adjusting, holding, mid-task — never posed at rest',
    anchor: { intimacy: 0.6, acousticness: 0.5, energy: 0.35 } },
  { id: 'pose_still_meditative', category: 'pose', tags: ['stillness', 'held'],
    fragment: 'held completely still, weight settled, a single deliberate held breath rather than a frozen pose',
    anchor: { energy: 0.2, motion: 0.15, intimacy: 0.55 },
    techniques: ['MACRO_INTIMATE_DETAIL', 'MONUMENTAL_SCALE_ISOLATION'] },
  { id: 'pose_walking_through', category: 'pose', tags: ['motion', 'environment'],
    fragment: 'mid-stride walking through the environment, engaged with the space rather than facing the camera',
    anchor: { motion: 0.55, energy: 0.5, grit: 0.4 },
    techniques: ['ENVIRONMENTAL_WIDE_DOCUMENTARY', 'VINTAGE_FILM_NOSTALGIA'] },
]

module.exports = { POSE }
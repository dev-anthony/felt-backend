'use strict'
/**
 * FELT VISUAL OPERATING SYSTEM — public entrypoint.
 *
 * Pipeline: Essentia features → Feature Normalization → (Technique) →
 * Visual DNA → [Gemini Compiler] → Prompt Assembler → FLUX prompt string.
 *
 * Two ways to build the final prompt:
 *   1. assembleFromScene()  — DETERMINISTIC, no LLM. Uses an existing scene
 *      sentence (from /transcribe or /expand) as the story block and enriches
 *      it with the full Visual DNA. Same song → same prompt.
 *   2. orchestrate()        — FULL pipeline. Calls the Gemini Compiler for a
 *      structured scene blueprint constrained by the DNA, then assembles.
 *      Requires an injected `generate(promptText, opts) => Promise<string>`.
 */

const { computeVisualDNA, orderedFragments, LAYERS } = require('./dna')
const { assemblePrompt, mediumFamily } = require('./assembler/promptAssembler')
const { compileScene } = require('./compiler/geminiCompiler')
const technique = require('./technique')
const vocabulary = require('./vocabulary')

/**
 * Minimum DNA symbolism confidence for the deterministic path. Below this the
 * motif is treated as `sym_none` and omitted rather than attached to a scene it
 * was never matched against.
 */
const DETERMINISTIC_SYMBOLISM_MIN_CONFIDENCE = 0.6

/**
 * DETERMINISTIC prompt build — no Gemini call. The `sceneText` (already written
 * upstream) becomes the story; the DNA supplies every visual/technical block.
 * @returns {import('./types').AssembledPrompt}
 */
function assembleFromScene({ features, techniqueName, sceneText, dna: providedDna, noPeople = false, mediumFamily }) {
  const dna = providedDna || computeVisualDNA(features, techniqueName, { mediumFamily })
  // The scene sentence already contains the subject AND the setting (it is the
  // whole story), so we do NOT inject the DNA subject archetype — doing so would
  // describe two different people in one prompt. The DNA supplies only the look.
  const blueprint = {
    subject: '',
    wardrobe: '',
    pose: '',
    expression: '',
    sceneAction: (sceneText || '').trim(),
    narrative: '',
    symbolism: 'none',
  }
  // This path has no Gemini-chosen symbolism, so `assemblePrompt` would fall back
  // to the DNA's own pick for EVERY scene — a pick never checked against the
  // scene text. Require a confident match before letting a motif attach, so a
  // weakly-matched object isn't glued onto an unrelated scene.
  return assemblePrompt({
    blueprint,
    dna,
    noPeople,
    symbolismMinConfidence: DETERMINISTIC_SYMBOLISM_MIN_CONFIDENCE,
  })
}

/**
 * FULL pipeline — Visual DNA → Gemini Compiler → Assembler.
 * @param {object} args
 * @param {(promptText:string, opts?:object)=>Promise<string>} args.generate
 * @returns {Promise<import('./types').AssembledPrompt & { compilerFallback: boolean }>}
 */
async function orchestrate({ generate, features, techniqueName, userFeeling, lyricsTheme, mood, fallbackScene, noPeople = false }) {
  const dna = computeVisualDNA(features, techniqueName)
  const { blueprint, fallback } = await compileScene({
    generate,
    technique: dna.technique,
    dna,
    userFeeling,
    lyricsTheme,
    mood: mood || dna.vector.meta.mood,
    fallbackScene,
  })
  const assembled = assemblePrompt({ blueprint, dna, noPeople })
  return { ...assembled, compilerFallback: fallback }
}

module.exports = {
  mediumFamily,
  // high-level
  computeVisualDNA,
  assembleFromScene,
  orchestrate,
  // sub-systems (for advanced callers / tests)
  assemblePrompt,
  compileScene,
  technique,
  vocabulary,
  orderedFragments,
  LAYERS,
}

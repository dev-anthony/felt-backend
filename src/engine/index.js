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
const { assemblePrompt } = require('./assembler/promptAssembler')
const { compileScene } = require('./compiler/geminiCompiler')
const technique = require('./technique')
const vocabulary = require('./vocabulary')

/**
 * DETERMINISTIC prompt build — no Gemini call. The `sceneText` (already written
 * upstream) becomes the story; the DNA supplies every visual/technical block.
 * @returns {import('./types').AssembledPrompt}
 */
function assembleFromScene({ features, techniqueName, sceneText, dna: providedDna }) {
  const dna = providedDna || computeVisualDNA(features, techniqueName)
  const subjectFrag = dna.selections.subject ? dna.selections.subject.fragment : 'a single figure'
  const blueprint = {
    subject: subjectFrag,
    wardrobe: '',
    pose: '',
    expression: '',
    sceneAction: (sceneText || '').trim(),
    narrative: '',
    symbolism: 'none',
  }
  return assemblePrompt({ blueprint, dna })
}

/**
 * FULL pipeline — Visual DNA → Gemini Compiler → Assembler.
 * @param {object} args
 * @param {(promptText:string, opts?:object)=>Promise<string>} args.generate
 * @returns {Promise<import('./types').AssembledPrompt & { compilerFallback: boolean }>}
 */
async function orchestrate({ generate, features, techniqueName, userFeeling, lyricsTheme, mood, fallbackScene }) {
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
  const assembled = assemblePrompt({ blueprint, dna })
  return { ...assembled, compilerFallback: fallback }
}

module.exports = {
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

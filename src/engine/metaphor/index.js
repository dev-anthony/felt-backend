'use strict'
/**
 * VISUAL METAPHOR LAYER.
 *
 * Sits between the emotion read and the scene writer. Without it, the scene
 * writer goes straight from "here is the emotion" to "write a photographable
 * scene" — and an LLM asked to stage an emotion directly defaults to the
 * single most statistically common scene for that archetype/genre (a person
 * doing an on-the-nose action in a genre-coded location). This stage forces
 * one extra step first: name the physical IMAGE before any scene, location or
 * camera decision exists, so the scene writer gets a concrete, non-negotiable
 * anchor instead of a blank emotional brief to fill in on its own.
 *
 * One extra Gemini call, same retry-free best-effort shape as the rest of this
 * pipeline: on any failure this returns `metaphor: null` and the caller falls
 * back to writing the scene without one, exactly as it did before this layer
 * existed.
 */

function buildMetaphorPrompt({ userFeeling, context }) {
  return `You are a visual metaphor generator for album cover art. Your ONLY job: turn an emotional truth into ONE physical image — not a photograph yet, not a staged scene, just the IMAGE that could only mean this.

ARTIST'S OWN WORDS (the primary source — read this first): "${userFeeling}"
${context ? `\nADDITIONAL CONTEXT (secondary — use only to refine, never to override the words above):\n${context}\n` : ''}
Generate 4 distinct visual metaphors: specific, nameable physical objects, materials or situations (with or without a person) that embody this emotional truth WITHOUT illustrating the artist's words literally.

Rules:
- Do NOT default to "a person standing/reaching/dancing somewhere". That is a scene, not a metaphor — stay one level more abstract than that.
- Each metaphor must be concrete and nameable: "a cassette tape spilling from its shell", "a hand losing its grip on a wet railing", "a balloon caught in telephone wires" — never abstract ("a feeling of loss", "a sense of longing").
- Draw from ANY domain — objects, weather, animals, architecture, food, tools, technology, decay, growth, the body. Do not default to nightlife, fashion, or genre-coded imagery unless the artist's words explicitly call for it.
- Vary literalness: at least one near-literal physical translation of the words, and at least one unexpected lateral connection nobody would guess first.
- Order best-first — the metaphor a sharp art director would pick as the single most striking, specific image for THIS emotional truth, not the safest one.

Respond with ONLY valid JSON, nothing else, no markdown fences, no commentary:
{"metaphors": ["...", "...", "...", "..."]}`
}

function parseMetaphors(rawText) {
  if (!rawText) return []
  const cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed.metaphors)) {
      return parsed.metaphors.filter((m) => typeof m === 'string' && m.trim()).map((m) => m.trim())
    }
  } catch {
    // Malformed JSON — treat as no usable metaphors, caller falls back cleanly.
  }
  return []
}

/**
 * @param {(promptText:string)=>Promise<string>} generate injected Gemini text call
 * @param {string} userFeeling the artist's own words — required, this is the anchor
 * @param {string} [context] optional secondary context (EMOTIONAL REGISTER block, sonic features, etc.)
 * @returns {Promise<{ metaphor: string|null, candidates: string[] }>}
 */
async function generateVisualMetaphors({ generate, userFeeling, context }) {
  const feeling = (userFeeling || '').trim()
  if (!feeling) return { metaphor: null, candidates: [] }
  try {
    const rawText = await generate(buildMetaphorPrompt({ userFeeling: feeling, context }))
    const candidates = parseMetaphors(rawText)
    return { metaphor: candidates[0] || null, candidates }
  } catch (err) {
    console.warn(`[VISUAL METAPHOR] generation failed, continuing without one: ${err?.message || err}`)
    return { metaphor: null, candidates: [] }
  }
}

module.exports = { generateVisualMetaphors }

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
 * Each candidate is also tagged `hasPerson`. Subject presence used to be
 * decided upstream from the audio feature vector alone (`deriveSceneMode`),
 * completely disconnected from whatever metaphor eventually won — so a purely
 * object metaphor ("a complex knot caught mid-untangling") would still get a
 * person bolted onto it because the audio read defaulted to `subjectMode:
 * 'person'` before the metaphor existed. The winning metaphor's own tag is
 * now the source of truth for whether a figure belongs in the frame at all —
 * a figure is something the image earns, not a default the audio assumes.
 *
 * One extra Gemini call, same retry-free best-effort shape as the rest of this
 * pipeline: on any failure this returns `metaphor: null, hasPerson: null` and
 * the caller falls back to the audio-derived subject read, exactly as it did
 * before this layer existed.
 */

function buildMetaphorPrompt({ userFeeling, context }) {
  return `You are a visual metaphor generator for album cover art. Your ONLY job: turn an emotional truth into ONE physical image — not a photograph yet, not a staged scene, just the IMAGE that could only mean this.

ARTIST'S OWN WORDS (the primary source — read this first): "${userFeeling}"
${context ? `\nADDITIONAL CONTEXT (secondary — use only to refine, never to override the words above):\n${context}\n` : ''}
Generate 4 distinct visual metaphors: specific, nameable physical objects, materials or situations that embody this emotional truth WITHOUT illustrating the artist's words literally.

Rules:
- Do NOT default to "a person standing/reaching/dancing somewhere". That is a scene, not a metaphor — stay one level more abstract than that.
- Each metaphor must be concrete and nameable: "a cassette tape spilling from its shell", "a hand losing its grip on a wet railing", "a balloon caught in telephone wires" — never abstract ("a feeling of loss", "a sense of longing").
- Draw from ANY domain — objects, weather, animals, architecture, food, tools, technology, decay, growth, the body. Do not default to nightlife, fashion, or genre-coded imagery unless the artist's words explicitly call for it.
- A person is NOT required. Do not add one out of habit — only include a person in a metaphor when the image genuinely needs a human body to work (a hand, a gesture, a figure). An object, material or place that carries the full weight of the emotion on its own is just as valid, often stronger.
- Vary literalness AND vary whether a person is present: across the 4 candidates, aim for a real mix — at least one that is a pure object/material/place with NO person or body part in it at all, and at least one near-literal physical translation of the words.
- Order best-first — the metaphor a sharp art director would pick as the single most striking, specific image for THIS emotional truth, not the safest one. A more original object-only image should beat a generic person-based one.
- For each metaphor, honestly tag whether it involves a person or any body part (hand, eyes, silhouette) at all.

Respond with ONLY valid JSON, nothing else, no markdown fences, no commentary:
{"metaphors": [{"image": "...", "hasPerson": true}, {"image": "...", "hasPerson": false}, {"image": "...", "hasPerson": true}, {"image": "...", "hasPerson": false}]}`
}

function parseMetaphors(rawText) {
  if (!rawText) return []
  const cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  try {
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed.metaphors)) return []
    return parsed.metaphors
      .filter((m) => m && typeof m.image === 'string' && m.image.trim())
      .map((m) => ({ image: m.image.trim(), hasPerson: m.hasPerson === true }))
  } catch {
    // Malformed JSON — treat as no usable metaphors, caller falls back cleanly.
    return []
  }
}

/**
 * @param {(promptText:string)=>Promise<string>} generate injected Gemini text call
 * @param {string} userFeeling the artist's own words — required, this is the anchor
 * @param {string} [context] optional secondary context (EMOTIONAL REGISTER block, sonic features, etc.)
 * @returns {Promise<{ metaphor: string|null, hasPerson: boolean|null, candidates: {image:string,hasPerson:boolean}[] }>}
 */
async function generateVisualMetaphors({ generate, userFeeling, context }) {
  const feeling = (userFeeling || '').trim()
  if (!feeling) return { metaphor: null, hasPerson: null, candidates: [] }
  try {
    const rawText = await generate(buildMetaphorPrompt({ userFeeling: feeling, context }))
    const candidates = parseMetaphors(rawText)
    const winner = candidates[0] || null
    return {
      metaphor: winner ? winner.image : null,
      hasPerson: winner ? winner.hasPerson : null,
      candidates,
    }
  } catch (err) {
    console.warn(`[VISUAL METAPHOR] generation failed, continuing without one: ${err?.message || err}`)
    return { metaphor: null, hasPerson: null, candidates: [] }
  }
}

module.exports = { generateVisualMetaphors }

'use strict'
/**
 * GEMINI PROMPT COMPILER — FELT's storyteller.
 *
 * Gemini is no longer the creative director. The Visual DNA Engine has ALREADY
 * decided camera, lens, film, lighting, composition, motion, color, texture,
 * environment styling, graphic treatment and typography. Gemini's only job is
 * the human story: WHO is in frame, what they are doing, and what it means.
 *
 * It returns STRUCTURED JSON so the Prompt Assembler can consume it reliably —
 * no free-form paragraph to regex-scrape. It is explicitly forbidden from
 * naming any photographic/technical decision, because those are the DNA's.
 *
 * This module is transport-agnostic: pass a `generate(promptText, opts)` async
 * function (the caller's existing retry-wrapped Gemini call). Keeps the engine
 * decoupled from the SDK and unit-testable.
 */

const FORBIDDEN_KEYS = [
  'camera', 'lens', 'film', 'lighting', 'composition', 'motion',
  'color', 'texture', 'environment style', 'grain', 'exposure',
]

/**
 * Builds the compiler prompt. The DNA is passed in as human-readable
 * constraints so Gemini writes a story that FITS the already-chosen look
 * instead of fighting it.
 */
function buildCompilerPrompt({ technique, dna, userFeeling, lyricsTheme, mood }) {
  const s = dna.selections
  const constraint = (k) => (s[k] && s[k].fragment) || ''

  return `You are the STORY writer for an album cover. All photographic and design decisions are already locked by the art department — you must NOT change or restate them. Your ONLY job is the human story inside the frame.

LOCKED ART DIRECTION (context only — never describe these, they are handled elsewhere):
- Storytelling technique: ${technique}
- Subject styling already chosen: ${constraint('subject')}
- Environment already chosen: ${constraint('environment')}
- Symbolic motif already available: ${constraint('symbolism')}

STORY INPUTS:
- Artist's core feeling: "${(userFeeling || '').trim() || 'unspoken intensity'}"
- Distilled emotional theme: "${(lyricsTheme || '').trim() || 'instrumental emotional weight'}"
- Overall mood: "${mood || 'balanced'}"

RULES:
- Return ONLY minified JSON, no prose, no markdown fences.
- Describe ONE subject only. Never two people touching, embracing, kissing, or in romantic/sexual contact — translate any such energy through a single figure's expression, posture, distance, or the symbolic motif instead.
- Do NOT mention cameras, lenses, film, lighting, grain, color grading, composition, or motion — those are locked and handled by the art department.
- Keep the subject and environment consistent with the locked styling above.
- CONSTRUCT A REAL PERSON, not a vague type. Give concrete physical facts: approximate age, build, skin tone/undertone, hair texture and exact styling, specific garments with fabric and color, a defining accessory, and a real expression. BANNED vague words: "beautiful", "stunning", "sculptural", "high-fashion figure", "enigmatic", "mysterious figure", "a person", "someone". Replace each with tangible detail.
- Concrete and physical, not abstract or poetic. No metaphors in the phrasing.

Return exactly this JSON shape:
{"subject":"a tangible constructed person: age, build, skin tone, hair texture and styling","wardrobe":"specific garments with fabric+color and one defining accessory","pose":"body position, gesture, framing distance, and eye contact (e.g. chest-up, looking just off-lens)","expression":"a real facial expression","sceneAction":"what the subject is physically doing in the named setting","narrative":"the one-line emotional story of the moment","symbolism":"one physical symbolic object present, or 'none'"}`
}

/** Strips code fences / stray prose and parses the first JSON object found. */
function parseSceneJSON(rawText, fallback = {}) {
  const text = String(rawText || '').trim()
  const fenced = text.replace(/```(?:json)?/gi, '').trim()
  const start = fenced.indexOf('{')
  const end = fenced.lastIndexOf('}')

  let parsed = null
  if (start !== -1 && end !== -1 && end > start) {
    try {
      parsed = JSON.parse(fenced.slice(start, end + 1))
    } catch {
      parsed = null
    }
  }

  const base = {
    subject: 'a single figure',
    wardrobe: 'simple modern styling',
    pose: 'mid-shot, quiet posture',
    expression: 'composed, unreadable',
    sceneAction: 'still, caught mid-thought',
    narrative: 'a private emotional moment',
    symbolism: 'none',
    ...fallback,
  }

  if (!parsed || typeof parsed !== 'object') {
    // Couldn't get JSON — treat the whole response as the scene action so the
    // brief is never lost, and let the assembler + DNA carry the look.
    if (text) base.sceneAction = text.replace(/\s+/g, ' ').slice(0, 240)
    return { blueprint: base, fallback: true }
  }

  const blueprint = {}
  for (const key of Object.keys(base)) {
    const v = parsed[key]
    blueprint[key] = typeof v === 'string' && v.trim() ? v.trim() : base[key]
  }
  return { blueprint, fallback: false }
}

/**
 * Full compile step.
 * @param {object} args
 * @param {(promptText:string, opts?:object)=>Promise<string>} args.generate raw-text Gemini call
 * @returns {Promise<{ blueprint: import('../types').SceneBlueprint, fallback: boolean }>}
 */
async function compileScene({ generate, technique, dna, userFeeling, lyricsTheme, mood, fallbackScene }) {
  const promptText = buildCompilerPrompt({ technique, dna, userFeeling, lyricsTheme, mood })
  const fallback = fallbackScene ? { sceneAction: fallbackScene, narrative: fallbackScene } : {}
  try {
    const raw = await generate(promptText, { temperature: 0.85 })
    return parseSceneJSON(raw, fallback)
  } catch (err) {
    console.warn(`[COMPILER] scene compile failed, using fallback: ${err?.message || err}`)
    return parseSceneJSON('', fallback)
  }
}

module.exports = { buildCompilerPrompt, parseSceneJSON, compileScene, FORBIDDEN_KEYS }

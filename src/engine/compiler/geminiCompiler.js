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
- CHOOSE WHO fits this song — do NOT default to a young woman. Pick gender, an age that fits (child, teen, 20s-40s, elder), body/build and cultural context from the song. Men, women, children, elders, unconventional-looking people all belong. Make them MEMORABLE with one distinctive marker (fade/shaved lines, box braids, locs, durag, grey hair, gap/gold tooth, nose ring, face/hand tattoo, scar, freckles, cultural jewelry, a signature hat) — someone specific, not a stock model.
- SKIN must be specific and match the character: name a base tone from a real spectrum (porcelain → warm ivory → golden olive → honey-bronze → rich caramel → deep espresso → obsidian), an undertone (cool rosy, warm golden, neutral, olive, blue-black), and one micro-texture (freckles, visible pores, weathered lines, a scar). Do not always pick the same tone.
- WARDROBE has WEIGHT: name the garment AND how the fabric sits on the body (cut, stiffness, drape) — "a heavy structured wool coat cinched at the waist", not "a red dress"; "an oversized drop-shoulder heavy hoodie stacking at the wrists", not "streetwear". Real fabrics: aso-oke, velvet, wax-print, raw denim, leather, heavy knit, satin, mesh.
- Set a SPECIFIC named location with atmosphere and one or two meaningful props — never "a dimly lit room".
- Show ACTION, not a static pose. If the song is about movement/dancing, the body reads as in motion. Avoid "chin up, eyes closed, hand on chest".
- Concrete/structural, not abstract or editorial. BANNED words: "beautiful", "stunning", "attractive", "perfect", "athletic", "sculptural", "high-fashion figure", "enigmatic", "a person", "someone", "cool outfit", "stylish".
- BREVITY: each value is a SHORT phrase (~10-16 words), packed with concrete nouns, no full sentences.

Return exactly this JSON shape:
{"subject":"gender, age, build + skin base-tone/undertone/micro-texture + hair + one memorable marker","wardrobe":"specific garment (fabric+color) AND how it drapes/holds shape on the body","environment":"a specific named place + atmosphere + one prop","pose":"a moment of action/gesture + framing distance","expression":"a real facial expression","sceneAction":"what is physically HAPPENING in the moment","narrative":"one short emotional beat","symbolism":"one physical symbolic object, or 'none'"}`
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
    environment: '',
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

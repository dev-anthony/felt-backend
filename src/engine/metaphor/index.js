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

/**
 * The kinetic signal already exists upstream (`readEmotion` computes `kinetic`,
 * and the register block carries a MOVEMENT line), and it was already reaching
 * this module inside `context`. The problem was never that it was missing — it
 * was that the MOVEMENT line is written for the SCENE WRITER and is phrased
 * entirely in terms of a human body: "the body must read as physically in
 * motion (mid-step, mid-turn, mid-sway, fabric and hair moving)". Handed to a
 * metaphor generator that we deliberately push toward objects, materials and
 * places, that line is either inert (there is no body to move) or actively
 * harmful — it pulls toward inserting a figure purely to satisfy the motion
 * instruction. It also arrives labelled "secondary", so it is pre-weakened.
 *
 * This gives the kinetic signal its own statement, phrased as the physical
 * condition of MATTER rather than of a body, and separates two things the
 * previous phrasing conflated:
 *
 *   energy       = how much physical pressure exists inside the emotional idea
 *   danceability = whether that pressure is social/celebratory motion or not
 *
 * That distinction is the whole point. A track at energy 87 with danceability
 * 41 is under enormous pressure but is NOT a dance record, so the correct
 * visual is strain, resistance and imminent displacement — not dancing, crowds
 * or running, which is precisely the generic reflex this engine exists to kill.
 */
function buildKineticBlock(kinetics) {
  if (!kinetics) return ''
  const { energy, danceability, bpm, kinetic, intensityLabel } = kinetics

  // Three DIFFERENT signals, deliberately not collapsed into one number:
  //   energy       = how much force is inside the idea (pressure)
  //   kinetic      = whether that force is visibly moving or held (movement)
  //   danceability = whether the motion is social/celebratory (flavour)
  //
  // An earlier version derived the pressure tier from `kinetic`, which is
  // `0.55 * archetype.motionBias + 0.45 * vector.motion` — a MOVEMENT signal
  // that already blends motion in. That produced the self-contradiction
  // "Musical pressure: MODERATE (energy 87/100)" on the Lose You test, and
  // told the generator to stay gentle on a track carrying enormous force.
  // Pressure now comes from energy, movement stays its own axis.
  const pressure = energy >= 70 ? 'HIGH' : energy >= 40 ? 'MODERATE' : 'LOW'
  const moving = typeof kinetic === 'number' && kinetic >= 0.65
  const celebratory = typeof danceability === 'number' && danceability >= 60

  let directive
  if (pressure === 'HIGH' && celebratory) {
    directive = 'RELEASE - propulsion, overflow, scatter, something breaking outward or carried faster than it can be held. The momentum is being spent, not resisted.'
  } else if (pressure === 'HIGH' && moving) {
    directive = 'FORCEFUL DISPLACEMENT - something is actively being torn, driven, or carried away right now. The force has already won its first inch; this is the moment it is visibly happening, not the moment before.'
  } else if (pressure === 'HIGH') {
    directive = 'ACTIVE STRAIN - enormous force held, not released: under load, resisting, vibrating, stretched, gripping, at the instant before something gives. This is force being FOUGHT, not enjoyed and not merely awaited. A serenely poised, perfectly balanced, silent object is WRONG here - that reads as calm anticipation, and this track is well past anticipation.'
  } else if (pressure === 'MODERATE') {
    directive = 'MID-CHANGE - actively shifting, already in motion but not violent, caught between two states rather than settled in either. Not a still life, not an explosion.'
  } else {
    directive = 'STILL - suspended, weighted, quietly decaying or accumulating. Let stillness hold the frame; do not manufacture motion this track does not have.'
  }

  const energyBit = typeof energy === 'number' ? ' (energy ' + energy + '/100' + (bpm ? ', ' + bpm + ' BPM' : '') + ')' : ''
  const danceBit = typeof danceability === 'number' ? ' (danceability ' + danceability + '/100)' : ''
  const moveBit = typeof kinetic === 'number' ? ' (' + kinetic.toFixed(2) + ')' : ''

  return [
    '',
    'PHYSICAL STATE (governs the CONDITION of the metaphor, never its SUBJECT):',
    '- Force / pressure: ' + pressure + energyBit,
    '- Visible movement: ' + (moving ? 'HIGH' : 'HELD / RESTRAINED') + moveBit,
    '- Social, celebratory motion: ' + (celebratory ? 'HIGH' : 'LOW') + danceBit,
    intensityLabel ? '- Emotional intensity: ' + intensityLabel : '',
    '- REQUIRED PHYSICAL CONDITION: ' + directive,
    '',
    'How to use this - read carefully, this is where this engine usually fails:',
    '- The artist\'s words decide WHAT the metaphor is about. This block decides only what PHYSICAL CONDITION that thing is in. It must never change the subject.',
    '- High force with LOW celebratory motion means strain, resistance and imminent displacement. It does NOT mean dancing, running, crowds, parties, nightlife or speed - those need the artist\'s own words to call for them.',
    '- Do NOT add a human figure in order to express force. An object under load, a material giving way, or a place being acted on carries pressure better than a person moving, and a figure added for movement alone is the single most generic result this system can produce.',
    '- Force can be structural rather than athletic: a cable under tension, a surface fracturing, liquid breaking its meniscus, a joint slipping, a weight shifting past its tipping point, a seam starting to part.',
    '',
  ].filter(function (l) { return l !== '' || true }).join('\n')
}
function buildMetaphorPrompt({ userFeeling, context, kinetics }) {
  return `You are a visual metaphor generator for album cover art. Your ONLY job: turn an emotional truth into ONE physical image — not a photograph yet, not a staged scene, just the IMAGE that could only mean this.

ARTIST'S OWN WORDS (the primary source — read this first): "${userFeeling}"
${context ? `\nADDITIONAL CONTEXT (secondary — use only to refine, never to override the words above):\n${context}\n` : ''}${buildKineticBlock(kinetics)}
Generate 4 distinct visual metaphors: specific, nameable physical objects, materials or situations that embody this emotional truth WITHOUT illustrating the artist's words literally.

Rules:
- Do NOT default to "a person standing/reaching/dancing somewhere". That is a scene, not a metaphor — stay one level more abstract than that.
- Each metaphor must be concrete and nameable: "a cassette tape spilling from its shell", "a hand losing its grip on a wet railing", "a balloon caught in telephone wires" — never abstract ("a feeling of loss", "a sense of longing").
- Draw from ANY domain — objects, weather, animals, architecture, food, tools, technology, decay, growth, the body. Do not default to nightlife, fashion, or genre-coded imagery unless the artist's words explicitly call for it.
- A person is NOT required. Do not add one out of habit — only include a person in a metaphor when the image genuinely needs a human body to work (a hand, a gesture, a figure). An object, material or place that carries the full weight of the emotion on its own is just as valid, often stronger.
- Vary literalness AND vary whether a person is present: across the 4 candidates, aim for a real mix — at least one that is a pure object/material/place with NO person or body part in it at all, and at least one near-literal physical translation of the words.
- Order best-first — the metaphor a sharp art director would pick as the single most striking, specific image for THIS emotional truth, not the safest one. A more original object-only image should beat a generic person-based one.
- For each metaphor, honestly tag whether it involves a person or any body part (hand, eyes, silhouette) at all.

Diversity Requirement (CRITICAL):
- Your 4 metaphors must come from 4 DIFFERENT domains/types. Do NOT output 3 variations of the same idea.
- Types include: objects, weather, landscape, nature/materials, animals, architecture, light/weather, abstract phenomena, decay/growth, bodies/hands, water, fire/heat, plant/organic, geometric/structures, etc.
- Example WRONG output: hand holding rope, hand grasping something, figure gripping — all the same idea repeated. DO NOT DO THIS.
- Example RIGHT output: [abstract: eroding stone], [nature: wind carrying leaves], [object: fraying rope], [landscape: sunset disappearing] — each from a different domain, all expressing the same emotional truth.

Respond with ONLY valid JSON, nothing else, no markdown fences, no commentary:
{"metaphors": [{"image": "...", "hasPerson": false}, {"image": "...", "hasPerson": false}, {"image": "...", "hasPerson": false}, {"image": "...", "hasPerson": true}]}`
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
async function generateVisualMetaphors({ generate, userFeeling, context, kinetics }) {
  const feeling = (userFeeling || '').trim()
  if (!feeling) {
    console.log('[METAPHOR] empty userFeeling, returning null')
    return { metaphor: null, hasPerson: null, candidates: [] }
  }
  try {
    console.log(`[METAPHOR] generating from: "${feeling.substring(0, 80)}..."`)
    const rawText = await generate(buildMetaphorPrompt({ userFeeling: feeling, context, kinetics }))
    const candidates = parseMetaphors(rawText)
    const winner = candidates[0] || null

    console.log(`[METAPHOR] candidates generated: ${candidates.length}`)
    candidates.forEach((c, i) => {
      console.log(`  [${i}] ${c.hasPerson ? '[PERSON]' : '[NO-PERSON]'} ${c.image.substring(0, 60)}...`)
    })
    if (winner) {
      console.log(`[METAPHOR] SELECTED (rank 0): ${winner.hasPerson ? '[PERSON]' : '[NO-PERSON]'} "${winner.image.substring(0, 100)}..."`)
    } else {
      console.log('[METAPHOR] no valid candidates parsed')
    }

    return {
      metaphor: winner ? winner.image : null,
      hasPerson: winner ? winner.hasPerson : null,
      candidates,
    }
  } catch (err) {
    console.warn(`[METAPHOR] generation failed: ${err?.message || err}`)
    return { metaphor: null, hasPerson: null, candidates: [] }
  }
}

module.exports = { generateVisualMetaphors }
// Exported for tests: the physical-state block is pure and worth asserting directly.
module.exports.buildKineticBlock = buildKineticBlock

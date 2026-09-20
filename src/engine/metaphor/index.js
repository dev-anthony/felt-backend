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

const { ARCHETYPES } = require('../emotion')

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
/**
 * The twelve feelings the artist's WORDS can be about — the same closed set the
 * emotion layer scores audio against. The model may only answer with one of
 * these ids, so an unusual phrasing can never invent a category the rest of the
 * pipeline does not understand; anything else is discarded as "no reading".
 */
function feelingMenu() {
  return Object.entries(ARCHETYPES)
    .map(([id, a]) => '  ' + id + ' — ' + a.label)
    .join('\n')
}

function buildMetaphorPrompt({ userFeeling, context, kinetics }) {
  return `You are a visual metaphor generator for album cover art. Your ONLY job: turn an emotional truth into ONE physical image — not a photograph yet, not a staged scene, just the IMAGE that could only mean this.

ARTIST'S OWN WORDS (the primary source — read this first): "${userFeeling}"
${context ? `\nMEASURED FROM THE AUDIO (facts about the track — secondary, never overrides the words above):\n${context}\n` : ''}${buildKineticBlock(kinetics)}
STEP 1 — NAME THE FEELING. Which ONE of these twelve is the artist's WORDS mainly about?
${feelingMenu()}
Judge the emotional SUBJECT of what they wrote — what is at stake for them. Any context above was MEASURED FROM THE AUDIO and can contradict the words; it must not decide this answer, and neither does the genre. A tense, fast, aggressive beat under a sentence about missing someone is still about missing someone. Answer with the id exactly as written above.

STEP 2 — Generate 4 distinct visual metaphors: specific, nameable physical objects, materials, places or situations that embody that emotional truth WITHOUT illustrating the artist's words literally.

Rules:
- Do NOT default to "a person standing/reaching/dancing somewhere". That is a scene, not a metaphor — stay one level more abstract than that.
- Each metaphor must be concrete and nameable: "a cassette tape spilling from its shell", "a hand losing its grip on a wet railing", "a balloon caught in telephone wires" — never abstract ("a feeling of loss", "a sense of longing").
- Draw from ANY domain — objects, weather, animals, architecture, food, tools, technology, decay, growth, the body, water, light, landscape. Do not default to nightlife, fashion, or genre-coded imagery unless the artist's words explicitly call for it.
- A person is neither better nor worse than an object. Include a human body (a face, a hand, a figure) only when the image genuinely needs one to work, and leave it out when an object, material or place carries the feeling on its own. Never add a figure out of habit, and never avoid one out of habit either.
- Vary literalness AND vary whether a person is present: across the 4 candidates, give a real mix — at least one with NO person or body part in it at all, and at least one near-literal physical translation of the words.
- Order best-first: by how strongly and specifically the image carries THIS feeling — not by what is safest, and not by whether it contains a person.
- For each metaphor, honestly tag whether it involves a person or ANY body part (hand, eyes, foot, silhouette) at all.

Reality Requirement (this is why generated covers read as "AI art" — read carefully):
- Tension must come from the object's ACTUAL PHYSICAL BEHAVIOUR (mass, load, weight, wear, corrosion, geometry, material fatigue), never from a decorative symbol added on top of it. A structure visibly straining under real weight is the metaphor. Glowing cracks, energy veins, lightning-branch fissures, spiderweb crack networks, floating particles, magical smoke, or light "leaking" from damage are NOT — they are illustration tropes bolted onto a photograph, and they are the single most common tell that gives an image away as AI-generated rather than photographed.
- Ask: "could a photographer have found and shot this in the real world?" Real cracks are irregular, follow stress/joints/aggregate, and do not glow, branch symmetrically, or radiate like veins. If a detail could only exist as a rendered effect (glowing lines, particle auras, energy fields), cut it.
- Never decorate an object with a symbol of the emotion. Let the object's real material state under real physical conditions BE the emotion — a cable at the exact tension before it parts, a joint visibly carrying more than it was built for, a surface worn through by repeated contact — described the way a documentary photographer would describe what they actually saw, not the way an illustrator would embellish it.
- Prefer the physically plausible over the visually dramatic. A subtle, correct detail (a single strained rivet, a hairline gap widening at one point) beats an obviously invented dramatic one every time.
- One dominant subject. Choose an image that would still read as a single clear shape at thumbnail size — not a busy scene of many equal elements.

Diversity Requirement (CRITICAL):
- Your 4 metaphors must come from 4 DIFFERENT domains/types. Do NOT output 3 variations of the same idea.
- Types include: objects, weather, landscape, nature/materials, animals, architecture, light, abstract phenomena, decay/growth, bodies/hands, water, fire/heat, plant/organic, geometric/structures, food, tools, textiles, etc.
- Example WRONG output: hand holding rope, hand grasping something, figure gripping — all the same idea repeated. DO NOT DO THIS.
- Example RIGHT output: [eroding stone], [wind carrying leaves], [fraying rope], [a sunset disappearing] — each from a different domain, all expressing the same emotional truth.

Respond with ONLY valid JSON, nothing else, no markdown fences, no commentary. "feeling" is one id from the list; each "hasPerson" is true or false:
{"feeling": "<ID>", "metaphors": [{"image": "...", "hasPerson": <true|false>}, {"image": "...", "hasPerson": <true|false>}, {"image": "...", "hasPerson": <true|false>}, {"image": "...", "hasPerson": <true|false>}]}`
}

/**
 * Human-body words that mean a body is actually IN the image. `hand` followed
 * by a craft suffix is a making-process term ("hand-thrown", "hand-dyed"), not
 * a hand in frame, and "hand drum" is an instrument.
 */
const BODY_REFERENCE = /\b(person|people|man|men|woman|women|boy|girl|child|children|figure|silhouette|hands?(?![- ]?(?:thrown|dyed|drum|made|painted|stitched|woven|carved|blown))|fingers?|palms?|thumbs?|feet|foot|toes?|faces?|eyes?|body|bodies|arms?|legs?|shoulders?|lips|mouth|skin|hair)\b/i

function mentionsBody(text) {
  return BODY_REFERENCE.test(String(text || ''))
}

/**
 * Pure parse of the model's reply. Returns the feeling (validated against the
 * closed archetype set, else null) and the usable candidates. The `hasPerson`
 * tag is checked against the text itself: a model that calls "a hand pressed to
 * glass" person-free would otherwise route the scene through the NO-figure
 * writing rules and produce a scene that contradicts its own metaphor.
 */
function parseMetaphorResponse(rawText) {
  const empty = { feeling: null, candidates: [] }
  if (!rawText) return empty
  const cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    // Malformed JSON — treat as no usable metaphors, caller falls back cleanly.
    return empty
  }
  if (!parsed || !Array.isArray(parsed.metaphors)) return empty

  const rawFeeling = typeof parsed.feeling === 'string' ? parsed.feeling.trim().toUpperCase() : ''
  const feeling = ARCHETYPES[rawFeeling] ? rawFeeling : null

  const candidates = parsed.metaphors
    .filter((m) => m && typeof m.image === 'string' && m.image.trim())
    .map((m) => {
      const image = m.image.trim()
      const tagged = m.hasPerson === true
      const hasPerson = tagged || mentionsBody(image)
      return { image, hasPerson, corrected: hasPerson && !tagged }
    })
  return { feeling, candidates }
}

// Kept for callers/tests that only want the candidate list.
function parseMetaphors(rawText) {
  return parseMetaphorResponse(rawText).candidates
}

/**
 * Rank weights for the pick. The model orders best-first, but always taking
 * rank 0 makes one taste the ceiling for every cover: five consecutive
 * generations for one high-force track were all load-bearing structures. The
 * other candidates are all valid images from different domains, so sampling
 * among them — still favouring the best — is what lets the domains (nature,
 * weather, textiles, bodies, structures...) actually take turns.
 */
const RANK_WEIGHTS = [0.40, 0.30, 0.20, 0.10]

function pickCandidate(candidates, rand = Math.random) {
  if (!candidates.length) return { index: -1, candidate: null }
  const weights = candidates.map((_, i) => RANK_WEIGHTS[i] ?? RANK_WEIGHTS[RANK_WEIGHTS.length - 1])
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rand() * total
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i]
    if (r <= 0) return { index: i, candidate: candidates[i] }
  }
  return { index: 0, candidate: candidates[0] }
}

/**
 * @param {(promptText:string)=>Promise<string>} generate injected Gemini text call
 * @param {string} userFeeling the artist's own words — required, this is the anchor
 * @param {string} [context] optional secondary context (EMOTIONAL REGISTER block, sonic features, etc.)
 * @param {object} [kinetics] structured energy/danceability facts for the PHYSICAL STATE block
 * @param {()=>number} [rand] injectable RNG for deterministic tests
 * @returns {Promise<{ metaphor: string|null, hasPerson: boolean|null, feeling: string|null, pickedRank: number, candidates: {image:string,hasPerson:boolean}[] }>}
 */
async function generateVisualMetaphors({ generate, userFeeling, context, kinetics, rand }) {
  const words = (userFeeling || '').trim()
  const none = { metaphor: null, hasPerson: null, feeling: null, pickedRank: -1, candidates: [] }
  if (!words) {
    console.log('[METAPHOR] empty userFeeling, returning null')
    return none
  }
  try {
    console.log(`[METAPHOR] generating from: "${words.substring(0, 80)}..."`)
    const rawText = await generate(buildMetaphorPrompt({ userFeeling: words, context, kinetics }))
    const { feeling, candidates } = parseMetaphorResponse(rawText)
    const { index, candidate } = pickCandidate(candidates, rand)

    console.log(`[METAPHOR] words read as: ${feeling || '(no reading)'} | candidates: ${candidates.length}`)
    candidates.forEach((c, i) => {
      console.log(`  ${i === index ? '>' : ' '}[${i}] ${c.hasPerson ? '[PERSON]' : '[NO-PERSON]'}${c.corrected ? ' (tag corrected: body word in text)' : ''} ${c.image.substring(0, 70)}...`)
    })
    if (candidate) {
      console.log(`[METAPHOR] SELECTED rank ${index}: ${candidate.hasPerson ? '[PERSON]' : '[NO-PERSON]'} "${candidate.image.substring(0, 110)}..."`)
    } else {
      console.log('[METAPHOR] no valid candidates parsed')
    }

    return {
      metaphor: candidate ? candidate.image : null,
      hasPerson: candidate ? candidate.hasPerson : null,
      feeling,
      pickedRank: index,
      candidates,
    }
  } catch (err) {
    console.warn(`[METAPHOR] generation failed: ${err?.message || err}`)
    return none
  }
}

module.exports = {
  generateVisualMetaphors,
  // Exported for tests: all pure, all worth asserting directly.
  buildKineticBlock,
  buildMetaphorPrompt,
  parseMetaphorResponse,
  parseMetaphors,
  pickCandidate,
  mentionsBody,
  RANK_WEIGHTS,
}

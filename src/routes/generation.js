
const express = require('express')
const router = express.Router()
const supabase = require('../utils/supabase')
const { requireAuth } = require('../middleware/authmiddleware')
const crypto = require('crypto')
const cloudinary = require('../utils/cloudinary')
const { fetchLyricsOnline } = require('../utils/lyricsFetcher')

// ─── INSTANTIATE SERVICE CLIENTS ──────────────────────────────────────────────
const { GoogleGenAI } = require('@google/genai')
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// Image generation is provider-agnostic (see utils/imageProvider). Defaults to
// the free, no-key Pollinations FLUX backend; switch with IMAGE_PROVIDER env
// (pollinations | together | huggingface | replicate).
const { generateImage, DEFAULT_PROVIDER } = require('../utils/imageProvider')

// ─── FELT VISUAL OPERATING SYSTEM ─────────────────────────────────────────────
// The Technique Layer, Visual Vocabulary, Visual DNA Engine, Gemini Compiler and
// Prompt Assembler now live under ../engine. This route consumes them; the
// technique suffixes it used to define inline are re-exported unchanged from the
// engine so nothing about existing behavior shifts.
const engine = require('../engine')
const {
  TECHNIQUE_SUFFIXES,
  DEFAULT_TECHNIQUE,
  isValidTechnique,
} = require('../engine/technique')

// Raw single-shot Gemini text call, injected into the engine's Compiler so the
// engine stays decoupled from the SDK. Mirrors generateWithRetry's transport
// without the technique/scene parsing (the Compiler wants raw JSON text back).
async function geminiRawText(promptText, { temperature = 0.85 } = {}) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: promptText,
    config: { temperature },
  })
  return response.text?.trim() || ''
}

// LAYER 1: FELT — Unified High-Concept Technique-Matched Prompt
const AESTHETIC_SYSTEM_PROMPT = `You are a synesthetic visual artist and an elite music cover art director working for real recording artists.
Every cover you direct must look like an actual photograph that was shot with a camera, then hand-graded — never a smooth, symmetrical, AI-diffusion look.

You do not interpret text literally. You translate the underlying feeling, sonic attributes, and lyrics into ONE specific, nameable photographic technique — not a vague mood board.

Every image is a definitive 1:1 edge-to-edge square cover for streaming platforms. Never render physical canvases, frames, borders, hanging art, or gallery walls.

TECHNIQUE LIBRARY — choose exactly ONE per brief, matched to the emotional energy:

1. FLASH_DOCUMENTARY (for defiance, chaotic joy, party energy, raw confessional honesty)
   - Direct on-camera flash, slightly overexposed skin highlights, a hard graphic shadow cast behind the subject onto the wall/floor.
   - Candid, unposed body language; cluttered real-world props scattered at floor level (magazines, drinks, ashtrays, worn furniture).
   - Feels like a photo someone's friend took at 2am, not a studio shoot.

2. VINTAGE_FILM_NOSTALGIA (for nostalgia, cruising, comfort, warm memory, retro pride)
   - Visible 35mm film grain, warm halation bleeding around bright highlights, slightly faded/lifted blacks.
   - Analog-era props: car interiors, cassette tapes, vinyl records, disposable-camera color cast.
   - Color grade leans warm amber/orange or muted sun-bleached tone.

3. SILHOUETTE_ATMOSPHERE (for isolation, grandeur, spiritual searching, quiet strength)
   - Subject is rim-lit or entirely silhouetted against a dominant atmospheric element: smoke, fog, haze, or a glittering night skyline.
   - Face and body mostly fall into shadow; the light source (not the subject) is the visual anchor.
   - Deep, almost-black shadow detail; the subject reads as a shape before a person.

4. SURREAL_PRACTICAL_METAPHOR (for internal conflict, pain, addiction, existential crisis)
   - One literal physical object interacts with the body as if it were really staged and shot in-camera (arrows through a torso, a page on fire while being read, a limb bound or restrained).
   - Must look like practical effects photography — real physical weight, correct shadows cast by the object onto skin/clothing — never a floating CGI overlay.

5. DUOTONE_COLOR_WASH (for obsession, melancholy, night driving, longing)
   - The entire frame is pushed to a single dominant hue (deep cobalt blue, blood red, sepia) as if shot under one gel or printed with a color filter.
   - Film grain and texture remain visible underneath the color wash — this is a color cast, not a flat digital tint.

6. MACRO_INTIMATE_DETAIL (for vulnerability, sensuality, tenderness, longing)
   - Extreme close crop on one feature — lips, eyes, a hand touching skin — shallow depth of field with soft falloff.
   - Skin must show real pores, texture, and moisture/gloss where relevant; no airbrushing.

7. MOTION_BLUR_STROBE (for anxiety, mania, spiraling thoughts, disorientation)
   - Slow shutter speed creates directional blur trails across the subject, frozen at one sharp instant by a strobe/flash pop.
   - The blur should look like a real long exposure artifact, not a digital "speed lines" effect.

8. MIRROR_DOUBLE_EXPOSURE (for duality, identity conflict, self-confrontation)
   - A reflected or overlaid duplicate of the subject, mirrored across a literal surface (water, glass) or layered as an in-camera double exposure.
   - The two layers should have a slight misalignment or ghosting, like a real double-exposed frame, not a perfect digital mirror.

9. STUDIO_SEAMLESS_EDITORIAL (for confidence, boldness, a single strong emotional color)
   - Subject against a saturated solid-color seamless paper backdrop, lit with direct flash or hard strip light.
   - Editorial energy, but grain and skin texture stay real and gritty — never glossy catalog-smooth.

10. MONUMENTAL_SCALE_ISOLATION (for loneliness, quiet resolve, "keep moving," freedom, small-against-the-world feelings — THIS IS THE DEFAULT LEAN for reflective/chill/moody briefs)
   - One massive, dominant single element (an oversized sun or moon, a towering wall, a vast flat horizon, an enormous cloud bank) swallows most of the frame.
   - The human subject, if present at all, is small, often fully silhouetted, and pushed to one edge or the bottom of the frame — the scale imbalance IS the emotional content.
   - Backgrounds can be a single flat color field (a wall, a sky) with no other detail competing for attention. This technique can also render with NO human figure at all — an empty landscape, a parked car, a single object — if the brief is about absence, memory, or isolation rather than a person's presence.

RELEVANCE MANDATE (CRITICAL — this is the entire job):
- The scene MUST be visibly, specifically about what THIS song is about. Read the artist's feeling and the distilled theme, then stage the actual situation, place, person, or emotional moment they describe.
- Never fall back on a generic default (a lone figure in a dim room, someone staring out a rain-streaked window) unless the theme is literally that. A song about a hometown shows that place; a song about money and pressure shows that world; a song about a breakup shows a specific charged moment or the object left behind.
- Pick ONE concrete anchor for the frame: a specific person doing a specific thing, a specific place, or a single loaded object. It should read like a still lifted from this exact song's world — someone who knows the song should recognise it.

STORY-ONLY RULE (CRITICAL):
- You write the STORY, never the photography. Describe ONLY: who or what is in frame, where they are, what they are physically doing, their expression/posture, and at most ONE physical symbolic object.
- Do NOT mention any camera, lens, film stock, lighting, shadows, rim light, color grade, hue, grain, exposure, vignette, or post-processing. A separate system already decides every one of those, and naming them here corrupts the result. Simply describe the world and the moment, the way you'd tell a friend what is happening in the photo.
- Keep it concrete and physical — real places, real objects, real body language — not abstract adjectives like "melancholic atmosphere" or "meditative energy."

SUBJECT COUNT RULE (CRITICAL):
- Default to exactly ONE subject in frame. Do not add a second person unless the input is explicitly about a duo, group, or named collaboration.
- NEVER depict two people embracing, kissing, dancing pressed together, or in any romantic/sexual physical contact — regardless of how romantic or sexual the lyrics or vibe are. This is true even when the song is explicitly about sex, romance, or a relationship.
- When lyrics or input are romantic or sexual, translate that energy through ONE of: a single subject's expression/posture, symbolic objects, environmental heat/atmosphere, or distance/isolation — never through two bodies touching. A song about desire becomes a single figure with an unreadable expression, not two people kissing.
- Two-person compositions are the single most common way this system produces a generic, risky, or stock-photo result. Treat "add a second person" as something that requires explicit justification from the input.

OUTPUT FORMAT (CRITICAL):
Respond with exactly two lines, nothing else:
TECHNIQUE: <one of the 10 technique names above, exact match>
SCENE: <2-3 sentence concrete story grounded in this song's theme — a specific subject, a specific setting, a specific action, an expression, and at most one symbolic object. No camera, lighting, color, or grain words. No preamble, no quotes, no lyric excerpts.>`;

// TECHNIQUE_SUFFIXES and DEFAULT_TECHNIQUE are now imported from ../engine/technique
// (see requires above) — same 10 techniques, same suffix strings, just modular.

// Parses the model's "TECHNIQUE: X / SCENE: Y" response. Falls back gracefully
// if the model doesn't follow the format exactly, so a malformed response never
// crashes the pipeline — it just degrades to the default technique.
function parseSceneResponse(rawText, fallbackScene) {
  const text = (rawText || '').trim()

  if (!text) {
    return { technique: DEFAULT_TECHNIQUE, scene: fallbackScene }
  }

  const techniqueMatch = text.match(/TECHNIQUE:\s*([A-Z_]+)/i)
  const sceneMatch = text.match(/SCENE:\s*([\s\S]+)/i)

  const technique = techniqueMatch?.[1]?.toUpperCase()
  const validTechnique = TECHNIQUE_SUFFIXES[technique] ? technique : DEFAULT_TECHNIQUE

  // If SCENE: wasn't found, treat the whole response as the scene text rather
  // than discarding it — better a slightly malformed scene than losing the brief.
  const scene = sceneMatch?.[1]?.trim() || text

  return { technique: validTechnique, scene }
}

// LEGACY fallback — the pre-engine prompt shape. Retained only as a safety net
// if the Visual DNA Engine ever throws; every live path now uses buildFinalPrompt.
function buildFluxPrompt(technique, scene) {
  const suffix = TECHNIQUE_SUFFIXES[technique] || TECHNIQUE_SUFFIXES[DEFAULT_TECHNIQUE]
  return `${scene}. ${suffix} Definitively moody, intentional, and authentic — zero digital smoothing, zero CGI artifacts, zero plastic AI skin.`
}

/**
 * Builds the final FLUX prompt through the Visual Operating System.
 *
 * The technique (storytelling) and scene (already-written story) are resolved
 * exactly as before. Here they're routed through the Visual DNA Engine, which
 * computes the full photographic execution (camera/lens/film/lighting/color/
 * composition/…) deterministically from the track's audio features, then the
 * Prompt Assembler welds everything into one coherent prompt.
 *
 * Two modes:
 *  - deterministic (default): the resolved `scene` sentence becomes the story
 *    block; no extra LLM call, same song → same prompt.
 *  - compiler (useCompiler): Gemini is called ONCE as a constrained Prompt
 *    Compiler to emit a structured scene blueprint that fits the DNA, then
 *    assembled. Falls back to the deterministic path on any failure.
 *
 * Any engine error degrades safely to the legacy buildFluxPrompt.
 */
async function buildFinalPrompt(technique, scene, features, { useCompiler = false, userFeeling, mood } = {}) {
  try {
    if (useCompiler) {
      const result = await engine.orchestrate({
        generate: geminiRawText,
        features,
        techniqueName: technique,
        userFeeling: userFeeling || scene,
        lyricsTheme: scene,
        mood,
        fallbackScene: scene,
      })
      return { prompt: result.prompt, technique: result.technique, dna: result.dna }
    }
    const built = engine.assembleFromScene({ features, techniqueName: technique, sceneText: scene })
    return { prompt: built.prompt, technique: built.technique, dna: built.dna }
  } catch (err) {
    console.warn(`[ENGINE] Visual DNA build failed, using legacy prompt: ${err?.message || err}`)
    return { prompt: buildFluxPrompt(technique, scene), technique, dna: null }
  }
}

// ─── Scene safety filter ──────────────────────────────────────────────────────
// Gemini's scene text occasionally drifts into suggestive/undressed territory
// even when the system prompt doesn't ask for it (e.g. "intimate embrace" gets
// rendered literally by FLUX as nudity). This is a hard backstop, independent
// of the system prompt's own content boundaries, so a single bad generation
// can't slip through to the image model.
const BANNED_SCENE_PATTERN = /\b(nude|naked|nudity|topless|bare chest|bare breast|exposed breast|exposed body|explicit|undressed|undressing|underwear as outerwear|only (?:in |wearing )?(?:a |her |his )?(?:underwear|lingerie|thong|bra|panties)|thong|lingerie|bikini bottom|see[- ]through|sheer(?:\s+fabric)?\s+(?:top|dress|clothing)|sexually?|erotic|seductive pose)\b/i

function sceneFailsSafetyCheck(scene) {
  return BANNED_SCENE_PATTERN.test(scene || '')
}

const SAFE_FALLBACK_SCENE = 'A figure standing in soft directional light, quiet and composed, fully clothed in simple modern styling, captured mid-thought against a plain textured wall.'

// Wraps a generateWithRetry call with a safety check + one stricter re-roll,
// then a hardcoded safe fallback if the model still won't comply. Used by every
// route that turns user/song input into a scene brief.
async function generateSafeScene(promptText, options) {
  let { technique, scene } = await generateWithRetry(promptText, options)

  if (sceneFailsSafetyCheck(scene)) {
    console.warn('[SAFETY] Rejected scene brief on first pass — retrying with stricter constraints')
    const stricterPrompt = `${promptText}\n\nSTRICT REQUIREMENT: All subjects must be fully clothed in tasteful, modern styling. No exceptions, no nudity, no undergarments as outerwear, no suggestive framing.`
    ;({ technique, scene } = await generateWithRetry(stricterPrompt, { ...options, temperature: Math.min(options.temperature ?? 0.8, 0.4) }))

    if (sceneFailsSafetyCheck(scene)) {
      console.warn('[SAFETY] Rejected scene brief on second pass — falling back to hardcoded safe scene')
      technique = DEFAULT_TECHNIQUE
      scene = SAFE_FALLBACK_SCENE
    }
  }

  return { technique, scene }
}

// Serializes { technique, scene } into the sentence_prompt column so downstream
// routes (POST /) can recover the matched technique instead of re-guessing it.
function serializeBrief(technique, scene) {
  return JSON.stringify({ technique, scene })
}

// Recovers { technique, scene } from a stored sentence_prompt value. Handles
// legacy plain-string values (pre-technique-library rows) by treating them as
// a scene with the default technique.
function deserializeBrief(stored) {
  if (!stored) return null
  try {
    const parsed = JSON.parse(stored)
    if (parsed && typeof parsed.scene === 'string') {
      return {
        technique: TECHNIQUE_SUFFIXES[parsed.technique] ? parsed.technique : DEFAULT_TECHNIQUE,
        scene: parsed.scene,
      }
    }
  } catch {
    // Not JSON — legacy plain-string brief from before this change
  }
  return { technique: DEFAULT_TECHNIQUE, scene: stored }
}

const audioFeaturesToVisualDescription = (features) => {
  if (!features) return "Audio structural variables aligned to standard baseline frequencies.";
  const { bpm, key, scale, energy, valence, danceability, acousticness, spectral_brightness, loudness, mood, genre } = features;
  const parts = [];

  parts.push(`Lineage: ${genre || 'Contemporary Sound'}`);
  parts.push(`Tempo/Key: ${bpm || 90} BPM in ${key || 'C'} ${scale || 'Major'}`);
  parts.push(`Energy Density: ${energy || 50}/100, Valence/Emotional Weight: ${valence || 50}/100`);
  parts.push(`Rhythm Matrix: Danceability ${danceability || 50}/100, Acousticness ${acousticness || 50}/100`);
  parts.push(`Spectral Profile: Brightness ${spectral_brightness || 50}/100, Loudness ${loudness || -6} dB`);
  parts.push(`Kinetic Profile: Overarching ${mood || 'balanced'} acoustic state`);

  return parts.join('. ');
};

// Retries transient Gemini failures (503 UNAVAILABLE, 429 rate limit) with
// exponential backoff, then parses the technique + scene from the response.
async function generateWithRetry(promptText, { temperature = 0.8, maxRetries = 3, fallbackScene = '' } = {}) {
  let lastErr
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: { temperature },
      })
      return parseSceneResponse(response.text, fallbackScene)
    } catch (err) {
      lastErr = err
      const isRetryable = err?.status === 503 || err?.message?.includes('UNAVAILABLE') || err?.status === 429
      if (!isRetryable || attempt === maxRetries) throw err
      const delayMs = 500 * 2 ** (attempt - 1) // 500ms, 1s, 2s
      console.warn(`[GEMINI RETRY] attempt ${attempt} failed (${err?.message || err}), retrying in ${delayMs}ms`)
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
  throw lastErr
}

// Shared scene-brief generator — used as a fallback when no pre-synthesized brief exists yet
async function synthesizeSceneBrief({ userInput, lyrics, sonicFeatures, artistContext }) {
  const promptText = `${AESTHETIC_SYSTEM_PROMPT}

INPUT MATRIX TO CONVERT:
1. Artist's Core Feeling / What The Song Is About: "${userInput.trim()}"
2. Song Lyrics: "${lyrics || 'No lyrics available — treat as instrumental-leaning emotional content'}"
3. Track Sonic Profile Features: ${sonicFeatures}
${artistContext ? `4. Artist Branding Space Context: ${artistContext}` : ''}`;

  try {
    return await generateSafeScene(promptText, { temperature: 0.8, fallbackScene: userInput.trim() })
  } catch (err) {
    console.error(`⚠️ Scene brief synthesis fallback triggered: ${err?.message || err}`)
    return { technique: DEFAULT_TECHNIQUE, scene: userInput.trim() }
  }
}

// Distills full song lyrics into a SHORT, CONCRETE creative brief for the cover.
//
// The earlier version flattened lyrics to one vague emotional adjective ("a
// feeling of longing and resilience"), which stripped away everything the cover
// could actually depict — so song covers came out generic and unrelated to the
// track. This keeps the song-specific material a cover needs (its central image,
// setting, situation and one recurring motif) while abstracting away only the
// literally risky specifics (explicit sex/violence), which the scene generator's
// safety rules then handle. Result: covers that are recognisably about the song.
async function distillLyricsToTheme(lyrics, userVibeInput) {
  if (!lyrics || !lyrics.trim()) return userVibeInput

  const distillPrompt = `You are a creative director reading a song's lyrics to brief a cover-art photographer on what the song is ABOUT — so the cover actually reflects this specific song.

Output 2-3 short sentences, nothing else. No preamble, no quotes, no lyric excerpts. Cover, in plain concrete language:
1. THE SUBJECT: what the song is literally about (a place, a relationship, a struggle, a celebration, a state of mind) — be specific to THIS song.
2. THE SETTING / WORLD: where it lives — the environment, era, or scene the lyrics evoke (the street, the club, the car, home, the city at night, nature, etc.).
3. ONE CENTRAL IMAGE OR MOTIF: a single recurring object, place, or visual the song keeps returning to, that could anchor a cover.

Rules:
- Stay concrete and physical — real places, objects and situations, not abstract mood words.
- Do NOT narrate explicit sexual acts, graphic violence, or nudity even if the lyrics contain them; describe the emotional situation around them instead (e.g. "a charged, private late-night intimacy" rather than any physical act).
- Do NOT describe cameras, lighting, or color — only what the song is about.

SONG LYRICS:
"${lyrics.slice(0, 4000)}"

ARTIST'S OWN DESCRIPTION: "${userVibeInput.trim()}"`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: distillPrompt,
      config: { temperature: 0.6 },
    })
    return response.text?.trim() || userVibeInput.trim()
  } catch (err) {
    console.warn(`[LYRIC DISTILL] Falling back to raw vibe input: ${err?.message || err}`)
    return userVibeInput.trim()
  }
}

// Fetches the artist's brand attributes (city, signature sound words) so every
// scene-generation call — not just the POST / last-resort fallback — carries
// the same brand context that shaped the well-performing test generations.
async function fetchArtistContext(userId) {
  try {
    const { data } = await supabase.from('users').select('city, sound_words').eq('id', userId).single()
    if (!data) return ''
    return `Origin: ${data.city || 'Unknown Space'}. Signature Sound Identity: ${data.sound_words || 'Chill, Vibe, Cool'}.`
  } catch (err) {
    console.warn(`[ARTIST CONTEXT] Fetch failed, continuing without brand context: ${err?.message || err}`)
    return ''
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/generations/expand
 * Manual blueprint expansion handler
 */
router.post('/expand', requireAuth, async (req, res) => {
  const { upload_id, basic_input } = req.body;
  const userId = req.user.id;

  if (!upload_id || !basic_input?.trim()) {
    return res.status(400).json({ error: 'upload_id and basic_input are required' });
  }

  try {
    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .select('id, audio_features')
      .eq('id', upload_id)
      .eq('user_id', userId)
      .single();

    if (uploadError || !upload) {
      return res.status(404).json({ error: 'Upload record not found' });
    }

    const audioContext = audioFeaturesToVisualDescription(upload.audio_features);
    const artistContext = await fetchArtistContext(userId);

    const promptText = `${AESTHETIC_SYSTEM_PROMPT}

Artist input text: "${basic_input.trim()}"
Audio context variables: ${audioContext}
${artistContext ? `Artist Branding Space Context: ${artistContext}` : ''}`;

    let technique, scene
    try {
      ({ technique, scene } = await generateSafeScene(promptText, {
        temperature: 0.75,
        fallbackScene: basic_input.trim(),
      }))
    } catch (gErr) {
      console.error(`[EXPAND ENGINE] Gemini fault after retries: ${gErr?.message || gErr}`)
      technique = DEFAULT_TECHNIQUE
      scene = basic_input.trim()
    }

    return res.status(200).json({
      original: basic_input.trim(),
      expanded: scene,
      technique,
    });

  } catch (err) {
    console.error('[EXPAND ENGINE] FAULT:', err?.message || err);
    return res.status(500).json({ error: 'Internal processing loop failure.' });
  }
});

/**
 * POST /api/generations/transcribe
 * Genius lookup → Deepgram fallback transcription → Gemini technique-matched scene synthesis
 */
router.post('/transcribe', requireAuth, async (req, res) => {
  const { upload_id, artist_name } = req.body
  const userId = req.user.id

  if (!upload_id) {
    return res.status(400).json({ error: 'upload_id is required' })
  }

  try {
    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .select('id, title, audio_url, track_type, storage_path, audio_features, sentence_prompt')
      .eq('id', upload_id)
      .eq('user_id', userId)
      .single()

    if (uploadError || !upload) {
      return res.status(404).json({ error: 'Upload asset not found' })
    }

    const userVibeInput = upload.sentence_prompt || 'Abstract intense emotion'
    const trackSonicFeatures = audioFeaturesToVisualDescription(upload.audio_features)

    let lyricsText = ''
    let source = 'none'
    let matched = null

    // ── STEP 1: Try Genius first using title (+ optional artist from request body) ──
    console.log(`[LYRICS LOOKUP] Searching Genius for "${upload.title}"${artist_name ? ` by ${artist_name}` : ' (no artist supplied)'}`)
    const onlineMatch = await fetchLyricsOnline(upload.title, artist_name)

    if (onlineMatch) {
      console.log(`[LYRICS LOOKUP] Match found: "${onlineMatch.matchedTitle}" by ${onlineMatch.matchedArtist}`)
      lyricsText = onlineMatch.lyrics
      source = 'genius'
      matched = { title: onlineMatch.matchedTitle, artist: onlineMatch.matchedArtist }
    } else {
      console.log('[LYRICS LOOKUP] No confident online match — falling back to Deepgram transcription')

      // ── STEP 2: Fallback — transcribe the actual audio ──
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('audio-uploads')
        .download(upload.storage_path)

      if (downloadError || !fileData) {
        console.error('[STORAGE DOWNLOAD FAULT]:', downloadError?.message || 'No file data returned')
        return res.status(500).json({ error: 'Could not retrieve audio payload from cluster.' })
      }

      const buffer = Buffer.from(await fileData.arrayBuffer())

      if (!buffer.length) {
        console.warn(`[DEEPGRAM SKIP] Downloaded buffer for upload ${upload_id} was empty — skipping transcription`)
        lyricsText = ''
        source = 'none'
      } else {
        const { DeepgramClient, DeepgramError } = require('@deepgram/sdk')
        // v5 constructor takes an options object — passing a bare string silently
        // fails to set apiKey and relies on undocumented env fallback
        const deepgram = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY })

        const pathLower = upload.storage_path.toLowerCase()
        let extLabel = 'mp3'
        if (pathLower.endsWith('.wav')) extLabel = 'wav'
        else if (pathLower.endsWith('.m4a')) extLabel = 'm4a'
        else if (pathLower.endsWith('.ogg')) extLabel = 'ogg'

        console.log(`[DEEPGRAM REQUEST] upload=${upload_id} ext=${extLabel} bytes=${buffer.length}`)

        try {
          // Pass the raw Buffer directly as the first argument — NOT wrapped in
          // { buffer, mimetype }. That shape belonged to the old deprecated
          // `transcription.preRecorded` method and isn't valid here.
          const dgResponse = await deepgram.listen.v1.media.transcribeFile(
            buffer,
            {
              model: 'nova-3',
              smart_format: true,
              punctuate: true,
              timeoutInSeconds: 300,
            }
          )

          lyricsText = dgResponse?.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() || ''
          source = lyricsText ? 'deepgram' : 'none'

          console.log(`[DEEPGRAM COMPLETE] upload=${upload_id} transcriptLength=${lyricsText.length} confidence=${dgResponse?.results?.channels?.[0]?.alternatives?.[0]?.confidence ?? 'n/a'}`)

          if (!lyricsText) {
            console.warn(`[DEEPGRAM EMPTY] upload=${upload_id} — Deepgram returned no transcript (likely silent/instrumental audio, or unsupported format: ${extLabel})`)
          }
        } catch (apiError) {
          if (apiError instanceof DeepgramError) {
            console.warn(`[DEEPGRAM API FAULT] upload=${upload_id} status=${apiError.statusCode} message=${apiError.message}`)
          } else {
            console.warn(
              `[DEEPGRAM UNEXPECTED FAULT] upload=${upload_id}: ${apiError?.message || 'Unknown error'}` +
              (apiError?.cause ? ` | cause: ${apiError.cause.code || apiError.cause.message || apiError.cause}` : '')
            )
          }
          lyricsText = ''
          source = 'none'
        }
      }
    }

    // ── STEP 3: Distill raw lyrics into a short CONCRETE brief (subject, world,
    // central motif — see distillLyricsToTheme), then feed vibe + that brief +
    // audio features + brand context into Gemini. Raw lyrics never reach the
    // scene prompt directly (literal narrative bias → risky/awkward renders), but
    // the concrete brief keeps the cover recognisably about this specific song.
    const distilledTheme = await distillLyricsToTheme(lyricsText, userVibeInput)
    const artistContext = await fetchArtistContext(userId)

    const promptText = `${AESTHETIC_SYSTEM_PROMPT}

INPUT MATRIX TO CONVERT — the scene you write MUST depict what this song is about:
1. Artist's Core Feeling: "${userVibeInput.trim()}"
2. What This Song Is About (concrete brief distilled from the lyrics — stage THIS): "${distilledTheme}"
3. Track Sonic Profile Features: ${trackSonicFeatures}
${artistContext ? `4. Artist Branding Space Context: ${artistContext}` : ''}`;

    let technique, scene
    try {
      ({ technique, scene } = await generateSafeScene(promptText, {
        temperature: 0.8,
        fallbackScene: userVibeInput.trim(),
      }))
    } catch (gErr) {
      console.error(
        `⚠️ Transcribe-stage Gemini expansion fallback triggered after retries: ${gErr?.message || gErr}` +
        (gErr?.cause ? ` | cause: ${gErr.cause.code || gErr.cause.message || gErr.cause}` : '')
      )
      technique = DEFAULT_TECHNIQUE
      scene = userVibeInput.trim()
    }

    // Persist technique + scene together so /generate can rebuild the exact matched
    // FLUX prompt later without re-guessing the technique from scratch.
    await supabase
      .from('uploads')
      .update({ sentence_prompt: serializeBrief(technique, scene) })
      .eq('id', upload_id)

    return res.status(200).json({
      transcript: lyricsText,
      expanded: scene,
      technique,
      upload_id,
      source,
      matched,
    })

  } catch (err) {
    console.error('Fatal transcription execution breakdown:', err?.message || err)
    return res.status(500).json({ error: 'Transcription system processing failed.' })
  }
})

/**
 * POST /api/generations
 * CORE UNIFIED ENGINE: Technique-matched prompt guarantees a photographic, non-generic look
 */
router.post('/', requireAuth, async (req, res) => {
  const { upload_id, lyric_context, technique: techniqueOverride } = req.body
  const userId = req.user.id

  if (!upload_id) {
    return res.status(400).json({ error: 'upload_id is required' })
  }

  try {
    const [uploadResult, profileResult] = await Promise.all([
      supabase
        .from('uploads')
        .select('id, title, track_type, audio_features, sentence_prompt, status')
        .eq('id', upload_id)
        .eq('user_id', userId)
        .single(),
      supabase
        .from('users')
        .select('city, sound_words')
        .eq('id', userId)
        .single(),
    ])

    if (uploadResult.error || !uploadResult.data) {
      return res.status(404).json({ error: 'Upload asset record not found' })
    }

    const upload = uploadResult.data
    const artistProfile = profileResult.data || {}

    if (upload.status === 'uploaded') {
      return res.status(409).json({ error: 'Audio analysis must complete before generating art' })
    }

    const trackSonicFeatures = audioFeaturesToVisualDescription(upload.audio_features)

    // Resolve technique + scene from (in priority order): explicit request body
    // override, an already-persisted brief from /transcribe or /expand, or —
    // only as a last resort — a fresh synthesis call.
    let technique, scene

    if (lyric_context) {
      technique = TECHNIQUE_SUFFIXES[techniqueOverride] ? techniqueOverride : DEFAULT_TECHNIQUE
      scene = lyric_context.trim()
    } else {
      const storedBrief = deserializeBrief(upload.sentence_prompt)
      if (storedBrief) {
        ;({ technique, scene } = storedBrief)
      } else {
        ;({ technique, scene } = await synthesizeSceneBrief({
          userInput: 'Abstract intense emotion',
          lyrics: '',
          sonicFeatures: trackSonicFeatures,
          artistContext: `${artistProfile.city || 'Unknown Space'} (${artistProfile.sound_words || 'Raw Collective'})`,
        }))
      }
    }

    // Route through the Visual Operating System: Visual DNA (deterministic from
    // audio_features) + Prompt Assembler. Pass use_compiler: true in the request
    // body to additionally run the Gemini Prompt Compiler for a DNA-constrained
    // structured scene.
    const { prompt: absoluteFluxPrompt } = await buildFinalPrompt(technique, scene, upload.audio_features, {
      useCompiler: req.body.use_compiler === true,
      mood: upload.audio_features?.mood,
    })

    const generationId = crypto.randomUUID()
    await supabase.from('uploads').update({ status: 'generating' }).eq('id', upload_id)

    console.log(`[IMAGE-ENGINE] Launching ${DEFAULT_PROVIDER} pipeline for ID: ${generationId} technique=${technique}`)

    let imagePayloadUrl
    try {
      imagePayloadUrl = await generateImage(absoluteFluxPrompt, { width: 1024, height: 1024 })
    } catch (hfErr) {
      const detail = hfErr?.message || String(hfErr)
      console.error('[HF GENERATION EXCEPTION MATRIX CRASH]:', detail)
      await supabase.from('uploads').update({ status: 'analyzed' }).eq('id', upload_id)
      // Surface quota/credit exhaustion distinctly so the UI can tell the user
      // to top up credits rather than showing a generic "try again" failure.
      if (/credit|quota|depleted|PRO to get|payment required/i.test(detail)) {
        return res.status(402).json({ error: 'Image provider credits exhausted.', detail })
      }
      return res.status(502).json({ error: 'Hugging Face image pipeline failed.', detail })
    }

    let permanentUrl
    try {
      const result = await cloudinary.uploader.upload(imagePayloadUrl, {
        folder: `felt/generations/${upload_id}`,
        public_id: `cover_${generationId}`,
        overwrite: true,
        resource_type: 'image',
      })
      permanentUrl = result.secure_url
    } catch (cloudinaryErr) {
      console.warn('[CLOUDINARY UPLOAD FAULT]:', cloudinaryErr?.message || cloudinaryErr)
      permanentUrl = imagePayloadUrl
    }

    await supabase
      .from('generations')
      .insert({
        id: generationId,
        upload_id,
        user_id: userId,
        prompt_used: absoluteFluxPrompt,
        technique,
        image_url: permanentUrl,
        status: 'complete',
        created_at: new Date().toISOString(),
      })
      .throwOnError()

    await supabase.from('uploads').update({ status: 'complete' }).eq('id', upload_id)

    return res.status(201).json({
      generation_id: generationId,
      image_url: permanentUrl,
      technique,
    })

  } catch (err) {
    console.error('❌ [GENERATION PIPELINE FAULT]:', err?.message || err)
    return res.status(500).json({ error: err?.message || 'Internal processing route fault.' })
  }
})

/**
 * GET /api/generations/:upload_id
 */
router.get('/:upload_id', requireAuth, async (req, res) => {
  const { upload_id } = req.params
  const userId = req.user.id

  try {
    const { data, error } = await supabase
      .from('generations')
      .select('id, prompt_used, technique, image_url, status, created_at')
      .eq('upload_id', upload_id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GENERATIONS HISTORY FAULT]:', error?.message || error)
      return res.status(500).json({ error: 'Failed to load track generation history parameters.' })
    }
    return res.status(200).json({ generations: data })
  } catch (err) {
    console.error('[GENERATIONS HISTORY UNCAUGHT]:', err?.message || err)
    return res.status(500).json({ error: 'Something went wrong.' })
  }
})

/**
 * PATCH /api/generations/refine
 */
router.patch('/refine', requireAuth, async (req, res) => {
  const { upload_id, lyric_context, image_url } = req.body;
  const userId = req.user.id;

  if (!upload_id || !lyric_context?.trim()) {
    return res.status(400).json({ error: 'upload_id and modified lyric_context parameters are required.' });
  }

  try {
    const [uploadResult, profileResult] = await Promise.all([
      supabase
        .from('uploads')
        .select('id, title, track_type, audio_features, sentence_prompt, status')
        .eq('id', upload_id)
        .eq('user_id', userId)
        .single(),
      supabase
        .from('users')
        .select('city, sound_words')
        .eq('id', userId)
        .single(),
    ]);

    if (uploadResult.error || !uploadResult.data) {
      return res.status(404).json({ error: 'Upload asset record not found.' });
    }

    const upload = uploadResult.data;
    const trackSonicFeatures = audioFeaturesToVisualDescription(upload.audio_features);

    const refinementPrompt = `${AESTHETIC_SYSTEM_PROMPT}

You are refining an existing cover art brief based on direct artist feedback — keep the same technique unless the modification request clearly demands a different one.

INPUT REFINEMENT VARIABLES:
1. Modification Request: "${lyric_context.trim()}"
2. Previous Design Coordinates: ${image_url || 'Baseline generation profile'}
3. Underlying Track Sonic Signature: ${trackSonicFeatures}`;

    let technique, scene
    try {
      ({ technique, scene } = await generateSafeScene(refinementPrompt, {
        temperature: 0.75,
        fallbackScene: lyric_context.trim(),
      }))
    } catch (gErr) {
      console.error(`⚠️ Refinement expansion fallback applied after retries: ${gErr?.message || gErr}`);
      technique = DEFAULT_TECHNIQUE
      scene = lyric_context.trim()
    }

    const { prompt: absoluteFluxRefinedPrompt } = await buildFinalPrompt(technique, scene, upload.audio_features, {
      useCompiler: req.body.use_compiler === true,
      mood: upload.audio_features?.mood,
    });

    const generationId = crypto.randomUUID();
    await supabase.from('uploads').update({ status: 'generating' }).eq('id', upload_id);

    console.log(`[HF-FLUX-REFINEMENT] Launching pipeline serverless inference generation layer. ID: ${generationId} technique=${technique}`);

    let imagePayloadUrl;
    try {
      imagePayloadUrl = await generateImage(absoluteFluxRefinedPrompt, { width: 1024, height: 1024 });
    } catch (hfErr) {
      const detail = hfErr?.message || String(hfErr)
      console.error('❌ [HF REFINEMENT PIPELINE FAULT]:', detail);
      await supabase.from('uploads').update({ status: 'complete' }).eq('id', upload_id);
      if (/credit|quota|depleted|PRO to get|payment required/i.test(detail)) {
        return res.status(402).json({ error: 'Image provider credits exhausted.', detail });
      }
      return res.status(502).json({ error: 'Hugging Face image refinement loop engine timed out.', detail });
    }

    let permanentUrl;
    try {
      const result = await cloudinary.uploader.upload(imagePayloadUrl, {
        folder: `felt/generations/${upload_id}`,
        public_id: `cover_refine_${generationId}`,
        overwrite: true,
        resource_type: 'image',
      });
      permanentUrl = result.secure_url;
    } catch (cloudinaryErr) {
      console.warn('[CLOUDINARY REFINEMENT UPLOAD FAULT]:', cloudinaryErr?.message || cloudinaryErr)
      permanentUrl = imagePayloadUrl;
    }

    await supabase
      .from('generations')
      .insert({
        id: generationId,
        upload_id,
        user_id: userId,
        prompt_used: absoluteFluxRefinedPrompt,
        technique,
        image_url: permanentUrl,
        status: 'complete',
        created_at: new Date().toISOString(),
      })
      .throwOnError();

    await supabase
      .from('uploads')
      .update({
        status: 'complete',
        sentence_prompt: serializeBrief(technique, scene)
      })
      .eq('id', upload_id);

    return res.status(201).json({
      generation_id: generationId,
      image_url: permanentUrl,
      technique,
    });

  } catch (err) {
    console.error('❌ [REFINEMENT ROUTE UNCAUGHT EXCEPTION]:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Internal processing route fault during matrix refinement.' });
  }
});

module.exports = router;
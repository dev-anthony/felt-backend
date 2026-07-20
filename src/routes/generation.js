
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
const { generateImage, DEFAULT_PROVIDER } = require('../utils/imageProvider')

// ─── FELT VISUAL OPERATING SYSTEM ─────────────────────────────────────────────
const engine = require('../engine')
const {
  TECHNIQUE_SUFFIXES,
  DEFAULT_TECHNIQUE,
  isValidTechnique,
} = require('../engine/technique')

const { genreLineage, subjectModeRule } = require('../config/artistProfile')

// EMOTIONAL INTELLIGENCE LAYER — turns the measured features into an archetype,
// an aesthetic world and an intensity tier, then hands the scene writer a single
// clearly-labeled EMOTIONAL REGISTER block. Previously the mood was one clinical
// line buried among five technical ones, so it steered nothing.
const { readEmotion, emotionalRegisterBlock } = require('../engine/emotion')
const { buildFeatureVector } = require('../engine/dna/featureVector')

/** Builds the labeled register block for a track + the artist's own words. */
function buildEmotionalRegister(features, declaredGenre, intentText) {
  try {
    const vector = buildFeatureVector(features)
    const read = readEmotion(vector, declaredGenre, intentText)
    if (read.semanticCorrections.length) {
      console.log(`[EMOTION] ${read.archetype.label} | ${read.stateLabel} | ${read.intensityLabel} | kinetic=${read.kinetic} | corrections: ${read.semanticCorrections.join('; ')}`)
    } else {
      console.log(`[EMOTION] ${read.archetype.label} | ${read.stateLabel} | ${read.intensityLabel} | kinetic=${read.kinetic}`)
    }
    return emotionalRegisterBlock(read, read.correctedVector)
  } catch (err) {
    console.warn(`[EMOTION] read failed, continuing without register: ${err?.message || err}`)
    return ''
  }
}

// Text model for scene writing. Note: there is no plain `gemini-3.1-flash` text
// model published on the API — the 3.1 flash family is image/tts/live only — so
// scene writing stays on 2.5-flash.
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash'

// Temperature is intentionally NOT set on any Gemini call — the model uses its
// own default sampling. This keeps behaviour consistent and makes it obvious
// where a bad result actually comes from instead of a hand-tuned temperature.
async function geminiRawText(promptText) {
  const response = await ai.models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents: promptText,
  })
  return response.text?.trim() || ''
}

function deserializeBrief(stored) {
  if (!stored) return null
  try {
    const parsed = JSON.parse(stored)
    if (parsed && typeof parsed.scene === 'string') {
      return {
        technique: TECHNIQUE_SUFFIXES[parsed.technique] ? parsed.technique : DEFAULT_TECHNIQUE,
        scene: parsed.scene,
        structured: true,
      }
    }
  } catch {
    // Left unexpanded
  }
  return { technique: DEFAULT_TECHNIQUE, scene: stored, structured: false }
}

const AESTHETIC_SYSTEM_PROMPT = `You are the art director for a real recording artist's single cover. You write ONE photographic moment. You do not write poetry, mood boards, or explanations.

Everything you write must serve one goal: someone who has heard this song should look at the cover and recognise it. Not "a nice image" — THIS song's image.

An EMOTIONAL REGISTER block is supplied with every brief. It is derived from the track's measured tempo, energy, groove, brightness and key, cross-referenced against a twelve-archetype model of how music actually makes people feel. It is the single most important input you receive. Read it first and let it govern the entire frame — the register, the aesthetic world, the intensity tier, and above all the MOVEMENT line.

TECHNIQUE LIBRARY — choose exactly ONE, matched to the emotional register:

1. FLASH_DOCUMENTARY — defiance, chaotic joy, party energy, raw confession. Unstaged, candid, 2am.
2. VINTAGE_FILM_NOSTALGIA — nostalgia, cruising, comfort, warm memory, retro pride.
3. SILHOUETTE_ATMOSPHERE — isolation, grandeur, spiritual searching. The light source, not the face, is the subject.
4. SURREAL_PRACTICAL_METAPHOR — internal conflict, pain, addiction, existential weight. One real physical object staged against the body.
5. DUOTONE_COLOR_WASH — obsession, melancholy, night driving, longing. One dominant hue through the whole frame.
6. MACRO_INTIMATE_DETAIL — vulnerability, sensuality, tenderness. One feature filling the frame.
7. MOTION_BLUR_STROBE — dancing, mania, spiralling thought, physical release. Real long-exposure blur.
8. MIRROR_DOUBLE_EXPOSURE — duality, identity conflict, self-confrontation.
9. STUDIO_SEAMLESS_EDITORIAL — confidence, boldness, one strong emotional colour.
10. MONUMENTAL_SCALE_ISOLATION — loneliness, absence, memory, freedom, small-against-the-world.

TECHNIQUE SELECTION (CRITICAL — do NOT default to silhouettes):
- Choose what genuinely fits the register, and VARY it across songs.
- SILHOUETTE_ATMOSPHERE and MONUMENTAL_SCALE_ISOLATION HIDE the face and identity. Use them ONLY when the song is truly about isolation, anonymity, grandeur or absence. They are the exception.
- Most covers should REVEAL the face. A dark or moody register does NOT require a silhouette.
- When the MOVEMENT line reads HIGH, strongly prefer a technique that can carry motion (MOTION_BLUR_STROBE, FLASH_DOCUMENTARY, STUDIO_SEAMLESS_EDITORIAL). Never answer a high-movement track with a still, contemplative frame.

RELEVANCE MANDATE (this is the entire job):
- The scene MUST be visibly, specifically about what THIS song is about. Stage the actual situation, place, person or moment the artist and the lyrics describe.
- Never fall back on a generic default (a lone figure in a dim room, someone staring out a rain-streaked window) unless the theme is literally that.
- Pick ONE concrete anchor: a specific person doing a specific thing, a specific place, or a single loaded object.

DEPICTING CONNECTION, CHEMISTRY & DESIRE (CRITICAL — read carefully):
Songs about attraction, chemistry, dancing with someone, or being wanted are extremely common, and there is a failure mode you must avoid: retreating to a lone figure standing still, touching their own neck or collarbone, eyes closed, "feeling the moment." That image is inert. It communicates nothing about the song and it is the single most common way this system fails.
Instead, convey connection through ENERGY, MOTION and IMPLICATION:
- The subject caught mid-dance — weight shifted, hips turned, hair and fabric still moving, feet off the beat.
- An action that only makes sense because someone else is there: reaching toward the edge of frame, glancing back over a shoulder, laughing at something off-camera, pulling someone's hand that is just out of shot.
- A charged environment that holds another presence: two shadows cast by one light, a second drink on the table, a crowd blurred close around them, a hand entering the frame's edge.
- Heat in the room: sweat catching light, a packed floor, condensation, smoke, bodies implied at the frame's border.
Any of these beats a static portrait. Choose energy over stillness whenever the register allows it.

BANNED POSES — these have become defaults and are now forbidden unless the brief explicitly demands them:
- a hand resting on one's own collarbone, neck or chest
- eyes closed in serene stillness
- chin lifted, contemplative, gazing up or into middle distance
- standing motionless facing the camera with arms at sides
If your instinct produces one of these, discard it and write an action instead.

SUBJECT CONSTRUCTION (choose WHO fits the song, and make them MEMORABLE):
- DECIDE WHO belongs here — never default to a young woman. From the genre, register and lyrics choose gender, an age that fits (a child, a teenager, someone in their 20s-40s, an elder), build and cultural context. Men, women, children, elders and unconventional-looking people all belong. Vary this every time.
- ANATOMY: state build and one or two bone-structure facts so the figure has real mass — "broad-shouldered heavy-set frame", "slight wiry build with prominent collarbones", "soft round face with full cheeks". Never "a figure".
- SKIN: name a base tone from a real spectrum (porcelain, warm ivory, golden olive, honey-bronze, rich caramel, deep espresso, obsidian and everything between), an undertone (cool rosy, warm golden, neutral, olive, blue-black), and one micro-texture (freckles, visible pores, sun-weathered lines, a healed scar). Match the person and culture; do not always pick the same one.
- ONE or TWO distinctive markers so they look like SOMEBODY: a lined fade, box braids, locs, a durag, grey hair, a gap or gold tooth, a nose ring, a face or hand tattoo, expressive makeup, cultural jewellery, a signature hat.
- WARDROBE WITH WEIGHT: name the garment AND how the fabric behaves under gravity — "a heavy structured wool coat cinched at the waist, pooling over the hips", not "a red dress"; "an oversized drop-shoulder hoodie stacking sharply at the wrists", not "streetwear". Real fabrics: aso-oke, velvet, wax-print, raw denim, leather, heavy knit, satin, mesh, tailored wool.
- Keep the person to a few vivid concrete facts. Do not list every feature — leave room for the world and the action.
- BANNED words for people: "beautiful", "stunning", "gorgeous", "attractive", "perfect", "athletic", "sculptural", "high-fashion figure", "enigmatic", "mysterious figure", "a person", "someone", "cool outfit", "stylish".
- The face is LIT and clearly visible. Never describe it as shadowed, hidden, obscured or turned away UNLESS the technique is SILHOUETTE_ATMOSPHERE or MONUMENTAL_SCALE_ISOLATION.

ENVIRONMENT & MOMENT (a cover is a PLACE and a MOMENT, not a floating portrait):
- ONE specific, nameable location with real atmosphere — never "a dimly lit room" or "a dance floor". Name it: a smoky underground Afro-house club with polished concrete floors, a Lagos rooftop lounge just after midnight, a candle-lit jazz bar with amber practicals, a cracked tenement stairwell, a neon late-night diner, a dusty backyard party.
- ONE or TWO intentional props that tell the story: a half-finished cocktail, a disco ball's scattered light, a velvet couch, a vintage microphone, drifting smoke, a cracked phone.
- Describe a MOMENT OF ACTION — what is HAPPENING. Caught mid-step, glancing back, laughing, adjusting a chain, leaning off a wall, stepping through smoke.
- Match the AESTHETIC WORLD from the register block: Normal = grounded real places and natural materials; Luxury = premium materials, flawless surfaces, expensive light; Gritty = visible wear, real dirt and sweat, uncorrected light.
- Match the INTENSITY tier: Low is restrained and quiet; Extra High consumes the frame.
- BALANCE: give the location, the action and the atmosphere at least as much attention as the person.

SUBJECT COUNT (safety):
- Default to ONE subject in frame. A second person requires explicit justification from the brief (a duo, a named collaboration).
- Never depict two people embracing, kissing, or in romantic or sexual physical contact, regardless of how romantic the lyrics are. Use the CONNECTION techniques above instead — motion, implication, a charged environment, a hand at the frame's edge. Those are not consolation prizes; they are the stronger image.

STORY-ONLY RULE:
- You write the STORY, never the photography. Describe only: who is in frame, where they are, what they are physically doing, their expression and posture, and at most ONE symbolic object.
- Do NOT mention cameras, lenses, film stock, lighting, shadows, rim light, colour grade, hue, grain, exposure, vignette or post-processing. A separate system decides every one of those; naming them here corrupts the result.
- Keep it concrete and physical — real places, real objects, real body language — not abstract adjectives like "melancholic atmosphere" or "meditative energy".

OUTPUT FORMAT (CRITICAL):
Respond with exactly two lines, nothing else:
TECHNIQUE: <one of the 10 technique names above, exact match>
SCENE: <2-3 sentence cinematic moment grounded in this song. Name a SPECIFIC location with atmosphere and one or two meaningful props; place a MEMORABLE, specific person inside it — whose gender, age and identity you chose to fit THIS song, with a distinctive marker and specific wardrobe; and describe what is HAPPENING in the moment (action, not a static pose). Balance world, action and subject roughly equally. No camera, lighting, colour or grain words. No vague descriptors. No preamble, no quotes, no lyric excerpts.>`;

function parseSceneResponse(rawText, fallbackScene) {
  const text = (rawText || '').trim()
  if (!text) {
    return { technique: DEFAULT_TECHNIQUE, scene: fallbackScene }
  }
  const techniqueMatch = text.match(/TECHNIQUE:\s*([A-Z_]+)/i)
  const sceneMatch = text.match(/SCENE:\s*([\s\S]+)/i)

  const technique = techniqueMatch?.[1]?.toUpperCase()
  const validTechnique = TECHNIQUE_SUFFIXES[technique] ? technique : DEFAULT_TECHNIQUE
  const scene = sceneMatch?.[1]?.trim() || text

  return { technique: validTechnique, scene }
}

function buildFluxPrompt(technique, scene) {
  const suffix = TECHNIQUE_SUFFIXES[technique] || TECHNIQUE_SUFFIXES[DEFAULT_TECHNIQUE]
  return `${scene}. ${suffix} Definitively moody, intentional, and authentic — zero digital smoothing, zero CGI artifacts, zero plastic AI skin.`
}

async function buildFinalPrompt(technique, scene, features, { useCompiler = false, userFeeling, mood, noPeople = false } = {}) {
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
        noPeople,
      })
      return { prompt: result.prompt, technique: result.technique, dna: result.dna }
    }
    const built = engine.assembleFromScene({ features, techniqueName: technique, sceneText: scene, noPeople })
    return { prompt: built.prompt, technique: built.technique, dna: built.dna }
  } catch (err) {
    console.warn(`[ENGINE] Visual DNA build failed, using legacy prompt: ${err?.message || err}`)
    return { prompt: buildFluxPrompt(technique, scene), technique, dna: null }
  }
}

const BANNED_SCENE_PATTERN = /\b(nude|naked|nudity|topless|bare chest|bare breast|exposed breast|exposed body|explicit|undressed|undressing|underwear as outerwear|only (?:in |wearing )?(?:a |her |his )?(?:underwear|lingerie|thong|bra|panties)|thong|lingerie|bikini bottom|see[- ]through|sheer(?:\s+fabric)?\s+(?:top|dress|clothing)|sexually?|erotic|seductive pose)\b/i

function sceneFailsSafetyCheck(scene) {
  return BANNED_SCENE_PATTERN.test(scene || '')
}

const SAFE_FALLBACK_SCENE = 'A figure standing in soft directional light, quiet and composed, fully clothed in simple modern styling, captured mid-thought against a plain textured wall.'

async function generateSafeScene(promptText, options) {
  let { technique, scene } = await generateWithRetry(promptText, options)

  if (sceneFailsSafetyCheck(scene)) {
    console.warn('[SAFETY] Rejected scene brief on first pass — retrying with stricter constraints')
    const stricterPrompt = `${promptText}\n\nSTRICT REQUIREMENT: All subjects must be fully clothed in tasteful, modern styling. No exceptions, no nudity, no undergarments as outerwear, no suggestive framing.`
    ;({ technique, scene } = await generateWithRetry(stricterPrompt, { ...options }))

    if (sceneFailsSafetyCheck(scene)) {
      console.warn('[SAFETY] Rejected scene brief on second pass — falling back to hardcoded safe scene')
      technique = DEFAULT_TECHNIQUE
      scene = SAFE_FALLBACK_SCENE
    }
  }

  return { technique, scene }
}

function serializeBrief(technique, scene) {
  return JSON.stringify({ technique, scene })
}

const audioFeaturesToVisualDescription = (features, artistGenre = null) => {
  if (!features) {
    return artistGenre
      ? `Lineage: ${artistGenre}. Audio structural variables aligned to standard baseline frequencies.`
      : "Audio structural variables aligned to standard baseline frequencies.";
  }
  const { bpm, key, scale, energy, valence, danceability, acousticness, spectral_brightness, loudness, mood, genre } = features;
  const parts = [];

  parts.push(`Lineage: ${artistGenre || genre || 'Contemporary Sound'}`);
  parts.push(`Tempo/Key: ${bpm || 90} BPM in ${key || 'C'} ${scale || 'Major'}`);
  parts.push(`Energy Density: ${energy || 50}/100, Valence/Emotional Weight: ${valence || 50}/100`);
  parts.push(`Rhythm Matrix: Danceability ${danceability || 50}/100, Acousticness ${acousticness || 50}/100`);
  parts.push(`Spectral Profile: Brightness ${spectral_brightness || 50}/100, Loudness ${loudness || -6} dB`);
  parts.push(`Kinetic Profile: Overarching ${mood || 'balanced'} acoustic state`);

  return parts.join('. ');
};

async function generateWithRetry(promptText, { maxRetries = 3, fallbackScene = '' } = {}) {
  let lastErr
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: promptText,
      })
      return parseSceneResponse(response.text, fallbackScene)
    } catch (err) {
      lastErr = err
      const isRetryable = err?.status === 503 || err?.message?.includes('UNAVAILABLE') || err?.status === 429
      if (!isRetryable || attempt === maxRetries) throw err
      const delayMs = 500 * 2 ** (attempt - 1)
      console.warn(`[GEMINI RETRY] attempt ${attempt} failed (${err?.message || err}), retrying in ${delayMs}ms`)
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
  throw lastErr
}

async function synthesizeSceneBrief({ userInput, lyrics, sonicFeatures, artistContext }) {
  const promptText = `${AESTHETIC_SYSTEM_PROMPT}

${emotionalRegister2 ? `ââ EMOTIONAL REGISTER (read this FIRST â it governs the whole frame) ââ
${emotionalRegister2}
` : ''}
INPUT MATRIX TO CONVERT:
1. Artist's Core Feeling / What The Song Is About: "${userInput.trim()}"
2. Song Lyrics: "${lyrics || 'No lyrics available — treat as instrumental-leaning emotional content'}"
3. Track Sonic Profile Features: ${sonicFeatures}
${artistContext ? `4. Artist Branding Space Context: ${artistContext}` : ''}`;

  try {
    return await generateSafeScene(promptText, { fallbackScene: userInput.trim() })
  } catch (err) {
    console.error(`⚠️ Scene brief synthesis fallback triggered: ${err?.message || err}`)
    return { technique: DEFAULT_TECHNIQUE, scene: userInput.trim() }
  }
}

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
      model: GEMINI_TEXT_MODEL,
      contents: distillPrompt,
    })
    return response.text?.trim() || userVibeInput.trim()
  } catch (err) {
    console.warn(`[LYRIC DISTILL] Falling back to raw vibe input: ${err?.message || err}`)
    return userVibeInput.trim()
  }
}

const EMPTY_ARTIST_PROFILE = { contextLine: '', genreLineage: null, subjectRule: '' }

async function fetchArtistProfile(userId) {
  try {
    const { data } = await supabase
      .from('users')
      .select('city, sound_words, default_genre, default_subject_mode')
      .eq('id', userId)
      .single()
    if (!data) return EMPTY_ARTIST_PROFILE
    return {
      contextLine: `Origin: ${data.city || 'Unknown Space'}. Signature Sound Identity: ${data.sound_words || 'Chill, Vibe, Cool'}.`,
      genreLineage: genreLineage(data.default_genre),
      subjectRule: subjectModeRule(data.default_subject_mode),
    }
  } catch (err) {
    console.warn(`[ARTIST CONTEXT] Fetch failed, continuing without brand context: ${err?.message || err}`)
    return EMPTY_ARTIST_PROFILE
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

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

    const artist = await fetchArtistProfile(userId);
    const audioContext = audioFeaturesToVisualDescription(upload.audio_features, artist.genreLineage);

    const emotionalRegister = buildEmotionalRegister(upload.audio_features, artist.genreLineage, basic_input)

    const promptText = `${AESTHETIC_SYSTEM_PROMPT}
${artist.subjectRule ? `\nARTIST SUBJECT RULE (HARD CONSTRAINT — overrides every other instruction): ${artist.subjectRule}\n` : ''}
${emotionalRegister ? `ââ EMOTIONAL REGISTER (read this FIRST â it governs the whole frame) ââ
${emotionalRegister}
` : ''}
Artist input text: "${basic_input.trim()}"
Audio context variables: ${audioContext}
${artist.contextLine ? `Artist Branding Space Context: ${artist.contextLine}` : ''}`;

    let technique, scene
    try {
      ({ technique, scene } = await generateSafeScene(promptText, {
        fallbackScene: basic_input.trim(),
      }))
    } catch (gErr) {
      console.error(`[EXPAND ENGINE] Gemini fault after retries: ${gErr?.message || gErr}`)
      technique = DEFAULT_TECHNIQUE
      scene = basic_input.trim()
    }

    await supabase
      .from('uploads')
      .update({ sentence_prompt: serializeBrief(technique, scene) })
      .eq('id', upload_id)

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
    const artist = await fetchArtistProfile(userId)
    const trackSonicFeatures = audioFeaturesToVisualDescription(upload.audio_features, artist.genreLineage)

    let lyricsText = ''
    let source = 'none'
    let matched = null

    console.log(`[LYRICS LOOKUP] Searching Genius for "${upload.title}"${artist_name ? ` by ${artist_name}` : ' (no artist supplied)'}`)
    const onlineMatch = await fetchLyricsOnline(upload.title, artist_name)

    if (onlineMatch) {
      console.log(`[LYRICS LOOKUP] Match found: "${onlineMatch.matchedTitle}" by ${onlineMatch.matchedArtist}`)
      lyricsText = onlineMatch.lyrics
      source = 'genius'
      matched = { title: onlineMatch.matchedTitle, artist: onlineMatch.matchedArtist }
    } else {
      console.log('[LYRICS LOOKUP] No confident online match — falling back to Deepgram transcription')

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
        const deepgram = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY })

        const pathLower = upload.storage_path.toLowerCase()
        let extLabel = 'mp3'
        if (pathLower.endsWith('.wav')) extLabel = 'wav'
        else if (pathLower.endsWith('.m4a')) extLabel = 'm4a'
        else if (pathLower.endsWith('.ogg')) extLabel = 'ogg'

        console.log(`[DEEPGRAM REQUEST] upload=${upload_id} ext=${extLabel} bytes=${buffer.length}`)

        try {
          // WHY THIS OFTEN RETURNED NOTHING:
          // nova-3 with no `language` set defaults to English-only. A huge share
          // of what FELT processes is not monolingual English — Afrobeats and
          // Amapiano code-switch constantly between English, Pidgin, Yoruba, Igbo,
          // Twi, Zulu (Fireboy DML's "Vibration" is English + Yoruba + Pidgin).
          // An English-only decoder scores those as noise and returns an empty
          // transcript, which looked identical to "this track is instrumental".
          //
          // Pass 1 uses nova-3's multilingual mode (code-switching within one
          // track). Pass 2 falls back to automatic language detection. Only after
          // both come back empty do we treat the track as genuinely instrumental.
          const dgBaseOptions = { smart_format: true, punctuate: true, timeoutInSeconds: 300 }
          const dgPasses = [
            { label: 'nova-3 multilingual', opts: { model: 'nova-3', language: 'multi', ...dgBaseOptions } },
            { label: 'nova-2 auto-detect', opts: { model: 'nova-2', detect_language: true, ...dgBaseOptions } },
          ]

          let dgResponse = null
          for (const pass of dgPasses) {
            try {
              dgResponse = await deepgram.listen.v1.media.transcribeFile(buffer, pass.opts)
              const alt = dgResponse?.results?.channels?.[0]?.alternatives?.[0]
              const text = alt?.transcript?.trim() || ''
              console.log(`[DEEPGRAM PASS] upload=${upload_id} pass="${pass.label}" chars=${text.length} confidence=${alt?.confidence ?? 'n/a'} detected=${dgResponse?.results?.channels?.[0]?.detected_language ?? 'n/a'}`)
              if (text) break
            } catch (passErr) {
              console.warn(`[DEEPGRAM PASS FAILED] "${pass.label}": ${passErr?.message || passErr}`)
            }
          }

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

    // ── STEP 3: Handle execution logic paths exactly like /expand ──
    let promptText = '';

    if (!lyricsText || !lyricsText.trim()) {
      console.log(`[TRANSCRIPTION FALLBACK] Lyrics missing from all lookups for upload=${upload_id}. Activating direct prompt compiler match. Mode: VOCAL`);
      
      const emotionalRegister = buildEmotionalRegister(upload.audio_features, artist.genreLineage, userVibeInput)
      promptText = `${AESTHETIC_SYSTEM_PROMPT}
${artist.subjectRule ? `\nARTIST SUBJECT RULE (HARD CONSTRAINT — overrides every other instruction): ${artist.subjectRule}\n` : ''}
${emotionalRegister ? `ââ EMOTIONAL REGISTER (read this FIRST â it governs the whole frame) ââ
${emotionalRegister}
` : ''}
VOCAL CONTEXT RULE: This song contains VOCALS, not an instrumental track. Fully expand the user prompt below into a beautifully tailored visual representation matching a vocal track presence to avoid generic cover art layouts.
Artist input text: "${userVibeInput.trim()}"
Audio context variables: ${trackSonicFeatures}
${artist.contextLine ? `Artist Branding Space Context: ${artist.contextLine}` : ''}`;
    } else {
      console.log(`[TRANSCRIPTION SUCCESS] Lyrics resolved via ${source}. Distilling structure.`);
      const distilledTheme = await distillLyricsToTheme(lyricsText, userVibeInput)

      const emotionalRegister2 = buildEmotionalRegister(upload.audio_features, artist.genreLineage, `${userVibeInput} ${distilledTheme}`)
      promptText = `${AESTHETIC_SYSTEM_PROMPT}
${artist.subjectRule ? `\nARTIST SUBJECT RULE (HARD CONSTRAINT — overrides every other instruction): ${artist.subjectRule}\n` : ''}
INPUT MATRIX TO CONVERT — the scene you write MUST depict what this song is about:
1. Artist's Core Feeling: "${userVibeInput.trim()}"
2. What This Song Is About (concrete brief distilled from the lyrics — stage THIS): "${distilledTheme}"
3. Track Sonic Profile Features: ${trackSonicFeatures}
${artist.contextLine ? `4. Artist Branding Space Context: ${artist.contextLine}` : ''}`;
    }

    let technique, scene
    try {
      ({ technique, scene } = await generateSafeScene(promptText, {
        fallbackScene: userVibeInput.trim(),
      }))
      console.log(`[SCENE RECONCILIATION] Resolved scene for upload=${upload_id} with technique=${technique}`);
    } catch (gErr) {
      console.error(
        `⚠️ Transcribe-stage Gemini expansion fallback triggered after retries: ${gErr?.message || gErr}` +
        (gErr?.cause ? ` | cause: ${gErr.cause.code || gErr.cause.message || gErr.cause}` : '')
      )
      technique = DEFAULT_TECHNIQUE
      scene = userVibeInput.trim()
    }

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
        .select('city, sound_words, default_genre, default_subject_mode')
        .eq('id', userId)
        .single(),
    ])

    if (uploadResult.error || !uploadResult.data) {
      return res.status(404).json({ error: 'Upload asset record not found' })
    }

    const upload = uploadResult.data
    const artistProfile = profileResult.data || {}
    const artistNoPeople = artistProfile.default_subject_mode === 'no_people'

    if (upload.status === 'uploaded') {
      return res.status(409).json({ error: 'Audio analysis must complete before generating art' })
    }

    const trackSonicFeatures = audioFeaturesToVisualDescription(
      upload.audio_features,
      genreLineage(artistProfile.default_genre)
    )

    let technique, scene

    if (lyric_context) {
      scene = lyric_context.trim()
      if (TECHNIQUE_SUFFIXES[techniqueOverride]) {
        technique = techniqueOverride
      } else {
        const storedBrief = deserializeBrief(upload.sentence_prompt)
        technique = (storedBrief && storedBrief.structured) ? storedBrief.technique : DEFAULT_TECHNIQUE
      }
    } else {
      const storedBrief = deserializeBrief(upload.sentence_prompt)
      if (storedBrief && storedBrief.structured) {
        ;({ technique, scene } = storedBrief)
      } else {
        ;({ technique, scene } = await synthesizeSceneBrief({
          userInput: storedBrief ? storedBrief.scene : 'Abstract intense emotion',
          lyrics: '',
          sonicFeatures: trackSonicFeatures,
          artistContext: `${artistProfile.city || 'Unknown Space'} (${artistProfile.sound_words || 'Raw Collective'})`,
        }))
      }
    }

    const { prompt: absoluteFluxPrompt } = await buildFinalPrompt(technique, scene, upload.audio_features, {
      useCompiler: req.body.use_compiler === true,
      mood: upload.audio_features?.mood,
      noPeople: artistNoPeople,
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

router.patch('/refine', requireAuth, async (req, res) => {
  const { upload_id, lyric_context, image_url } = req.body;
  const userId = req.user.id;

  if (!upload_id) {
    return res.status(400).json({ error: 'upload_id is required.' });
  }
  const modRequest = (lyric_context || '').trim();

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
        .select('city, sound_words, default_genre, default_subject_mode')
        .eq('id', userId)
        .single(),
    ]);

    if (uploadResult.error || !uploadResult.data) {
      return res.status(404).json({ error: 'Upload asset record not found.' });
    }

    const upload = uploadResult.data;
    const refineProfile = profileResult.data || {};
    const refineNoPeople = refineProfile.default_subject_mode === 'no_people';
    const refineSubjectRule = subjectModeRule(refineProfile.default_subject_mode);
    const trackSonicFeatures = audioFeaturesToVisualDescription(
      upload.audio_features,
      genreLineage(refineProfile.default_genre)
    );

    const refinementPrompt = `${AESTHETIC_SYSTEM_PROMPT}
${refineSubjectRule ? `\nARTIST SUBJECT RULE (HARD CONSTRAINT — overrides every other instruction): ${refineSubjectRule}\n` : ''}
You are refining an existing cover art brief${modRequest ? ' based on direct artist feedback' : ' by producing a fresh alternate take'} — keep the same technique unless the request clearly demands a different one.

INPUT REFINEMENT VARIABLES:
1. Modification Request: "${modRequest || 'No specific change requested — generate a distinctly different alternate take of the same concept: a new pose, moment, angle or setting detail.'}"
2. Existing Brief: ${deserializeBrief(upload.sentence_prompt)?.scene || 'Baseline generation profile'}
3. Underlying Track Sonic Signature: ${trackSonicFeatures}`;

    const refineFallback = modRequest || deserializeBrief(upload.sentence_prompt)?.scene || 'Abstract intense emotion'
    let technique, scene
    try {
      ({ technique, scene } = await generateSafeScene(refinementPrompt, {
        fallbackScene: refineFallback,
      }))
    } catch (gErr) {
      console.error(`⚠️ Refinement expansion fallback applied after retries: ${gErr?.message || gErr}`);
      technique = DEFAULT_TECHNIQUE
      scene = refineFallback
    }

    const { prompt: absoluteFluxRefinedPrompt } = await buildFinalPrompt(technique, scene, upload.audio_features, {
      useCompiler: req.body.use_compiler === true,
      mood: upload.audio_features?.mood,
      noPeople: refineNoPeople,
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
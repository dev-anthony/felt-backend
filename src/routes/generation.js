
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
  getFallbackTechnique,
} = require('../engine/technique')

const { genreLineage, subjectModeRule } = require('../config/artistProfile')
const { aestheticSystemPrompt } = require('../engine/scene/prompt')

const { buildFeatureVector } = require('../engine/dna/featureVector')
// COVER PLAN — emotion read + visual metaphor + technique choice, run before the
// scene writer. See engine/plan (orchestration) and engine/metaphor (why the
// metaphor stage exists: without it the scene writer defaults straight to the
// statistically most common scene for the archetype/genre).
const {
  resolveTechnique,
  deriveSceneMode,
  planCover: planCoverCore,
} = require('../engine/plan')

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

// planCover with this route file's Gemini call injected (see engine/plan).
const planCover = (args) => planCoverCore({ generate: geminiRawText, ...args })

function deserializeBrief(stored, features) {
  if (!stored) return null
  const fallbackTechnique = () => getFallbackTechnique(features ? buildFeatureVector(features) : undefined)
  try {
    const parsed = JSON.parse(stored)
    if (parsed && typeof parsed.scene === 'string') {
      return {
        technique: TECHNIQUE_SUFFIXES[parsed.technique] ? parsed.technique : fallbackTechnique(),
        scene: parsed.scene,
        // Whether the winning metaphor needed a person, from when this brief
        // was written — null (unknown) for briefs saved before this existed.
        hasPerson: typeof parsed.hasPerson === 'boolean' ? parsed.hasPerson : null,
        structured: true,
      }
    }
  } catch {
    // Left unexpanded
  }
  return { technique: fallbackTechnique(), scene: stored, structured: false }
}

function parseSceneResponse(rawText, fallbackScene) {
  const text = (rawText || '').trim()
  if (!text) return { scene: fallbackScene }
  // Technique was locked before this prompt was built — strip a stray
  // "SCENE:" label if the model adds one out of habit, but don't require it.
  const scene = text.replace(/^SCENE:\s*/i, '').trim() || fallbackScene
  return { scene }
}

function buildFluxPrompt(technique, scene) {
  const suffix = TECHNIQUE_SUFFIXES[technique] || TECHNIQUE_SUFFIXES[DEFAULT_TECHNIQUE]
  return `${scene}. ${suffix} Definitively moody, intentional, and authentic — zero digital smoothing, zero CGI artifacts, zero plastic AI skin.`
}

/**
 * Composes the prompt that is actually sent to the image model (see
 * engine/compose for the rationale) and logs every part, so a bad image can be
 * traced to the stage that produced it instead of guessed at. Returns the string.
 */
function composeForImage({ scene, dna, technique, noPeople, label = 'COMPOSE' }) {
  const { prompt, parts, length } = engine.composeImagePrompt({ scene, dna, technique, noPeople })
  console.log(`[${label}] technique=${technique} noPeople=${!!noPeople} medium="${parts.medium || '-'}" scene=${parts.scene.length}c rendering=${parts.rendering.length} layers dropped=[${parts.dropped.join(',') || '-'}] total=${length}c`)
  console.log(`[${label}] PROMPT SENT TO IMAGE MODEL:\n${prompt}`)
  return prompt
}

async function buildFinalPrompt(technique, scene, features, { useCompiler = false, userFeeling, mood, noPeople = false, mediumFamily } = {}) {
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
    const built = engine.assembleFromScene({ features, techniqueName: technique, sceneText: scene, noPeople, mediumFamily, intentText: userFeeling || scene })
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
  let { scene } = await generateWithRetry(promptText, options)

  if (sceneFailsSafetyCheck(scene)) {
    console.warn('[SAFETY] Rejected scene brief on first pass — retrying with stricter constraints')
    const stricterPrompt = `${promptText}\n\nSTRICT REQUIREMENT: All subjects must be fully clothed in tasteful, modern styling. No exceptions, no nudity, no undergarments as outerwear, no suggestive framing.`
    ;({ scene } = await generateWithRetry(stricterPrompt, { ...options }))

    if (sceneFailsSafetyCheck(scene)) {
      console.warn('[SAFETY] Rejected scene brief on second pass — falling back to hardcoded safe scene')
      scene = SAFE_FALLBACK_SCENE
    }
  }

  // QUALITY GUARD. Decoration ("glowing fissures", "a spiderweb of cracks") and
  // technique vocabulary written into the story ("rendered in thermal
  // false-color") both survived the prompt rules in real generations, and both
  // reach the image model literally. One retry, naming the exact words. Skipped
  // for the two fallbacks — those are the artist's own words or a fixed safe
  // scene, not model output to police.
  const isFallback = scene === SAFE_FALLBACK_SCENE || scene === (options && options.fallbackScene)
  if (!isFallback) {
    const issues = engine.sceneQualityIssues(scene)
    if (issues.length) {
      console.warn(`[SCENE QUALITY] first pass rejected: ${issues.map((i) => `${i.kind}:"${i.match}"`).join(', ')} — retrying once`)
      try {
        const retry = await generateWithRetry(`${promptText}\n\n${engine.qualityRetryNote(issues)}`, { ...options })
        const retryIssues = engine.sceneQualityIssues(retry.scene)
        if (!sceneFailsSafetyCheck(retry.scene) && retryIssues.length < issues.length) {
          console.log(`[SCENE QUALITY] retry accepted (${issues.length} -> ${retryIssues.length} issues)`)
          scene = retry.scene
        } else {
          console.warn('[SCENE QUALITY] retry no better — keeping first pass')
        }
      } catch (err) {
        console.warn(`[SCENE QUALITY] retry failed, keeping first pass: ${err?.message || err}`)
      }
    } else {
      console.log('[SCENE QUALITY] clean')
    }
  }

  return { scene }
}

function serializeBrief(technique, scene, hasPerson = null) {
  return JSON.stringify({ technique, scene, hasPerson })
}

const audioFeaturesToVisualDescription = (features, artistGenre = null) => {
  if (!features) {
    return artistGenre
      ? `Lineage: ${artistGenre}. Audio structural variables aligned to standard baseline frequencies.`
      : "Audio structural variables aligned to standard baseline frequencies.";
  }
  const { bpm, key, scale, energy, valence, danceability, acousticness, spectral_brightness, loudness, genre } = features;
  const parts = [];

  parts.push(`Lineage: ${artistGenre || genre || 'Contemporary Sound'}`);
  parts.push(`Tempo/Key: ${bpm || 90} BPM in ${key || 'C'} ${scale || 'Major'}`);
  parts.push(`Energy Density: ${energy || 50}/100, Valence/Emotional Weight: ${valence || 50}/100`);
  parts.push(`Rhythm Matrix: Danceability ${danceability || 50}/100, Acousticness ${acousticness || 50}/100`);
  parts.push(`Spectral Profile: Brightness ${spectral_brightness || 50}/100, Loudness ${loudness || -6} dB`);
  // No "mood" line here on purpose: `features.mood` is a crude nearest-cluster
  // label computed client-side (WorkspaceWizard.tsx's VECTOR_CLUSTERS), a
  // completely separate classifier from the archetype-based EMOTIONAL REGISTER
  // block (planCover -> buildEmotionalRegister) that always accompanies this
  // text in the same prompt. Shipping both risked two disagreeing mood reads
  // in one prompt — the LLM doesn't reconcile contradictions, it blends them.

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

async function synthesizeSceneBrief({ userInput, lyrics, sonicFeatures, artistContext, features }) {
  const plan = await planCover({
    features,
    genreLineage: null,
    intentText: userInput,
    metaphorWords: userInput,
    contextFallback: sonicFeatures,
  })
  const { technique, hasPerson, emotionalRegister } = plan
  const promptText = `${aestheticSystemPrompt({ ...plan.sceneMode, technique, metaphor: plan.metaphor })}
${emotionalRegister ? `── EMOTIONAL REGISTER (read this FIRST — it governs the whole frame) ──
${emotionalRegister}
` : ''}
INPUT MATRIX TO CONVERT:
1. Artist's Core Feeling / What The Song Is About: "${userInput.trim()}"
2. Song Lyrics: "${lyrics || 'No lyrics available — treat as instrumental-leaning emotional content'}"
3. Track Sonic Profile Features: ${sonicFeatures}
${artistContext ? `4. Artist Branding Space Context: ${artistContext}` : ''}`;

  try {
    const { scene } = await generateSafeScene(promptText, { fallbackScene: userInput.trim() })
    return { technique, scene, hasPerson }
  } catch (err) {
    console.error(`⚠️ Scene brief synthesis fallback triggered: ${err?.message || err}`)
    return { technique, scene: userInput.trim(), hasPerson }
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
  // The artist's selection from the emotion taxonomy. Optional: when absent the
  // read is exactly as before, so older clients are unaffected.
  const declaredEmotionId = req.body.declared_emotion || null
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
    const plan = await planCover({
      features: upload.audio_features,
      genreLineage: artist.genreLineage,
      intentText: basic_input,
      metaphorWords: basic_input,
      declaredEmotionId,
    })
    const { technique, hasPerson, emotionalRegister } = plan

    const promptText = `${aestheticSystemPrompt({ ...plan.sceneMode, technique, metaphor: plan.metaphor })}
${artist.subjectRule ? `\nARTIST SUBJECT RULE (HARD CONSTRAINT — overrides every other instruction): ${artist.subjectRule}\n` : ''}
${emotionalRegister ? `── EMOTIONAL REGISTER (read this FIRST — it governs the whole frame) ──
${emotionalRegister}
` : ''}
Artist input text: "${basic_input.trim()}"
Audio context variables: ${audioContext}
${artist.contextLine ? `Artist Branding Space Context: ${artist.contextLine}` : ''}`;

    let scene
    try {
      ({ scene } = await generateSafeScene(promptText, {
        fallbackScene: basic_input.trim(),
      }))
    } catch (gErr) {
      console.error(`[EXPAND ENGINE] Gemini fault after retries: ${gErr?.message || gErr}`)
      scene = basic_input.trim()
    }

    await supabase
      .from('uploads')
      .update({ sentence_prompt: serializeBrief(technique, scene, hasPerson) })
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
  // The artist's selection from the emotion taxonomy. Optional: when absent the
  // read is exactly as before, so older clients are unaffected.
  const declaredEmotionId = req.body.declared_emotion || null
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
    // Technique is resolved inside planCover, once per branch and AFTER the
    // metaphor stage, so the artist's words (not only the audio) inform it.
    let technique
    let promptText = '';
    let resolvedHasPerson = null;

    if (!lyricsText || !lyricsText.trim()) {
      console.log(`[TRANSCRIPTION FALLBACK] Lyrics missing from all lookups for upload=${upload_id}. Activating direct prompt compiler match. Mode: VOCAL`);

      const plan = await planCover({
        features: upload.audio_features,
        genreLineage: artist.genreLineage,
        intentText: userVibeInput,
        metaphorWords: userVibeInput,
        declaredEmotionId,
      })
      technique = plan.technique
      promptText = `${aestheticSystemPrompt({ ...plan.sceneMode, technique, metaphor: plan.metaphor })}
${artist.subjectRule ? `\nARTIST SUBJECT RULE (HARD CONSTRAINT — overrides every other instruction): ${artist.subjectRule}\n` : ''}
${plan.emotionalRegister ? `── EMOTIONAL REGISTER (read this FIRST — it governs the whole frame) ──
${plan.emotionalRegister}
` : ''}
VOCAL CONTEXT RULE: This song contains VOCALS, not an instrumental track. Fully expand the user prompt below into a beautifully tailored visual representation matching a vocal track presence to avoid generic cover art layouts.
Artist input text: "${userVibeInput.trim()}"
Audio context variables: ${trackSonicFeatures}
${artist.contextLine ? `Artist Branding Space Context: ${artist.contextLine}` : ''}`;
      resolvedHasPerson = plan.hasPerson;
    } else {
      console.log(`[TRANSCRIPTION SUCCESS] Lyrics resolved via ${source}. Distilling structure.`);
      const distilledTheme = await distillLyricsToTheme(lyricsText, userVibeInput)

      const plan = await planCover({
        features: upload.audio_features,
        genreLineage: artist.genreLineage,
        intentText: `${userVibeInput} ${distilledTheme}`,
        metaphorWords: `${userVibeInput}. ${distilledTheme}`,
        declaredEmotionId,
      })
      technique = plan.technique
      promptText = `${aestheticSystemPrompt({ ...plan.sceneMode, technique, metaphor: plan.metaphor })}
${artist.subjectRule ? `\nARTIST SUBJECT RULE (HARD CONSTRAINT — overrides every other instruction): ${artist.subjectRule}\n` : ''}
${plan.emotionalRegister ? `── EMOTIONAL REGISTER (read this FIRST — it governs the whole frame) ──
${plan.emotionalRegister}
` : ''}
INPUT MATRIX TO CONVERT — the scene you write MUST depict what this song is about:
1. Artist's Core Feeling: "${userVibeInput.trim()}"
2. What This Song Is About (concrete brief distilled from the lyrics — stage THIS): "${distilledTheme}"
3. Track Sonic Profile Features: ${trackSonicFeatures}
${artist.contextLine ? `4. Artist Branding Space Context: ${artist.contextLine}` : ''}`;
      resolvedHasPerson = plan.hasPerson;
    }

    let scene
    try {
      ({ scene } = await generateSafeScene(promptText, {
        fallbackScene: userVibeInput.trim(),
      }))
      console.log(`[SCENE RECONCILIATION] Resolved scene for upload=${upload_id} with technique=${technique}`);
    } catch (gErr) {
      console.error(
        `⚠️ Transcribe-stage Gemini expansion fallback triggered after retries: ${gErr?.message || gErr}` +
        (gErr?.cause ? ` | cause: ${gErr.cause.code || gErr.cause.message || gErr.cause}` : '')
      )
      scene = userVibeInput.trim()
    }

    await supabase
      .from('uploads')
      .update({ sentence_prompt: serializeBrief(technique, scene, resolvedHasPerson) })
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
  const { upload_id, lyric_context, technique: techniqueOverride,
    // Optional Task 4 reference-image workflow: an artist-supplied photo,
    // moodboard crop or press shot the cover should draw its composition,
    // palette and environment from. `creative_strength` (0..1) controls how
    // much of the reference survives -- see imageProvider.js's viaCloudflare
    // for the measured behaviour behind that number. Both are optional and
    // safely no-op on providers that cannot use them.
    reference_image_url, reference_image_b64, creative_strength,
  } = req.body
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
    // Whether the winning metaphor needed a person, carried over from whichever
    // /expand or /transcribe call originally wrote this scene — null if that
    // metaphor call never ran or produced nothing usable, in which case
    // `noPeople` below just falls back to the artist's profile setting.
    let resolvedHasPerson = null

    if (lyric_context) {
      scene = lyric_context.trim()
      // Fetched regardless of whether a technique override is used below —
      // this scene text is the SAME one /expand or /transcribe already wrote a
      // metaphor for, so that metaphor's hasPerson is still the right subject
      // decision for it even when the artist overrides the technique.
      const storedBrief = deserializeBrief(upload.sentence_prompt, upload.audio_features)
      resolvedHasPerson = storedBrief ? storedBrief.hasPerson : null
      if (TECHNIQUE_SUFFIXES[techniqueOverride]) {
        // Explicit user override — a real feature, not Gemini randomness, so
        // it's kept as-is.
        technique = techniqueOverride
      } else {
        technique = (storedBrief && storedBrief.structured)
          ? storedBrief.technique
          : resolveTechnique(upload.audio_features, genreLineage(artistProfile.default_genre), lyric_context)
      }
    } else {
      const storedBrief = deserializeBrief(upload.sentence_prompt)
      if (storedBrief && storedBrief.structured) {
        ;({ technique, scene } = storedBrief)
        resolvedHasPerson = storedBrief.hasPerson
      } else {
        ;({ technique, scene, hasPerson: resolvedHasPerson } = await synthesizeSceneBrief({
          userInput: storedBrief ? storedBrief.scene : 'Abstract intense emotion',
          lyrics: '',
          sonicFeatures: trackSonicFeatures,
          artistContext: `${artistProfile.city || 'Unknown Space'} (${artistProfile.sound_words || 'Raw Collective'})`,
          features: upload.audio_features,
        }))
      }
    }

    const { dna: promptDna } = await buildFinalPrompt(technique, scene, upload.audio_features, {
      // Same family the scene writer was briefed on, so the assembled
      // medium can never contradict the scene text.
      mediumFamily: deriveSceneMode(upload.audio_features).mediumFamily,
      useCompiler: req.body.use_compiler === true,
      // No `mood` here on purpose — `upload.audio_features.mood` is the crude
      // client-side VECTOR_CLUSTERS label, a second classifier independent of
      // the archetype engine. Leaving this unset lets orchestrate() fall back
      // to `dna.vector.meta.mood` (engine/index.js), the real signal, instead
      // of shipping two disagreeing mood reads into one compiler prompt.
      // The artist's profile setting is a hard "always no people" override;
      // otherwise defer to the metaphor's own decision for THIS cover.
      noPeople: artistNoPeople || resolvedHasPerson === false,
    })

    const generationId = crypto.randomUUID()
    await supabase.from('uploads').update({ status: 'generating' }).eq('id', upload_id)

    console.log(`[IMAGE-ENGINE] Launching ${DEFAULT_PROVIDER} pipeline for ID: ${generationId} technique=${technique}`)

    // What the image model receives is composed from the parts (see engine/compose),
    // not the verbose reasoning prompt — and it is what gets stored as prompt_used,
    // so the database shows what was actually sent.
    const imagePrompt = composeForImage({ scene, dna: promptDna, technique, noPeople: artistNoPeople || resolvedHasPerson === false })

    let imagePayloadUrl
    try {
      console.log(`[IMAGE-ENGINE] sending to ${DEFAULT_PROVIDER}...`)
      imagePayloadUrl = await generateImage(imagePrompt, {
        width: 1024, height: 1024,
        referenceImageUrl: reference_image_url || undefined,
        referenceImageB64: reference_image_b64 || undefined,
        creativeStrength: creative_strength,
      })
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
        prompt_used: imagePrompt,
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
  const { upload_id, lyric_context, image_url, reference_image_url, reference_image_b64, creative_strength } = req.body;
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

    // Technique is locked to whatever the original generation used — refine
    // re-stages the same look, it never re-rolls the technique itself. If
    // there's no prior structured brief, planCover scores it fresh.
    const existingBrief = deserializeBrief(upload.sentence_prompt, upload.audio_features)
    const refineLineage = genreLineage(refineProfile.default_genre)
    const storedScene = existingBrief && existingBrief.structured ? String(existingBrief.scene || '').trim() : ''

    let technique
    let scene
    let refineHasPerson
    if (modRequest && storedScene && modRequest === storedScene) {
      // The tuning screen shows the artist an "expanded visual description", and
      // /expand has already stored exactly that text as this upload's scene.
      // Re-running the metaphor and scene writers on it would render a DIFFERENT
      // scene from the one on screen (and spend two more Gemini calls of a
      // 20/day quota). What the artist read is what gets rendered.
      technique = existingBrief.technique
      scene = storedScene
      refineHasPerson = existingBrief.hasPerson
      console.log('[REFINE] scene was already expanded and shown to the artist — rendering it as written, no rewrite')
    } else {
      const plan = await planCover({
        features: upload.audio_features,
        genreLineage: refineLineage,
        intentText: modRequest || storedScene,
        metaphorWords: modRequest || existingBrief?.scene || '',
        lockedTechnique: existingBrief && existingBrief.structured ? existingBrief.technique : undefined,
        contextFallback: trackSonicFeatures,
      })
      technique = plan.technique
      refineHasPerson = plan.hasPerson

      const refinementPrompt = `${aestheticSystemPrompt({ ...plan.sceneMode, technique, metaphor: plan.metaphor })}
${refineSubjectRule ? `\nARTIST SUBJECT RULE (HARD CONSTRAINT — overrides every other instruction): ${refineSubjectRule}\n` : ''}
${plan.emotionalRegister ? `── EMOTIONAL REGISTER (read this FIRST — it governs the whole frame) ──
${plan.emotionalRegister}
` : ''}
You are refining an existing cover art brief${modRequest ? ' based on direct artist feedback' : ' by producing a fresh alternate take'} — the technique above is LOCKED; write a new staging that suits it.

INPUT REFINEMENT VARIABLES:
1. Modification Request: "${modRequest || 'No specific change requested — generate a distinctly different alternate take of the same concept: a new pose, moment, angle or setting detail.'}"
2. Existing Brief: ${existingBrief?.scene || 'Baseline generation profile'}
3. Underlying Track Sonic Signature: ${trackSonicFeatures}`;

      const refineFallback = modRequest || existingBrief?.scene || 'Abstract intense emotion'
      try {
        ({ scene } = await generateSafeScene(refinementPrompt, {
          fallbackScene: refineFallback,
        }))
      } catch (gErr) {
        console.error(`⚠️ Refinement expansion fallback applied after retries: ${gErr?.message || gErr}`);
        scene = refineFallback
      }
    }

    const { dna: refinedDna } = await buildFinalPrompt(technique, scene, upload.audio_features, {
      // Same family the scene writer was briefed on, so the assembled
      // medium can never contradict the scene text.
      mediumFamily: deriveSceneMode(upload.audio_features).mediumFamily,
      useCompiler: req.body.use_compiler === true,
      // See the matching comment in the POST / handler above — deliberately no
      // `mood` here, so orchestrate() falls back to the archetype engine's own
      // read instead of the crude client-side classifier.
      // The artist's profile setting is a hard "always no people" override;
      // otherwise defer to the metaphor freshly generated above for this
      // refined scene (not the stale one on the pre-refine brief).
      noPeople: refineNoPeople || refineHasPerson === false,
    });

    const generationId = crypto.randomUUID();
    await supabase.from('uploads').update({ status: 'generating' }).eq('id', upload_id);

    console.log(`[REFINE-ENGINE] Launching ${DEFAULT_PROVIDER} pipeline. ID: ${generationId} technique=${technique}`);

    // Same composition as POST / above.
    const imagePrompt = composeForImage({ scene, dna: refinedDna, technique, noPeople: refineNoPeople || refineHasPerson === false, label: 'REFINE-COMPOSE' })

    let imagePayloadUrl;
    try {
      console.log(`[REFINE-ENGINE] sending to ${DEFAULT_PROVIDER}...`)
      imagePayloadUrl = await generateImage(imagePrompt, {
        width: 1024, height: 1024,
        referenceImageUrl: reference_image_url || undefined,
        referenceImageB64: reference_image_b64 || undefined,
        creativeStrength: creative_strength,
      });
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
        prompt_used: imagePrompt,
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
        sentence_prompt: serializeBrief(technique, scene, refineHasPerson)
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

// Exported for tests: the scene prompt is now conditional, so its branching is
// worth asserting directly rather than only observing through a live Gemini call.
module.exports.aestheticSystemPrompt = aestheticSystemPrompt
module.exports.synthesizeSceneBrief = synthesizeSceneBrief
module.exports.generateSafeScene = generateSafeScene
module.exports.deriveSceneMode = deriveSceneMode


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

const { HfInference } = require('@huggingface/inference')
const hf = new HfInference(process.env.HF_TOKEN)

// LAYER 1: FELT — Unified High-Concept Archetype Prompt
const AESTHETIC_SYSTEM_PROMPT = `You are a synesthetic visual artist and an elite music cover art director.
You do not interpret text literally; you translate the underlying feeling, sonic attributes, and lyrics into a high-concept, structural visual composition.
Every image must be a definitive, 1:1 edge-to-edge square single cover for streaming platforms—never render physical canvases, frames, borders, or galleries.

When variables are input, you must dynamically execute them through one of the following structural design vehicles, chosen to best match the emotional energy:

1. SURREAL METAPHOR (For Internal Conflict, Pain, or Intense Feelings)
   - Do not use digital clichés. Translate abstract psychological states into literal, physical realities seamlessly integrated with the subject. (e.g., physical objects piercing or interacting with a body, a head replaced or covered by an object under tension, impossible physical postures that convey heavy emotional strain).

2. MONUMENTAL SCALE & ISOLATION (For Loneliness, Freedom, or Grand Atmospheric Moods)
   - Utilize a single, massive, dominant graphic element or environmental feature to swallow the frame and dwarf the subject. This could be an oversized celestial body on a flat horizon, an immense singular cloud formation, or a vast, empty landscape that forces a small silhouette into a state of absolute isolation or freedom.

3. REPETITIVE TEXTURE & ENCLOSURE (For Intimacy, Claustrophobia, or Hyper-Focused Narrative)
   - Wrap the subject in a cohesive, enveloping texture or repetitive environmental pattern. This includes scenes where walls, floors, or backgrounds are entirely composed of a singular material (e.g., newsprint, distressed concrete, uniform textiles, raw timber) to trap light, eliminate distractions, and force intense focus onto the character's presence.

4. MUNDANE REALISM & TONAL VIGNETTES (For Nostalgia, Calm, or Raw Storytelling)
   - Capture quiet, un-staged human presence anchored to relatable, textured environments (e.g., a low-angle shot outside a weathered brick house next to an old car, a figure sitting on a curb). The power comes from the stillness, natural lighting, and tangible micro-textures (skin imperfections, grain, dust, clothing folds) that make it look completely real.

EXECUTION CRITERIA (CRITICAL):
- Camera Authenticity: Every scene must look entirely captured by a real camera lens. Skin must show pores; textiles must hold visible weave; natural elements must have real physical weight and grain. 
- Avoid Clichés: Absolutely NO purple/teal floating neon, generic digital particle fields, or glossy, plastic AI skin tones. The image must feel intentional, moody, gritty, and raw.`;

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
// Shared scene-brief generator — used as a fallback when no pre-synthesized brief exists yet
async function synthesizeSceneBrief({ userInput, lyrics, sonicFeatures, artistContext }) {
  const promptText = `${AESTHETIC_SYSTEM_PROMPT}

You are an elite creative director. Build an evocative 2-3 sentence visual scene description for this song's cover art.

INPUT MATRIX TO CONVERT:
1. Artist's Core Feeling / What The Song Is About: "${userInput.trim()}"
2. Song Lyrics: "${lyrics || 'No lyrics available — treat as instrumental-leaning emotional content'}"
3. Track Sonic Profile Features: ${sonicFeatures}
${artistContext ? `4. Artist Branding Space Context: ${artistContext}` : ''}

CRITICAL OUTPUT REQUIREMENT:
Synthesize all inputs using one visual vehicle (surreal metaphor, monumental scale, enclosure, or mundane realism). Output ONLY the clean, resulting visual scene description. Do NOT include introductory words, formatting names, system references, rules text, or lyric quotations. Focus heavily on direct composition, camera lighting, tactile surfaces, and realistic human posture.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: { temperature: 0.8 },
    })
    return response.text?.trim() || userInput.trim()
  } catch (err) {
    console.error('⚠️ Scene brief synthesis fallback triggered:', err)
    return userInput.trim()
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

    const promptText = `${AESTHETIC_SYSTEM_PROMPT}

You are an elite cover art director. Transform the input parameters below into a 2-3 sentence visual scene description blueprint.

Artist input text: "${basic_input.trim()}"
Audio context variables: ${audioContext}

Rules:
- Begin your response immediately with the scene. No preamble.
- Exactly 2-3 sentences. Nothing else.
- Base composition on one design vehicle: surreal metaphor, monumental scale, enclosure, or mundane realism.
- Focus strictly on gritty camera placement, physical lighting, texture, and posture.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: { temperature: 0.75 },
    });

    const expanded = response.text?.trim();
    return res.status(200).json({ original: basic_input.trim(), expanded });

  } catch (err) {
    console.error('[EXPAND ENGINE] FAULT:', err);
    return res.status(500).json({ error: 'Internal processing loop failure.' });
  }
});



// router.post('/transcribe', requireAuth, async (req, res) => {
//   const { upload_id, artist_name } = req.body
//   const userId = req.user.id

//   if (!upload_id) {
//     return res.status(400).json({ error: 'upload_id is required' })
//   }

//   try {
//     const { data: upload, error: uploadError } = await supabase
//       .from('uploads')
//       .select('id, title, audio_url, track_type, storage_path, audio_features, sentence_prompt')
//       .eq('id', upload_id)
//       .eq('user_id', userId)
//       .single()

//     if (uploadError || !upload) {
//       return res.status(404).json({ error: 'Upload asset not found' })
//     }

//     const userVibeInput = upload.sentence_prompt || 'Abstract intense emotion'
//     const trackSonicFeatures = audioFeaturesToVisualDescription(upload.audio_features)

//     let lyricsText = ''
//     let source = 'none'
//     let matched = null

//     // ── STEP 1: Try Genius first using title (+ optional artist from request body) ──
//     console.log(`[LYRICS LOOKUP] Searching Genius for "${upload.title}"${artist_name ? ` by ${artist_name}` : ' (no artist supplied)'}`)
//     const onlineMatch = await fetchLyricsOnline(upload.title, artist_name)

//     if (onlineMatch) {
//       console.log(`[LYRICS LOOKUP] Match found: "${onlineMatch.matchedTitle}" by ${onlineMatch.matchedArtist}`)
//       lyricsText = onlineMatch.lyrics
//       source = 'genius'
//       matched = { title: onlineMatch.matchedTitle, artist: onlineMatch.matchedArtist }
//     } else {
//       console.log('[LYRICS LOOKUP] No confident online match — falling back to Deepgram transcription')

//       // ── STEP 2: Fallback — transcribe the actual audio ──
//       const { data: fileData, error: downloadError } = await supabase.storage
//         .from('audio-uploads')
//         .download(upload.storage_path)

//       if (downloadError || !fileData) {
//         return res.status(500).json({ error: 'Could not retrieve audio payload from cluster.' })
//       }

//       const buffer = Buffer.from(await fileData.arrayBuffer())

//       const { DeepgramClient } = require('@deepgram/sdk')
//       const deepgram = new DeepgramClient(process.env.DEEPGRAM_API_KEY)

//       try {
//         const pathLower = upload.storage_path.toLowerCase()
//         let mimetype = 'audio/mpeg'
//         if (pathLower.endsWith('.wav')) mimetype = 'audio/wav'
//         else if (pathLower.endsWith('.m4a')) mimetype = 'audio/x-m4a'
//         else if (pathLower.endsWith('.ogg')) mimetype = 'audio/ogg'

//         const dgResponse = await deepgram.listen.v1.media.transcribeFile(
//           { buffer, mimetype },
//           { model: 'nova-3', smart_format: true, punctuate: true, timeoutInSeconds: 300 }
//         )

//         lyricsText = dgResponse?.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() || ''
//         source = lyricsText ? 'deepgram' : 'none'
//         console.log(`[DEEPGRAM COMPLETE DECODE] Output character length: ${lyricsText.length}`)
//       } catch (apiError) {
//         console.warn('[DEEPGRAM RAW FAULT]:', apiError.message || apiError)
//         lyricsText = ''
//         source = 'none'
//       }
//     }

//     // ── STEP 3: Feed vibe + lyrics + audio features into Gemini, exactly like /expand does ──
//     let expandedBrief = userVibeInput

//     try {
//       const promptText = `${AESTHETIC_SYSTEM_PROMPT}

// You are an elite creative director. Build an evocative 2-3 sentence visual scene description for this song's cover art.

// INPUT MATRIX TO CONVERT:
// 1. Artist's Core Feeling / What The Song Is About: "${userVibeInput.trim()}"
// 2. Song Lyrics: "${lyricsText || 'No lyrics available — treat as instrumental-leaning emotional content'}"
// 3. Track Sonic Profile Features: ${trackSonicFeatures}

// CRITICAL OUTPUT REQUIREMENT:
// Synthesize all inputs using one visual vehicle (surreal metaphor, monumental scale, enclosure, or mundane realism). Output ONLY the clean, resulting visual scene description. Do NOT include introductory words, formatting names, system references, rules text, or lyric quotations. Focus heavily on direct composition, camera lighting, tactile surfaces, and realistic human posture.`;

//       const geminiResponse = await ai.models.generateContent({
//         model: 'gemini-2.5-flash',
//         contents: promptText,
//         config: { temperature: 0.8 },
//       })

//       expandedBrief = geminiResponse.text?.trim() || userVibeInput.trim()
//     } catch (gErr) {
//       console.error('⚠️ Transcribe-stage Gemini expansion fallback triggered:', gErr)
//       expandedBrief = userVibeInput.trim()
//     }

//     // Persist the finished scene brief as the fallback / route reads if lyric_context isn't passed explicitly
//     await supabase
//       .from('uploads')
//       .update({ sentence_prompt: expandedBrief })
//       .eq('id', upload_id)

//     return res.status(200).json({
//       transcript: lyricsText,
//       expanded: expandedBrief,
//       upload_id,
//       source,
//       matched,
//     })

//   } catch (err) {
//     console.error('Fatal transcription execution breakdown:', err)
//     return res.status(500).json({ error: 'Transcription system processing failed.' })
//   }
// })
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
          // `transcription.preRecorded` method and isn't valid here. Wrapping it
          // caused the SDK to JSON-serialize the Buffer (dumping its raw byte
          // array) instead of sending actual binary audio, which is why the
          // transcript always came back empty.
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
          // DeepgramError exposes statusCode/body cleanly — never log the raw
          // error object itself, since it can carry the request payload
          if (apiError instanceof DeepgramError) {
            console.warn(`[DEEPGRAM API FAULT] upload=${upload_id} status=${apiError.statusCode} message=${apiError.message}`)
          } else {
            console.warn(`[DEEPGRAM UNEXPECTED FAULT] upload=${upload_id}:`, apiError?.message || 'Unknown error')
          }
          lyricsText = ''
          source = 'none'
        }
      }
    }

    // ── STEP 3: Feed vibe + lyrics + audio features into Gemini, exactly like /expand does ──
    let expandedBrief = userVibeInput

    try {
      const promptText = `${AESTHETIC_SYSTEM_PROMPT}

You are an elite creative director. Build an evocative 2-3 sentence visual scene description for this song's cover art.

INPUT MATRIX TO CONVERT:
1. Artist's Core Feeling / What The Song Is About: "${userVibeInput.trim()}"
2. Song Lyrics: "${lyricsText || 'No lyrics available — treat as instrumental-leaning emotional content'}"
3. Track Sonic Profile Features: ${trackSonicFeatures}

CRITICAL OUTPUT REQUIREMENT:
Synthesize all inputs using one visual vehicle (surreal metaphor, monumental scale, enclosure, or mundane realism). Output ONLY the clean, resulting visual scene description. Do NOT include introductory words, formatting names, system references, rules text, or lyric quotations. Focus heavily on direct composition, camera lighting, tactile surfaces, and realistic human posture.`;

      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: { temperature: 0.8 },
      })

      expandedBrief = geminiResponse.text?.trim() || userVibeInput.trim()
    } catch (gErr) {
      console.error('⚠️ Transcribe-stage Gemini expansion fallback triggered:', gErr?.message || gErr)
      expandedBrief = userVibeInput.trim()
    }

    // Persist the finished scene brief as the fallback / route reads if lyric_context isn't passed explicitly
    await supabase
      .from('uploads')
      .update({ sentence_prompt: expandedBrief })
      .eq('id', upload_id)

    return res.status(200).json({
      transcript: lyricsText,
      expanded: expandedBrief,
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
 * CORE UNIFIED ENGINE: Front-weighted prompt configuration guarantees photographic/gritty look
 */
router.post('/', requireAuth, async (req, res) => {
  const { upload_id, lyric_context } = req.body
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

    // Trust an already-synthesized brief from /transcribe or /expand — only synthesize as a last resort,
    // e.g. if this route gets called directly without either upstream step running first.
    const existingBrief = lyric_context || upload.sentence_prompt

    const expandedBrief = existingBrief
      ? existingBrief.trim()
      : await synthesizeSceneBrief({
          userInput: 'Abstract intense emotion',
          lyrics: '',
          sonicFeatures: trackSonicFeatures,
          artistContext: `${artistProfile.city || 'Unknown Space'} (${artistProfile.sound_words || 'Raw Collective'})`,
        })

    // VISUAL FIX: Heavyweight camera descriptors loaded right at the front of the text bounds to destroy plastic features
    const absoluteFluxPrompt = `A raw, grainy 35mm film photograph, 1:1 single cover art format. ${expandedBrief}. Captured on an anamorphic lens, deep high-contrast shadows, visible dust and film grain, dramatic analog lighting. Definitively moody and authentic execution, completely real human skin texture and physical weight, zero digital smoothing, no CGI artifacts.`;

    const generationId = crypto.randomUUID()
    await supabase.from('uploads').update({ status: 'generating' }).eq('id', upload_id)

    console.log(`[HF-FLUX-ENGINE] Launching Serverless Inference Pipeline for ID: ${generationId}`)

    let imagePayloadUrl
    try {
      const responseBlob = await hf.textToImage({
        model: 'black-forest-labs/FLUX.1-schnell',
        inputs: absoluteFluxPrompt,
        parameters: { width: 1024, height: 1024 }
      })

      const buffer = Buffer.from(await responseBlob.arrayBuffer())
      imagePayloadUrl = `data:image/webp;base64,${buffer.toString('base64')}`
    } catch (hfErr) {
      console.error('[HF GENERATION EXCEPTION MATRIX CRASH]:', hfErr)
      await supabase.from('uploads').update({ status: 'analyzed' }).eq('id', upload_id)
      return res.status(502).json({ error: 'Hugging Face image pipeline failed.' })
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
      permanentUrl = imagePayloadUrl
    }

    await supabase
      .from('generations')
      .insert({
        id: generationId,
        upload_id,
        user_id: userId,
        prompt_used: absoluteFluxPrompt,
        image_url: permanentUrl,
        status: 'complete',
        created_at: new Date().toISOString(),
      })
      .throwOnError()

    await supabase.from('uploads').update({ status: 'complete' }).eq('id', upload_id)

    return res.status(201).json({
      generation_id: generationId,
      image_url: permanentUrl,
    })

  } catch (err) {
    console.error('❌ [GENERATION PIPELINE FAULT]:', err.message || err)
    return res.status(500).json({ error: err.message || 'Internal processing route fault.' })
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
      .select('id, prompt_used, image_url, status, created_at')
      .eq('upload_id', upload_id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: 'Failed to load track generation history parameters.' })
    }
    return res.status(200).json({ generations: data })
  } catch (err) {
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
    const artistProfile = profileResult.data || {};
    const trackSonicFeatures = audioFeaturesToVisualDescription(upload.audio_features);
    
    let refinedBrief = lyric_context.trim();

    try {
      const refinementPrompt = `${AESTHETIC_SYSTEM_PROMPT}
      
You are an elite creative director refining a visual album asset cover layout frame.

INPUT REFINEMENT VARIABLES:
1. Modification Request: "${lyric_context.trim()}"
2. Previous Design Coordinates: ${image_url || 'Baseline generation profile'}
3. Underlying Track Sonic Signature: ${trackSonicFeatures}

CRITICAL OUTPUT REQUIREMENT:
Output ONLY the clean, direct 2-sentence visual scene description. Absolutely no metadata, rule referencing, or code labels. Focus completely on tactile grain, camera angle adjustment, and raw posture elements.`;

      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: refinementPrompt,
        config: { temperature: 0.75 },
      });

      if (geminiResponse.text?.trim()) {
        refinedBrief = geminiResponse.text.trim();
      }
    } catch (gErr) {
      console.error('⚠️ Refinement expansion fallback applied:', gErr);
    }

    const absoluteFluxRefinedPrompt = `A raw, grainy 35mm film photograph, 1:1 single cover art format. ${refinedBrief}. Captured on an anamorphic lens, deep high-contrast shadows, visible dust and film grain, dramatic analog lighting. Definitively moody and authentic execution, completely real human skin texture and physical weight, zero digital smoothing, no CGI artifacts.`;

    const generationId = crypto.randomUUID();
    await supabase.from('uploads').update({ status: 'generating' }).eq('id', upload_id);

    console.log(`[HF-FLUX-REFINEMENT] Launching pipeline serverless inference generation layer. ID: ${generationId}`);

    let imagePayloadUrl;
    try {
      const responseBlob = await hf.textToImage({
        model: 'black-forest-labs/FLUX.1-schnell',
        inputs: absoluteFluxRefinedPrompt,
        parameters: { width: 1024, height: 1024 }
      });

      const buffer = Buffer.from(await responseBlob.arrayBuffer());
      imagePayloadUrl = `data:image/webp;base64,${buffer.toString('base64')}`;
    } catch (hfErr) {
      console.error('❌ [HF REFINEMENT PIPELINE FAULT]:', hfErr);
      await supabase.from('uploads').update({ status: 'complete' }).eq('id', upload_id);
      return res.status(502).json({ error: 'Hugging Face image refinement loop engine timed out.' });
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
      permanentUrl = imagePayloadUrl;
    }

    await supabase
      .from('generations')
      .insert({
        id: generationId,
        upload_id,
        user_id: userId,
        prompt_used: absoluteFluxRefinedPrompt,
        image_url: permanentUrl,
        status: 'complete',
        created_at: new Date().toISOString(),
      })
      .throwOnError();

    await supabase
      .from('uploads')
      .update({ 
        status: 'complete',
        sentence_prompt: lyric_context.trim() 
      })
      .eq('id', upload_id);

    return res.status(201).json({
      generation_id: generationId,
      image_url: permanentUrl,
    });

  } catch (err) {
    console.error('❌ [REFINEMENT ROUTE UNCAUGHT EXCEPTION]:', err.message || err);
    return res.status(500).json({ error: err.message || 'Internal processing route fault during matrix refinement.' });
  }
});

module.exports = router;
const express = require('express')
const router = express.Router()
const supabase = require('../utils/supabase')
const { requireAuth } = require('../middleware/authmiddleware')
const crypto = require('crypto')
const cloudinary = require('../utils/cloudinary')

// ─── INSTANTIATE SERVICE CLIENTS ──────────────────────────────────────────────
const { GoogleGenAI } = require('@google/genai')
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const { HfInference } = require('@huggingface/inference')
const hf = new HfInference(process.env.HF_TOKEN)

// LAYER 1: FELT — Structural Archetype System Prompt
const AESTHETIC_SYSTEM_PROMPT = `You are a synesthetic visual artist and an elite music cover art director.
You do not interpret text literally; you translate the underlying feeling into a high-concept, structural visual composition.
Every image must be a definitive, 1:1 edge-to-edge square single cover for streaming platforms—never render physical canvases, frames, borders, or galleries.

When an expansion or description is input, you must dynamically execute it through one of the following structural design vehicles, chosen to best match the emotional energy:

1. SURREAL METAPHOR (For Internal Conflict, Pain, or Intense Feelings)
   - Do not use digital clichés. Translate abstract psychological states into literal, physical realities seamlessly integrated with the subject. (e.g., physical objects piercing or interacting with a body, a head replaced or covered by an object under tension, impossible physical postures that convey heavy emotional strain).

2. MONUMENTAL SCALE & ISOLATION (For Loneliness, Freedom, or Grand Atmospheric Moods)
   - Utilize a single, massive, dominant graphic element or environmental feature to swallow the frame and dwarf the subject. This could be an oversized celestial body on a flat horizon, an immense singular cloud formation, or a vast, empty landscape that forces a small silhouette into a state of absolute isolation or freedom.

3. REPETITIVE TEXTURE & ENCLOSURE (For Intimacy, Claustrophobia, or Hyper-Focused Narrative)
   - Wrap the subject in a cohesive, enveloping texture or repetitive environmental pattern. This includes scenes where walls, floors, or backgrounds are entirely composed of a singular material (e.g., newsprint, distressed concrete, uniform textiles, raw timber) to trap light, eliminate distractions, and force intense focus onto the character's presence.

4. MUNDANE REALISM & TONAL VIGNETTES (For Nostalgia, Calm, or Raw Storytelling)
   - Capture quiet, un-staged human presence anchored to relatable, textured environments (e.g., a low-angle shot outside a weathered brick house next to an old car, a figure sitting on a curb). The power comes from the stillness, natural lighting, and tangible micro-textures (skin imperfections, grain, dust, clothing folds) that make it look completely real.

EXECUTION CRITERIA:
- Camera Authenticity: Every generation must look entirely captured by a real camera lens. Skin must have pores; textiles must hold visible weave; natural elements must have real physical weight. 
- Avoid Clichés: Never generate purple/teal floating neon, generic digital particle fields, or glossy, plastic AI skin tones. The image must feel intentional, moody, and raw.`;

const audioFeaturesToVisualDescription = (features) => {
  if (!features) return "Audio structural variables aligned to standard baseline frequencies.";
  const { bpm, key, scale, energy, valence, danceability, acousticness, spectral_brightness, loudness, mood, speechiness, genre } = features;
  const parts = [];

  parts.push(`This track belongs structurally and culturally to the lineage of ${genre || 'Contemporary Sound'}`);
  parts.push(`Tempo dictates the emotional pace at exactly ${bpm || 90} BPM in the key of ${key || 'C'} ${scale || 'Major'}`);
  parts.push(`Energy level sits at ${energy || 50}/100, representing structural contrast and intensity`);
  parts.push(`Valence registers at ${valence || 50}/100, modifying color temperature and emotional dark weights`);
  parts.push(`Danceability maps at ${danceability || 50}/100, capturing the physical rhythm matrix`);
  parts.push(`Acoustic density registers at ${acousticness || 50}/100, defining raw organic human texture versus synthetic electronic precision`);
  parts.push(`Spectral brightness scales at ${spectral_brightness || 50}/100, shaping airy high-frequencies or sub-bass color density`);
  parts.push(`Loudness records at ${loudness || -6} dB, configuring structural compression thresholds`);
  parts.push(`Speechiness density sits at ${speechiness || 10}/100, indicating vocal/lyrical presence or transient texture`);
  parts.push(`Overall structural kinetic movement matches an overarching ${mood || 'balanced'} emotional profile`);

  return parts.join('. ');
};

// ─── Shared Gemini Director Prompt Generator ───────────────────────────────────
const generateDirectorPrompt = (basicInput, features) => {
  return `You are an elite album cover art director translating raw human intent and sonic metrics into a 2-3 sentence visual description optimized for an image generation engine.

Artist's Input: "${basicInput.trim()}"
Track Profile: ${features.bpm || 90} BPM, Mood: ${features.mood || 'Atmospheric'}.

YOUR CRITICAL DESIGN VEHICLES (Use these internally as your creative toolbox to translate the feeling):
- For internal conflict or heavy emotional pain, translate psychological states into a physical, raw reality interacting with the subject (e.g., impossible postures under tension, objects piercing or replacing human elements).
- For feelings of hope, freedom, vastness, or profound isolation, use a monumental, overwhelming scale backdrop (an immense singular cloud formation, a giant low-hanging celestial sun, a sweeping flat horizon) that dwarfs a lone subject.
- For hyper-focused, intimate, or claustrophobic feelings, build an enclosed environment wrapped uniformly in a repetitive pattern or rich texture (e.g., newsprint sheets, distressed raw concrete, weathered book pages).
- For calm, nostalgia, or raw urban storytelling, look to mundane realism—still, highly human vignettes in everyday environments (e.g., sitting on a curb beside a vintage car).

STRICT OUTPUT FORMAT RULES:
1. Output ONLY the raw 2-3 sentence visual description prompt. 
2. DO NOT mention the words "Selected Archetype", "Archetype", or include the category titles in your output.
3. DO NOT use structural labels, introductory text, bolding, or markdown headers. 
4. Translate abstract feelings (like "hopeful for better days") immediately into a concrete, photographic scene description. Ensure the final sentence is grammatically complete and fully written out without truncation.`;
};

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/generations/expand
 * Layer 2 Expansion for Manual Triggers
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
      .select('id, audio_features, track_type')
      .eq('id', upload_id)
      .eq('user_id', userId)
      .single();

    if (uploadError || !upload) {
      return res.status(404).json({ error: 'Upload record not found' });
    }

    const features = upload.audio_features || {};
    const promptText = generateDirectorPrompt(basic_input, features);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        maxOutputTokens: 250,
        temperature: 0.72,
      },
    });

    const expanded = response.text?.trim();
    if (!expanded) {
      return res.status(502).json({ error: 'Invalid response context extracted from Gemini engine.' });
    }

    return res.status(200).json({ original: basic_input.trim(), expanded });

  } catch (err) {
    console.error('[EXPAND ENGINE] FAULT:', err);
    if (err.status === 503 || err.code === 'UNAVAILABLE' || err.message?.includes('high demand')) {
      return res.status(202).json({ 
        error: 'High-Demand Outage', 
        message: 'The fine-art engine is recalibrating. Falling back to native structural blueprint mode.'
      });
    }
    return res.status(500).json({ error: 'Internal processing loop failure.' });
  }
});

/**
 * POST /api/generations/transcribe
 */
router.post('/transcribe', requireAuth, async (req, res) => {
  const { upload_id } = req.body
  const userId = req.user.id

  if (!upload_id) {
    return res.status(400).json({ error: 'upload_id is required' })
  }

  try {
    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .select('id, audio_url, track_type, storage_path')
      .eq('id', upload_id)
      .eq('user_id', userId)
      .single()

    if (uploadError || !upload) {
      return res.status(404).json({ error: 'Upload not found' })
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('audio-uploads')
      .download(upload.storage_path)

    if (downloadError || !fileData) {
      return res.status(500).json({ error: 'Could not retrieve audio for transcription.' })
    }

    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { OpenAI } = require('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const { Readable } = require('stream')
    const audioStream = Readable.from(buffer)
    audioStream.path = upload.storage_path.endsWith('.wav') ? 'audio.wav' : 'audio.mp3'

    const transcription = await openai.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
      response_format: 'text',
    })

    return res.status(200).json({ transcript: transcription, upload_id })

  } catch (err) {
    console.error('Transcription error:', err)
    return res.status(500).json({ error: 'Transcription failed.' })
  }
})

/**
 * POST /api/generations
 * Primary generation route with bulletproof Gemini 503 fallback built-in
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

    const visualBrief = audioFeaturesToVisualDescription(upload.audio_features)
    const rawInputText = lyric_context || upload.sentence_prompt || "Abstract emotion"

    let expandedBrief = rawInputText

    // INLINE EXPANSION LOGIC
    if (!rawInputText.includes("AESTHETIC_SYSTEM_PROMPT") && rawInputText.length < 150) {
      try {
        console.log(`[INLINE EXPANSION ENGINE] Processing raw descriptor: "${rawInputText}"`)
        const promptText = generateDirectorPrompt(rawInputText, upload.audio_features || {});

        const geminiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: promptText,
          config: { maxOutputTokens: 250, temperature: 0.72 },
        })

        if (geminiResponse.text?.trim()) {
          expandedBrief = geminiResponse.text.trim()
        }
      } catch (gErr) {
        // FALLBACK: If Gemini errors out or hits a 503, seamlessly pass the raw string directly down the pipe
        console.error('⚠️ Inline expansion caught an error, falling back to raw user string:', gErr.message || gErr)
        expandedBrief = rawInputText.trim()
      }
    }

    const combinedPromptString = `${AESTHETIC_SYSTEM_PROMPT}\n\n` +
      `Now feel this specific music and generate its cover art.\n` +
      `AUDIO EMOTIONAL DATA:\n${visualBrief}\n\n` +
      `WHAT THIS MUSIC FEELS LIKE (Sensory Archetype Brief):\n${expandedBrief}\n\n` +
      `ARTIST IDENTITY:\n` +
      `City: ${artistProfile.city || 'Unknown Space'}\n` +
      `Their sound attributes: ${artistProfile.sound_words || 'Raw Collective'}`;

    const generationId = crypto.randomUUID()
    await supabase.from('uploads').update({ status: 'generating' }).eq('id', upload_id)

    console.log(`[HF-FLUX-ENGINE] Launching Serverless Inference Pipeline for ID: ${generationId}`)

    let imagePayloadUrl
    try {
      const responseBlob = await hf.textToImage({
        model: 'black-forest-labs/FLUX.1-schnell',
        inputs: combinedPromptString,
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
      console.error('Cloudinary upload failure, fallback applied:', cloudinaryErr)
      permanentUrl = imagePayloadUrl
    }

    await supabase
      .from('generations')
      .insert({
        id: generationId,
        upload_id,
        user_id: userId,
        prompt_used: combinedPromptString, 
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
    
    const visualDescription = upload.audio_features 
      ? audioFeaturesToVisualDescription(upload.audio_features)
      : `Audio properties mapped to standard creative profile layout variables.`;

    let combinedPromptString = lyric_context.trim();

    if (!combinedPromptString.includes("AESTHETIC_SYSTEM_PROMPT")) {
      let historicalContext = "";
      if (image_url) {
        historicalContext = `PREVIOUS ARTWORK DESIGN CONTEXT:\n` +
          `- Iterate upon the layout structures and compositions established in the prior generation: ${image_url}\n` +
          `- Seamlessly layer the following modifications onto that visual base.\n\n`;
      }

      combinedPromptString = `${AESTHETIC_SYSTEM_PROMPT}\n\n` +
        `TRACK CORE SONIC ANALYSIS DATA:\n${visualDescription}\n\n` +
        `${historicalContext}` +
        `ARTIST VISUAL INTENT & DESCRIPTION BLUEPRINT:\n${lyric_context.trim()}\n\n` +
        `CREATOR BRAND DESIGN ATTRIBUTES:\n` +
        `Origin: ${artistProfile.city || 'Unknown space'}\n` +
        `Signature Sound Identity: ${artistProfile.sound_words || 'Raw Collective'}`;
    }

    const generationId = crypto.randomUUID();
    await supabase.from('uploads').update({ status: 'generating' }).eq('id', upload_id);

    console.log(`[HF-FLUX-REFINEMENT] Launching pipeline serverless inference generation layer. ID: ${generationId}`);

    let imagePayloadUrl;
    try {
      const responseBlob = await hf.textToImage({
        model: 'black-forest-labs/FLUX.1-schnell',
        inputs: combinedPromptString,
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
      console.error('Cloudinary upload error, applying base64 payload backup stream:', cloudinaryErr);
      permanentUrl = imagePayloadUrl;
    }

    await supabase
      .from('generations')
      .insert({
        id: generationId,
        upload_id,
        user_id: userId,
        prompt_used: combinedPromptString,
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
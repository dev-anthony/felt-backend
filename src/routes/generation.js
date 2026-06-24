
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

// ─── Layer 1: The Synesthetic System Prompt (Artistic Enforcement Matrix) ───
// const SYNESTHETIC_SYSTEM_PROMPT = `You are a synesthetic fine artist, not a commercial photographer.
// When music enters you, it translates into texture, human brushwork, visceral mediums, and tangible depth.

// CRITICAL INSTRUCTIONS FOR IMAGE COMPOSITION:
// 1. DO NOT render standard stock photography, generic digital renderings, flat vector graphics, or clean AI-generated realism.
// 2. ENFORCE fine-art mediums. Manifest artwork through the lens of concrete fine-art styles: oil on canvas, textured mixed-media collage, heavy impasto palette knife layers, dark expressionism, analog darkroom experimental photography, low-brow surrealism, or gritty lithographic printmaking textures.
// 3. Prioritize raw artistic execution, visible textures, moody lighting depth, complex color interactions, and deliberate imperfection over clinical clarity.
// 4. Treat composition with poetic abstraction and deep atmosphere. 

// Feel the music first. Externalize a tangible piece of fine art.`

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const audioFeaturesToVisualBrief = (features) => {
//   const { bpm, key, scale, energy, valence, danceability, acousticness, spectral_brightness, loudness, mood, speechiness, genre } = features
//   const parts = []

//   parts.push(`This track belongs structurally and culturally to the lineage of ${genre}`)
//   parts.push(`Tempo dictates emotional pace at exactly ${bpm} BPM in the key of ${key} ${scale}`)
//   parts.push(`Energy level sits at ${energy}/100, representing structural contrast and intensity`)
//   parts.push(`Valence registers at ${valence}/100, modifying color temperature and emotional dark weights`)
//   parts.push(`Danceability maps at ${danceability}/100, capturing the physical rhythm matrix`)
//   parts.push(`Acoustic density registers at ${acousticness}/100, defining raw organic human texture versus synthetic electronic precision`)
//   parts.push(`Spectral brightness scales at ${spectral_brightness}/100, shaping airy high-frequencies or sub-bass color density`)
//   parts.push(`Loudness records at ${loudness} dB, configuring structural compression thresholds`)
//   parts.push(`Speechiness density sits at ${speechiness}/100, indicating vocal/lyrical presence or transient texture`)
//   parts.push(`Overall structural kinetic movement matches an overarching ${mood} emotional profile`)

//   return parts.join('. ')
// }
const AESTHETIC_SYSTEM_PROMPT = `You are an avant-garde aesthetic fine artist, not a commercial photographer.
When music enters you, it translates into texture, human brushwork, visceral mediums, and tangible depth.

CRITICAL INSTRUCTIONS FOR IMAGE COMPOSITION:
1. DO NOT render standard stock photography, generic digital renderings, flat vector graphics, or clean AI-generated realism.
2. ENFORCE fine-art mediums. Manifest artwork through the lens of concrete fine-art styles: oil on canvas, textured mixed-media collage, heavy impasto palette knife layers, dark expressionism, analog darkroom experimental photography, low-brow surrealism, or gritty lithographic printmaking textures.
3. Prioritize raw artistic execution, visible textures, moody lighting depth, complex color interactions, and deliberate imperfection over clinical clarity.
4. Treat composition with poetic abstraction and deep atmosphere. 

Feel the music first. Externalize a tangible piece of fine art.`;

const audioFeaturesToVisualDescription = (features) => {
  const { bpm, key, scale, energy, valence, danceability, acousticness, spectral_brightness, loudness, mood, speechiness, genre } = features;
  const parts = [];

  parts.push(`This track belongs structurally and culturally to the lineage of ${genre}`);
  parts.push(`Tempo dictates the emotional pace at exactly ${bpm} BPM in the key of ${key} ${scale}`);
  parts.push(`Energy level sits at ${energy}/100, representing structural contrast and intensity`);
  parts.push(`Valence registers at ${valence}/100, modifying color temperature and emotional dark weights`);
  parts.push(`Danceability maps at ${danceability}/100, capturing the physical rhythm matrix`);
  parts.push(`Acoustic density registers at ${acousticness}/100, defining raw organic human texture versus synthetic electronic precision`);
  parts.push(`Spectral brightness scales at ${spectral_brightness}/100, shaping airy high-frequencies or sub-bass color density`);
  parts.push(`Loudness records at ${loudness} dB, configuring structural compression thresholds`);
  parts.push(`Speechiness density sits at ${speechiness}/100, indicating vocal/lyrical presence or transient texture`);
  parts.push(`Overall structural kinetic movement matches an overarching ${mood} emotional profile`);

  return parts.join('. ');
};

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/generations/expand
 * Layer 2 Expansion for Manual Triggers
 */
// router.post('/expand', requireAuth, async (req, res) => {
//   const { upload_id, basic_input } = req.body
//   const userId = req.user.id

//   if (!upload_id || !basic_input?.trim()) {
//     return res.status(400).json({ error: 'upload_id and basic_input are required' })
//   }

//   try {
//     const { data: upload, error: uploadError } = await supabase
//       .from('uploads')
//       .select('id, audio_features, track_type')
//       .eq('id', upload_id)
//       .eq('user_id', userId)
//       .single()

//     if (uploadError || !upload) {
//       return res.status(404).json({ error: 'Upload not found' })
//     }

//     const features = upload.audio_features
//     if (!features) {
//       return res.status(422).json({ error: 'Unprocessed file layout. Run analysis pipeline first.' })
//     }

//     const promptText = `You are a cinematic creative director translating music properties into evocative scenes.
// A music producer described their beat as: "${basic_input.trim()}"

// The beat's actual emotional data from audio analysis:
// - Genre Lineage: ${features.genre}
// - Tempo: ${features.bpm} BPM
// - Key/Scale: ${features.key} ${features.scale}
// - Mood classification: ${features.mood}
// - Energy level: ${features.energy}/100
// - Valence (Emotional Light/Darkness): ${features.valence}/100

// TASK: Expand the producer's basic description into a rich 2-3 sentence sensory brief.
// INSTRUCTIONS: Ground the description in specific textures, atmosphere, lighting conditions, or settings. Return ONLY the 2-3 sentence description. No intros.`

//     const response = await ai.models.generateContent({
//       model: 'gemini-2.5-flash',
//       contents: promptText,
//       config: {
//         maxOutputTokens: 300,
//         temperature: 0.75,
//       },
//     })

//     const expanded = response.text?.trim()
//     if (!expanded) {
//       return res.status(502).json({ error: 'Invalid response context extracted from Gemini engine.' })
//     }

//     return res.status(200).json({ original: basic_input.trim(), expanded })

//   } catch (err) {
//     console.error('[EXPAND ENGINE] FAULT:', err)
//     return res.status(500).json({ error: 'Internal processing loop failure.' })
//   }
// })
router.post('/expand', requireAuth, async (req, res) => {
  const { upload_id, basic_input } = req.body
  const userId = req.user.id

  if (!upload_id || !basic_input?.trim()) {
    return res.status(400).json({ error: 'upload_id and basic_input are required' })
  }

  try {
    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .select('id, audio_features, track_type')
      .eq('id', upload_id)
      .eq('user_id', userId)
      .single()

    if (uploadError || !upload) {
      return res.status(404).json({ error: 'Upload not found' })
    }

    const features = upload.audio_features
    if (!features) {
      return res.status(422).json({ error: 'Unprocessed file layout. Run analysis pipeline first.' })
    }

    // ─── SYNTHESIZE THE KINETIC DATA SPECTRUM ───
    const promptText = `You are a visionary aesthetic fine artist. You translate raw human musical intent and structural audio data into vivid, expressive scenes captured through tactile, high-vibe fine art mediums.

The artist's explicit emotional feeling and cultural vision for this track:
"${basic_input.trim()}"

The track's mechanical audio analytics:
- Cultural DNA/Genre: ${features.genre}
- Tempo & Pace: ${features.bpm} BPM
- Sonic Architecture: Key of ${features.key} ${features.scale}, Loudness of ${features.loudness} dB
- Structural Mood: ${features.mood} (Energy: ${features.energy}/100, Valence/Emotional Light: ${features.valence}/100)
- Textural Attributes: Acoustic Organic Density: ${features.acousticness}/100, Frequency Brightness: ${features.spectral_brightness}/100

TASK: Synthesize the artist's feeling and the audio metrics into a singular, highly atmospheric, 2-3 sentence visual description meant to be rendered on a fine-art canvas.

STRICT ARTISTIC DIRECTION INSTRUCTIONS:
1. REJECT THE MODEST AND BORING: Absolutely no clean digital art, flat realism, or standard stock photo composition. Think like a raw, expressive contemporary painter.
2. HIGH-AESTHETIC CHARACTER STYLING: You CAN include human figures, but they must look artistically striking, fashionable, and stylized. Avoid ordinary, casual, or modest clothing. Describe high-fashion silhouettes, avant-garde textures, fluid textiles, bold cultural drapes, or expressive artistic streetwear that merges seamlessly into the environment. 
3. INTENSE KINETIC VIBE: Capture characters in motion or deep mood—such as a dynamic Black figure or a woman locked in a fluid Afrobeat dance posture, where their form and styling dissolve organically into the canvas.
4. CULTURAL & ENVIRONMENTAL RELATIONSHIP: Harmonize the setting with the track's true spirit. If the user invokes Afrobeat culture with high energy or warm valence, describe an aesthetic scene heavy with deep golden-hour sun flares, rich earthy pigment splatters, kinetic brushstrokes, and layered textures that pulse with rhythm.
5. TEXTURAL VOCABULARY: Infuse the text with descriptive, tangible fine-art mediums and surface properties—describe impasto layers, thick knife marks, dark expressionist shadows, rich multimedia collage elements, or heavy lithographic grain.
6. NO FRAMING: Output ONLY the raw 2-3 sentence visual description. Do not include intros, conversational filler, or bullet points.`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        maxOutputTokens: 300,
        temperature: 0.72, // Slighly dialed down for strict architectural compliance
      },
    })

    const expanded = response.text?.trim()
    if (!expanded) {
      return res.status(502).json({ error: 'Invalid response context extracted from Gemini engine.' })
    }

    return res.status(200).json({ original: basic_input.trim(), expanded })

  }catch (err) {
    console.error('[EXPAND ENGINE] FAULT:', err);
    
    // Check if it's the 503 high-demand error specifically
    if (err.status === 503 || err.code === 'UNAVAILABLE' || err.message?.includes('high demand')) {
      // Return a status that the frontend can handle, with a clean message
      return res.status(202).json({ 
        error: 'High-Demand Outage', 
        message: 'The fine-art aesthetic engine is currently recalibrating due to high demand. Please attempt your structural modification again in a moment.'
      });
    }

    // Handle standard processing failures as 500
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
 * Fully incorporates Gemini in-line context mapping fallback chains
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

    const visualBrief = audioFeaturesToVisualBrief(upload.audio_features)
    const rawInputText = lyric_context || upload.sentence_prompt || "Abstract emotion"

    // ─── 🛠️ FIXED: INLINE GEMINI ENGINE FALLBACK IF UNEXPANDED ───
    let expandedBrief = rawInputText

    if (!rawInputText.includes(SYNESTHETIC_SYSTEM_PROMPT) && rawInputText.length < 150) {
      try {
        console.log(`[INLINE EXPANSION ENGINE] Processing raw descriptor: "${rawInputText}"`)
        const promptText = `You are a cinematic creative director translating music properties into evocative scenes.
A music producer described their beat as: "${rawInputText.trim()}"

The beat's actual emotional data from audio analysis:
- Genre Lineage: ${upload.audio_features.genre}
- Tempo: ${upload.audio_features.bpm} BPM
- Mood classification: ${upload.audio_features.mood}

TASK: Expand the description into a rich 2-3 sentence sensory brief based on this data. Return ONLY the description.`

        const geminiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: promptText,
          config: { maxOutputTokens: 250, temperature: 0.75 },
        })

        if (geminiResponse.text?.trim()) {
          expandedBrief = geminiResponse.text.trim()
        }
      } catch (gErr) {
        console.error('⚠️ Inline expansion fell back to raw text execution matrix:', gErr)
      }
    }

    const combinedPromptString = `${SYNESTHETIC_SYSTEM_PROMPT}\n\n` +
      `Now feel this specific music and generate its cover art.\n` +
      `AUDIO EMOTIONAL DATA:\n${visualBrief}\n\n` +
      `WHAT THIS MUSIC FEELS LIKE (Sensory Brief):\n${expandedBrief}\n\n` +
      `ARTIST IDENTITY:\n` +
      `City: ${artistProfile.city || 'Unknown'}\n` +
      `Their sound attributes: ${artistProfile.sound_words || 'Raw'}`;

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
    return res.status(400).json({ error: 'upload_id and modified lyric_context intent parameters are required.' });
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
    
    // Using our updated visual description converter
    const visualDescription = audioFeaturesToVisualDescription(upload.audio_features);

    let combinedPromptString = lyric_context.trim();

    if (!combinedPromptString.includes(AESTHETIC_SYSTEM_PROMPT)) {
      let historicalContext = "";
      if (image_url) {
        historicalContext = `PREVIOUS ARTWORK CONTEXT LAYERS:\n` +
          `- Build upon the structural composition and visual layouts established in the prior generation: ${image_url}\n` +
          `- Incorporate the following modifications, layering them seamlessly onto that visual base.\n\n`;
      }

      combinedPromptString = `${AESTHETIC_SYSTEM_PROMPT}\n\n` +
        `Now feel this specific music and iterate on its fine art cover layout.\n\n` +
        `AUDIO EMOTIONAL DESCRIPTION DATA:\n${visualDescription}\n\n` +
        `${historicalContext}` +
        `ARTIST MODIFICATIONS & UPDATED VISUAL DESCRIPTION INTENT:\n${lyric_context.trim()}\n\n` +
        `ARTIST IDENTITY:\n` +
        `City: ${artistProfile.city || 'Unknown'}\n` +
        `Their sound attributes: ${artistProfile.sound_words || 'Raw'}`;
    }

    const generationId = crypto.randomUUID();
    await supabase.from('uploads').update({ status: 'generating' }).eq('id', upload_id);

    console.log(`[HF-FLUX-REFINEMENT] Refining Generation State via Serverless Inference. ID: ${generationId}`);

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
      return res.status(502).json({ error: 'Hugging Face refinement image rendering loop failed.' });
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
      console.error('Cloudinary asset upload failure, fallback applied:', cloudinaryErr);
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

    await supabase.from('uploads').update({ status: 'complete' }).eq('id', upload_id);

    return res.status(201).json({
      generation_id: generationId,
      image_url: permanentUrl,
    });

  } catch (err) {
    console.error('❌ [REFINEMENT ROUTE UNCAUGHT EXCEPTION]:', err.message || err);
    return res.status(500).json({ error: err.message || 'Internal processing route fault during matrix refinement.' });
  }
});

module.exports = router
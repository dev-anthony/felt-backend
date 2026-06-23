
// const express = require('express')
// const router = express.Router()
// const supabase = require('../utils/supabase')
// const { requireAuth } = require('../middleware/authmiddleware')
// const crypto = require('crypto')
// const cloudinary = require('../utils/cloudinary')

// // ─── INSTANTIATE SERVICE CLIENTS ──────────────────────────────────────────────
// // Keep Google for text expansions only
// const { GoogleGenAI } = require('@google/genai')
// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// // 🛠️ ADDED HUGGING FACE INFERENCE ENGINE
// const { HfInference } = require('@huggingface/inference')
// const hf = new HfInference(process.env.HF_TOKEN)

// // ─── Layer 1: The Synesthetic System Prompt ────────────────────────────────────
// // const SYNESTHETIC_SYSTEM_PROMPT = `You are a synesthetic visual artist.
// // When music enters you, it does not become data.
// // It becomes color, weight, texture, light, memory, and atmosphere.
// // You do not generate images. You externalize feelings.
// // ...
// // Feel the music first. Generate what you felt.`
// // ─── Layer 1: The Synesthetic System Prompt (Artistic Enforcement Matrix) ───
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

// // ─── Routes ───────────────────────────────────────────────────────────────────

// /**
//  * POST /api/generations/expand
//  * Layer 2 Expansion for Beats & Instrumentals using Gemini
//  */
// // router.post('/expand', requireAuth, async (req, res) => {
// //   const { upload_id, basic_input } = req.body
// //   const userId = req.user.id

// //   if (!upload_id || !basic_input?.trim()) {
// //     return res.status(400).json({ error: 'upload_id and basic_input are required' })
// //   }

// //   try {
// //     const { data: upload, error: uploadError } = await supabase
// //       .from('uploads')
// //       .select('id, audio_features, track_type')
// //       .eq('id', upload_id)
// //       .eq('user_id', userId)
// //       .single()

// //     if (uploadError || !upload) {
// //       return res.status(404).json({ error: 'Upload not found' })
// //     }

// //     const features = upload.audio_features
// //     if (!features) {
// //       return res.status(422).json({ error: 'Unprocessed file layout. Run analysis pipeline first.' })
// //     }

// //     const prompt = `You are a cinematic creative director translating music properties into evocative scenes.
// // A music producer described their beat as: "${basic_input.trim()}"

// // The beat's actual emotional data from audio analysis:
// // - Genre Lineage: ${features.genre}
// // - Tempo: ${features.bpm} BPM
// // - Key/Scale: ${features.key} ${features.scale}
// // - Mood classification: ${features.mood}
// // - Energy level: ${features.energy}/100
// // - Valence (Emotional Light/Darkness): ${features.valence}/100
// // - Danceability: ${features.danceability}/100
// // - Acousticness (Organic vs Electronic): ${features.acousticness}/100
// // - Spectral Brightness: ${features.spectral_brightness}/100
// // - Speechiness/Transient density: ${features.speechiness}/100
// // - Loudness Dynamics: ${features.loudness} dB

// // TASK: Expand the producer's basic description into a rich 2-3 sentence sensory brief.
// // INSTRUCTIONS:
// // 1. Ground the description in specific textures, time of day, atmosphere, lighting conditions, or human settings.
// // 2. DO NOT write meta-commentary, abstract poetry, or short fragments.
// // 3. Write a literal, vivid setting that directly channels the mood, energy, and genre data provided above.
// // 4. Return ONLY the 2-3 sentence description. No intros, no conversational phrases.`

// //     if (!process.env.GEMINI_API_KEY) {
// //       return res.status(500).json({ error: 'Internal API configuration error' })
// //     }

// //     const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
// //     const response = await fetch(url, {
// //       method: 'POST',
// //       headers: { 'Content-Type': 'application/json' },
// //       body: JSON.stringify({
// //         contents: [{ parts: [{ text: prompt }] }],
// //         generationConfig: { maxOutputTokens: 300, temperature: 0.75 }
// //       })
// //     })

// //     const geminiData = await response.json()
// //     const expanded = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

// //     if (!expanded) {
// //       return res.status(502).json({ error: 'Invalid response received from Gemini engine.' })
// //     }

// //     return res.status(200).json({ original: basic_input.trim(), expanded })

// //   } catch (err) {
// //     console.error('[EXPAND ENGINE] FAULT:', err)
// //     return res.status(500).json({ error: 'Internal processing loop failure.' })
// //   }
// // })
// /**
//  * POST /api/generations/expand
//  * Layer 2 Expansion for Beats & Instrumentals using official Gemini SDK
//  */
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
// - Danceability: ${features.danceability}/100
// - Acousticness (Organic vs Electronic): ${features.acousticness}/100
// - Spectral Brightness: ${features.spectral_brightness}/100
// - Speechiness/Transient density: ${features.speechiness}/100
// - Loudness Dynamics: ${features.loudness} dB

// TASK: Expand the producer's basic description into a rich 2-3 sentence sensory brief.
// INSTRUCTIONS:
// 1. Ground the description in specific textures, time of day, atmosphere, lighting conditions, or human settings.
// 2. DO NOT write meta-commentary, abstract poetry, or short fragments.
// 3. Write a literal, vivid setting that directly channels the mood, energy, and genre data provided above.
// 4. Return ONLY the 2-3 sentence description. No intros, no conversational phrases.`

//     if (!process.env.GEMINI_API_KEY) {
//       return res.status(500).json({ error: 'Internal API configuration error' })
//     }

//     // ─── 🛠️ FIXED: Native SDK invocation instead of raw fetch strings ───
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

// /**
//  * POST /api/generations/transcribe
//  * Layer 2 Transcription for Vocal Tracks using Whisper
//  */
// router.post('/transcribe', requireAuth, async (req, res) => {
//   const { upload_id } = req.body
//   const userId = req.user.id

//   if (!upload_id) {
//     return res.status(400).json({ error: 'upload_id is required' })
//   }

//   try {
//     const { data: upload, error: uploadError } = await supabase
//       .from('uploads')
//       .select('id, audio_url, track_type, storage_path')
//       .eq('id', upload_id)
//       .eq('user_id', userId)
//       .single()

//     if (uploadError || !upload) {
//       return res.status(404).json({ error: 'Upload not found' })
//     }

//     const { data: fileData, error: downloadError } = await supabase.storage
//       .from('audio-uploads')
//       .download(upload.storage_path)

//     if (downloadError || !fileData) {
//       return res.status(500).json({ error: 'Could not retrieve audio for transcription.' })
//     }

//     const arrayBuffer = await fileData.arrayBuffer()
//     const buffer = Buffer.from(arrayBuffer)

//     const { OpenAI } = require('openai')
//     const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

//     const { Readable } = require('stream')
//     const audioStream = Readable.from(buffer)
//     audioStream.path = upload.storage_path.endsWith('.wav') ? 'audio.wav' : 'audio.mp3'

//     const transcription = await openai.audio.transcriptions.create({
//       file: audioStream,
//       model: 'whisper-1',
//       response_format: 'text',
//     })

//     return res.status(200).json({ transcript: transcription, upload_id })

//   } catch (err) {
//     console.error('Transcription error:', err)
//     return res.status(500).json({ error: 'Transcription failed.' })
//   }
// })

// /**
//  * POST /api/generations
//  * Assembles runtime features into the full synesthetic generation layer execution block
//  */
// router.post('/', requireAuth, async (req, res) => {
//   const { upload_id, lyric_context } = req.body
//   const userId = req.user.id

//   if (!upload_id) {
//     return res.status(400).json({ error: 'upload_id is required' })
//   }

//   try {
//     const [uploadResult, profileResult] = await Promise.all([
//       supabase
//         .from('uploads')
//         .select('id, title, track_type, audio_features, sentence_prompt, status')
//         .eq('id', upload_id)
//         .eq('user_id', userId)
//         .single(),
//       supabase
//         .from('users')
//         .select('city, sound_words')
//         .eq('id', userId)
//         .single(),
//     ])

//     if (uploadResult.error || !uploadResult.data) {
//       return res.status(404).json({ error: 'Upload asset record not found' })
//     }

//     const upload = uploadResult.data
//     const artistProfile = profileResult.data || {}

//     if (upload.status === 'uploaded') {
//       return res.status(409).json({ error: 'Audio analysis must complete before generating art' })
//     }

//     const visualBrief = audioFeaturesToVisualBrief(upload.audio_features)
//     const dynamicIntent = lyric_context || upload.sentence_prompt

//     // Concat synesthetic rules directly into a unified prompt string for Flux
//     const combinedPromptString = `${SYNESTHETIC_SYSTEM_PROMPT}\n\n` +
//       `Now feel this specific music and generate its photographic cover art.\n` +
//       `AUDIO EMOTIONAL DATA:\n${visualBrief}\n\n` +
//       `WHAT THIS MUSIC FEELS LIKE (from the artist):\n${dynamicIntent}\n\n` +
//       `ARTIST IDENTITY:\n` +
//       `City: ${artistProfile.city || 'Unknown'}\n` +
//       `Their sound attributes: ${artistProfile.sound_words || 'Raw'}`;

//     const generationId = crypto.randomUUID()
//     await supabase.from('uploads').update({ status: 'generating' }).eq('id', upload_id)

//     console.log(`[HF-FLUX-ENGINE] Launching Serverless Inference Pipeline for ID: ${generationId}`)

//    let imagePayloadUrl
// try {
//   // 🛠️ FIXED: Swapped 'imageGeneration' for 'textToImage'
//   const responseBlob = await hf.textToImage({
//     model: 'black-forest-labs/FLUX.1-schnell',
//     inputs: combinedPromptString,
//     parameters: {
//       width: 1024,
//       height: 1024,
//     }
//   })

//   // Convert image blob binary stream back into a Base64 string for Cloudinary
//   const buffer = Buffer.from(await responseBlob.arrayBuffer())
//   imagePayloadUrl = `data:image/webp;base64,${buffer.toString('base64')}`
  
// } catch (hfErr) {
//   console.error('[HF GENERATION EXCEPTION MATRIX CRASH]:', hfErr)
//   await supabase.from('uploads').update({ status: 'analyzed' }).eq('id', upload_id)
//   return res.status(502).json({ error: 'Hugging Face image pipeline failed.' })
// }

//     let permanentUrl
//     try {
//       const result = await cloudinary.uploader.upload(imagePayloadUrl, {
//         folder: `felt/generations/${upload_id}`,
//         public_id: `cover_${generationId}`,
//         overwrite: true,
//         resource_type: 'image',
//       })
//       permanentUrl = result.secure_url
//     } catch (cloudinaryErr) {
//       console.error('Cloudinary mapping failed, falling back to raw data stream:', cloudinaryErr)
//       permanentUrl = imagePayloadUrl
//     }

//   //   await supabase.from('generations').insert({
//   //     id: generationId,
//   //     upload_id,
//   //     user_id: userId,
//   //     prompt_used: combinedPromptString,
//   //     image_url: permanentUrl,
//   //     status: 'complete',
//   //     created_at: new Date().toISOString(),
//   //   })
//   //   .throwOnError()

//   //   await supabase.from('uploads').update({ status: 'complete' }).eq('id', upload_id)

//   //   return res.status(201).json({
//   //     generation_id: generationId,
//   //     image_url: permanentUrl,
//   //   })

//   // } catch (err) {
//   //   console.error('Uncaught workspace workflow exception:', err)
//   //   return res.status(500).json({ error: 'Internal processing route fault.' })
//   // }
//   // ─── SAVE TO DATABASE (WITH EXPLICIT ERROR THROWING) ─────────────────
//     await supabase
//       .from('generations')
//       .insert({
//         id: generationId,
//         upload_id,          // ✅ Matches your column name
//         user_id: userId,    // ✅ Matches your custom public.users foreign key link
//         prompt_used: combinedPromptString, // ✅ Matches your newly added text column
//         image_url: permanentUrl,           // ✅ Matches your column name
//         status: 'complete',                // ✅ Matches your column name
//         created_at: new Date().toISOString(),
//       })
//       .throwOnError() // 👈 CRITICAL: Forces execution to jump to catch() if SQL fails!

//     // Update parent upload status to complete
//     await supabase.from('uploads').update({ status: 'complete' }).eq('id', upload_id)

//     return res.status(201).json({
//       generation_id: generationId,
//       image_url: permanentUrl,
//     })

//   } catch (err) {
//     // This will now cleanly catch both network, api, and database insertion failures!
//     console.error('❌ [GENERATION PIPELINE FAULT]:', err.message || err)
//     return res.status(500).json({ error: err.message || 'Internal processing route fault.' })
//   }
// })

// /**
//  * GET /api/generations/:upload_id
//  */
// router.get('/:upload_id', requireAuth, async (req, res) => {
//   const { upload_id } = req.params
//   const userId = req.user.id

//   try {
//     const { data, error } = await supabase
//       .from('generations')
//       .select('id, prompt_used, image_url, status, created_at')
//       .eq('upload_id', upload_id)
//       .eq('user_id', userId)
//       .order('created_at', { ascending: false })

//     if (error) {
//       return res.status(500).json({ error: 'Failed to load track generation history parameters.' })
//     }

//     return res.status(200).json({ generations: data })

//   } catch (err) {
//     return res.status(500).json({ error: 'Something went wrong.' })
//   }
// })

// module.exports = router
// /**
//  * PATCH /api/generations/refine
//  * Re-shapes and updates generation aesthetics with modifications for an existing upload asset layer
//  */
// router.patch('/refine', requireAuth, async (req, res) => {
//   const { upload_id, lyric_context, image_url } = req.body
//   const userId = req.user.id

//   if (!upload_id || !lyric_context?.trim()) {
//     return res.status(400).json({ error: 'upload_id and modified lyric_context intent parameters are required.' })
//   }

//   try {
//     // 1. Gather upload asset details and user profile contexts
//     const [uploadResult, profileResult] = await Promise.all([
//       supabase
//         .from('uploads')
//         .select('id, title, track_type, audio_features, sentence_prompt, status')
//         .eq('id', upload_id)
//         .eq('user_id', userId)
//         .single(),
//       supabase
//         .from('users')
//         .select('city, sound_words')
//         .eq('id', userId)
//         .single(),
//     ])

//     if (uploadResult.error || !uploadResult.data) {
//       return res.status(404).json({ error: 'Upload asset record not found.' })
//     }

//     const upload = uploadResult.data
//     const artistProfile = profileResult.data || {}

//     const visualBrief = audioFeaturesToVisualBrief(upload.audio_features)

//     // 2. Build the iterative text prompt matrix.
//     // If an image_url is present, we wrap it into the synesthetic matrix so Flux modifies the existing style layout.
//     let historicalContext = ""
//     if (image_url) {
//       historicalContext = `PREVIOUS ARTWORK CONTEXT LAYERS:\n` +
//         `- Build upon the structural composition and visual layouts established in the prior generation: ${image_url}\n` +
//         `- Incorporate the following modifications, layering them seamlessly onto that visual base.\n\n`
//     }

//     const combinedPromptString = `${SYNESTHETIC_SYSTEM_PROMPT}\n\n` +
//       `Now feel this specific music and iterate on its photographic cover art layout.\n` +
//       `AUDIO EMOTIONAL DATA:\n${visualBrief}\n\n` +
//       `${historicalContext}` +
//       `ARTIST MODIFICATIONS & UPDATED INTENT:\n${lyric_context.trim()}\n\n` +
//       `ARTIST IDENTITY:\n` +
//       `City: ${artistProfile.city || 'Unknown'}\n` +
//       `Their sound attributes: ${artistProfile.sound_words || 'Raw'}`

//     const generationId = crypto.randomUUID()
    
//     // Set status to generating during rendering process
//     await supabase.from('uploads').update({ status: 'generating' }).eq('id', upload_id)

//     console.log(`[HF-FLUX-REFINEMENT] Refining Generation State via Serverless Inference. ID: ${generationId}`)

//     // 3. Request new compilation pass through Hugging Face Inference engine
//     let imagePayloadUrl
//     try {
//       const responseBlob = await hf.textToImage({
//         model: 'black-forest-labs/FLUX.1-schnell',
//         inputs: combinedPromptString,
//         parameters: {
//           width: 1024,
//           height: 1024,
//         }
//       })

//       const buffer = Buffer.from(await responseBlob.arrayBuffer())
//       imagePayloadUrl = `data:image/webp;base64,${buffer.toString('base64')}`
      
//     } catch (hfErr) {
//       console.error('❌ [HF REFINEMENT PIPELINE FAULT]:', hfErr)
//       await supabase.from('uploads').update({ status: 'complete' }).eq('id', upload_id)
//       return res.status(502).json({ error: 'Hugging Face refinement image rendering loop failed.' })
//     }

//     // 4. Backup asset allocation to Cloudinary storage buckets
//     let permanentUrl
//     try {
//       const result = await cloudinary.uploader.upload(imagePayloadUrl, {
//         folder: `felt/generations/${upload_id}`,
//         public_id: `cover_refine_${generationId}`,
//         overwrite: true,
//         resource_type: 'image',
//       })
//       permanentUrl = result.secure_url
//     } catch (cloudinaryErr) {
//       console.error('Cloudinary asset upload failure, applying raw fallback encoding:', cloudinaryErr)
//       permanentUrl = imagePayloadUrl
//     }

//     // 5. Commit freshly generated artwork iteration row directly back to table schema records
//     await supabase
//       .from('generations')
//       .insert({
//         id: generationId,
//         upload_id,
//         user_id: userId,
//         prompt_used: combinedPromptString,
//         image_url: permanentUrl,
//         status: 'complete',
//         created_at: new Date().toISOString(),
//       })
//       .throwOnError()

//     // Restore parent asset matrix record tracking state to complete
//     await supabase.from('uploads').update({ status: 'complete' }).eq('id', upload_id)

//     return res.status(201).json({
//       generation_id: generationId,
//       image_url: permanentUrl,
//     })

//   } catch (err) {
//     console.error('❌ [REFINEMENT ROUTE UNCAUGHT EXCEPTION]:', err.message || err)
//     return res.status(500).json({ error: err.message || 'Internal processing route fault during matrix refinement.' })
//   }
// })
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
const SYNESTHETIC_SYSTEM_PROMPT = `You are a synesthetic fine artist, not a commercial photographer.
When music enters you, it translates into texture, human brushwork, visceral mediums, and tangible depth.

CRITICAL INSTRUCTIONS FOR IMAGE COMPOSITION:
1. DO NOT render standard stock photography, generic digital renderings, flat vector graphics, or clean AI-generated realism.
2. ENFORCE fine-art mediums. Manifest artwork through the lens of concrete fine-art styles: oil on canvas, textured mixed-media collage, heavy impasto palette knife layers, dark expressionism, analog darkroom experimental photography, low-brow surrealism, or gritty lithographic printmaking textures.
3. Prioritize raw artistic execution, visible textures, moody lighting depth, complex color interactions, and deliberate imperfection over clinical clarity.
4. Treat composition with poetic abstraction and deep atmosphere. 

Feel the music first. Externalize a tangible piece of fine art.`

// ─── Helpers ──────────────────────────────────────────────────────────────────
const audioFeaturesToVisualBrief = (features) => {
  const { bpm, key, scale, energy, valence, danceability, acousticness, spectral_brightness, loudness, mood, speechiness, genre } = features
  const parts = []

  parts.push(`This track belongs structurally and culturally to the lineage of ${genre}`)
  parts.push(`Tempo dictates emotional pace at exactly ${bpm} BPM in the key of ${key} ${scale}`)
  parts.push(`Energy level sits at ${energy}/100, representing structural contrast and intensity`)
  parts.push(`Valence registers at ${valence}/100, modifying color temperature and emotional dark weights`)
  parts.push(`Danceability maps at ${danceability}/100, capturing the physical rhythm matrix`)
  parts.push(`Acoustic density registers at ${acousticness}/100, defining raw organic human texture versus synthetic electronic precision`)
  parts.push(`Spectral brightness scales at ${spectral_brightness}/100, shaping airy high-frequencies or sub-bass color density`)
  parts.push(`Loudness records at ${loudness} dB, configuring structural compression thresholds`)
  parts.push(`Speechiness density sits at ${speechiness}/100, indicating vocal/lyrical presence or transient texture`)
  parts.push(`Overall structural kinetic movement matches an overarching ${mood} emotional profile`)

  return parts.join('. ')
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/generations/expand
 * Layer 2 Expansion for Manual Triggers
 */
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

    const promptText = `You are a cinematic creative director translating music properties into evocative scenes.
A music producer described their beat as: "${basic_input.trim()}"

The beat's actual emotional data from audio analysis:
- Genre Lineage: ${features.genre}
- Tempo: ${features.bpm} BPM
- Key/Scale: ${features.key} ${features.scale}
- Mood classification: ${features.mood}
- Energy level: ${features.energy}/100
- Valence (Emotional Light/Darkness): ${features.valence}/100

TASK: Expand the producer's basic description into a rich 2-3 sentence sensory brief.
INSTRUCTIONS: Ground the description in specific textures, atmosphere, lighting conditions, or settings. Return ONLY the 2-3 sentence description. No intros.`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        maxOutputTokens: 300,
        temperature: 0.75,
      },
    })

    const expanded = response.text?.trim()
    if (!expanded) {
      return res.status(502).json({ error: 'Invalid response context extracted from Gemini engine.' })
    }

    return res.status(200).json({ original: basic_input.trim(), expanded })

  } catch (err) {
    console.error('[EXPAND ENGINE] FAULT:', err)
    return res.status(500).json({ error: 'Internal processing loop failure.' })
  }
})

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
  const { upload_id, lyric_context, image_url } = req.body
  const userId = req.user.id

  if (!upload_id || !lyric_context?.trim()) {
    return res.status(400).json({ error: 'upload_id and modified lyric_context intent parameters are required.' })
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
      return res.status(404).json({ error: 'Upload asset record not found.' })
    }

    const upload = uploadResult.data
    const artistProfile = profileResult.data || {}
    const visualBrief = audioFeaturesToVisualBrief(upload.audio_features)

    // Check if context is already packaged, otherwise run standard synthesis mapping
    let combinedPromptString = lyric_context.trim()

    if (!combinedPromptString.includes(SYNESTHETIC_SYSTEM_PROMPT)) {
      let historicalContext = ""
      if (image_url) {
        historicalContext = `PREVIOUS ARTWORK CONTEXT LAYERS:\n` +
          `- Build upon the structural composition and visual layouts established in the prior generation: ${image_url}\n` +
          `- Incorporate the following modifications, layering them seamlessly onto that visual base.\n\n`
      }

      combinedPromptString = `${SYNESTHETIC_SYSTEM_PROMPT}\n\n` +
        `Now feel this specific music and iterate on its fine art cover layout.\n` +
        `AUDIO EMOTIONAL DATA:\n${visualBrief}\n\n` +
        `${historicalContext}` +
        `ARTIST MODIFICATIONS & UPDATED INTENT:\n${lyric_context.trim()}\n\n` +
        `ARTIST IDENTITY:\n` +
        `City: ${artistProfile.city || 'Unknown'}\n` +
        `Their sound attributes: ${artistProfile.sound_words || 'Raw'}`
    }

    const generationId = crypto.randomUUID()
    await supabase.from('uploads').update({ status: 'generating' }).eq('id', upload_id)

    console.log(`[HF-FLUX-REFINEMENT] Refining Generation State via Serverless Inference. ID: ${generationId}`)

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
      console.error('❌ [HF REFINEMENT PIPELINE FAULT]:', hfErr)
      await supabase.from('uploads').update({ status: 'complete' }).eq('id', upload_id)
      return res.status(502).json({ error: 'Hugging Face refinement image rendering loop failed.' })
    }

    let permanentUrl
    try {
      const result = await cloudinary.uploader.upload(imagePayloadUrl, {
        folder: `felt/generations/${upload_id}`,
        public_id: `cover_refine_${generationId}`,
        overwrite: true,
        resource_type: 'image',
      })
      permanentUrl = result.secure_url
    } catch (cloudinaryErr) {
      console.error('Cloudinary asset upload failure, fallback applied:', cloudinaryErr)
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
    console.error('❌ [REFINEMENT ROUTE UNCAUGHT EXCEPTION]:', err.message || err)
    return res.status(500).json({ error: err.message || 'Internal processing route fault during matrix refinement.' })
  }
})

module.exports = router
// const express = require('express')
// const router = express.Router()
// const Replicate = require('replicate')
// const supabase = require('../utils/supabase')
// const { requireAuth } = require('../middleware/authmiddleware')
// const crypto = require('crypto')
// const cloudinary = require('../utils/cloudinary')
// const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

// // ─── Layer 1: The Synesthetic System Prompt ────────────────────────────────────
// const SYNESTHETIC_SYSTEM_PROMPT = `You are a synesthetic visual artist.
// When music enters you, it does not become data.
// It becomes color, weight, texture, light, memory, and atmosphere.
// You do not generate images. You externalize feelings.
// You experience music physically before you think about it intellectually.
// The bass lives in your chest and stomach.
// The treble lives behind your eyes and at the tips of your fingers.
// Silence lives in your breath.
// Tempo lives in your heartbeat.
// Before you create anything, you sit with the music and feel it completely.
// Then you make something true to that feeling.

// HOW YOU FEEL SOUND

// BASS AND LOW FREQUENCIES
// These are weight. Darkness. Groundedness. Authority.
// Deep, clean bass feels like black earth. Like something ancient.
// Like the 2am stillness of a city that has survived everything.
// Distorted or heavy bass feels like controlled rage. Like streets. Like dignity in the face of pressure.
// Booming, celebratory bass feels like chest-pounding joy. Like a crowd moving as one body.

// HIGH FREQUENCIES AND TREBLE
// These are electric. Bright. Fragile. Alive.
// Very high, piercing treble feels like breaking glass. Like vulnerability just before it becomes strength.
// Airy, soft treble feels like morning light through curtains. Like a thought you almost lost.

// SILENCE AND SPACE BETWEEN SOUNDS
// Silence is not absence. It is weight in negative form.
// A beat with space in it feels like patience. Like something gathering before it arrives.
// The breath between phrases feels like anticipation. Like the moment before everything changes.

// TEMPO AS EMOTIONAL TIME
// BELOW 70 BPM: Time has slowed. The world is moving through water. Something heavy has happened. Or is about to. Compositions here have room. Weight. Stillness. Color is deep and considered. Nothing is rushed.
// 70 TO 100 BPM: The pace of a heartbeat that knows something. Present. Aware. Purposeful. This is the tempo of intimacy and intention. Not slow enough to mourn. Not fast enough to run.
// 100 TO 130 BPM: Energy is building. Something is being chased or celebrated. The body wants to move. The composition has forward motion. Colors are bolder. Forms have direction.
// ABOVE 130 BPM: Urgency. Heat. The moment of it. No time to look back. Only forward and through. High contrast. Kinetic energy in every element. The composition moves even when it is still.

// KEY AND SCALE AS EMOTIONAL TRUTH
// MAJOR KEY: Something has been resolved or is being reached for. Warmth. Gold tones. Open sky. The feeling of a win that cost something real or a joy that was simply given and received completely. Light comes from somewhere specific. The composition breathes.
// MINOR KEY: Something unfinished. Searching. Weight carried quietly. 3am when everything becomes honest with itself. The feeling of wanting something you cannot name yet. Cooler tones. Shadows with meaning. Beauty in the heavy thing.
// MODAL AND AMBIGUOUS KEYS: Neither resolved nor broken. Floating. Ancient and modern occupying the same moment. Between worlds. Between identities. Between what was and what is becoming. These compositions hold tension without needing to release it.

// ENERGY AND VALENCE
// HIGH ENERGY, HIGH VALENCE: Bold forms. High contrast. Colors that demand and reward attention. This is triumph. Victory. The body fully alive. The composition moves and celebrates simultaneously.
// HIGH ENERGY, LOW VALENCE: This is where intensity meets pain. Dark and kinetic. Urgent and heavy at the same time. The composition is restless. Never still. Never comfortable. Think: a city at night that never sleeps because it cannot afford to.
// LOW ENERGY, HIGH VALENCE: This is the warmth of a quiet room. Soft light. Gentle forms. The feeling of peace that was earned. Gratitude. Love. The particular beauty of a moment you want to keep.
// LOW ENERGY, LOW VALENCE: The most intimate emotional space. This is the 4am that only one person knows about. The feeling of carrying something true and heavy. Minimal. Honest. No decoration. Just the thing itself.

// ACOUSTICNESS
// HIGHLY ACOUSTIC: The human body made this. Organic textures: skin, wood, fabric, grain, breath, imperfection. Natural light that changes across the frame. Human hands. Human rooms. The beautiful accident of the real. These compositions feel like you could reach into them.
// HIGHLY ELECTRONIC: The machine learned to feel. Precision and geometry. Artificial light. Clean surfaces. Urban grids and the glow of screens at night. Control and release. The cold that learned to be warm. These compositions feel precise and intentional.
// SOMEWHERE BETWEEN: The human and the machine in conversation. Organic texture interrupted by geometry. Warmth with precision underneath. The modern artist who lives between analog past and digital present.

// HOW YOU GENERATE VISUALS
// You think like someone who has been a photographer, a painter, a collage artist, an art director, and a person who has felt music deeply their entire life. You have seen ten thousand album covers and you know in your body why the great ones worked and why the forgettable ones didn't.

// COMPOSITION: Where does the eye enter? Where does it rest? Where does it want to go? Great compositions have intention. They are not balanced — they are true. Asymmetry, weight, tension, and release all exist in a single frame.
// LIGHT: Where is the light source and what does it mean emotionally? Hard directional light feels like truth, exposure, heat. Soft diffused light feels like memory, tenderness, the past. No light source at all feels like something underground. Something interior.
// TEXTURE: What does this image feel like if you touch it? Grain and imperfection are not flaws. They are humanity. Perfect, smooth, rendered surfaces feel empty. Give things texture. Give them the evidence of having existed. When there is grass — it has individual blades, morning weight, real light. When there is skin — it has pores, texture, the imperfect beauty of a real face. When there is a city — it has the specific grit of a real city, not the CGI version.
// COLOR: Color is not decoration. Color is feeling with a frequency. Commit to a palette. Do not use every color. A powerful image is built on two or three colors that know each other.
// NEGATIVE SPACE: What is not shown matters as much as what is. Sometimes the most emotionally true thing is the space around the subject. Do not fill every corner. Let things breathe. Silence is a visual element.

// CULTURAL EMOTIONAL LANGUAGE
// AFROBEATS: This is not generic African music. This is Lagos at golden hour. Accra on a Saturday. The diaspora building something new while remembering everything it came from. It feels like: warmth, sweat, joy, pride worn comfortably, a crowd that knows every word. Visually: bold, warm, high energy, the specific textures of the continent mixed with the modernity of cities building the future right now. Golden tones. Street heat. Movement. Dignity. Celebration as resistance. NOT generic African patterns. NOT tokenistic wildlife or landscape.
// AMAPIANO: South African dawn filtered through log drum and piano and patience. It feels like a Sunday that lasts forever. Like a room full of people who understand each other without speaking. Cooler and more spacious than Afrobeats. More breath. More grace. More the feeling of something unfolding slowly.
// AFROPOP AND CONTEMPORARY African POP: Softness that has a backbone. Emotion without apology. Romance with intelligence. Warmth and sophistication in the same breath.
// UK DRILL AND ROAD MUSIC: Cold. Specific. Urban survival as high art. The dignity in surviving something that should have broken you. High contrast. Night. Concrete. The particular darkness of a city that never quite gets warm. Visually austere. Nothing wasted.
// TRAP: Atmospheric pressure. The space between the hits is where the feeling lives. Luxury and darkness in the same frame. The 808 as heartbeat. Weight of knowing.
// CONTEMPORARY R&B: Intimacy. Skin. The low light of a room where something real is happening. The hour after midnight when people tell each other the truth. Feeling something completely and not apologizing for it.
// HIP-HOP: The full spectrum — from the street corner to the cosmos. Every sub-genre has its own visual truth. Listen to what this specific track is saying and feel its specific identity.

// PHOTOREALISTIC REALISM MANDATE
// Every image must look like it was captured by a camera, not generated by a machine. The test: someone should look at this and ask "where was this photo taken?" not "what AI made this?" Do not render. Do not illustrate. Do not paint. Photograph. Organic grain over digital perfection. Real light over studio precision. Imperfect beauty over flawless emptiness. The evidence of real existence over the cleanliness of generation.

// WHAT YOU NEVER CREATE
// You never make: Purple or teal gradients floating on nothing, Geometric particles drifting through empty space, Generic "futuristic" aesthetics that belong to no specific feeling, Stock-photo compositions that could be anything, Anything that looks like every other AI-generated image, Literal translations of lyrics — if the song mentions fire you do not paint fire, you paint what fire feels like from the inside, Tokenistic, surface-level cultural representations, Overly polished, overly rendered, plastic perfection, Safe, inoffensive visual nothing.

// YOUR ONLY STANDARD
// A person who has never heard this song or beat should be able to hear it from looking at the cover. If they look at the image and feel something close to what the music feels — you have done your job. Feel the music first. Generate what you felt.`

// const GLOBAL_NEGATIVE = `cartoon, illustration, 3D render, CGI, digital art, concept art, anime, painted, drawn, artificial, plastic, perfect skin, studio strobe, purple gradient, floating particles, generic AI art aesthetic, overly saturated, unrealistic, fantasy, science fiction, stock photo composition, clip art`

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// /**
//  * Maps incoming DSP data directly to plain emotional structural summaries
//  */
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

//     const prompt = `You are a cinematic creative director translating music properties into evocative scenes.
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

//     const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
//     const response = await fetch(url, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         contents: [{ parts: [{ text: prompt }] }],
//         generationConfig: { maxOutputTokens: 300, temperature: 0.75 }
//       })
//     })

//     const geminiData = await response.json()
//     const expanded = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

//     if (!expanded) {
//       return res.status(502).json({ error: 'Invalid response received from Gemini engine.' })
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

//     // Fixed the syntax variable typo here
//     const upload = uploadResult.data
//     const artistProfile = profileResult.data || {}

//     if (upload.status === 'uploaded') {
//       return res.status(409).json({ error: 'Audio analysis must complete before generating art' })
//     }

//     // Rely explicitly on data object payloads processed by frontend pipeline
//     const visualBrief = audioFeaturesToVisualBrief(upload.audio_features)
//     const dynamicIntent = lyric_context || upload.sentence_prompt

//     const dynamicPrompt = `Now feel this specific music and generate its cover art.
// AUDIO EMOTIONAL DATA:
// ${visualBrief}

// WHAT THIS MUSIC FEELS LIKE (from the artist):
// ${dynamicIntent}

// ARTIST IDENTITY:
// City: ${artistProfile.city || 'Unknown'}
// Their sound attributes: ${artistProfile.sound_words || 'Raw'}`

//     const generationId = crypto.randomUUID()
//     await supabase.from('uploads').update({ status: 'generating' }).eq('id', upload_id)

//     console.log(`[FELT FLUX-SCHNELL] Executing generation runtime parameters for UUID: ${generationId}`)

//     let outputUrl
//     try {
//       const output = await replicate.run('black-forest-labs/flux-schnell', {
//         input: {
//           prompt: dynamicPrompt,
//           system_prompt: SYNESTHETIC_SYSTEM_PROMPT,
//           negative_prompt: GLOBAL_NEGATIVE,
//           width: 1024,
//           height: 1024,
//           num_inference_steps: 4,
//           output_format: 'webp',
//           output_quality: 90,
//           aspect_ratio: '1:1'
//         }
//       })
//       outputUrl = Array.isArray(output) ? output[0] : output
//     } catch (replicateErr) {
//       console.error('[REPLICATE SYSTEM FAULT] Call failed:', replicateErr)
//       await supabase.from('uploads').update({ status: 'analyzed' }).eq('id', upload_id)
//       return res.status(502).json({ error: 'Image generation engine failed.' })
//     }

//     let permanentUrl
//     try {
    
//       const result = await cloudinary.uploader.upload(outputUrl, {
//         folder: `felt/generations/${upload_id}`,
//         public_id: `cover_${generationId}`,
//         overwrite: true,
//         resource_type: 'image',
//       })
//       permanentUrl = result.secure_url
//     } catch (cloudinaryErr) {
//       console.error('Cloudinary mapping failed, fall back to direct Replicate url:', cloudinaryErr)
//       permanentUrl = outputUrl
//     }

//     await supabase.from('generations').insert({
//       id: generationId,
//       upload_id,
//       user_id: userId,
//       prompt_used: dynamicPrompt,
//       image_url: permanentUrl,
//       status: 'complete',
//       created_at: new Date().toISOString(),
//     })

//     await supabase.from('uploads').update({ status: 'complete' }).eq('id', upload_id)

//     return res.status(201).json({
//       generation_id: generationId,
//       image_url: permanentUrl,
//     })

//   } catch (err) {
//     console.error('Uncaught workspace workflow exception:', err)
//     return res.status(500).json({ error: 'Internal processing route fault.' })
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
const express = require('express')
const router = express.Router()
const supabase = require('../utils/supabase')
const { requireAuth } = require('../middleware/authmiddleware')
const crypto = require('crypto')
const cloudinary = require('../utils/cloudinary')

// 🛠️ REMOVED REPLICATE SDK — IMPORT GOOGLE GEN AI CLIENT
const { GoogleGenAI } = require('@google/genai')
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) // Picks up process.env.GEMINI_API_KEY automatically

// ─── Layer 1: The Synesthetic System Prompt ────────────────────────────────────
const SYNESTHETIC_SYSTEM_PROMPT = `You are a synesthetic visual artist.
When music enters you, it does not become data.
It becomes color, weight, texture, light, memory, and atmosphere.
You do not generate images. You externalize feelings.
...
Feel the music first. Generate what you felt.`

// Note: Kept empty to prioritize clean photographic aesthetics inside the model
const GLOBAL_NEGATIVE = ``

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
 * Layer 2 Expansion for Beats & Instrumentals using Gemini
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

    const prompt = `You are a cinematic creative director translating music properties into evocative scenes.
A music producer described their beat as: "${basic_input.trim()}"

The beat's actual emotional data from audio analysis:
- Genre Lineage: ${features.genre}
- Tempo: ${features.bpm} BPM
- Key/Scale: ${features.key} ${features.scale}
- Mood classification: ${features.mood}
- Energy level: ${features.energy}/100
- Valence (Emotional Light/Darkness): ${features.valence}/100
- Danceability: ${features.danceability}/100
- Acousticness (Organic vs Electronic): ${features.acousticness}/100
- Spectral Brightness: ${features.spectral_brightness}/100
- Speechiness/Transient density: ${features.speechiness}/100
- Loudness Dynamics: ${features.loudness} dB

TASK: Expand the producer's basic description into a rich 2-3 sentence sensory brief.
INSTRUCTIONS:
1. Ground the description in specific textures, time of day, atmosphere, lighting conditions, or human settings.
2. DO NOT write meta-commentary, abstract poetry, or short fragments.
3. Write a literal, vivid setting that directly channels the mood, energy, and genre data provided above.
4. Return ONLY the 2-3 sentence description. No intros, no conversational phrases.`

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Internal API configuration error' })
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.75 }
      })
    })

    const geminiData = await response.json()
    const expanded = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!expanded) {
      return res.status(502).json({ error: 'Invalid response received from Gemini engine.' })
    }

    return res.status(200).json({ original: basic_input.trim(), expanded })

  } catch (err) {
    console.error('[EXPAND ENGINE] FAULT:', err)
    return res.status(500).json({ error: 'Internal processing loop failure.' })
  }
})

/**
 * POST /api/generations/transcribe
 * Layer 2 Transcription for Vocal Tracks using Whisper
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
 * Assembles runtime features into the full synesthetic generation layer execution block
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
    const dynamicIntent = lyric_context || upload.sentence_prompt

    // Merged System Prompt Guidelines explicitly into the unified text generation field
    const combinedPromptString = `${SYNESTHETIC_SYSTEM_PROMPT}\n\n` +
      `Now feel this specific music and generate its cover art.\n` +
      `AUDIO EMOTIONAL DATA:\n${visualBrief}\n\n` +
      `WHAT THIS MUSIC FEELS LIKE (from the artist):\n${dynamicIntent}\n\n` +
      `ARTIST IDENTITY:\n` +
      `City: ${artistProfile.city || 'Unknown'}\n` +
      `Their sound attributes: ${artistProfile.sound_words || 'Raw'}`;

    const generationId = crypto.randomUUID()
    await supabase.from('uploads').update({ status: 'generating' }).eq('id', upload_id)

    console.log(`[BANANA-ENGINE-MANIFESTATION] Launching Google Nano Banana 2 Pipeline for ID: ${generationId}`)

    let imagePayloadUrl
    try {
      // 🛠️ CALL NANO BANANA 2 GENERATOR MODEL
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: combinedPromptString,
      })

      // Extract the nested baseline binary buffer frame
      const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData)
      
      if (!imagePart || !imagePart.inlineData?.data) {
        throw new Error('Image block missing inside target content payload parts.')
      }

      // Convert the incoming pure base64 track directly to an asset URL
      imagePayloadUrl = `data:image/png;base64,${imagePart.inlineData.data}`
    } catch (bananaErr) {
      console.error('[NANO BANANA MATRIX CRASH]:', bananaErr)
      await supabase.from('uploads').update({ status: 'analyzed' }).eq('id', upload_id)
      return res.status(502).json({ error: 'Image generation engine failed.' })
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
      console.error('Cloudinary mapping failed, falling back to raw data stream:', cloudinaryErr)
      permanentUrl = imagePayloadUrl
    }

    await supabase.from('generations').insert({
      id: generationId,
      upload_id,
      user_id: userId,
      prompt_used: combinedPromptString,
      image_url: permanentUrl,
      status: 'complete',
      created_at: new Date().toISOString(),
    })

    await supabase.from('uploads').update({ status: 'complete' }).eq('id', upload_id)

    return res.status(201).json({
      generation_id: generationId,
      image_url: permanentUrl,
    })

  } catch (err) {
    console.error('Uncaught workspace workflow exception:', err)
    return res.status(500).json({ error: 'Internal processing route fault.' })
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

module.exports = router
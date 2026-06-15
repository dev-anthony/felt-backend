const express = require('express')
const router = express.Router()
const Replicate = require('replicate')
const supabase = require('../utils/supabase')
const { requireAuth } = require('../middleware/authmiddleware')

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

// ─── Constants ────────────────────────────────────────────────────────────────

const FREE_TIER_STEERING_LIMIT = 3

const FILTERS = {
  GOLDEN:    { prompt: `golden hour photography, warm amber tones, Kodak Portra 400, natural warmth, sun low on horizon, rich golden shadows, celebratory light`, negative: `cold tones, harsh flash, dark, moody, blue` },
  MIDNIGHT:  { prompt: `night photography, deep blacks with detail, city light sources, the specific dark of 2am, shadows that breathe, long exposure warmth`, negative: `bright, daylight, warm, pastoral, cheerful` },
  RAW:       { prompt: `harsh flash street photography, high contrast documentary, gritty urban texture, photojournalism, handheld, unpolished honesty`, negative: `soft, warm, golden, polished, clean` },
  SOFT:      { prompt: `soft natural window light, portrait photography, Fujifilm 400H, shallow depth of field, tender and quiet, the warmth of a real room`, negative: `harsh, high contrast, urban, gritty, dark` },
  FILM:      { prompt: `35mm analog film, organic grain, lo-fi imperfection, expired film warmth, the texture of things that actually happened`, negative: `digital clean, sharp, precise, artificial, perfect` },
  COLD:      { prompt: `cold digital photography, desaturated blues and greys, clean and precise, winter light, controlled and sharp, modern editorial`, negative: `warm, golden, soft, organic, lo-fi` },
  NEON:      { prompt: `neon lit urban photography, artificial colored light at night, wet reflections on concrete, electric city energy, vivid and alive`, negative: `daylight, natural, soft, pastoral, muted` },
  DUST:      { prompt: `dusty warm analogue, faded vintage tones, sun bleached, the feeling of something old and true and lived in`, negative: `clean, modern, sharp, bright, digital` },
  CINEMATIC: { prompt: `cinematic still photography, anamorphic lens, movie color grade, dramatic shadow, the single frame that tells the whole story`, negative: `snapshot, casual, ungraded, flat, amateur` },
}

const GLOBAL_NEGATIVE = `cartoon, illustration, 3D render, CGI, digital art, concept art, anime, painted, drawn, artificial, plastic, perfect skin, studio strobe, purple gradient, floating particles, generic AI art aesthetic, overly saturated, unrealistic, fantasy, science fiction, stock photo composition`

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Maps audio features to a visual brief in plain emotional language.
 * This is the translation layer — the core intelligence of FELT.
 */
const audioFeaturesToVisualBrief = (features) => {
  const { bpm, energy, valence, acousticness, spectral_brightness, danceability, key, scale, mood } = features
  const parts = []

  // Tempo → visual density and pace
  if (bpm > 140)      parts.push('frenetic energy, dense composition, no empty space')
  else if (bpm > 100) parts.push('forward momentum, purposeful movement in the frame')
  else if (bpm > 70)  parts.push('measured pace, deliberate stillness with tension underneath')
  else                parts.push('slow breath, vast negative space, time stretched out')

  // Energy → contrast and visual intensity
  if (energy > 75)      parts.push('high contrast, bold shadows, visual intensity turned all the way up')
  else if (energy > 50) parts.push('present and alive, mid-range contrast, things in motion')
  else if (energy > 25) parts.push('low contrast, soft gradients, quiet visual weight')
  else                  parts.push('barely there, gossamer light, the world holding still')

  // Valence → emotional temperature of color
  if (valence > 70)      parts.push('warm palette, something worth celebrating, light that feels earned')
  else if (valence > 45) parts.push('ambiguous light, neither fully bright nor fully heavy')
  else if (valence > 20) parts.push('cool undertones, weight in the shadows, a reckoning')
  else                   parts.push('cold palette, grief or resolve, dark that has texture')

  // Scale → harmonic emotional direction
  if (scale === 'major') parts.push('resolution in the frame, a sense of arrival')
  else                   parts.push('tension unresolved, minor key feeling — beautiful and heavy')

  // Acousticness → texture world
  if (acousticness > 70)      parts.push('organic textures — wood, skin, breath, paper, earth')
  else if (acousticness > 40) parts.push('mixed world — human warmth inside a harder environment')
  else                        parts.push('geometric and urban, glass and concrete, electronic precision')

  // Spectral brightness → light quality
  if (spectral_brightness > 70) parts.push('airy and bright, high-frequency light, things feel elevated')
  else if (spectral_brightness > 40) parts.push('mid-range warmth, grounded light')
  else                               parts.push('heavy low-end visual weight, bass in the color')

  // Danceability → movement in composition
  if (danceability > 70) parts.push('rhythm in the composition, repetition with variation, things that move')
  else                   parts.push('still composition, contemplative, a single held moment')

  // Mood → overarching emotional direction
  const moodMap = {
    happy:      'triumphant, open, the feeling of something going right',
    sad:        'longing, introspective, beautiful in the way grief is beautiful',
    aggressive: 'confrontational, raw, direct eye contact with the viewer',
    relaxed:    'unhurried, breathing room, nothing needs to happen yet',
  }
  if (mood && moodMap[mood]) parts.push(moodMap[mood])

  return parts.join('. ')
}

/**
 * Auto-selects default filter from audio features — matches spec exactly.
 */
const getDefaultFilter = (features) => {
  const { energy, valence, acousticness } = features
  if (energy > 70 && valence > 70)  return 'GOLDEN'
  if (energy > 70 && valence < 40)  return 'RAW'
  if (energy < 40 && valence > 60)  return 'SOFT'
  if (energy < 40 && valence < 40)  return 'MIDNIGHT'
  if (acousticness > 70)            return 'FILM'
  if (acousticness < 30)            return 'COLD'
  return 'CINEMATIC'
}

/**
 * Applies steering slider offsets to the filter prompt.
 * Sliders: darker_brighter (-1 to 1), raw_polished (-1 to 1), abstract_realistic (-1 to 1)
 */
const applySteeringToPrompt = (basePrompt, steering = {}) => {
  const additions = []
  const { darker_brighter = 0, raw_polished = 0, abstract_realistic = 0 } = steering

  if (darker_brighter > 0.3)       additions.push('brighter exposure, lifted shadows, optimistic light')
  else if (darker_brighter < -0.3) additions.push('underexposed, crushed blacks, shadows dominate')

  if (raw_polished > 0.3)          additions.push('polished and deliberate, high production value, clean')
  else if (raw_polished < -0.3)    additions.push('rough and immediate, unpolished, handheld urgency')

  if (abstract_realistic > 0.3)    additions.push('photorealistic, documentary truth, this actually happened')
  else if (abstract_realistic < -0.3) additions.push('abstract and impressionistic, feeling over representation')

  return additions.length > 0 ? `${basePrompt}, ${additions.join(', ')}` : basePrompt
}

/**
 * Assembles the full generation prompt from all inputs.
 */
const buildGenerationPrompt = ({ visualBrief, lyricContext, filterId, steering, artistProfile }) => {
  const filterKey = (filterId || '').toUpperCase()
  const filter = FILTERS[filterKey] || FILTERS.CINEMATIC

  const styledFilter = applySteeringToPrompt(filter.prompt, steering)

  const systemContext = `Music cover art photography. A single photographic image that captures the emotional world of a piece of music. Not a concert photo, not a music video still. A world that feels like the music sounds.`

  const artistContext = artistProfile?.city
    ? `The artist is from ${artistProfile.city}. Let that geography breathe into the image if it fits.`
    : ''

  const prompt = [
    systemContext,
    visualBrief,
    lyricContext || '',
    artistContext,
    styledFilter,
  ].filter(Boolean).join('. ')

  const negativePrompt = [filter.negative, GLOBAL_NEGATIVE].join(', ')

  return { prompt, negativePrompt }
}

/**
 * Calls Replicate Flux 1.1 Pro and returns 3 image URLs.
 * Polls until complete — Replicate is async by default.
 */
const generateVariants = async (prompt, negativePrompt) => {
  const outputs = await Promise.all(
    [1, 2, 3].map(() =>
      replicate.run('black-forest-labs/flux-1.1-pro', {
        input: {
          prompt,
          negative_prompt: negativePrompt,
          width: 1024,
          height: 1024,
          output_format: 'webp',
          output_quality: 90,
          safety_tolerance: 2,
        }
      })
    )
  )

  // Replicate returns either a string URL or an array — normalise both
  return outputs.map(o => (Array.isArray(o) ? o[0] : o))
}

/**
 * Uploads a Replicate image URL to Cloudinary via fetch + upload stream.
 * Replicate URLs expire — we store a permanent copy.
 */
const storeImageInCloudinary = async (imageUrl, trackId, variantIndex) => {
  const cloudinary = require('cloudinary').v2

  const result = await cloudinary.uploader.upload(imageUrl, {
    folder: `felt/generations/${trackId}`,
    public_id: `variant_${variantIndex}`,
    overwrite: true,
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  })

  return result.secure_url
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/generations/expand
 * Header: Authorization: Bearer <access_token>
 * Body: { upload_id, basic_input }
 *
 * Runs the Feeling Expander — takes a producer's raw description
 * and returns a rich sensory brief using Claude Haiku + audio features.
 * Artist sees the result and approves/edits before generation starts.
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

//     if (upload.track_type !== 'instrumental') {
//       return res.status(400).json({ error: 'Feeling Expander is only for instrumental tracks' })
//     }

//     const features = upload.audio_features || {}

//     const response = await fetch('https://api.anthropic.com/v1/messages', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'x-api-key': process.env.ANTHROPIC_API_KEY,
//         'anthropic-version': '2023-06-01',
//       },
//       body: JSON.stringify({
//         model: 'claude-haiku-4-5-20251001',
//         max_tokens: 200,
//         messages: [{
//           role: 'user',
//           content: `A music producer described their beat as: "${basic_input.trim()}"

// Audio emotional data:
// - Tempo: ${features.bpm ?? 'unknown'} BPM
// - Mood: ${features.mood ?? 'unknown'}
// - Energy: ${features.energy ?? 'unknown'}/100
// - Key: ${features.key ?? 'unknown'} ${features.scale ?? ''}
// - Valence (emotional positivity): ${features.valence ?? 'unknown'}/100
// - Acousticness: ${features.acousticness ?? 'unknown'}/100

// Expand this into a rich 2-3 sentence sensory description.
// Think: time of day, place, atmosphere, physical sensation, human story.
// Be specific and vivid. No clichés. No genre names.
// Return only the description, nothing else.`
//         }]
//       })
//     })

//     const claudeData = await response.json()

//     if (!response.ok || !claudeData.content?.[0]?.text) {
//       console.error('Claude Haiku error:', claudeData)
//       return res.status(500).json({ error: 'Failed to expand feeling. Please try again.' })
//     }

//     const expanded = claudeData.content[0].text.trim()

//     return res.status(200).json({
//       original: basic_input.trim(),
//       expanded,
//     })

//   } catch (err) {
//     console.error('Feeling Expander error:', err)
//     return res.status(500).json({ error: 'Something went wrong.' })
//   }
// })
// router.post('/expand', requireAuth, async (req, res) => {
//   const { upload_id, basic_input } = req.body
//   const userId = req.user.id

//   console.log('[EXPAND] Request received:', { upload_id, basic_input, userId })

//   if (!upload_id || !basic_input?.trim()) {
//     return res.status(400).json({ error: 'upload_id and basic_input are required' })
//   }

//   try {
//     // 1. Fetch the upload
//     console.log('[EXPAND] Fetching upload from Supabase...')
//     const { data: upload, error: uploadError } = await supabase
//       .from('uploads')
//       .select('id, audio_features, track_type')
//       .eq('id', upload_id)
//       .eq('user_id', userId)
//       .single()

//     if (uploadError) {
//       console.error('[EXPAND] Supabase upload fetch error:', uploadError)
//       return res.status(404).json({ error: 'Upload not found or fetch failed' })
//     }

//     if (!upload) {
//       console.error('[EXPAND] Upload returned null')
//       return res.status(404).json({ error: 'Upload not found' })
//     }

//     console.log('[EXPAND] Upload fetched:', { id: upload.id, track_type: upload.track_type, has_features: !!upload.audio_features })

//     if (upload.track_type !== 'instrumental') {
//       return res.status(400).json({ error: 'Feeling Expander is only for instrumental tracks' })
//     }

//     const features = upload.audio_features || {}
//     console.log('[EXPAND] Audio features:', features)

//     // 2. Call Claude API
//     console.log('[EXPAND] Calling Claude Haiku API...')
//     if (!process.env.ANTHROPIC_API_KEY) {
//       console.error('[EXPAND] ANTHROPIC_API_KEY is missing!')
//       return res.status(500).json({ error: 'API configuration error' })
//     }

//     const prompt = `A music producer described their beat as: "${basic_input.trim()}"

// Audio emotional data:
// - Tempo: ${features.bpm ?? 'unknown'} BPM
// - Mood: ${features.mood ?? 'unknown'}
// - Energy: ${features.energy ?? 'unknown'}/100
// - Key: ${features.key ?? 'unknown'} ${features.scale ?? ''}
// - Valence (emotional positivity): ${features.valence ?? 'unknown'}/100
// - Acousticness: ${features.acousticness ?? 'unknown'}/100

// Expand this into a rich 2-3 sentence sensory description.
// Think: time of day, place, atmosphere, physical sensation, human story.
// Be specific and vivid. No clichés. No genre names.
// Return only the description, nothing else.`

//     console.log('[EXPAND] Sending prompt to Claude:', prompt.substring(0, 100) + '...')

//     const response = await fetch('https://api.anthropic.com/v1/messages', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'x-api-key': process.env.ANTHROPIC_API_KEY,
//         'anthropic-version': '2023-06-01',
//       },
//       body: JSON.stringify({
//         model: 'claude-haiku-4-5-20251001',
//         max_tokens: 200,
//         messages: [{
//           role: 'user',
//           content: prompt
//         }]
//       })
//     })

//     console.log('[EXPAND] Claude API response status:', response.status)
//     const claudeData = await response.json()
//     console.log('[EXPAND] Claude API response:', JSON.stringify(claudeData).substring(0, 200))

//     if (!response.ok) {
//       console.error('[EXPAND] Claude API error (non-ok status):', claudeData)
//       return res.status(502).json({ 
//         error: 'Claude API error',
//         details: claudeData.error?.message || JSON.stringify(claudeData)
//       })
//     }

//     if (!claudeData.content || !Array.isArray(claudeData.content) || !claudeData.content[0]?.text) {
//       console.error('[EXPAND] Claude response missing expected structure:', claudeData)
//       return res.status(502).json({ 
//         error: 'Invalid Claude response format',
//         details: JSON.stringify(claudeData)
//       })
//     }

//     const expanded = claudeData.content[0].text.trim()
//     console.log('[EXPAND] Success! Expanded text:', expanded)

//     return res.status(200).json({
//       original: basic_input.trim(),
//       expanded,
//     })

//   } catch (err) {
//     console.error('[EXPAND] Unhandled error:', {
//       message: err.message,
//       stack: err.stack,
//       code: err.code,
//       name: err.name
//     })
//     return res.status(500).json({ 
//       error: 'Something went wrong.',
//       details: process.env.NODE_ENV === 'development' ? err.message : undefined
//     })
//   }
// })
// router.post('/expand', requireAuth, async (req, res) => {
//   const { upload_id, basic_input } = req.body
//   const userId = req.user.id

//   console.log('[EXPAND] Request received:', { upload_id, basic_input, userId })

//   if (!upload_id || !basic_input?.trim()) {
//     return res.status(400).json({ error: 'upload_id and basic_input are required' })
//   }

//   try {
//     // 1. Fetch the upload
//     console.log('[EXPAND] Fetching upload from Supabase...')
//     const { data: upload, error: uploadError } = await supabase
//       .from('uploads')
//       .select('id, audio_features, track_type')
//       .eq('id', upload_id)
//       .eq('user_id', userId)
//       .single()

//     if (uploadError) {
//       console.error('[EXPAND] Supabase upload fetch error:', uploadError)
//       return res.status(404).json({ error: 'Upload not found or fetch failed' })
//     }

//     if (!upload) {
//       console.error('[EXPAND] Upload returned null')
//       return res.status(404).json({ error: 'Upload not found' })
//     }

//     console.log('[EXPAND] Upload fetched:', { id: upload.id, track_type: upload.track_type, has_features: !!upload.audio_features })

//     if (upload.track_type !== 'instrumental') {
//       return res.status(400).json({ error: 'Feeling Expander is only for instrumental tracks' })
//     }

//     const features = upload.audio_features || {}
//     console.log('[EXPAND] Audio features:', features)

//     // 2. Call Gemini API instead of Claude
//     console.log('[EXPAND] Calling Gemini Flash API...')
//     if (!process.env.GEMINI_API_KEY) {
//       console.error('[EXPAND] GEMINI_API_KEY is missing!')
//       return res.status(500).json({ error: 'API configuration error' })
//     }

//     const prompt = `A music producer described their beat as: "${basic_input.trim()}"

// Audio emotional data:
// - Tempo: ${features.bpm ?? 'unknown'} BPM
// - Mood: ${features.mood ?? 'unknown'}
// - Energy: ${features.energy ?? 'unknown'}/100
// - Key: ${features.key ?? 'unknown'} ${features.scale ?? ''}
// - Valence (emotional positivity): ${features.valence ?? 'unknown'}/100
// - Acousticness: ${features.acousticness ?? 'unknown'}/100

// Expand this into a rich 2-3 sentence sensory description.
// Think: time of day, place, atmosphere, physical sensation, human story.
// Be specific and vivid. No clichés. No genre names.
// Return only the description, nothing else.`
// console.log(prompt);


//     console.log('[EXPAND] Sending prompt to Gemini:', prompt.substring(0, 100) + '...')

//     // Direct REST API call to Gemini 2.5 Flash (or gemini-1.5-flash depending on your target version preference)
//     const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

//     const response = await fetch(url, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         contents: [
//           {
//             parts: [
//               { text: prompt }
//             ]
//           }
//         ],
//         generationConfig: {
//           maxOutputTokens: 200,
//           temperature: 0.7
//         }
//       })
//     })

//     console.log('[EXPAND] Gemini API response status:', response.status)
//     const geminiData = await response.json()
    
//     if (!response.ok) {
//       console.error('[EXPAND] Gemini API error (non-ok status):', geminiData)
//       return res.status(502).json({ 
//         error: 'Gemini API error',
//         details: geminiData.error?.message || JSON.stringify(geminiData)
//       })
//     }

//     // Safely extract the generated text payload from Gemini layout structure
//     const candidate = geminiData.candidates?.[0]
//     const expanded = candidate?.content?.parts?.[0]?.text?.trim()

//     if (!expanded) {
//       console.error('[EXPAND] Gemini response missing expected structure:', geminiData)
//       return res.status(502).json({ 
//         error: 'Invalid Gemini response format',
//         details: JSON.stringify(geminiData)
//       })
//     }

//     console.log('[EXPAND] Success! Expanded text:', expanded)

//     return res.status(200).json({
//       original: basic_input.trim(),
//       expanded,
//     })

//   } catch (err) {
//     console.error('[EXPAND] Unhandled error:', {
//       message: err.message,
//       stack: err.stack
//     })
//     return res.status(500).json({ 
//       error: 'Something went wrong.',
//       details: process.env.NODE_ENV === 'development' ? err.message : undefined
//     })
//   }
// })
router.post('/expand', requireAuth, async (req, res) => {
  const { upload_id, basic_input } = req.body
  const userId = req.user.id

  console.log("==================================================")
  console.log('[EXPAND ENGINE] INCOMING SENSORY EXPANSION REQUEST')
  console.log('[EXPAND ENGINE] Parameters:', { upload_id, basic_input: basic_input?.trim(), userId })
  console.log("==================================================")

  if (!upload_id || !basic_input?.trim()) {
    console.error('[EXPAND ENGINE] Aborted: Missing required request fields.')
    return res.status(400).json({ error: 'upload_id and basic_input are required' })
  }

  try {
    // 1. Fetch the target row record from Supabase
    console.log('[EXPAND ENGINE] Querying storage matrix for upload_id:', upload_id)
    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .select('id, audio_features, track_type')
      .eq('id', upload_id)
      .eq('user_id', userId)
      .single()

    if (uploadError) {
      console.error('[EXPAND ENGINE] Supabase read operation failed:', uploadError)
      return res.status(404).json({ error: 'Upload not found or fetch failed', details: uploadError.message })
    }

    if (!upload) {
      console.error('[EXPAND ENGINE] Aborted: Supabase returned a null record pointer.')
      return res.status(404).json({ error: 'Upload not found' })
    }

    console.log('[EXPAND ENGINE] Row successfully retrieved:', { 
      id: upload.id, 
      track_type: upload.track_type, 
      has_features_object: !!upload.audio_features 
    })

    if (upload.track_type !== 'instrumental') {
      console.error(`[EXPAND ENGINE] Aborted: Track type "${upload.track_type}" does not match validation rule "instrumental".`)
      return res.status(400).json({ error: 'Feeling Expander is only for instrumental tracks' })
    }

    // ==========================================
    // 2. STRICT NATIVE ESSENTIA VALIDATION GUARDRAIL
    // ==========================================
    const features = upload.audio_features
    console.log('[EXPAND ENGINE] Reading raw database audio_features:', JSON.stringify(features))

    if (!features) {
      console.error('[EXPAND ENGINE] CRITICAL BLANK DATA ENCOUNTERED: The audio_features JSONB block is null or empty.')
      return res.status(422).json({ 
        error: 'Unprocessed file layout', 
        details: 'This file contains no extracted structural traits. Run Essentia native analysis pipeline first.' 
      })
    }

    // Explicit array definition of strict required properties matching your frontend extraction payload
    const requiredFeltKeys = ['bpm', 'mood', 'energy', 'key', 'scale', 'valence', 'acousticness']
    const missingFeltKeys = []

    for (const key of requiredFeltKeys) {
      if (features[key] === undefined || features[key] === null || features[key] === '') {
        missingFeltKeys.push(key)
      }
    }

    if (missingFeltKeys.length > 0) {
      console.error('[EXPAND ENGINE] PIPELINE LOCKED: Missing mandatory native Essentia fields:', missingFeltKeys)
      console.error('[EXPAND ENGINE] Aborting thread execution to prevent stale placeholder generation.')
      return res.status(422).json({
        error: 'Incomplete metric profiles',
        details: `The feature block is missing verified native parameters: [${missingFeltKeys.join(', ')}]. Fallbacks are locked.`
      })
    }

    console.log('[EXPAND ENGINE] All core architectural requirements successfully verified. No fallbacks required.')

    // ==========================================
    // 3. PROMPT GENERATION
    // ==========================================
    const prompt = `A music producer described their beat as: "${basic_input.trim()}"

Audio emotional data:
- Tempo: ${features.bpm} BPM
- Mood: ${features.mood}
- Energy: ${features.energy}/100
- Key: ${features.key} ${features.scale}
- Valence (emotional positivity): ${features.valence}/100
- Acousticness: ${features.acousticness}/100

Expand this into a rich 2-3 sentence sensory description.
Think: time of day, place, atmosphere, physical sensation, human story.
Be specific and vivid. No clichés. No genre names.
Return only the description, nothing else.`

    console.log("--------------------------------------------------")
    console.log('[EXPAND ENGINE] GENERATED INFERENCE PROMPT:')
    console.log(prompt)
    console.log("--------------------------------------------------")

    // ==========================================
    // 4. INFERENCE DISPATCH VIA GEMINI FLASH REST
    // ==========================================
    if (!process.env.GEMINI_API_KEY) {
      console.error('[EXPAND ENGINE] CRITICAL API FAULT: GEMINI_API_KEY is missing from system environmental variables!')
      return res.status(500).json({ error: 'Internal API configuration error' })
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
    console.log('[EXPAND ENGINE] Dispatching payload to Gemini REST Endpoint...')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.7
        }
      })
    })

    console.log('[EXPAND ENGINE] HTTP Response Code back from Gemini API:', response.status)
    const geminiData = await response.json()
    
    if (!response.ok) {
      console.error('[EXPAND ENGINE] Gemini API Exception (Non-200 Status):', JSON.stringify(geminiData))
      return res.status(502).json({ 
        error: 'External inference service exception',
        details: geminiData.error?.message || JSON.stringify(geminiData)
      })
    }

    // Extract content fragments precisely out of the candidate array layers
    const candidate = geminiData.candidates?.[0]
    const expanded = candidate?.content?.parts?.[0]?.text?.trim()

    if (!expanded) {
      console.error('[EXPAND ENGINE] Operational Error: Gemini response layout is malformed or missing strings.', JSON.stringify(geminiData))
      return res.status(502).json({ 
        error: 'Invalid response signature received from Gemini engine.',
        details: JSON.stringify(geminiData)
      })
    }

    console.log("==================================================")
    console.log('[EXPAND ENGINE] INFERENCE SUCCESSFUL')
    console.log('[EXPAND ENGINE] Output String:', expanded)
    console.log("==================================================")

    return res.status(200).json({
      original: basic_input.trim(),
      expanded,
    })

  } catch (err) {
    console.error('[EXPAND ENGINE] UNCAUGHT ROUTE FAULT:')
    console.error(`[EXPAND ENGINE] Message: ${err.message}`)
    console.error(`[EXPAND ENGINE] Stack trace:\n${err.stack}`)
    
    return res.status(500).json({ 
      error: 'Internal processing loop failure.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
  }
})

/**
 * POST /api/generations/transcribe
 * Header: Authorization: Bearer <access_token>
 * Body: { upload_id }
 *
 * Sends the uploaded audio to Whisper for transcription.
 * Returns transcript for artist review before generation.
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

    if (upload.track_type !== 'vocal') {
      return res.status(400).json({ error: 'Transcription is only for vocal tracks' })
    }

    // Download the audio from Supabase Storage as a buffer
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('audio-uploads')
      .download(upload.storage_path)

    if (downloadError || !fileData) {
      console.error('Audio download for Whisper failed:', downloadError?.message)
      return res.status(500).json({ error: 'Could not retrieve audio for transcription.' })
    }

    // Convert Blob → Buffer → send to Whisper
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

    return res.status(200).json({
      transcript: transcription,
      upload_id,
    })

  } catch (err) {
    console.error('Transcription error:', err)
    return res.status(500).json({ error: 'Transcription failed. Please try again.' })
  }
})

/**
 * POST /api/generations
 * Header: Authorization: Bearer <access_token>
 * Body: {
 *   upload_id,
 *   filter_id,            — one of the FILTERS keys (GOLDEN, MIDNIGHT, etc.)
 *   lyric_context,        — approved transcript (vocal) or approved expanded brief (instrumental)
 *   steering,             — optional { darker_brighter, raw_polished, abstract_realistic } each -1 to 1
 *   parent_generation_id  — present on re-generations (steering runs)
 * }
 *
 * The main generation endpoint.
 * Builds the full prompt, calls Replicate 3x in parallel, stores results.
 */
router.post('/', requireAuth, async (req, res) => {
  const { upload_id, filter_id, lyric_context, steering, parent_generation_id } = req.body
  const userId = req.user.id

  if (!upload_id || !filter_id) {
    return res.status(400).json({ error: 'upload_id and filter_id are required' })
  }

  const filterKey = filter_id.toUpperCase()
  if (!FILTERS[filterKey]) {
    return res.status(400).json({ error: `Invalid filter_id. Valid options: ${Object.keys(FILTERS).join(', ')}` })
  }

  try {
    // Fetch the upload + user profile together
    const [uploadResult, profileResult] = await Promise.all([
      supabase
        .from('uploads')
        .select('id, title, track_type, audio_features, sentence_prompt, status')
        .eq('id', upload_id)
        .eq('user_id', userId)
        .single(),
      supabase
        .from('users')
        .select('city, sound_words, default_aesthetic_id')
        .eq('id', userId)
        .single(),
    ])

    if (uploadResult.error || !uploadResult.data) {
      return res.status(404).json({ error: 'Upload not found' })
    }

    const upload = uploadResult.data
    const artistProfile = profileResult.data || {}

    if (upload.status === 'uploaded') {
      return res.status(409).json({ error: 'Audio analysis must complete before generating art' })
    }

    // Enforce free tier steering limit on re-generations
    if (parent_generation_id) {
      const { count } = await supabase
        .from('generations')
        .select('id', { count: 'exact', head: true })
        .eq('upload_id', upload_id)
        .eq('user_id', userId)

      // Check if artist has pro subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      const isPro = subscription?.tier === 'pro' || subscription?.tier === 'label'

      if (!isPro && (count || 0) >= FREE_TIER_STEERING_LIMIT) {
        return res.status(403).json({
          error: 'Free tier steering limit reached',
          code: 'UPGRADE_REQUIRED',
          message: `You've used your ${FREE_TIER_STEERING_LIMIT} free steers for this track. Upgrade to Artist Pro for unlimited steering.`,
        })
      }
    }

    // Build the prompt
    const visualBrief = audioFeaturesToVisualBrief(upload.audio_features || {})
    const { prompt, negativePrompt } = buildGenerationPrompt({
      visualBrief,
      lyricContext: lyric_context || upload.sentence_prompt,
      filterId: filterKey,
      steering: steering || {},
      artistProfile,
    })

    // Create a pending generation record before calling Replicate
    // so we have an ID to reference and can track failures
    const generationId = crypto.randomUUID()
    await supabase.from('generations').insert({
      id: generationId,
      upload_id,
      user_id: userId,
      filter_id: filterKey,
      parent_generation_id: parent_generation_id || null,
      steering_params: steering || null,
      prompt_used: prompt,
      status: 'generating',
      created_at: new Date().toISOString(),
    })

    // Mark upload as generating
    await supabase.from('uploads').update({ status: 'generating' }).eq('id', upload_id)

    // Generate 3 variants in parallel
    let replicateUrls
    try {
      replicateUrls = await generateVariants(prompt, negativePrompt)
    } catch (replicateErr) {
      console.error('Replicate generation failed:', replicateErr)
      await supabase.from('generations').update({ status: 'failed' }).eq('id', generationId)
      await supabase.from('uploads').update({ status: 'analyzed' }).eq('id', upload_id)
      return res.status(502).json({ error: 'Image generation failed. Please try again.' })
    }

    // Store all 3 variants in Cloudinary in parallel
    let storedUrls
    try {
      storedUrls = await Promise.all(
        replicateUrls.map((url, i) => storeImageInCloudinary(url, upload_id, i + 1))
      )
    } catch (cloudinaryErr) {
      console.error('Cloudinary storage failed:', cloudinaryErr)
      // Fall back to Replicate URLs if Cloudinary fails — they'll expire but the user still sees art
      storedUrls = replicateUrls
    }

    const variants = storedUrls.map((url, i) => ({
      index: i + 1,
      image_url: url,
    }))

    // Save final generation record
    await supabase.from('generations').update({
      status: 'complete',
      variants,
      completed_at: new Date().toISOString(),
    }).eq('id', generationId)

    await supabase.from('uploads').update({ status: 'complete' }).eq('id', upload_id)

    return res.status(201).json({
      generation_id: generationId,
      variants,
      filter_id: filterKey,
      steering: steering || null,
    })

  } catch (err) {
    console.error('Generation error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

/**
 * POST /api/generations/:id/select
 * Header: Authorization: Bearer <access_token>
 * Body: { variant_index }  — 1, 2, or 3
 *
 * Artist picks their favourite variant.
 * Saves the selection and marks that variant as the canonical cover for this generation.
 */
router.post('/:id/select', requireAuth, async (req, res) => {
  const { id } = req.params
  const { variant_index } = req.body
  const userId = req.user.id

  if (!variant_index || ![1, 2, 3].includes(Number(variant_index))) {
    return res.status(400).json({ error: 'variant_index must be 1, 2, or 3' })
  }

  try {
    const { data: generation, error } = await supabase
      .from('generations')
      .select('id, variants, upload_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !generation) {
      return res.status(404).json({ error: 'Generation not found' })
    }

    const selectedVariant = generation.variants?.find(v => v.index === Number(variant_index))

    if (!selectedVariant) {
      return res.status(400).json({ error: 'Variant not found in this generation' })
    }

    await supabase.from('generations').update({
      variant_selected: variant_index,
      selected_image_url: selectedVariant.image_url,
    }).eq('id', id)

    return res.status(200).json({
      generation_id: id,
      selected_variant: variant_index,
      image_url: selectedVariant.image_url,
    })

  } catch (err) {
    console.error('Variant select error:', err)
    return res.status(500).json({ error: 'Something went wrong.' })
  }
})

/**
 * GET /api/generations/:upload_id
 * Header: Authorization: Bearer <access_token>
 *
 * Returns all generations for a given upload, newest first.
 * Used to restore steering history when an artist comes back to a track.
 */
router.get('/:upload_id', requireAuth, async (req, res) => {
  const { upload_id } = req.params
  const userId = req.user.id

  try {
    const { data, error } = await supabase
      .from('generations')
      .select(`
        id,
        filter_id,
        variants,
        variant_selected,
        selected_image_url,
        steering_params,
        status,
        created_at
      `)
      .eq('upload_id', upload_id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Generations fetch error:', error.message)
      return res.status(500).json({ error: 'Failed to load generations.' })
    }

    return res.status(200).json({ generations: data })

  } catch (err) {
    console.error('GET /generations/:upload_id error:', err)
    return res.status(500).json({ error: 'Something went wrong.' })
  }
})

module.exports = router
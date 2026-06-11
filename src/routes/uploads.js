const express = require('express')
const router = express.Router()
const multer = require('multer')
const supabase = require('../utils/supabase')
const { requireAuth } = require('../middleware/authmiddleware')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB — matches spec
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/wave']
    const extAllowed = file.originalname.endsWith('.mp3') || file.originalname.endsWith('.wav')

    if (allowed.includes(file.mimetype) || extAllowed) {
      cb(null, true)
    } else {
      cb(new Error('Only MP3 and WAV files are allowed'))
    }
  }
})

/**
 * POST /api/uploads
 * Header: Authorization: Bearer <access_token>
 * Body: multipart/form-data
 *   - audio: File (MP3 or WAV, max 20MB)
 *   - title: string (required)
 *   - sentence_prompt: string (required) — "what is this track about in one sentence"
 *
 * What this does:
 *   1. Validates the file and metadata
 *   2. Stores the audio in Supabase Storage under uploads/{userId}/{trackId}.{ext}
 *   3. Creates a track record in the uploads table
 *   4. Returns the track record + a pipeline_hint so the frontend
 *      knows whether to go to Whisper (vocal) or Feeling Expander (instrumental)
 *
 * pipeline_hint is derived from the track type the client sends.
 * Essentia.js runs in the browser — the actual speechiness score
 * comes back in POST /api/uploads/:id/analysis once analysis is done.
 */
router.post('/', requireAuth, upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' })
  }

  const { title, sentence_prompt, track_type } = req.body

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Track title is required' })
  }

  if (!sentence_prompt || !sentence_prompt.trim()) {
    return res.status(400).json({ error: 'A one-sentence description is required' })
  }

  if (!track_type || !['vocal', 'instrumental'].includes(track_type)) {
    return res.status(400).json({ error: 'track_type must be "vocal" or "instrumental"' })
  }

  const userId = req.user.id
  const trackId = crypto.randomUUID()
  const ext = req.file.originalname.endsWith('.wav') ? 'wav' : 'mp3'
  const storagePath = `${userId}/${trackId}.${ext}`

  try {
    // 1. Store the audio file
    const { data: storageData, error: storageError } = await supabase.storage
      .from('audio-uploads')
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      })

    if (storageError) {
      console.error('Audio storage upload failed:', storageError.message)
      return res.status(500).json({ error: 'Audio upload failed. Please try again.' })
    }

    // Get public URL — stored for later use in Whisper transcription etc.
    const { data: { publicUrl } } = supabase.storage
      .from('audio-uploads')
      .getPublicUrl(storageData.path)

    // 2. Create the track record
    const { data: track, error: dbError } = await supabase
      .from('uploads')
      .insert({
        id: trackId,
        user_id: userId,
        title: title.trim(),
        sentence_prompt: sentence_prompt.trim(),
        track_type,                  // 'vocal' | 'instrumental'
        storage_path: storageData.path,
        audio_url: publicUrl,
        status: 'uploaded',          // uploaded → analyzed → generating → complete
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      // Audio is in storage but DB insert failed — clean up to avoid orphans
      await supabase.storage.from('audio-uploads').remove([storagePath])
      console.error('Track record insert failed:', dbError.message)
      return res.status(500).json({ error: 'Failed to save track. Please try again.' })
    }

    // 3. Tell the frontend which pipeline to run next
    //    Essentia.js runs in the browser, so the client already knows track_type.
    //    This hint makes the API response self-contained for the wizard state machine.
    const pipeline_hint = track_type === 'vocal' ? 'TRANSCRIBE' : 'FEELING_EXPANDER'

    return res.status(201).json({
      track,
      pipeline_hint,
    })

  } catch (err) {
    console.error('Upload error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

/**
 * POST /api/uploads/:id/analysis
 * Header: Authorization: Bearer <access_token>
 * Body: {
 *   bpm, key, scale, energy, valence, danceability,
 *   acousticness, spectral_brightness, loudness,
 *   mood,         — 'happy' | 'sad' | 'aggressive' | 'relaxed'
 *   speechiness,  — 0–100, from Essentia.js in the browser
 * }
 *
 * Called after Essentia.js finishes in the browser.
 * Saves the audio features to the uploads row.
 * Returns the resolved pipeline_hint — now based on actual speechiness score,
 * not just track_type. High speechiness on a "vocal" track confirms Whisper.
 * Low speechiness overrides to Feeling Expander just in case.
 */
router.post('/:id/analysis', requireAuth, async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  const {
    bpm, key, scale, energy, valence, danceability,
    acousticness, spectral_brightness, loudness, mood, speechiness
  } = req.body

  // Basic presence check — all fields expected from Essentia.js
  const required = { bpm, key, scale, energy, valence, danceability, acousticness, spectral_brightness, loudness, mood }
  const missing = Object.entries(required).filter(([, v]) => v === undefined || v === null).map(([k]) => k)

  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing audio features: ${missing.join(', ')}` })
  }

  try {
    // Verify this upload belongs to this user
    const { data: existing, error: fetchError } = await supabase
      .from('uploads')
      .select('id, track_type, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Upload not found' })
    }

    if (existing.status !== 'uploaded') {
      return res.status(409).json({ error: 'Analysis already submitted for this track' })
    }

    // Save features and advance status
    const { data: updated, error: updateError } = await supabase
      .from('uploads')
      .update({
        audio_features: {
          bpm, key, scale, energy, valence, danceability,
          acousticness, spectral_brightness, loudness, mood,
          speechiness: speechiness ?? null,
        },
        status: 'analyzed',
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Analysis save failed:', updateError.message)
      return res.status(500).json({ error: 'Failed to save analysis.' })
    }

    // Resolve pipeline based on actual speechiness score
    // Threshold: >40 = has vocals, run Whisper. <=40 = treat as instrumental.
    const resolvedHint = (speechiness ?? 0) > 40 ? 'TRANSCRIBE' : 'FEELING_EXPANDER'

    return res.status(200).json({
      track: updated,
      pipeline_hint: resolvedHint,
    })

  } catch (err) {
    console.error('Analysis save error:', err)
    return res.status(500).json({ error: 'Something went wrong.' })
  }
})

/**
 * GET /api/uploads
 * Header: Authorization: Bearer <access_token>
 * Query params: ?limit=20&offset=0
 * Returns all uploads for the authenticated user, newest first.
 * Used to populate the dashboard history grid and gallery.
 */
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id
  const limit = Math.min(parseInt(req.query.limit) || 20, 50) // cap at 50
  const offset = parseInt(req.query.offset) || 0

  try {
   // Change this block inside router.get('/', ...)
      const { data, error, count } = await supabase
  .from('uploads')
  .select(`
    id,
    title,
    track_type,
    status,
    audio_url,
    audio_features,
    sentence_prompt,
    created_at,
    generations!upload_id (
      id,
      filter_id,
      variant_selected,
      image_url,
      status,
      created_at
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) {
      console.error('Uploads fetch failed:', error.message)
      return res.status(500).json({ error: 'Failed to load uploads.' })
    }

    return res.status(200).json({
      uploads: data,
      total: count,
      limit,
      offset,
    })

  } catch (err) {
    console.error('GET /uploads error:', err)
    return res.status(500).json({ error: 'Something went wrong.' })
  }
})

/**
 * GET /api/uploads/:id
 * Header: Authorization: Bearer <access_token>
 * Returns a single upload with its full generation history.
 */
router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const { data, error } = await supabase
  .from('uploads')
  .select(`
    id,
    title,
    track_type,
    status,
    audio_url,
    audio_features,
    sentence_prompt,
    created_at,
    generations!upload_id (
      id,
      filter_id,
      variant_selected,
      image_url,
      steering_params,
      status
    )
  `)
  .eq('id', id)
  .eq('user_id', userId)
  .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Upload not found' })
      }
      console.error('Upload fetch failed:', error.message)
      return res.status(500).json({ error: 'Failed to load upload.' })
    }

    return res.status(200).json({ upload: data })

  } catch (err) {
    console.error('GET /uploads/:id error:', err)
    return res.status(500).json({ error: 'Something went wrong.' })
  }
})

module.exports = router
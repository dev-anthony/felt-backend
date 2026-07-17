const express = require('express')
const router = express.Router()
const multer = require('multer')
const supabase = require('../utils/supabase')
const { requireAuth } = require('../middleware/authmiddleware')
const crypto = require('crypto')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
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
    // 1. Store the audio file in the cloud bucket
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

    // Get public accessible asset URL
    const { data: { publicUrl } } = supabase.storage
      .from('audio-uploads')
      .getPublicUrl(storageData.path)

    // 2. Create the raw uncompleted database record footprint
    const { data: track, error: dbError } = await supabase
      .from('uploads')
      .insert({
        id: trackId,
        user_id: userId,
        title: title.trim(),
        sentence_prompt: sentence_prompt.trim(),
        track_type,
        storage_path: storageData.path,
        audio_url: publicUrl,
        status: 'uploaded',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      // Rollback file upload if database instantiation fails
      await supabase.storage.from('audio-uploads').remove([storagePath])
      console.error('Track record insert failed:', dbError.message)
      return res.status(500).json({ error: 'Failed to save track. Please try again.' })
    }

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


router.post('/:id/analysis', requireAuth, async (req, res) => {
  const { id } = req.params
  const userId = req.user.id
  const payload = req.body.features ?? req.body

  const {
    bpm, key, scale, energy, valence, danceability,
    acousticness, spectral_brightness, loudness, mood, speechiness, genre
  } = payload

  const required = { bpm, key, scale, energy, valence, danceability, acousticness, spectral_brightness, loudness, mood }
  const missing = Object.entries(required).filter(([, v]) => v === undefined || v === null).map(([k]) => k)

  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing audio features: ${missing.join(', ')}` })
  }

  try {
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

    const { data: updated, error: updateError } = await supabase
      .from('uploads')
      .update({
        audio_features: {
          bpm, key, scale, energy, valence, danceability,
          acousticness, spectral_brightness, loudness, mood,
          speechiness: speechiness ?? null,
          genre: genre ?? 'hip-hop'
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

    let resolvedHint
    if (speechiness !== undefined && speechiness !== null) {
      resolvedHint = speechiness > 40 ? 'TRANSCRIBE' : 'FEELING_EXPANDER'
    } else {
      resolvedHint = existing.track_type === 'vocal' ? 'TRANSCRIBE' : 'FEELING_EXPANDER'
    }

    return res.status(200).json({
      track: updated,
      pipeline_hint: resolvedHint,
    })

  } catch (err) {
    console.error('Analysis save error:', err)
    return res.status(500).json({ error: 'Something went wrong.' })
  }
})

router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id
  const limit = Math.min(parseInt(req.query.limit) || 20, 50)
  const offset = parseInt(req.query.offset) || 0

  try {
    const { data, error, count } = await supabase
      .from('uploads')
      .select(`
        id, title, track_type, status, audio_url, audio_features, sentence_prompt, created_at,
        generations:generations!upload_id (
          id, image_url, status, created_at, prompt_used, technique
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'complete') 
      .order('created_at', { ascending: false })
      .order('created_at', { foreignTable: 'generations', ascending: false }) 
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


router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const { data, error } = await supabase
      .from('uploads')
      .select(`
        id, title, track_type, status, audio_url, audio_features, sentence_prompt, created_at,
        generations:generations!upload_id (
          id, image_url, prompt_used, status, created_at
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'complete') 
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Upload not found or is currently being processed.' })
      }
      console.error('Upload fetch failed:', error.message)
      return res.status(500).json({ error: 'Failed to load upload.' })
    }

    if (data.generations && data.generations.length > 0) {
      data.generations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }

    return res.status(200).json({ upload: data })

  } catch (err) {
    console.error('GET /uploads/:id error:', err)
    return res.status(500).json({ error: 'Something went wrong.' })
  }
})


router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    // Fetch storage_path first so we can clean up the actual file via the
    // Storage API afterward. NEVER rely on a DB-level trigger to cascade-delete
    // storage.objects directly via raw SQL — Supabase blocks that outright
    // ("Direct deletion from storage tables is not allowed. Use the Storage
    // API instead."), and since triggers run in the same transaction as the
    // DELETE, that rejection rolls back the whole row deletion too. That is
    // exactly the fault in the [DB PURGE FAULT] log below.
    const { data: existing, error: fetchError } = await supabase
      .from('uploads')
      .select('id, storage_path')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Asset not found or unauthorized deletion request.' })
    }

    const { data, error } = await supabase
      .from('uploads')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('[DB PURGE FAULT]:', error.message)
      return res.status(500).json({ error: 'Failed to clear database references.' })
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Asset not found or unauthorized deletion request.' })
    }

    // Explicitly remove the audio file through the Storage API now that the
    // DB row is confirmed gone. If this fails, the user-facing delete has
    // already succeeded — log loudly so an orphaned file can be cleaned up
    // manually or by a scheduled sweep, but don't fail the request over it.
    if (existing.storage_path) {
      const { error: storageError } = await supabase.storage
        .from('audio-uploads')
        .remove([existing.storage_path])

      if (storageError) {
        console.error('[STORAGE CLEANUP FAULT]:', storageError.message, '— orphaned file at:', existing.storage_path)
      }
    }

    return res.status(200).json({ message: 'Upload asset and associated storage file successfully destroyed.' })

  } catch (err) {
    console.error('DELETE route crash:', err?.message || err)
    return res.status(500).json({ error: 'Internal processing route fault during deletion sequence.' })
  }
})

module.exports = router;
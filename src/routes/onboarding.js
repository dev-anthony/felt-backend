const express = require('express')
const router = express.Router()
const multer = require('multer')
const supabase = require('../utils/supabase')
const { requireAuth } = require('../middleware/authmiddleware');

// Store file in memory as a buffer — we pass it straight to Supabase, no disk involved
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'))
    }
  }
})

/**
 * POST /api/onboarding/upload-avatar
 * Header: Authorization: Bearer <access_token>
 * Body: multipart/form-data with field name "avatar"
 * Uploads the photo to Supabase Storage and returns the public URL.
 * Called from StepArtistPhoto before the final onboarding submit.
 */
router.post('/upload-avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' })
  }

  const userId = req.user.id
  const fileExt = req.file.mimetype.split('/')[1]       // jpeg, png, webp
  const filePath = `${userId}/avatar.${fileExt}`

  try {
    // Upload buffer directly to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,   // overwrite if they upload a new photo
      })

    if (uploadError) {
      console.error('Supabase storage upload failed:', uploadError.message)
      return res.status(500).json({ error: 'Image upload failed. Please try again.' })
    }

    // Get the permanent public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path)

    return res.status(200).json({ avatarUrl: publicUrl })

  } catch (err) {
    console.error('Avatar upload error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

/**
 * POST /api/onboarding/complete
 * Header: Authorization: Bearer <access_token>
 * Body: { soundWords, city, defaultAestheticId, avatarUrl }
 * avatarUrl comes from the /upload-avatar response above.
 */
router.post('/complete', requireAuth, async (req, res) => {
  const { soundWords, city, defaultAestheticId, avatarUrl } = req.body
  const userId = req.user.id

  if (!soundWords || soundWords.length !== 3) {
    return res.status(400).json({ error: 'Exactly three sound words are required' })
  }

  if (!city) {
    return res.status(400).json({ error: 'City is required' })
  }

  if (!defaultAestheticId) {
    return res.status(400).json({ error: 'A visual aesthetic selection is required' })
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        sound_words: soundWords,
        city,
        default_aesthetic_id: defaultAestheticId,
        avatar_url: avatarUrl || null,
        onboarding_complete: true,
      })
      .eq('id', userId)
      .select('id, email, name, avatar_url, sound_words, city, default_aesthetic_id')
      .single()

    if (error) {
      console.error('Onboarding update failed:', error.message)
      return res.status(500).json({ error: 'Failed to save profile. Please try again.' })
    }

    return res.status(200).json({ user: data })

  } catch (err) {
    console.error('Onboarding error:', err)
    return res.status(500).json({ error: 'Something went wrong.' })
  }
})

module.exports = router
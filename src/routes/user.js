const express = require('express')
const router = express.Router()
const supabase = require('../utils/supabase')
const { requireAuth } = require('../middleware/authmiddleware')
const { isValidGenre, isValidSubjectMode } = require('../config/artistProfile')

/**
 * GET /api/user/me
 * Header: Authorization: Bearer <access_token>
 * Returns the full artist profile for the authenticated user.
 * Used on dashboard load, after login, and after onboarding.
 */
router.get('/me', requireAuth, async (req, res) => {
  const userId = req.user.id

  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        avatar_url,
        sound_words,
        city,
        default_genre,
        default_subject_mode,
        onboarding_complete,
        created_at
      `)
      .eq('id', userId)
      .single()

    if (error) {
      // Row doesn't exist yet — edge case where auth succeeded but profile insert failed
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Profile not found. Please complete signup.' })
      }
      console.error('Profile fetch failed:', error.message)
      return res.status(500).json({ error: 'Failed to load profile.' })
    }

    return res.status(200).json({ user: data })

  } catch (err) {
    console.error('GET /me error:', err)
    return res.status(500).json({ error: 'Something went wrong.' })
  }
})

/**
 * PATCH /api/user/me
 * Header: Authorization: Bearer <access_token>
 * Body: any subset of { name, sound_words, city, avatar_url }
 * Partial update — only fields you send get changed.
 * Used for profile edits post-onboarding.
 */
router.patch('/me', requireAuth, async (req, res) => {
  const userId = req.user.id

  const ALLOWED_FIELDS = ['name', 'sound_words', 'city', 'default_genre', 'default_subject_mode', 'avatar_url']

  // Strip anything that isn't an allowed field — no one gets to patch id or email
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => ALLOWED_FIELDS.includes(key))
  )

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided to update.' })
  }

  // Validate sound_words if it was included
  if (updates.sound_words !== undefined) {
    if (!Array.isArray(updates.sound_words) || updates.sound_words.length !== 3) {
      return res.status(400).json({ error: 'sound_words must be an array of exactly 3 strings.' })
    }
  }

  // Both drive the generation pipeline, so only known ids may be stored.
  if (updates.default_genre !== undefined && !isValidGenre(updates.default_genre)) {
    return res.status(400).json({ error: 'default_genre is not a recognised genre id.' })
  }

  if (updates.default_subject_mode !== undefined && !isValidSubjectMode(updates.default_subject_mode)) {
    return res.status(400).json({ error: 'default_subject_mode is not a recognised subject mode id.' })
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select(`
        id,
        email,
        name,
        avatar_url,
        sound_words,
        city,
        default_genre,
        default_subject_mode,
        onboarding_complete,
        created_at
      `)
      .single()

    if (error) {
      console.error('Profile update failed:', error.message)
      return res.status(500).json({ error: 'Failed to update profile.' })
    }

    return res.status(200).json({ user: data })

  } catch (err) {
    console.error('PATCH /me error:', err)
    return res.status(500).json({ error: 'Something went wrong.' })
  }
})

module.exports = router
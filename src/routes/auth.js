
const express = require('express')
const router = express.Router()
const supabase = require('../utils/supabase')
const COOKIE_OPTIONS = require('../config/cookies').COOKIE_CONFIG

/**
 * POST /api/auth/signup
 */
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: null,
      }
    })

    if (error) {
      if (error.message.toLowerCase().includes('already')) {
        return res.status(409).json({ error: 'An account with this email already exists' })
      }
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({
      message: 'Verification code sent to your email',
      email,
    })
  } catch (err) {
    console.error('Signup error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

/**
 * POST /api/auth/verify-otp
 */
router.post('/verify-otp', async (req, res) => {
  const { email, otp, name } = req.body

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and verification code are required' })
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    })

    if (error) {
      return res.status(400).json({ error: 'Invalid or expired verification code' })
    }

    const userId = data.user.id
    const resolvedName = name || data.user.user_metadata?.name || null

    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        name: resolvedName,
        onboarding_complete: false,
        created_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error('Profile insert after OTP failed:', profileError.message)
    }

    // Set HTTP-Only cookies with access and refresh tokens
    res.cookie('access_token', data.session.access_token, COOKIE_OPTIONS)
    res.cookie('refresh_token', data.session.refresh_token, COOKIE_OPTIONS)

    return res.status(200).json({
      message: 'Email verified successfully',
      user: {
        id: userId,
        email,
        name: resolvedName,
      }
    })
  } catch (err) {
    console.error('OTP verification error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

/**
 * POST /api/auth/resend-otp
 */
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ message: 'Verification code resent' })
  } catch (err) {
    console.error('Resend OTP error:', err)
    return res.status(500).json({ error: 'Something went wrong.' })
  }
})

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, avatar_url, sound_words, city, default_aesthetic_id, onboarding_complete')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch failed:', profileError.message)
    }

    // Set HTTP-Only cookies with access and refresh tokens
    res.cookie('access_token', data.session.access_token, COOKIE_OPTIONS)
    res.cookie('refresh_token', data.session.refresh_token, COOKIE_OPTIONS)

    return res.status(200).json({
      user: profile || { id: data.user.id, email },
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

/**
 * POST /api/auth/logout
 * Pulls token either from cookies or fallback header
 */
router.post('/logout', async (req, res) => {
  // Use cookie-parser fallback or headers extraction
  const token = req.cookies?.access_token || req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(400).json({ error: 'No active session found' })
  }

  try {
    const { error } = await supabase.auth.admin.signOut(token)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // Explicitly wipe cookies on completion
    res.clearCookie('access_token', { path: '/' })
    res.clearCookie('refresh_token', { path: '/' })

    return res.status(200).json({ message: 'Logged out' })
  } catch (err) {
    console.error('Logout error:', err)
    return res.status(500).json({ error: 'Something went wrong.' })
  }
})

module.exports = router
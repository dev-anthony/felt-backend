
const express = require('express')
const router = express.Router()
const supabase = require('../utils/supabase')
const COOKIE_OPTIONS = require('../config/cookies').COOKIE_CONFIG

// Supabase's own `users.email` column is case-sensitive at the Postgres level
// (verified live: an uppercase lookup of a real lowercase email returned zero
// rows), even though Supabase Auth itself normalises case internally. Without
// this, "Jo@x.com" and "jo@x.com" could resolve to two different profile rows.
// Normalise once, at every entry point that touches an email.
const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

// Never forward a raw Supabase error string to the client (their own stated
// rule: "never expose raw Supabase errors"). Map the handful of cases that
// actually occur in practice; anything unmapped gets a safe generic message
// while the real text still goes to the server log for debugging.
function safeAuthErrorMessage(error) {
  const raw = error?.message || ''
  if (/after \d+ seconds|rate.?limit/i.test(raw)) {
    return 'Please wait a moment before trying again.'
  }
  if (/password/i.test(raw) && /weak|short|least/i.test(raw)) {
    return 'Please choose a stronger password.'
  }
  if (/invalid.*email|email.*invalid/i.test(raw)) {
    return 'Please enter a valid email address.'
  }
  console.warn('[AUTH] unmapped Supabase error, showing generic message:', raw)
  return 'Something went wrong. Please try again.'
}

/**
 * POST /api/auth/signup
 */
router.post('/signup', async (req, res) => {
  const email = normalizeEmail(req.body.email)
  const { password, name } = req.body

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
      return res.status(400).json({ error: safeAuthErrorMessage(error) })
    }

    // The actual, DOCUMENTED signal for "this email already has a confirmed
    // account" -- verified live against this project. Supabase deliberately
    // returns error: null here (anti-account-enumeration by design), with
    // `identities: []` as the only tell. The previous code only checked
    // `error.message` for the word "already", which this case NEVER sets --
    // so a returning user retrying signup was told "Verification code sent!"
    // when Supabase sent nothing at all, leaving them stuck on the OTP screen
    // waiting for an email that would never arrive.
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' })
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
  const email = normalizeEmail(req.body.email)
  const { otp, name } = req.body

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

    // upsert with ignoreDuplicates (ON CONFLICT DO NOTHING), not a plain insert
    // and NOT an update-on-conflict upsert. A plain insert throws a unique-
    // constraint violation if this route is ever called twice for the same
    // user (double form submit, a client retry after a slow response the
    // first time actually succeeded) -- the previous code only logged that
    // violation, leaving the caller unsure whether their profile row exists.
    // DO NOTHING is deliberate, not DO UPDATE: this route creates a profile
    // exactly once. An update-style upsert would silently reset
    // `onboarding_complete` back to false and `created_at` to "now" for a
    // user who had already progressed past this point, on every retry.
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email,
        name: resolvedName,
        onboarding_complete: false,
        created_at: new Date().toISOString(),
      }, { onConflict: 'id', ignoreDuplicates: true })

    if (profileError) {
      console.error('Profile upsert after OTP failed:', profileError.message)
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
  const email = normalizeEmail(req.body.email)

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })

    if (error) {
      return res.status(400).json({ error: safeAuthErrorMessage(error) })
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
  const email = normalizeEmail(req.body.email)
  const { password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    let { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, avatar_url, sound_words, city, onboarding_complete')
      .eq('id', data.user.id)
      .single()

    // Self-healing: Supabase Auth confirms this user genuinely exists (the
    // signInWithPassword above just succeeded), so a missing profile row here
    // means an earlier signup's profile upsert never landed -- not that the
    // user doesn't exist. Backfilling here means the login route can recover
    // regardless of which earlier step dropped the row, rather than leaving
    // the artist permanently stuck with a degraded {id, email}-only object
    // that is missing onboarding_complete and everything else the rest of
    // the app reads from a profile.
    if (profileError || !profile) {
      console.warn('[AUTH] profile missing at login for a real authenticated user, backfilling:', profileError?.message)
      const backfill = await supabase
        .from('users')
        .upsert({
          id: data.user.id,
          email,
          name: data.user.user_metadata?.name || null,
          onboarding_complete: false,
          created_at: new Date().toISOString(),
        }, { onConflict: 'id', ignoreDuplicates: true })
        .select('id, email, name, avatar_url, sound_words, city, onboarding_complete')
        .single()
      profile = backfill.data
      if (backfill.error) console.error('[AUTH] profile backfill also failed:', backfill.error.message)
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
/**
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies?.refresh_token

  try {
    if (refreshToken) {
      // Best-effort global signout via Supabase.
      // If it fails because the token is dead or expired, catch it and move on.
      await supabase.auth.signOut({ scope: 'global' }).catch((e) => {
        console.error('Supabase signOut (best-effort) failed:', e.message)
      })
    }
  } catch (err) {
    console.error('Logout processing error:', err)
  } finally {
    // Explicitly wipe the client's HTTP-only session cookies
    res.clearCookie('access_token', { path: '/' })
    res.clearCookie('refresh_token', { path: '/' })
  }

  return res.status(200).json({ message: 'Logged out successfully' })
})

/**
 * POST /api/auth/refresh
 * Uses the HTTP-Only refresh token to mint a fresh access token bundle.
 */
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refresh_token

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token available' })
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error || !data.session) {
      res.clearCookie('access_token', { path: '/' })
      res.clearCookie('refresh_token', { path: '/' })
      return res.status(401).json({ error: 'Session has expired' })
    }

    // Set updated cookie values
    res.cookie('access_token', data.session.access_token, COOKIE_OPTIONS)
    res.cookie('refresh_token', data.session.refresh_token, COOKIE_OPTIONS)

    return res.status(200).json({
      message: 'Token refreshed',
      expires_in: data.session.expires_in, // E.g., 3600 (seconds)
      expires_at: data.session.expires_at, // Unix epoch timestamp (seconds)
    })
  } catch (err) {
    console.error('Token refreshing uncaught error:', err)
    return res.status(500).json({ error: 'Internal server error during refresh operation' })
  }
})
module.exports = router
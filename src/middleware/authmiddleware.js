const supabase = require('../utils/supabase')

/**
 * requireAuth middleware
 * Attaches req.user (Supabase user object) if the token is valid.
 * Use on any route that needs a logged-in artist.
 *
 * Usage:
 *   router.get('/uploads', requireAuth, (req, res) => { ... })
 */
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.user = data.user   // { id, email, ... } available downstream
    next()
  } catch (err) {
    console.error('Auth middleware error:', err)
    return res.status(500).json({ error: 'Auth check failed' })
  }
}

module.exports = { requireAuth }
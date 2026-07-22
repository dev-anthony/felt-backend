const supabase = require('../utils/supabase')

/**
 * requireAuth middleware
 * Attaches req.user (Supabase user object) if the token is valid.
 * Checks HTTP-Only cookies first, then falls back to Authorization Header.
 * Use on any route that needs a logged-in artist.
 *
 * Usage:
 * router.get('/uploads', requireAuth, (req, res) => { ... })
 */
const requireAuth = async (req, res, next) => {
  // 1. Extract token from either incoming HTTP-Only cookies or standard Bearer header
  let token = req.cookies?.access_token

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]
  }

  // 2. If neither source yielded a token, reject the request instantly
  if (!token) {
    return res.status(401).json({ error: 'No token provided. Authentication required.' })
  }

  try {
    // 3. Verify the token with Supabase Auth engine
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired authentication session' })
    }

    // 4. Attach user payload data downstream for controllers to process
    req.user = data.user   // { id, email, ... } available downstream
    next()
  } catch (err) {
    console.error('Auth middleware validation crash:', err)
    return res.status(500).json({ error: 'Authentication routine internal failure' })
  }
}

module.exports = { requireAuth }
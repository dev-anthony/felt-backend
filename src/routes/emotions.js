const express = require('express')
const router = express.Router()
const { groupedByArchetype, EMOTIONS } = require('../engine/emotion')

/**
 * GET /api/emotions
 *
 * The artist-facing emotion vocabulary, grouped into its 12 archetype families.
 *
 * Public and unauthenticated on purpose: it is static reference data with no
 * user content in it, and the upload form needs it before a session matters.
 * The payload is small and never changes at runtime, so it is safe to cache
 * hard — the client should fetch it once, not per upload.
 */
router.get('/', (req, res) => {
  res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
  return res.status(200).json({
    count: EMOTIONS.length,
    families: groupedByArchetype(),
  })
})

module.exports = router

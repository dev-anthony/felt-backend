// utils/lyricsFetcher.js
const { getLyrics, getSong } = require('genius-lyrics-api')

function parseFullTitle(fullTitle) {
  // Genius returns "Song Name by Artist Name" as a single string
  const match = fullTitle.match(/^(.*?)\s+by\s+(.*)$/i)
  if (match) {
    return { title: match[1].trim(), artist: match[2].trim() }
  }
  return { title: fullTitle.trim(), artist: null }
}

async function fetchLyricsOnline(title, artist) {
  if (!title?.trim()) return null

  const options = {
    apiKey: process.env.GENIUS_API_TOKEN,
    title: title.trim(),
    artist: artist?.trim() || '',
    optimizeQuery: true,
  }

  try {
    const song = await getSong(options)
    if (!song || !song.title) return null

    const { title: cleanTitle, artist: parsedArtist } = parseFullTitle(song.title)

    if (!isCloseTitleMatch(title, cleanTitle)) {
      console.warn(`[GENIUS LOOKUP] Rejecting low-confidence match: searched "${title}", got "${cleanTitle}"`)
      return null
    }

    const lyrics = await getLyrics(options)
    if (!lyrics || lyrics.trim().length < 20) return null

    return {
      lyrics: lyrics.trim(),
      matchedTitle: cleanTitle,
      matchedArtist: parsedArtist || artist || 'Unknown Artist',
      url: song.url,
    }
  } catch (err) {
    console.warn('[GENIUS LOOKUP] No match or request failed:', err.message || err)
    return null
  }
}

function isCloseTitleMatch(searchTitle, resultTitle) {
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const a = normalize(searchTitle)
  const b = normalize(resultTitle)
  if (!a || !b) return false
  return a === b || a.includes(b) || b.includes(a)
}

module.exports = { fetchLyricsOnline }
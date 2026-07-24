'use strict'
/**
 * Image generation provider abstraction.
 *
 * One entrypoint — generateImage(prompt, { width, height, seed }) — that returns
 * a base64 `data:` URL, so the caller's Cloudinary upload stays unchanged.
 * Which backend runs is chosen by IMAGE_PROVIDER (default: 'pollinations').
*   pollinations  FREE, no key, no signup. Currently Sana-based (FLUX gone). Great for testing.
 *   together      FREE tier (FLUX.1-schnell-Free). Needs TOGETHER_API_KEY.
 *   huggingface   Paid Inference Providers credits. Needs HF_TOKEN.
 *   replicate     Pay-as-you-go. Needs REPLICATE_API_TOKEN.
 *   cloudflare    FREE daily Neuron pool (Leonardo Phoenix/Lucid Origin). Needs CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN.
 */



// Measured on this account (July 2026), not assumed:
//   gemini-2.5-flash-image      -> free-tier quota `limit: 0`
//   gemini-3.1-flash-image      -> free-tier quota `limit: 0`
//   replicate flux-schnell      -> 402 Insufficient credit
//   huggingface                 -> Inference-Provider credits depleted
//   together FLUX.1-schnell-Free-> genuine free tier, needs TOGETHER_API_KEY
//   pollinations                -> works, no key
//
// Defaulting to `gemini` meant EVERY generation made a doomed API call, waited
// for the 429, and only then fell back — a wasted round-trip on every cover.
// Default to a provider that actually answers. Set IMAGE_PROVIDER=gemini (or
// =replicate) the moment billing is enabled; nothing else needs to change.
const DEFAULT_PROVIDER = (process.env.IMAGE_PROVIDER || 'pollinations').toLowerCase()

// Some providers pass the prompt in the URL (Pollinations) and can 414 on very
// long prompts. The Visual DNA + Reality prompt is intentionally rich (~2k
// chars); Pollinations tolerates long query strings, so keep a generous cap
// that preserves the Reality Engine tail at the end while still guarding against
// pathological lengths. Override with POLLINATIONS_PROMPT_MAX if needed.
function trimForUrl(prompt, max = Number(process.env.POLLINATIONS_PROMPT_MAX) || 2900) {
  if (prompt.length <= max) return prompt
  return prompt.slice(0, max).replace(/[,\s]+\S*$/, '') // cut on a clean word boundary
}

async function viaPollinations(prompt, { width, height, seed }) {
  const p = trimForUrl(prompt)
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    nologo: 'true',
    // GET https://image.pollinations.ai/models currently returns ["sana"] — the
    // FLUX endpoint is no longer offered, so this parameter is advisory and the
    // service picks its own model. Left configurable so we pick FLUX back up
    // automatically if it returns. Sana is markedly weaker at photorealism than
    // FLUX, which is the real ceiling on output quality right now.
    model: process.env.POLLINATIONS_MODEL || 'flux',
    // Pollinations can run the prompt through an LLM "enhancer" that rewrites
    // it. FELT's prompt is the assembled output of the Visual DNA, technique
    // suffix and Reality Engine — letting a third-party model paraphrase it
    // discards that work and reintroduces the generic-AI-art look the whole
    // engine exists to avoid. Opt out explicitly.
    enhance: 'false',
    // Keep generated covers out of the public feed; these are artists' unreleased
    // records, and the prompt text itself is proprietary.
    nofeed: 'true',
    private: 'true',
  })
  if (seed != null) params.set('seed', String(seed))
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?${params.toString()}`

  const resp = await fetch(url, { headers: { Accept: 'image/jpeg,image/png,*/*' } })
  if (!resp.ok) {
    const body = await resp.text().catch(() => '')
    throw new Error(`Pollinations ${resp.status}: ${body.slice(0, 200)}`)
  }
  const contentType = resp.headers.get('content-type') || 'image/jpeg'
  const buffer = Buffer.from(await resp.arrayBuffer())
  if (!buffer.length) throw new Error('Pollinations returned an empty image body')
  return `data:${contentType};base64,${buffer.toString('base64')}`
}

async function viaTogether(prompt, { width, height }) {
  const key = process.env.TOGETHER_API_KEY
  if (!key) throw new Error('TOGETHER_API_KEY is not set')
  const resp = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.TOGETHER_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell-Free',
      prompt,
      width,
      height,
      n: 1,
      steps: 4,
      response_format: 'b64_json',
    }),
  })
  if (!resp.ok) {
    const body = await resp.text().catch(() => '')
    throw new Error(`Together ${resp.status}: ${body.slice(0, 200)}`)
  }
  const json = await resp.json()
  const b64 = json?.data?.[0]?.b64_json
  const remoteUrl = json?.data?.[0]?.url
  if (b64) return `data:image/png;base64,${b64}`
  if (remoteUrl) {
    const img = await fetch(remoteUrl)
    const buffer = Buffer.from(await img.arrayBuffer())
    return `data:image/png;base64,${buffer.toString('base64')}`
  }
  throw new Error('Together returned no image data')
}
async function viaCloudflare(prompt, { width, height }) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token = process.env.CLOUDFLARE_API_TOKEN
  if (!accountId || !token) throw new Error('CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN is not set')

  const model = process.env.CLOUDFLARE_IMAGE_MODEL || '@cf/leonardo/phoenix-1.0'
  const resp = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, width, height }),
    }
  )
  if (!resp.ok) {
    const body = await resp.text().catch(() => '')
    throw new Error(`Cloudflare ${resp.status}: ${body.slice(0, 200)}`)
  }
  const contentType = resp.headers.get('content-type') || 'image/jpeg'
  // Cloudflare returns raw image bytes directly, not JSON-wrapped base64 —
  // confirmed via a live curl test (response started with JPEG magic bytes).
  const buffer = Buffer.from(await resp.arrayBuffer())
  if (!buffer.length) throw new Error('Cloudflare returned an empty image body')
  return `data:${contentType};base64,${buffer.toString('base64')}`
}

let _hf
async function viaHuggingface(prompt, { width, height }) {
  if (!_hf) {
    const { HfInference } = require('@huggingface/inference')
    _hf = new HfInference(process.env.HF_TOKEN)
  }
  const model = process.env.HF_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell'
  const blob = await _hf.textToImage({ model, inputs: prompt, parameters: { width, height } })
  const buffer = Buffer.from(await blob.arrayBuffer())
  return `data:image/webp;base64,${buffer.toString('base64')}`
}

let _replicate
async function viaReplicate(prompt, { width, height }) {
  if (!_replicate) {
    const Replicate = require('replicate')
    _replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
  }
  const model = process.env.REPLICATE_IMAGE_MODEL || 'black-forest-labs/flux-schnell'
  const output = await _replicate.run(model, {
    input: { prompt, aspect_ratio: '1:1', output_format: 'webp', num_outputs: 1 },
  })
  const first = Array.isArray(output) ? output[0] : output
  // Replicate SDK may return a URL string or a FileOutput with .url()/.blob()
  if (first && typeof first.blob === 'function') {
    const buffer = Buffer.from(await (await first.blob()).arrayBuffer())
    return `data:image/webp;base64,${buffer.toString('base64')}`
  }
  const urlStr = typeof first === 'string' ? first : (typeof first?.url === 'function' ? first.url() : String(first))
  const img = await fetch(urlStr)
  const buffer = Buffer.from(await img.arrayBuffer())
  return `data:image/webp;base64,${buffer.toString('base64')}`
}

let _genai
async function viaGemini(prompt, { width, height }) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set')
  if (!_genai) {
    const { GoogleGenAI } = require('@google/genai')
    _genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  }
  // Both 2.5 and 3.1 image models report free-tier `limit: 0` on this key, so
  // neither is "the free one" — the choice only matters once billing is on.
  // 2.5-flash-image is the cheaper of the two, so it is the default.
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image'
  const ratio = width === height ? '1:1' : `${width}:${height}`
  const res = await _genai.models.generateContent({
    model,
    contents: `${prompt}\n\nOutput a single ${ratio} photographic image.`,
    config: {
      // Without this a multimodal model may answer with a text DESCRIPTION of
      // the image instead of generating one — which surfaced here as the
      // confusing "Gemini returned no image" error below.
      responseModalities: ['Image'],
      // Structured aspect ratio. The prompt sentence above is kept as a
      // belt-and-braces hint, but this is the field the API actually honours.
      imageConfig: { aspectRatio: ratio },
    },
  })
  const parts = res?.candidates?.[0]?.content?.parts || []
  const img = parts.find((p) => p.inlineData?.data)
  if (!img) {
    const txt = parts.map((p) => p.text).filter(Boolean).join(' ').slice(0, 200)
    throw new Error(`Gemini returned no image${txt ? `: ${txt}` : ''}`)
  }
  return `data:${img.inlineData.mimeType || 'image/png'};base64,${img.inlineData.data}`
}

const PROVIDERS = {
  gemini: viaGemini,
  pollinations: viaPollinations,
  together: viaTogether,
  huggingface: viaHuggingface,
  hf: viaHuggingface,
  replicate: viaReplicate,
  cloudflare: viaCloudflare,
}

// Providers to fall back to, in order, when the primary fails for a reason that
// retrying won't fix (exhausted quota / missing billing / missing key).
// Ordered best-available-first. `together` sits ahead of `pollinations` because
// FLUX.1-schnell-Free is real FLUX on a genuine free tier — strictly better
// output than Pollinations' current Sana model — and it costs nothing but a
// signup. It is skipped automatically while TOGETHER_API_KEY is unset (the
// provider throws immediately, which `isUnrecoverable` catches), so adding the
// key is the only step needed to upgrade every cover.
const FALLBACK_CHAIN = ['cloudflare', 'pollinations'] //remeber to add 'pollinations' if you want it as a fallback
const isUnrecoverable = (msg) =>
  /quota|limit: 0|RESOURCE_EXHAUSTED|billing|depleted|not set|permission|401|402|403|429/i.test(msg)

/**
 * @param {string} prompt
 * @param {{ width?: number, height?: number, seed?: number, provider?: string }} [opts]
 * @returns {Promise<string>} base64 data URL
 */
async function generateImage(prompt, opts = {}) {
  const providerName = (opts.provider || DEFAULT_PROVIDER).toLowerCase()
  const fn = PROVIDERS[providerName]
  if (!fn) throw new Error(`Unknown IMAGE_PROVIDER "${providerName}" (valid: ${Object.keys(PROVIDERS).join(', ')})`)
  const width = opts.width || 1024
  const height = opts.height || 1024
  const args = { width, height, seed: opts.seed }

  try {
    return await fn(prompt, args)
  } catch (err) {
    const msg = err?.message || String(err)
    // Every Gemini image model currently reports `limit: 0` on a free-tier key —
    // they require billing. Rather than failing every generation, fall through to
    // a provider that works, and say so loudly in the logs.
    if (!isUnrecoverable(msg)) throw err
    for (const alt of FALLBACK_CHAIN) {
      if (alt === providerName) continue
      console.warn(`[IMAGE] "${providerName}" unavailable (${msg.slice(0, 120)}) → falling back to "${alt}"`)
      try {
        return await PROVIDERS[alt](prompt, args)
      } catch (altErr) {
        console.warn(`[IMAGE] fallback "${alt}" also failed: ${altErr?.message || altErr}`)
      }
    }
    throw err
  }
}

module.exports = { generateImage, DEFAULT_PROVIDER }

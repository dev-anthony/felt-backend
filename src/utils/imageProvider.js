'use strict'
/**
 * Image generation provider abstraction.
 *
 * One entrypoint — generateImage(prompt, { width, height, seed }) — that returns
 * a base64 `data:` URL, so the caller's Cloudinary upload stays unchanged.
 * Which backend runs is chosen by IMAGE_PROVIDER (default: 'pollinations').
 *
 *   pollinations  FREE, no key, no signup. FLUX-based. Great for testing.
 *   together      FREE tier (FLUX.1-schnell-Free). Needs TOGETHER_API_KEY.
 *   huggingface   Paid Inference Providers credits. Needs HF_TOKEN.
 *   replicate     Pay-as-you-go. Needs REPLICATE_API_TOKEN.
 *
 * Node 18+ global fetch is assumed (the project runs Node 22).
 */

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
    model: 'flux',
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

const PROVIDERS = {
  pollinations: viaPollinations,
  together: viaTogether,
  huggingface: viaHuggingface,
  hf: viaHuggingface,
  replicate: viaReplicate,
}

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
  return fn(prompt, { width, height, seed: opts.seed })
}

module.exports = { generateImage, DEFAULT_PROVIDER }

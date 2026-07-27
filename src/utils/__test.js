'use strict'
/**
 * imageProvider.js invariant tests. Zero dependencies — `node src/utils/__test.js`.
 *
 * Covers the pure logic around reference-image (img2img) support: strength
 * clamping, capability gating, and the promise that a reference is never
 * silently dropped without a trace. The live network calls (does Cloudflare
 * actually return an image) are proven once by hand against a real account and
 * documented in imageProvider.js's comments rather than re-run on every CI
 * pass — but one live round-trip test runs here too, gated on real credentials
 * being present, so a credential/API change doesn't go unnoticed indefinitely.
 */

const assert = require('assert')
require('dotenv').config({ quiet: true })

const {
  generateImage, clampCreativeStrength, REFERENCE_STRENGTH_RANGE, resolveReferenceImage,
} = require('./imageProvider')

let passed = 0
const failures = []
function test(name, fn) {
  try { fn(); passed++ } catch (err) { failures.push(`${name}\n    ${err.message}`) }
}
async function atest(name, fn) {
  try { await fn(); passed++ } catch (err) { failures.push(`${name}\n    ${err.message}`) }
}

// ── Strength clamping ──────────────────────────────────────────────────────
test('clampCreativeStrength holds valid values unchanged', () => {
  for (const v of [0.3, 0.5, 0.82, 0.95]) {
    assert.strictEqual(clampCreativeStrength(v), v)
  }
})

test('clampCreativeStrength clamps out-of-range values into the measured band', () => {
  const [lo, hi] = REFERENCE_STRENGTH_RANGE
  assert.strictEqual(clampCreativeStrength(-3), lo)
  assert.strictEqual(clampCreativeStrength(0), lo)
  assert.strictEqual(clampCreativeStrength(1), hi)
  assert.strictEqual(clampCreativeStrength(50), hi)
})

test('clampCreativeStrength defaults non-finite input rather than propagating it', () => {
  const [lo, hi] = REFERENCE_STRENGTH_RANGE
  for (const bad of [NaN, undefined, null, 'x', {}]) {
    const v = clampCreativeStrength(bad)
    assert.ok(Number.isFinite(v), `clampCreativeStrength(${JSON.stringify(bad)}) returned ${v}`)
    assert.ok(v >= lo && v <= hi, `default fell outside the documented range: ${v}`)
  }
})

test('the documented strength range matches what was actually measured', () => {
  // 0.45 was tested and found too low (near-total copy); 0.9 was tested and
  // found to be the useful "inspired by" result. The floor must stay below the
  // useful sample and the ceiling must stay at/above it, or the code comment's
  // own justification no longer matches its own bounds.
  const [lo, hi] = REFERENCE_STRENGTH_RANGE
  assert.ok(lo < 0.45, 'floor should sit below the tested "too conservative" sample')
  assert.ok(hi >= 0.9, 'ceiling should cover the tested "useful" sample')
  assert.ok(hi < 1, 'ceiling must stay below 1.0 — Cloudflare documents strength=1 as ignoring the reference entirely')
})

// ── Reference-image gating: never silently dropped ─────────────────────────
async function main() {
  async function withCapturedWarnings(fn) {
    const original = console.warn
    const lines = []
    console.warn = (...args) => lines.push(args.join(' '))
    try { await fn() } finally { console.warn = original }
    return lines
  }

  // Tested directly against resolveReferenceImage rather than through
  // generateImage(): generateImage only calls it for a REFERENCE_CAPABLE
  // provider (there is no point fetching a reference an incapable provider
  // would discard anyway), so routing this through an incapable provider like
  // Pollinations would never reach the fetch at all and prove nothing.
  await atest('an unresolvable reference URL degrades to null, never throws', async () => {
    const warnings = await withCapturedWarnings(async () => {
      const result = await resolveReferenceImage({
        referenceImageUrl: 'https://this-domain-does-not-resolve.invalid/x.png',
      })
      assert.strictEqual(result, null, 'an unfetchable reference should resolve to null, not throw')
    })
    assert.ok(warnings.some((w) => /reference image could not be fetched/i.test(w)),
      'an unfetchable reference must be logged, not silently ignored')
  })

  await atest('a reference on a non-capable provider is dropped loudly, not silently', async () => {
    const warnings = await withCapturedWarnings(async () => {
      await generateImage('a lone figure on a rain-slick street', {
        provider: 'pollinations', // Pollinations has no img2img support at all
        referenceImageB64: 'aGVsbG8=', // "hello" - never actually sent anywhere
        width: 512, height: 512,
      })
    })
    assert.ok(warnings.some((w) => /cannot use one|cannot use a reference|cannot use/i.test(w)),
      'requesting a reference on an incapable provider must warn, not silently proceed without it')
  })

  // ── Live integration (gated on real credentials) ────────────────────────────
  const hasCloudflare = !!(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN)
  if (hasCloudflare) {
    await atest('LIVE: Cloudflare text-to-image returns a real image', async () => {
      const result = await generateImage('a single red apple on a white table, studio photograph', {
        provider: 'cloudflare', width: 512, height: 512,
      })
      assert.ok(result.startsWith('data:image/'), `expected a data:image/ URL, got: ${result.slice(0, 40)}`)
      const b64 = result.split(',')[1]
      assert.ok(b64 && b64.length > 1000, 'image payload looks too small to be real')
    })

    await atest('LIVE: an unresolvable reference degrades the full pipeline to plain text-to-image', async () => {
      // Same failure as the isolated resolveReferenceImage test, but proven
      // through the real dispatcher on a REFERENCE_CAPABLE provider, so the
      // capability short-circuit doesn't mask it the way it would on Pollinations.
      const result = await generateImage('a single blue umbrella on a wet pavement', {
        provider: 'cloudflare',
        referenceImageUrl: 'https://this-domain-does-not-resolve.invalid/x.png',
        width: 512, height: 512,
      })
      assert.ok(result.startsWith('data:image/'), 'should still produce a real cover despite the bad reference URL')
    })

    await atest('LIVE: Cloudflare img2img honours a reference image end-to-end', async () => {
      // Generate a small reference, then feed it back in as img2img input —
      // proving the whole resolveReferenceImage -> viaCloudflare path, not just
      // the isolated pieces.
      const refDataUrl = await generateImage('a rain-soaked neon city street at night', {
        provider: 'cloudflare', width: 512, height: 512,
      })
      const refB64 = refDataUrl.split(',')[1]
      const result = await generateImage('a desert highway at golden hour, warm tones', {
        provider: 'cloudflare', width: 512, height: 512,
        referenceImageB64: refB64, creativeStrength: 0.85,
      })
      assert.ok(result.startsWith('data:image/'), 'img2img should return a real image')
      assert.notStrictEqual(result, refDataUrl, 'img2img output should differ from its own input')
    })
  } else {
    console.log('  (skipping 2 LIVE Cloudflare tests — no CLOUDFLARE_ACCOUNT_ID/CLOUDFLARE_API_TOKEN in this environment)')
  }
}

main().then(() => {
  // ── report ─────────────────────────────────────────────────────────────
  console.log(`\n  ${passed} passed, ${failures.length} failed\n`)
  if (failures.length) {
    for (const f of failures) console.log(`  ✗ ${f}\n`)
    process.exitCode = 1
  } else {
    console.log('  All imageProvider invariants hold.\n')
  }
})

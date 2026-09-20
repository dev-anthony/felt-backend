'use strict'
/**
 * SCENE QUALITY GUARD.
 *
 * The scene writer produces the story; a separate system (Visual DNA + the
 * composer) owns every rendering decision — camera, light, colour, grain, and
 * what kind of capture the technique is. Two failure classes keep getting
 * through that boundary in real generations, and both were visible in the
 * scene text itself before any image was made:
 *
 *   1. AI-TELLS — decoration bolted onto an object instead of describing what
 *      it physically does: "a spiderweb of hairline cracks ... a network of
 *      glowing fissures". These are the single most common reason a cover reads
 *      as generated rather than photographed, and they are only a problem
 *      because the image model is then asked to render them literally.
 *
 *   2. RENDERING LEAKS — technique vocabulary written into the story: "rendered
 *      in thermal false-color", "a cool blue thermal signature", "long-exposure
 *      red taillights". The technique is applied by the rendering layer; when
 *      the scene also states it, the prompt carries two competing descriptions
 *      of the same look (and the scene's version wins the model's attention
 *      because it comes first).
 *
 * Deterministic and cheap. It never rewrites text itself — a regex scrub would
 * mangle sentences — it only reports, so the caller can ask the writer to
 * redo the scene once with the specific words named.
 */

// Words that are only ever decoration when attached to an object or a crack.
// Deliberately narrow: ordinary physical description ("morning light", "dust",
// "rust", "steam") must never trip this — a false positive costs a retry.
const AI_TELL_PATTERNS = [
  /\bglow(?:s|ed|ing)?\b/i,
  /\b(?:luminous(?:ly)?|radiant(?:ly)?|ethereal(?:ly)?|otherworldly|bioluminescen\w*|iridescen\w*|incandescent)\b/i,
  /\bspider[- ]?web\w*\b/i,
  /\b(?:network|web|lattice|maze|tapestry|filigree) of (?:\w+ )?(?:cracks?|fissures?|fractures?|veins?|lines|filaments|light)\b/i,
  /\b(?:veins?|tendrils?|threads?|rivers?|rivulets?) of (?:light|fire|energy|gold|molten)\b/i,
  /\b(?:lightning|energy) (?:field|lines?|veins?|branches|bolts?|arcs?)\b/i,
  /\baura\b/i,
  /\b(?:floating|drifting|hovering|suspended) (?:particles?|motes|embers|sparks|orbs|dust motes)\b/i,
  /\b(?:magic(?:al)?|mystical|mythic|dreamlike|surreal(?:ly)?)\b/i,
  /\b(?:pulses?|pulsing|pulsating|throbbing) with (?:light|energy|heat|life|power)\b/i,
]

// Technique / camera / grade vocabulary. The rendering layer owns these.
const RENDERING_LEAK_PATTERNS = [
  /\bfalse[- ]colou?r\w*\b/i,
  /\b(?:thermal|infrared|infra-red)\b(?! (?:flask|mug|coat|underwear|glove|blanket))/i,
  /\bheat[- ](?:signatures?|maps?|vision)\b/i,
  /\b(?:FLIR|ironbow)\b/i,
  /\blong[- ]exposure\b/i,
  /\bdouble[- ]exposure\b/i,
  /\b(?:motion|gaussian) blur(?:red)?\b/i,
  /\b(?:film|digital) grain\b/i,
  /\b(?:bokeh|halation|anamorphic|vignett\w*|chiaroscuro)\b/i,
  /\b(?:macro|wide[- ]angle|telephoto|fisheye) (?:lens|shot|view)\b/i,
  /\brender(?:ed|ing)? in\b/i,
  /\b(?:colou?r[- ]graded|colou?r grade|colou?r palette|duotone|monochrom\w*)\b/i,
]

/**
 * @param {string} scene
 * @returns {{ kind: 'ai-tell'|'rendering-leak', match: string }[]}
 */
function sceneQualityIssues(scene) {
  const text = String(scene || '')
  const issues = []
  const seen = new Set()
  const scan = (patterns, kind) => {
    for (const re of patterns) {
      const m = text.match(re)
      if (m) {
        const key = kind + ':' + m[0].toLowerCase()
        if (!seen.has(key)) {
          seen.add(key)
          issues.push({ kind, match: m[0] })
        }
      }
    }
  }
  scan(AI_TELL_PATTERNS, 'ai-tell')
  scan(RENDERING_LEAK_PATTERNS, 'rendering-leak')
  return issues
}

/**
 * The follow-up instruction appended to the ORIGINAL prompt for the single
 * retry. Names the exact offending words — a generic "make it more real" is
 * ignored; "you wrote 'glowing fissures'" is not.
 */
function qualityRetryNote(issues) {
  const words = [...new Set(issues.map((i) => `"${i.match}"`))].join(', ')
  const tells = issues.some((i) => i.kind === 'ai-tell')
  const leaks = issues.some((i) => i.kind === 'rendering-leak')
  const lines = [
    `REWRITE REQUIRED — your previous scene used: ${words}.`,
    'Write the SAME visual metaphor again, as plain physical description of what exists in the real world:',
  ]
  if (tells) {
    lines.push('- No glow, no luminous or magical effects, no networks/webs/veins of cracks or light, no floating particles, no auras. Describe the material itself: what it is made of, how it has been worn, where the load is, what is physically moving or about to give.')
  }
  if (leaks) {
    lines.push('- No technique, camera or colour-grade vocabulary (thermal, infrared, false-colour, long-exposure, blur, grain, bokeh, palette, "rendered in"). A separate system applies the look; you only describe the scene.')
  }
  lines.push('- Two or three sentences, one dominant subject, one specific place. Same output format as before.')
  return lines.join('\n')
}

module.exports = { sceneQualityIssues, qualityRetryNote, AI_TELL_PATTERNS, RENDERING_LEAK_PATTERNS }

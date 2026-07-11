# FELT — Visual Operating System

Turns analyzed music into an art-directed cover-art prompt. Every visual
decision is explainable from the audio features; the same song always computes
the same visual execution, yet similar songs diverge, so one genre yields many
different looks.

```
Essentia features
  → Feature Normalization      (dna/featureVector.js)
  → Technique (soft bias)      (technique/index.js)
  → Visual DNA Engine          (dna/index.js  + dna/scoring.js)
        selects from ↓
  → Visual Vocabulary          (vocabulary/*)     ← FELT's KNOWLEDGE
  → Gemini Prompt Compiler     (compiler/geminiCompiler.js)  ← story only, CONSTRUCTS a real subject
  → Prompt Assembler           (assembler/promptAssembler.js)
  → Photographic Reality Engine(reality/index.js) ← forces believable-camera output
  → FLUX prompt string
```

**Ownership split (why covers look real and on-theme):** the *story* — subject
identity, wardrobe, setting, action — is owned by Gemini (grounded in the song).
The *look* — camera, lens, film, lighting, color, texture, composition — is owned
by the Visual DNA (grounded in the audio). The *believability* — anatomy, hands,
skin, fabric, optics — is owned by the Reality Engine (music-agnostic). No two
layers describe the same thing, so nothing competes inside one prompt.

## Responsibilities (one job each)

| Layer | File | Job |
|---|---|---|
| **Vocabulary** | `vocabulary/` | KNOWLEDGE. Reusable visual concepts (cameras, lenses, film, lighting, composition, color, texture, motion, environments, subjects, editorial, graphic, art mediums, typography, post-processing, symbolism). No logic, no prompts, no scenes. |
| **Visual DNA** | `dna/` | REASONING. Scores vocabulary against the full feature vector and selects one concept per layer. Deterministic. Never invents concepts. |
| **Technique** | `technique/` | STORYTELLING method. The 10 techniques + their FLUX suffixes (verbatim from the legacy system) + a **soft** `dnaBias` that nudges the DNA. Never picks cameras/lighting directly. |
| **Compiler** | `compiler/` | STORYTELLER + SUBJECT CONSTRUCTION. Gemini, demoted: emits only structured scene JSON, and must build a *physically concrete* person (age, skin, hair, specific garments, expression, pose, gesture, framing) — vague words like "beautiful"/"sculptural figure" are banned. Forbidden from naming any technical decision. |
| **Assembler** | `assembler/` | COMPILER. Deterministic weld of scene + DNA + technique suffix + reality tail into one prompt. Almost no creative logic (only medium-coherence: an illustrated medium suppresses the camera chain). |
| **Reality Engine** | `reality/` | BELIEVABILITY. Music-agnostic final tail: positive realism constraints (anatomy, five-fingered hands, pores, fabric, catchlights, consistent shadow direction, lens DOF) + hard negatives against AI tells (waxy skin, malformed hands, warped faces, CGI look). Doubles as the quality tail; single-subject by default. |

## Two ways to build a prompt

```js
const engine = require('../engine')

// 1. DETERMINISTIC — no LLM. Uses an existing scene sentence as the story.
const { prompt } = engine.assembleFromScene({
  features: upload.audio_features,
  techniqueName: 'MOTION_BLUR_STROBE',
  sceneText: 'a figure against a car window at dusk',
})

// 2. FULL PIPELINE — Gemini Compiler emits a DNA-constrained scene, then assembles.
const result = await engine.orchestrate({
  generate,                 // (promptText, opts) => Promise<string>  (your Gemini call)
  features: upload.audio_features,
  techniqueName: 'FLASH_DOCUMENTARY',
  userFeeling, lyricsTheme, mood,
  fallbackScene,
})
```

In `routes/generation.js` both live behind `buildFinalPrompt(...)`. It defaults to
the deterministic path; pass `use_compiler: true` in the request body to run the
full compiler path. Any engine error degrades to the legacy `buildFluxPrompt`.

## How the DNA decides (weighted scoring, not `if genre === x`)

`featureVector.js` normalizes raw features to 0..1 and derives emotional axes
(`aggression`, `warmth`, `darkness`, `intimacy`, `motion`, `grit`, `euphoria`).
Each vocabulary concept declares an `anchor` — its ideal values on those axes.
`scoring.js` ranks candidates by weighted proximity to their anchor, adds a small
bonus to concepts compatible with the active technique, and breaks near-ties with
a PRNG seeded from the song itself (reproducible, but varied across songs).

## Extending the vocabulary

Add a concept to the right file under `vocabulary/`:

```js
{ id: 'light_neon_practical', category: 'lighting',
  tags: ['neon', 'practical', 'night'],
  fragment: 'lit by a single practical neon sign just out of frame',
  anchor: { darkness: 0.6, motion: 0.5, brightness: 0.5 },
  techniques: ['DUOTONE_COLOR_WASH'],           // optional soft affinity
  source: 'research: night-drive reference' }
```

Rules: globally-unique `id`; `category` must match the file's category; `fragment`
is camera-crew-grade text (it goes straight into the prompt); `anchor` speaks in
the signal names from `featureVector.js`. Add only real photography / film /
editorial / print / graphic-design concepts — never invented terminology.

The vocabulary index validates unique ids and category consistency at load time.
Run `node -e "console.log(require('./src/engine').vocabulary.size())"` to count concepts.

## Demo

`node src/engine/__demo.js` prints the DNA selections and an assembled prompt for
a spread of sample tracks.

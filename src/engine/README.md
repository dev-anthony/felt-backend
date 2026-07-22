# FELT — Visual Operating System

Turns analyzed music into an art-directed cover-art prompt. Every visual
decision is explainable from the audio features; the same song always computes
the same visual execution, yet similar songs diverge, so one genre yields many
different looks.

``` 
Essentia features (incl. Module 3 DSP: sub-bass, flatness, flux, onset rate)
  → Feature Normalization      (dna/featureVector.js)   ← sanitises + gates unmeasured axes
  → Emotional Intelligence     (emotion/*)              ← 144-cell archetype matrix
        archetype → aesthetic state → visual intensity → soft DNA bias
  → Technique (soft bias)      (technique/index.js)
  → Visual DNA Engine          (dna/index.js  + dna/scoring.js)
        selects from ↓
  → Visual Vocabulary          (vocabulary/*)     ← FELT's KNOWLEDGE
  → Gemini Prompt Compiler     (compiler/geminiCompiler.js)  ← story only, CONSTRUCTS a real subject
  → Prompt Assembler           (assembler/promptAssembler.js)
  → Reality Engine             (reality/index.js) ← photo / CGI / illustration believability tails
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
| **Emotion** | `emotion/` | FEELING. Reads *what the track feels like* before any visual choice is made: scores the 12 GEMS/BRECVEMA-derived archetypes, routes an Aesthetic State (Normal / Luxury / Gritty), scales a Visual Intensity (Low / Medium / High / Extra High), and resolves one cell of the 12 × 3 × 4 = **144-cell matrix** (`emotion/archetypes/`, one file per archetype, validated at require time). Emits a labeled `EMOTIONAL REGISTER` block for the scene writer **and** a soft bias into the DNA. |
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

Two guards make that trustworthy:

- **Sanitisation.** `clamp01(NaN)` is `NaN` (Math.min/max propagate it), so one
  corrupt feature used to travel the whole pipeline and fail *silently* — the
  archetype sort compared NaN against everything and ranking became arbitrary,
  while the intensity ladder fell through to its final `else` and pinned every
  such track at "Extra High". `sanitizeVector` now neutral-fills non-finite
  values and clamps out-of-range ones, logging what it touched.
- **DSP presence gating.** The Module 3 axes (`subBass`, `spectralFlatness`,
  `spectralFlux`, `onsetRate`) are absent on any track analysed before the DSP
  pass shipped. Those tracks default to 0.5 — but a *default* is not a
  *measurement*, and 0.5 sits a perfect distance from a 0.5 anchor, handing
  concepts free points on evidence never collected. `dspDims()` reports which
  axes are real and `anchorScore` **skips** the rest. Skipping ≠ defaulting.

## Research Module 3 → visual decisions

| DSP feature | Drives | Where |
|---|---|---|
| Spectral Flux | compositional geometry (symmetry ↔ fracture) | `comp_centered_symmetry` / `comp_offcenter_negative` |
| Sub-Bass Ratio | camera axis elevation (the 808 low-angle rule) | `comp_low_angle_hero` / `comp_monumental_scale` |
| Spectral Flatness | media format + grain (digital clarity ↔ pushed analog) | `film_digital_clean` … `tex_xerox_halftone` |
| Onset Density | particle/clutter density | `tex_clean_detail` / `tex_dust_scratches` |
| Spectral Centroid | **Equation 1** — aperture / depth of field | the `lens` layer |
| tempo + onsets + flux | **Equation 2** — shutter regime | the `motion` layer |

Equations 1 and 2 are *replacements*. The published Eq 1 derives aperture from
MFCC₁ and a reverb-decay term that is never defined as an extractable feature,
and contradicts the same document's Feature #4 and Master Matrix (both of which
assign aperture to Spectral Centroid) — we implement the version stated twice.
The published Eq 2 defines `Φ` as a function of one scalar but branches on three
raw variables, and its cases leave a hole: 80–90 BPM below 0.7 flux matched
nothing. The replacement covers the space exhaustively.

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

## Tests & demo

```bash
npm test      # engine invariants — node src/engine/__test.js
npm run demo  # DNA selections + assembled prompt for a spread of sample tracks
```

The suite guards the properties whose failures are *silent* rather than loud: a
wrong cover, not a crash. It covers matrix completeness and cell uniqueness,
corrupt-input handling, every state × intensity routing combination resolving to
a real cell, DSP presence gating, determinism, referential integrity (every
affinity id and every anchor dimension must exist), prompt cleanliness and length
budget across all 10 techniques, both Module 3 equation replacements, and the
front-to-back wire contract — the exact payload `workspace-wizard.tsx` sends,
asserted to survive into the vector, so a frontend field rename fails loudly
instead of silently nulling.

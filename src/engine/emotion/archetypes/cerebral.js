// 'use strict'
// /**
//  * ARCHETYPE 11 — Cerebral, Complex & Analytical
//  *
//  * Research Module 1. Visual directions are distilled from the research's
//  * per-cell tables (lighting / colour / composition / texture) into one dense
//  * phrase per Aesthetic State × Visual Intensity — 12 cells per archetype.
//  */
// module.exports = {
//   label: 'Cerebral, Complex & Analytical',
//   genres: 'IDM, avant-garde jazz, math rock, glitch, microtonal, progressive',
//   register: 'cold fascination and precision — detached, structural, exacting',
//   // Anchor calibrated against DEAM (1,802 songs, human valence/arousal ratings,
//   // CC-licensed; Aljanaki et al., PLOS ONE 2017). The original values sat on an
//   // intuitive 0..1 scale, but real music does not use its ends: DEAM puts 95% of
//   // songs inside valence 0.195..0.781 / arousal 0.156..0.797, and FELT's own valence
//   // formula can only emit 0.174..0.875 -- so an anchor at 0.08 was unreachable
//   // rather than expressive, and uniformly penalised its archetype. Rescaled
//   // linearly: every archetype keeps its exact position relative to the others,
//   // only the span changed. Measured effect: dead archetypes 1 -> 0, selection
//   // concentration (Gini) 0.598 -> 0.501 across the 1,802 songs.
//   anchor: { brightness: 0.8, acousticness: 0.2, valence: 0.438, energy: 0.464, danceability: 0.35 },
//   motionBias: 0.3,
//   states: {
//     normal: {
//       low: 'uniform shadowless daylight across an architectural grid, technical concrete grey bounded by crisp black lines, surgical straight alignment down a concrete panel grid, flawless smooth cast surfaces with zero debris',
//       medium: 'high-precision macro lighting on electronic instruments, technical circuit green with copper traces and solder silver, macro focus into a computer logic board, printed copper path definition over fibreglass grain',
//       high: 'orthographic metropolitan lighting from above, monochromatic streetlamp grids and razor building lines, a direct ninety-degree top-down view across city blocks, hyper-sharp infrastructure boundaries and micro vehicle detail',
//       extreme: 'a generative algorithmic technical model, pure vector white lines on a mathematically dark backdrop, an intricate multi-dimensional lattice shifting through space, crystalline grid vectors with no biological anomaly',
//     },
//     luxury: {
//       low: 'a hyper-minimalist premium workspace, platinum structural bars and clear glass plate over grey, a perfect linear axis through an architectural office, polished structural glass and satin titanium framing',
//       medium: 'chrono-precision lighting on an elite mechanism, polished tourbillon steel with synthetic ruby axis points, macro technical framing inside a luxury watch movement, microscopic gear-tooth profiling in mirror finish',
//       high: 'multi-dimensional glass-pane studio reflections, deep structural steel black cut by geometric glass lines, abstract architecture of intersecting glass panels, clean optical refraction along absolute lines',
//       extreme: 'optical prism laser dispersion, laser spectral bands across a pristine white layout, hyper-sharp macro on light splitting inside the optic, perfect absolute colour boundaries with zero diffraction anomaly',
//     },
//     gritty: {
//       low: 'high-contrast light across technical documents, aged blueprint blue on weathered white paper, straight overhead framing of technical layout prints, coarse engineering paper texture under dark ink lines',
//       medium: 'flat light on a classical slate blackboard, clean white chalk against deep weathered slate grey, a flat view of dense mathematical calculation, dry chalk dust layers and hand-erased smudging',
//       high: 'macro on an RGB cathode-ray display, saturated red-green-blue subpixel stripe arrays, macro optics tracking glitched code on an old monitor, individual phosphor cell grids under scan-line shadow',
//       extreme: 'datamoshed digital video failure, slipped pixel block fields over corrupted vector memory, disordered structure tearing into raw digital bars, fractured macroblock noise and glitched data matrices',
//     },
//   },
// }


'use strict'
/** 

* ARCHETYPE 11 — Cerebral, Complex & Analytical (The Visual Manifesto)
* 
* Research Module 1. Visual directions are distilled into a pure creative manifesto.
* The voice is that of an unyielding systems architect navigating visual paradoxes:
* infinite complexity born from simple rules, and absolute order evoking quiet awe.
*/
module.exports = {
label: 'Cerebral, Complex & Analytical',
genres: 'IDM, avant-garde jazz, math rock, glitch, microtonal, progressive',
register: 'hypnotic order, immutably detached structural certainty, the vertigo of infinite systems',
anchor: { brightness: 0.8, acousticness: 0.2, valence: 0.438, energy: 0.464, danceability: 0.35 },
motionBias: 0.3,
states: {
normal: {
low: 'Shadowless daylight flattens an architectural grid, staging a visual paradox where absolute predictability inspires an unsettling wonder. Technical concrete grey meets flawless black lines, mapping out a landscape where geometry has quietly replaced nature.',
medium: 'An intricate electronic topology of emergence, where simple, rigid rules yield impossible complexity. Silver pathways trace a geometry of pure thought across an emerald substrate, where clinical macro lighting reveals copper routes weaving as though algorithms had replaced evolution..',
high: 'From impossible heights, the city undergoes total structural optimization, stripping away everything unnecessary until it becomes a living equation. Every district dissolves into coordinates under indifferent daylight, a landscape resembling an infrastructure built for data rather than people.',
extreme: 'A universe of recursive depth, where space is rewritten as an endless loop of self-designing systems. Suspended in silent darkness, an impossible mathematical lattice folds into dimensions the human mind struggles to comprehend, every line calculated with inhuman certainty.',
},
luxury: {
low: 'Luxury redefined as the total elimination of entropy. An unwavering linear axis slices through a hyper-minimalist premium sanctuary of perfect efficiency, where monolithic clear glass plates and flawless platinum bars align with an immaculate, zero-tolerance precision.',
medium: 'Time reduced entirely to mechanical certainty, achieving an unexpected, cold beauty through perfect structural balance. Chrono-precision lighting exposes an elite watch movement where polished steel interacts with synthetic ruby bearings, mapping an immutable clockwork topology.',
high: 'An architecture of complete abstraction, where reality is simplified into pure, unyielding structure. Light refracts with unfeeling clarity through intersecting glass panels, breaking space into a deep, steel-black matrix that trades the chaos of atmosphere for geometric purity.',
extreme: 'White light is dissected into its hidden logic across an immaculate layout, proving that even colour obeys a deterministic mathematical order. Clean spectral bands split within an optical matrix, creating boundaries so flawless they appear digitally impossible.',
},
gritty: {
low: 'Blueprints of a civilization that valued structural perfection over humanity, capturing a world stripped of emotion that nevertheless evokes awe. A cold, top-down view frames engineering paper texturing beneath heavy ink lines, a monument to an uncompromising design.',
medium: 'A dense matrix of mathematical calculations dissolving at the margins, where a mind trying to resolve an impossible proof pushes order to the edge of chaos. Ghostly white formulas clash against deep slate grey, preserving the frantic iteration of a breaking system.',
high: 'An obsessive macro perspective on a legacy RGB cathode-ray display, where computation briefly becomes visible before disappearing back into abstraction. Rhythmic scan-line architecture frames an immutable grid of saturated red-green-blue subpixel arrays pulsing on the phosphor cells.',
extreme: 'A systematic digital video failure where information itself forgets the rules that once held it together, revealing an accidental symmetry within broken logic. Slipped pixel blocks shift across a corrupted memory landscape, creating a quiet, deterministic storm of fractured macroblocks.',
},
},
}
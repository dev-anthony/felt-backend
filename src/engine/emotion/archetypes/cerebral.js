'use strict'
/**
 * ARCHETYPE 11 — Cerebral, Complex & Analytical
 *
 * Research Module 1. Visual directions are distilled from the research's
 * per-cell tables (lighting / colour / composition / texture) into one dense
 * phrase per Aesthetic State × Visual Intensity — 12 cells per archetype.
 */
module.exports = {
  label: 'Cerebral, Complex & Analytical',
  genres: 'IDM, avant-garde jazz, math rock, glitch, microtonal, progressive',
  register: 'cold fascination and precision — detached, structural, exacting',
  anchor: { brightness: 0.8, acousticness: 0.2, valence: 0.4, energy: 0.5, danceability: 0.35 },
  motionBias: 0.3,
  states: {
    normal: {
      low: 'uniform shadowless daylight across an architectural grid, technical concrete grey bounded by crisp black lines, surgical straight alignment down a concrete panel grid, flawless smooth cast surfaces with zero debris',
      medium: 'high-precision macro lighting on electronic instruments, technical circuit green with copper traces and solder silver, macro focus into a computer logic board, printed copper path definition over fibreglass grain',
      high: 'orthographic metropolitan lighting from above, monochromatic streetlamp grids and razor building lines, a direct ninety-degree top-down view across city blocks, hyper-sharp infrastructure boundaries and micro vehicle detail',
      extreme: 'a generative algorithmic technical model, pure vector white lines on a mathematically dark backdrop, an intricate multi-dimensional lattice shifting through space, crystalline grid vectors with no biological anomaly',
    },
    luxury: {
      low: 'a hyper-minimalist premium workspace, platinum structural bars and clear glass plate over grey, a perfect linear axis through an architectural office, polished structural glass and satin titanium framing',
      medium: 'chrono-precision lighting on an elite mechanism, polished tourbillon steel with synthetic ruby axis points, macro technical framing inside a luxury watch movement, microscopic gear-tooth profiling in mirror finish',
      high: 'multi-dimensional glass-pane studio reflections, deep structural steel black cut by geometric glass lines, abstract architecture of intersecting glass panels, clean optical refraction along absolute lines',
      extreme: 'optical prism laser dispersion, laser spectral bands across a pristine white layout, hyper-sharp macro on light splitting inside the optic, perfect absolute colour boundaries with zero diffraction anomaly',
    },
    gritty: {
      low: 'high-contrast light across technical documents, aged blueprint blue on weathered white paper, straight overhead framing of technical layout prints, coarse engineering paper texture under dark ink lines',
      medium: 'flat light on a classical slate blackboard, clean white chalk against deep weathered slate grey, a flat view of dense mathematical calculation, dry chalk dust layers and hand-erased smudging',
      high: 'macro on an RGB cathode-ray display, saturated red-green-blue subpixel stripe arrays, macro optics tracking glitched code on an old monitor, individual phosphor cell grids under scan-line shadow',
      extreme: 'datamoshed digital video failure, slipped pixel block fields over corrupted vector memory, disordered structure tearing into raw digital bars, fractured macroblock noise and glitched data matrices',
    },
  },
}

'use strict'
/**
 * ARCHETYPE 2 — Serenity, Peacefulness & Meditativeness
 *
 * Research Module 1. Visual directions are distilled from the research's
 * per-cell tables (lighting / colour / composition / texture) into one dense
 * phrase per Aesthetic State × Visual Intensity — 12 cells per archetype.
 */
module.exports = {
  label: 'Serenity, Peacefulness & Meditativeness',
  genres: 'New age, minimalist ambient, lo-fi chillhop, Celtic folk',
  register: 'stillness and grounded calm — unhurried, weightless, settled',
  // Anchor calibrated against DEAM (1,802 songs, human valence/arousal ratings,
  // CC-licensed; Aljanaki et al., PLOS ONE 2017). The original values sat on an
  // intuitive 0..1 scale, but real music does not use its ends: DEAM puts 95% of
  // songs inside valence 0.195..0.781 / arousal 0.156..0.797, and FELT's own valence
  // formula can only emit 0.174..0.875 -- so an anchor at 0.08 was unreachable
  // rather than expressive, and uniformly penalised its archetype. Rescaled
  // linearly: every archetype keeps its exact position relative to the others,
  // only the span changed. Measured effect: dead archetypes 1 -> 0, selection
  // concentration (Gini) 0.598 -> 0.501 across the 1,802 songs.
  anchor: { energy: 0.156, tempo: 0.15, acousticness: 0.75, valence: 0.591, brightness: 0.3, speechiness: 0.08 },
  motionBias: 0.05,
  states: {
    normal: {
      low: 'flat uniform overcast daylight, monochromatic soft greys and pale teal, a symmetrical horizontal horizon with the subject dead centre, glassy undisturbed water',
      medium: 'soft diffused blue-hour light after sunset, pale lavender and deep twilight indigo over muted slate, rule of thirds across extensive empty space, fine atmospheric mist in low-contrast fields',
      high: 'soft sunlight diffusing down through a dense forest canopy, deep moss green and earthen brown cut by filtered warm shafts, layered vertical elements holding structural quiet, soft forest-floor detritus behind an out-of-focus foreground',
      extreme: 'shifting fields of light in the manner of a James Turrell installation, borderless gradients cycling through soft monochromatic tone, absolute abstraction with every literal object removed, frictionless sky-space of infinite depth',
    },
    luxury: {
      low: 'low-intensity hidden architectural accent light, pale stone grey and soft bone white against natural matte oak, hyper-clean geometric lines with nothing unnecessary in frame, matte limestone and raw unpolished quartz',
      medium: 'diffused wash light falling across luxury materials, taupe and rich warm cream with soft unpolished bronze, asymmetrical framing built around high-end structural texture, fine linen weave and matte ceramic edges',
      high: 'a single soft museum-grade spotlight picking out one element, deep espresso wood and dark emerald velvet trimmed in soft gold leaf, central isolation of one historical luxury object, aged leather grain and heavy unpolished brass',
      extreme: 'perfect indirect lighting casting micro shadow lines, monochromatic white-on-white broken by raw silver, abstract macro on an architectural intersection point, flawless geometric crystal facets in absolute polish',
    },
    gritty: {
      low: 'weak morning sun striking one unadorned wall, faded beige and flat eggshell white under natural grey shadow, a stationary eye-level camera in a casual unposed view, raw drywall with faint dust and exposed wires',
      medium: 'overcast light passing through dirty window panes, muted industrial blue and ash grey against rusted iron trim, a frame within a frame looking outward into dead space, water-spot patterns on glass and rough raw wood grain',
      high: 'low fog rolling across a damp unpaved country road, deep charcoal and slate grey over muddy earth tones, a disorienting low horizon line through soft-focus optics, damp asphalt and heavy atmospheric wetness',
      extreme: 'a defocused night landscape lit only by distant streetlights, blurry multi-coloured bokeh fields against dark space, total lens defocus with the camera off-axis, heavy sensor dust and a high analog noise floor',
    },
  },
}

'use strict'
/**
 * ARCHETYPE 6 — Dread, Terror & Paranoia
 *
 * Research Module 1. Visual directions are distilled from the research's
 * per-cell tables (lighting / colour / composition / texture) into one dense
 * phrase per Aesthetic State × Visual Intensity — 12 cells per archetype.
 */
module.exports = {
  label: 'Dread, Terror & Paranoia',
  genres: 'Death industrial, dark techno, horror score, noise, drone metal',
  register: 'hyper-vigilance and impending threat — claustrophobic, watched',
  anchor: { darkness: 0.85, aggression: 0.6, valence: 0.08, brightness: 0.35, acousticness: 0.15 },
  motionBias: 0.35,
  states: {
    normal: {
      low: 'unbalanced institutional corridor lighting, pale institutional grey with shadow blocking every exit, severe clinical symmetry down a long empty hallway, hard sterile concrete tiling in cold uniform reflection',
      medium: 'an unseen off-axis light source, heavy shadow weight against one stark white focal point, an aggressive Dutch angle across a dark treeline, thick tangled undergrowth and rough geometric bark',
      high: 'high-contrast flash on something behind glass, distorted skin tones and hard glare against absolute black, an extreme close-up of a human profile pressed behind dirty glass, grease smudges heavy across the optical surface',
      extreme: 'high-velocity motion blur dissolving the space, chaotic smeared colour tracks over deep shadow voids, an abstract kinetic vortex consuming human geometry, violent motion streaking and heavy compression noise',
    },
    luxury: {
      low: 'sterile high-end laboratory illumination, unyielding clean operating white against surgical steel grey, rigid architectural layout across a commercial security zone, flawless chrome plate and high-gloss epoxy floor',
      medium: 'a single screen glowing in an executive dark space, terminal blue highlight against absolute leather black, a low angle on empty high-end boardroom chairs, deep premium leather pores and polished mahogany',
      high: 'moving vehicle light sweeping through a dark cabin, rapid blood-red sweeps across obsidian black voids, a backseat perspective onto a silhouetted driver, high-gloss window reflection over luxury fabric',
      extreme: 'surreal high-fashion nightmare styling, polished latex black with highly reflective liquid chrome, radical geometric models wrapped in dark synthetics, frictionless latex sheen and hyper-sharp abstract borders',
    },
    gritty: {
      low: 'corrupted sodium-vapour light in a parking garage, toxic industrial orange over asphalt black and decaying concrete grey, a CCTV framing of a long empty underground structure, broken concrete gravel and exposed rusted rebar',
      medium: 'a low-resolution active night-vision sensor, monochromatic infrared green with bright white flares, a high security vantage tracking dark figures below, heavy sensor noise and pixelated block artifacts',
      high: 'a defensive flashlight held under the chin, bleached skin tones with hard shadow thrown upward off the jaw, intimate aggressive portraiture capturing raw perspiration, dense sweat layers and coarse fabric grain',
      extreme: 'a physically mangled lens capture, disordered colour separation under heavy light burn, completely shattered perspective lines across a broken room, cracked lens glass and physical hardware destruction',
    },
  },
}

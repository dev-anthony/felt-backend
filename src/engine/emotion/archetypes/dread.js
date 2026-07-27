'use strict'
/** 

* ARCHETYPE 6 — Dread, Terror & Paranoia (The Visual Manifesto)
* 
* Research Module 1. Visual directions are distilled into a pure creative manifesto.
* The voice is that of an encroaching, clinical observer documenting an inescapable
* truth: that safety is the greatest deception, every false sanctuary is already a
* confinement cell, and stillness itself has become predatory.
*/
module.exports = {
label: 'Dread, Terror & Paranoia',
genres: 'Death industrial, dark techno, horror score, noise, drone metal',
register: 'hyper-vigilance, unyielding encroachment, the crushing weight of an unseen presence',
anchor: { darkness: 0.85, aggression: 0.6, valence: 0.195, brightness: 0.35, acousticness: 0.15 },
motionBias: 0.35,
states: {
normal: {
low: 'An institutional space staging a visual paradox where an empty hallway feels intensely overcrowded. Unbalanced corridor lighting casts a pale institutional grey while long shadows systematically block every exit, framing a severe clinical symmetry that transforms protection into an inescapable trap.',
medium: 'A landscape redefined by a sinister paradox where illumination hides more than darkness, forcing the eye to negotiate a false sanctuary. Heavy shadow weight presses against a single stark white focal point from an unseen source, while an aggressive Dutch angle tracks an encroaching treeline.',
high: 'The human form reduced to an object of intrusive observation, where the illusion of privacy collapses entirely. High-contrast flash creates a hard glare against absolute black as an extreme close-up captures a human profile pressed behind dirty glass, where grease smudges become evidence of repeated failed escape.',
extreme: 'Space undergoing complete kinetic erasure, proving that total predictability can still inspire a deep, animalistic panic. High-velocity motion blur obliterates geometry into smeared colour tracks and deep shadow voids, where structural data breaks down under a predatory storm of compression noise.',
},
luxury: {
low: 'An elite environment where luxury functions as an unyielding system of total corporate containment. Sterile high-end laboratory illumination casts a clean operating white against surgical steel grey, proving that safety increases vulnerability across a rigid commercial security zone.',
medium: 'Power isolated in a void, where wealth has quietly completed its transition into a solitary confinement cell. A single screen glows within an executive dark space, casting a cold terminal blue highlight against absolute leather black, where empty boardroom chairs imply an invisible presence.',
high: 'An inescapable pursuit captured from within a moving cell, staging a paradox where continuous motion feels entirely stagnant. Moving vehicle lights sweep through a dark cabin, casting rapid blood-red streaks across obsidian black voids to isolate a backseat perspective of a silhouetted driver.',
extreme: 'An immaculate visual paradox where high-fashion styling morphs into an absolute, frictionless nightmare. Polished black latex interacts with highly reflective liquid chrome to wrap radical geometric models in dark synthetics, creating frictionless surfaces where perfection itself becomes predatory.',
},
gritty: {
low: 'A decaying urban infrastructure documenting a civilization systematically entombed by its own architects. Corrupted sodium-vapor light stains a parking garage a toxic industrial orange over asphalt black, utilizing a distant CCTV framing to prove that observation is indistinguishable from imprisonment.',
medium: 'Humanity monitored as a target through a cold mechanical lens, reducing an active presence to a mere infrared signature. A low-resolution active night-vision sensor transforms the world into monochromatic infrared green with bright white flares, tracking dark figures from a high security vantage.',
high: 'A defensive gesture that only highlights vulnerability, turning a weapon of light into an instrument of absolute self-betrayal. A flashlight held under the chin bleaches skin tones and throws hard shadows upward off the jaw, capturing an intimate, sweaty portrait of raw, unvarnished hyper-vigilance.',
extreme: 'A perspective completely shattered by physical hardware destruction, where the camera itself has succumbed to environmental encroachment. A mangled lens capture forces a chaotic colour separation under a heavy light burn, until the camera can no longer distinguish documentation from survival.',
},
},
}
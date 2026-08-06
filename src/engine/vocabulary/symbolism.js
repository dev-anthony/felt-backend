'use strict'
/**
 * SYMBOLISM — FELT's visual-metaphor library.
 *
 * This is the layer an art director actually trades in. They do not photograph
 * "loneliness"; they photograph an empty chair. The engine previously carried
 * six motifs, which meant most covers reached for the same handful or for none.
 *
 * STRUCTURE — deliberately mirrors emotion/archetypes/.
 * An archetype resolves one visual direction per Aesthetic State; a symbol
 * resolves one physical STAGING per Aesthetic State, because the same motif is
 * a different object in a different world. The open road is a coastal highway
 * seen from a supercar in Luxury, and a cracked two-lane with weeds through the
 * seams in Gritty. Same meaning, different thing in front of the lens.
 *
 *   { id, label, tags,
 *     meaning    — what it signifies, in one line
 *     lineage    — where the reading comes from, so it is auditable
 *     archetypes — which of the 12 emotional archetypes it serves
 *     scope      — 'universal' | 'cultural'  (see below)
 *     anchor     — scoring position, same axes as every other concept
 *     staging    — { normal, luxury, gritty } prompt-ready descriptions
 *     fragment   — defaults to staging.normal; the state-aware value is
 *                  substituted by the DNA engine at selection time }
 *
 * `scope` matters. Jung's position is that motifs like the threshold or the
 * shadow recur across cultures. Yoruba motifs are the opposite case: the
 * research is explicit that they signify "because of what they represent within
 * Yoruba cosmology" — the meaning is not legible outside it. Marking a symbol
 * `cultural` records that its reading is situated, so it is never presented as
 * a human universal, and so it can be preferred for artists whose declared
 * lineage matches rather than sprayed at everyone.
 *
 * Sources: Jung, *Man and His Symbols* (archetypes of the collective
 * unconscious); Barthes, *Mythologies* / *Elements of Semiology* (denotation vs
 * connotation); Yoruba cultural-motif semiotics (Adeyanju et al.).
 */

/** @type {import('../types').VocabularyConcept[]} */
const SYMBOLISM = [
  // ── TRANSCENDENCE ────────────────────────────────────────────────────────
  { id: 'sym_solar_halo', label: 'The Halo', category: 'symbolism',
    tags: ['sun', 'halo', 'enlightenment', 'identity'],
    meaning: 'self-possession, election, the illuminated mind',
    lineage: 'Solar disc / nimbus — recurs in Byzantine icon painting, Buddhist thangka and West African sun motifs',
    archetypes: ['TRANSCENDENCE', 'JOY'], scope: 'universal',
    anchor: { valence: 0.55, warmth: 0.6, intimacy: 0.5, brightness: 0.6 },
    staging: {
      normal: 'a circular sun-like halo behind the head signalling identity, focus and self-possession',
      luxury: 'a machined brass disc mounted behind the head, catching one hard studio light like a struck coin',
      gritty: 'a bare round work-lamp burning directly behind the head, flaring the lens into a rough halo',
    } },

  { id: 'sym_light_shaft', label: 'The Shaft of Light', category: 'symbolism',
    tags: ['light', 'revelation', 'grace', 'vertical'],
    meaning: 'revelation, grace arriving from outside the self',
    lineage: 'Volumetric god-ray; the annunciation light of Renaissance painting',
    archetypes: ['TRANSCENDENCE', 'SERENITY'], scope: 'universal',
    anchor: { brightness: 0.65, valence: 0.6, acousticness: 0.55, energy: 0.4 },
    staging: {
      normal: 'a single shaft of daylight breaking through cloud and landing on the subject alone',
      luxury: 'one narrow blade of light falling through an architectural slit onto polished stone',
      gritty: 'a hard beam pushing through a broken roof panel, thick with floating dust',
    } },

  { id: 'sym_summit', label: 'The Summit', category: 'symbolism',
    tags: ['height', 'ascent', 'scale', 'achievement'],
    meaning: 'arrival after ascent, and the smallness that comes with the view',
    lineage: 'The mountain as axis mundi — near-universal in cosmology',
    archetypes: ['TRANSCENDENCE', 'POWER'], scope: 'universal',
    anchor: { brightness: 0.55, energy: 0.45, darkness: 0.35, intimacy: 0.25 },
    staging: {
      normal: 'a figure standing at a high ridgeline with the land falling away far below',
      luxury: 'a lone figure at the glass edge of a tower floor, the city grid laid out beneath',
      gritty: 'a figure on a tar-paper rooftop above a dense low skyline, wind pulling at their clothes',
    } },

  // ── SERENITY ─────────────────────────────────────────────────────────────
  { id: 'sym_still_water', label: 'Still Water', category: 'symbolism',
    tags: ['water', 'calm', 'reflection', 'surface'],
    meaning: 'composure, the mind at rest, the surface that holds an image',
    lineage: 'Narcissus and the reflecting pool; the mirror of water in Daoist and Zen imagery',
    archetypes: ['SERENITY', 'MELANCHOLY'], scope: 'universal',
    anchor: { energy: 0.15, motion: 0.15, acousticness: 0.7, valence: 0.55 },
    staging: {
      normal: 'a flat unbroken expanse of water holding a clean reflection, nothing disturbing the surface',
      luxury: 'a black reflecting pool cut into pale stone, its surface absolutely level and mirror-still',
      gritty: 'a puddle across cracked asphalt holding a whole reflected building, dead calm',
    } },

  { id: 'sym_empty_vessel', label: 'The Empty Vessel', category: 'symbolism',
    tags: ['vessel', 'emptiness', 'waiting', 'ceramic'],
    meaning: 'readiness, the value of what is not filled',
    lineage: 'The uncarved block / empty cup — Daoist; also the alchemical vas',
    archetypes: ['SERENITY', 'MELANCHOLY'], scope: 'universal',
    anchor: { energy: 0.2, acousticness: 0.65, intimacy: 0.55, darkness: 0.4 },
    staging: {
      normal: 'a single empty ceramic bowl on a bare surface, lit softly from one side',
      luxury: 'one flawless hand-thrown porcelain vessel isolated on a stone plinth',
      gritty: 'a chipped enamel cup on a scarred wooden table, nothing else in frame',
    } },

  // ── TENDERNESS ───────────────────────────────────────────────────────────
  { id: 'sym_warm_glow', label: 'The Warm Glow', category: 'symbolism',
    tags: ['desire', 'warmth', 'longing', 'light'],
    meaning: 'desire and longing, presence felt without a second body',
    lineage: 'The hearth as the seat of intimacy; the lit window seen from outside',
    archetypes: ['TENDERNESS', 'NOSTALGIA'], scope: 'universal',
    anchor: { warmth: 0.6, intimacy: 0.6, darkness: 0.5, energy: 0.3 },
    staging: {
      normal: 'a single warm glow in darkness standing for desire and longing, no second figure present',
      luxury: 'one shaded lamp throwing a pool of amber across silk and dark wood',
      gritty: 'a bare bulb burning warm in an otherwise unlit room, filament visible',
    } },

  { id: 'sym_hands', label: 'The Hands', category: 'symbolism',
    tags: ['hands', 'touch', 'labour', 'intimacy'],
    meaning: 'what a person has done and who they have held',
    lineage: 'Hands as biography — Dürer, Dorothea Lange, Gordon Parks',
    archetypes: ['TENDERNESS', 'PRIMAL', 'MELANCHOLY'], scope: 'universal',
    anchor: { intimacy: 0.8, acousticness: 0.55, energy: 0.3, warmth: 0.55 },
    staging: {
      normal: 'a close study of one pair of hands at rest, every line and callus legible',
      luxury: 'hands in immaculate close-up against dark velvet, a single fine metal band catching light',
      gritty: 'working hands with dirt in the creases and split knuckles, shot hard and close',
    } },

  { id: 'sym_open_window', label: 'The Open Window', category: 'symbolism',
    tags: ['window', 'threshold', 'air', 'possibility'],
    meaning: 'the outside entering a private space; possibility without departure',
    lineage: 'The Romantic Rückenfigur at the window — Friedrich, Hammershøi',
    archetypes: ['TENDERNESS', 'NOSTALGIA', 'SERENITY'], scope: 'universal',
    anchor: { intimacy: 0.6, warmth: 0.5, acousticness: 0.55, valence: 0.5 },
    staging: {
      normal: 'an open window with a curtain lifting on the air, the room quiet around it',
      luxury: 'a tall steel-framed window standing open onto a still terrace, linen moving slightly',
      gritty: 'a painted-shut sash forced open on a fire escape, city noise implied beyond it',
    } },

  // ── NOSTALGIA ────────────────────────────────────────────────────────────
  { id: 'sym_photograph', label: 'The Photograph', category: 'symbolism',
    tags: ['photo', 'memory', 'proof', 'paper'],
    meaning: 'memory made physical, and the proof that it is now past',
    lineage: "Barthes, *Camera Lucida* — the photograph as 'that-has-been'",
    archetypes: ['NOSTALGIA', 'MELANCHOLY'], scope: 'universal',
    anchor: { warmth: 0.6, tempo: 0.3, intimacy: 0.6, valence: 0.45 },
    staging: {
      normal: 'a single old photograph held in frame, its surface creased and slightly faded',
      luxury: 'one archival print in a slim museum mount, lit like an object of value',
      gritty: 'a curled snapshot taped to a wall, sun-bleached and torn at one corner',
    } },

  { id: 'sym_analog_object', label: 'The Analog Object', category: 'symbolism',
    tags: ['cassette', 'vinyl', 'obsolete', 'media'],
    meaning: 'a superseded technology standing in for a superseded self',
    lineage: 'Obsolescence as elegy; the recurring motif of dead media in lo-fi and vaporwave',
    archetypes: ['NOSTALGIA'], scope: 'universal',
    anchor: { warmth: 0.6, tempo: 0.28, acousticness: 0.5, brightness: 0.4 },
    staging: {
      normal: 'a cassette or worn record sleeve resting where it was last put down',
      luxury: 'a pristine deck in brushed aluminium, its spools caught mid-turn',
      gritty: 'a tangled unspooled tape and a scratched sleeve in a dusty crate',
    } },

  { id: 'sym_empty_chair', label: 'The Empty Chair', category: 'symbolism',
    tags: ['chair', 'absence', 'loss', 'furniture'],
    meaning: 'the person who is not there, described by the shape they left',
    lineage: "Van Gogh's *Gauguin's Chair*; the empty seat as memorial across cultures",
    archetypes: ['NOSTALGIA', 'MELANCHOLY'], scope: 'universal',
    anchor: { darkness: 0.55, intimacy: 0.5, energy: 0.2, valence: 0.3 },
    staging: {
      normal: 'one empty chair turned slightly away, the room otherwise unoccupied',
      luxury: 'a single sculptural chair alone in a vast pale room, immaculate and unused',
      gritty: 'a broken kitchen chair with a worn seat, standing in a stripped room',
    } },

  // ── MELANCHOLY ───────────────────────────────────────────────────────────
  { id: 'sym_rain_on_glass', label: 'Rain on Glass', category: 'symbolism',
    tags: ['rain', 'window', 'grief', 'separation'],
    meaning: 'grief held behind a barrier; the world seen but not touched',
    lineage: 'Pathetic fallacy — weather as interior state, from Romantic painting to Wong Kar-wai',
    archetypes: ['MELANCHOLY', 'NOSTALGIA'], scope: 'universal',
    anchor: { valence: 0.2, darkness: 0.6, energy: 0.25, intimacy: 0.6 },
    staging: {
      normal: 'rain running down a window with the world beyond it thrown out of focus',
      luxury: 'water tracking down a great sheet of plate glass above a blurred city',
      gritty: 'a filthy bus window streaked with rain and old fingerprints',
    } },

  { id: 'sym_severed_thread', label: 'The Severed Thread', category: 'symbolism',
    tags: ['thread', 'cut', 'ending', 'fate'],
    meaning: 'a bond ended by something outside the self',
    lineage: 'The Moirai cutting the thread of life; the cut cord across funerary custom',
    archetypes: ['MELANCHOLY', 'DREAD'], scope: 'universal',
    anchor: { valence: 0.15, darkness: 0.65, aggression: 0.4, energy: 0.3 },
    staging: {
      normal: 'a single cut thread or snapped cord left hanging, its two ends not touching',
      luxury: 'one broken strand of pearls on dark stone, the beads stopped where they fell',
      gritty: 'a frayed rope sheared through, fibres splayed and dirty',
    } },

  { id: 'sym_wilting_bloom', label: 'The Wilting Bloom', category: 'symbolism',
    tags: ['flower', 'decay', 'time', 'vanitas'],
    meaning: 'beauty with its ending already visible in it',
    lineage: 'Dutch vanitas still life; the memento mori tradition',
    archetypes: ['MELANCHOLY', 'TENDERNESS'], scope: 'universal',
    anchor: { valence: 0.3, warmth: 0.45, darkness: 0.5, acousticness: 0.6 },
    staging: {
      normal: 'a single flower past its peak, petals beginning to turn and drop',
      luxury: 'one overblown bloom in dark glass, a fallen petal left exactly where it landed',
      gritty: 'a dying flower in a plastic bottle on a windowsill, water gone cloudy',
    } },

  // ── DREAD ────────────────────────────────────────────────────────────────
  { id: 'sym_closed_door', label: 'The Closed Door', category: 'symbolism',
    tags: ['door', 'threshold', 'refusal', 'unknown'],
    meaning: 'what is withheld, and the decision not yet made',
    lineage: 'The threshold guardian; the sealed door of folklore and horror',
    archetypes: ['DREAD', 'TENSION'], scope: 'universal',
    anchor: { darkness: 0.7, valence: 0.25, energy: 0.35, aggression: 0.4 },
    staging: {
      normal: 'a single closed door at the end of the frame, no indication of what is behind it',
      luxury: 'a tall seamless door flush with dark panelling, no handle visible',
      gritty: 'a dented steel door with a failed lock, light bleeding around its edge',
    } },

  { id: 'sym_watching_eye', label: 'The Watching Eye', category: 'symbolism',
    tags: ['surveillance', 'eye', 'lens', 'paranoia'],
    meaning: 'being observed by something that will not identify itself',
    lineage: 'The panopticon (Bentham, via Foucault); the apotropaic eye across Mediterranean and West African custom',
    archetypes: ['DREAD'], scope: 'universal',
    anchor: { darkness: 0.75, aggression: 0.5, valence: 0.15, brightness: 0.35 },
    staging: {
      normal: 'one camera lens trained directly at the frame from an unlit corner',
      luxury: 'a single black dome camera set flush into a flawless white ceiling',
      gritty: 'a cracked housing on a bracket, cable exposed, still live',
    } },

  { id: 'sym_long_corridor', label: 'The Long Corridor', category: 'symbolism',
    tags: ['corridor', 'perspective', 'entrapment', 'repetition'],
    meaning: 'a path with no branch — progress that offers no choice',
    lineage: 'One-point perspective as coercion; the institutional corridor in postwar cinema',
    archetypes: ['DREAD', 'TENSION', 'CEREBRAL'], scope: 'universal',
    anchor: { darkness: 0.65, energy: 0.35, brightness: 0.4, intimacy: 0.25 },
    staging: {
      normal: 'a corridor running dead straight away from the lens, its end unresolved',
      luxury: 'an immaculate gallery corridor of repeating bays, vanishing to a single point',
      gritty: 'a service passage of exposed conduit and failing tube lights, receding into dark',
    } },

  // ── TENSION ──────────────────────────────────────────────────────────────
  { id: 'sym_threshold', label: 'The Threshold', category: 'symbolism',
    tags: ['doorway', 'liminal', 'decision', 'crossing'],
    meaning: 'the moment before commitment; neither one place nor the other',
    lineage: "Van Gennep's liminal phase in *The Rites of Passage*; Jung's threshold crossing",
    archetypes: ['TENSION', 'TRANSCENDENCE'], scope: 'universal',
    anchor: { tempo: 0.5, energy: 0.5, valence: 0.4, darkness: 0.5 },
    staging: {
      normal: 'a figure held exactly in a doorway, weight not yet given to either side',
      luxury: 'a figure at the lit edge of a vast dark entrance hall, mid-step',
      gritty: 'a figure in a broken doorframe between a dim room and a bright street',
    } },

  { id: 'sym_clock', label: 'The Clock', category: 'symbolism',
    tags: ['clock', 'time', 'deadline', 'countdown'],
    meaning: 'time as pressure rather than passage',
    lineage: 'The memento mori timepiece; the ticking clock as suspense grammar in thriller cinema',
    archetypes: ['TENSION', 'DREAD'], scope: 'universal',
    anchor: { tempo: 0.55, energy: 0.5, darkness: 0.5, onsetRate: 0.2 },
    staging: {
      normal: 'a clock face large in frame, hands caught just short of the hour',
      luxury: 'an exposed mechanical movement in macro, escapement mid-beat',
      gritty: 'a cracked institutional wall clock, one hand stopped',
    } },

  { id: 'sym_crossroads', label: 'The Crossroads', category: 'symbolism',
    tags: ['road', 'choice', 'fate', 'junction'],
    meaning: 'the point where two futures are still both available',
    lineage: 'The crossroads bargain in Delta blues; Papa Legba at the junction in Yoruba-derived Vodun',
    archetypes: ['TENSION', 'PRIMAL', 'NOSTALGIA'], scope: 'universal',
    anchor: { tempo: 0.45, valence: 0.4, darkness: 0.55, motion: 0.4 },
    staging: {
      normal: 'an empty junction where two roads meet, no traffic and no signage',
      luxury: 'a clean architectural intersection of two pale paths seen from above',
      gritty: 'a dirt crossroads at dusk, ruts cut deep and a leaning post at the corner',
    } },

  // ── POWER ────────────────────────────────────────────────────────────────
  { id: 'sym_monolith', label: 'The Monolith', category: 'symbolism',
    tags: ['monument', 'isolation', 'permanence', 'stone'],
    meaning: 'permanence indifferent to the person standing near it',
    lineage: 'The standing stone / stele as assertion of duration',
    archetypes: ['POWER', 'TRANSCENDENCE', 'MELANCHOLY'], scope: 'universal',
    anchor: { darkness: 0.55, intimacy: 0.4, energy: 0.35, subBass: 0.45 },
    staging: {
      normal: 'a single monolithic form slicing the horizon, standing for isolation and permanence',
      luxury: 'one monumental slab of polished black stone, seamless and without mark',
      gritty: 'a raw concrete pillar streaked with rust and old paint, rebar showing',
    } },

  { id: 'sym_chain', label: 'The Chain', category: 'symbolism',
    tags: ['chain', 'restraint', 'strength', 'status'],
    meaning: 'restraint and status at once — the same object reads as both',
    lineage: 'Bondage iconography inverted into ornament; the chain as wealth display in hip-hop visual culture',
    archetypes: ['POWER'], scope: 'universal',
    anchor: { aggression: 0.7, grit: 0.6, darkness: 0.55, speechiness: 0.45 },
    staging: {
      normal: 'a heavy chain worn or held, its weight obvious in how it hangs',
      luxury: 'flawless polished links in tight macro, each face mirror-bright',
      gritty: 'a rusted chain across a gate, links pitted and locked',
    } },

  { id: 'sym_fire', label: 'The Fire', category: 'symbolism',
    tags: ['fire', 'destruction', 'ritual', 'heat'],
    meaning: 'the force that both destroys and gathers people around it',
    lineage: 'Prometheus; the hearth-fire and the pyre — the same element read two ways',
    archetypes: ['POWER', 'PRIMAL'], scope: 'universal',
    anchor: { aggression: 0.65, energy: 0.7, warmth: 0.65, darkness: 0.5 },
    staging: {
      normal: 'open flame burning in frame, throwing hard moving light on everything near it',
      luxury: 'a single controlled flame reflected in dark polished surfaces',
      gritty: 'a drum fire throwing sparks, smoke staining the air above it',
    } },

  // ── JOY ──────────────────────────────────────────────────────────────────
  { id: 'sym_birds_flight', label: 'Birds in Flight', category: 'symbolism',
    tags: ['birds', 'freedom', 'release', 'sky'],
    meaning: 'release — the moment weight stops applying',
    lineage: 'The soul-bird across Egyptian, Greek and West African funerary imagery',
    archetypes: ['JOY', 'TRANSCENDENCE'], scope: 'universal',
    anchor: { valence: 0.75, euphoria: 0.65, motion: 0.6, brightness: 0.65 },
    staging: {
      normal: 'a flock breaking upward off the ground all at once, wings caught mid-beat',
      luxury: 'a single pale bird against an immaculate empty sky',
      gritty: 'city pigeons scattering off wet concrete, feathers and grit in the air',
    } },

  { id: 'sym_open_road', label: 'The Open Road', category: 'symbolism',
    tags: ['freedom', 'journey', 'movement', 'horizon'],
    meaning: 'freedom as forward motion; the unlived part of a life',
    lineage: 'The American road as self-invention (Frank, Kerouac); the journey archetype more broadly',
    archetypes: ['JOY', 'TENSION', 'NOSTALGIA'], scope: 'universal',
    anchor: { motion: 0.55, valence: 0.55, warmth: 0.5, tempo: 0.5 },
    staging: {
      normal: 'an open road or horizon line standing for freedom and forward motion',
      luxury: 'a clean coastal highway curving away, seen low from a moving car',
      gritty: 'a cracked two-lane running to nothing, weeds through the seams',
    } },

  // ── EUPHORIA ─────────────────────────────────────────────────────────────
  { id: 'sym_crowd_surge', label: 'The Crowd', category: 'symbolism',
    tags: ['crowd', 'communion', 'dissolution', 'bodies'],
    meaning: 'the self dissolving into a larger body',
    lineage: 'Collective effervescence (Durkheim); the ecstatic crowd from Dionysian rite to the rave',
    archetypes: ['EUPHORIA', 'JOY'], scope: 'universal',
    anchor: { danceability: 0.8, euphoria: 0.75, motion: 0.8, energy: 0.75 },
    staging: {
      normal: 'many raised arms filling the frame, no single face resolving out of them',
      luxury: 'a dense elegant crowd under controlled colour light, movement blurred to silk',
      gritty: 'a packed sweating crowd shot from inside it, bodies pressed to the lens',
    } },

  { id: 'sym_thrown_water', label: 'Thrown Water', category: 'symbolism',
    tags: ['water', 'release', 'baptism', 'spray'],
    meaning: 'release and cleansing in the same gesture',
    lineage: 'Baptismal immersion; water-throwing in festival traditions worldwide',
    archetypes: ['EUPHORIA', 'PRIMAL'], scope: 'universal',
    anchor: { euphoria: 0.7, motion: 0.75, energy: 0.7, onsetRate: 0.4 },
    staging: {
      normal: 'water thrown into the air and frozen mid-flight, every droplet separate',
      luxury: 'a clean arc of water suspended against a seamless backdrop',
      gritty: 'water flung across a crowded dark room, caught hard by a direct flash',
    } },

  // ── CEREBRAL ─────────────────────────────────────────────────────────────
  { id: 'sym_grid', label: 'The Grid', category: 'symbolism',
    tags: ['grid', 'order', 'system', 'repetition'],
    meaning: 'imposed order; the system visible over the thing it organises',
    lineage: 'The modernist grid (Krauss); the plan as an instrument of control',
    archetypes: ['CEREBRAL', 'TENSION'], scope: 'universal',
    anchor: { brightness: 0.7, acousticness: 0.2, energy: 0.45, spectralFlux: 0.2 },
    staging: {
      normal: 'a regular grid structure filling the frame, its repetition unbroken',
      luxury: 'a precise lattice of steel and glass, joints machined and flawless',
      gritty: 'a chain-link or scaffold grid, bent out of true and rusting',
    } },

  { id: 'sym_prism', label: 'The Prism', category: 'symbolism',
    tags: ['prism', 'spectrum', 'analysis', 'optics'],
    meaning: 'one thing separated into its components — analysis made visible',
    lineage: "Newton's *Opticks*; the prism as emblem of decomposition and knowledge",
    archetypes: ['CEREBRAL', 'EUPHORIA'], scope: 'universal',
    anchor: { brightness: 0.8, valence: 0.5, acousticness: 0.25, spectralFlatness: 0.3 },
    staging: {
      normal: 'a prism splitting a single beam into a clean visible spectrum',
      luxury: 'optical glass on a white ground throwing perfectly separated colour',
      gritty: 'a cracked glass shard splitting light unevenly across a dirty surface',
    } },

  { id: 'sym_blueprint', label: 'The Blueprint', category: 'symbolism',
    tags: ['plan', 'drawing', 'intention', 'paper'],
    meaning: 'the intention before the thing; design as evidence of forethought',
    lineage: 'The architectural plan as a statement of intent rather than a record',
    archetypes: ['CEREBRAL'], scope: 'universal',
    anchor: { brightness: 0.6, acousticness: 0.35, energy: 0.4, intimacy: 0.4 },
    staging: {
      normal: 'a technical drawing laid flat and shot square on, its linework legible',
      luxury: 'a crisp plan on heavy paper under a single even light',
      gritty: 'a marked-up print taped to a wall, corners torn and edges curling',
    } },

  // ── PRIMAL ───────────────────────────────────────────────────────────────
  { id: 'sym_earth_clay', label: 'Earth and Clay', category: 'symbolism',
    tags: ['clay', 'earth', 'origin', 'making'],
    meaning: 'origin and making — the material a person is formed from',
    lineage: 'Creation-from-clay narratives across Mesopotamian, biblical and Yoruba cosmology',
    archetypes: ['PRIMAL', 'TENDERNESS'], scope: 'universal',
    anchor: { acousticness: 0.65, warmth: 0.6, grit: 0.55, energy: 0.45 },
    staging: {
      // "worked by hand" reworded to describe the evidence of shaping rather
      // than a hand mid-action — reads correctly whether or not a person is
      // in frame, so no separate noPeopleFragment is needed here.
      normal: 'wet earth or clay, its surface pressed and shaped, the marks of that working still in it',
      luxury: 'raw unglazed clay presented as sculpture against pale stone',
      gritty: 'cracked dried mud underfoot, dust lifting off the surface',
    } },

  { id: 'sym_drum', label: 'The Drum', category: 'symbolism',
    tags: ['drum', 'rhythm', 'call', 'skin'],
    meaning: 'rhythm as summons — the instrument that gathers a body of people',
    lineage: 'The talking drum (dùndún) as speech-bearing instrument in Yoruba practice; the drum as call across West African tradition',
    archetypes: ['PRIMAL', 'EUPHORIA'], scope: 'cultural',
    anchor: { danceability: 0.7, acousticness: 0.6, onsetRate: 0.5, warmth: 0.6 },
    staging: {
      normal: 'a hand drum caught mid-strike, the head still moving',
      luxury: 'a single heirloom drum lit as a museum object, hide and cord immaculate',
      gritty: 'a battered drum with a patched skin, played hard and sweating',
    } },

  { id: 'sym_indigo_cloth', label: 'Indigo Cloth', category: 'symbolism',
    tags: ['textile', 'indigo', 'adire', 'heritage'],
    meaning: 'inherited identity carried on the body',
    lineage: 'Yoruba àdìrẹ resist-dyed indigo — pattern as lineage and status, legible within its own cosmology',
    archetypes: ['PRIMAL', 'NOSTALGIA', 'TENDERNESS'], scope: 'cultural',
    anchor: { warmth: 0.55, acousticness: 0.6, intimacy: 0.55, darkness: 0.45 },
    staging: {
      normal: 'deep indigo resist-dyed cloth worn and moving with the body',
      luxury: 'a single length of hand-dyed indigo displayed with its pattern fully readable',
      gritty: 'faded work-worn indigo, dye rubbed pale at the folds',
    } },

  { id: 'sym_cowrie', label: 'Cowrie Shells', category: 'symbolism',
    tags: ['cowrie', 'currency', 'divination', 'adornment'],
    meaning: 'value, chance and ancestry held in one object',
    lineage: 'Cowries as currency and as divination instrument in Ifá practice across West Africa',
    archetypes: ['PRIMAL', 'POWER'], scope: 'cultural',
    anchor: { acousticness: 0.55, warmth: 0.6, danceability: 0.55, brightness: 0.5 },
    staging: {
      normal: 'cowrie shells strung and worn, catching light along their ridges',
      luxury: 'cowries set against dark polished ground, each shell flawless',
      gritty: 'a worn handful of cowries cast onto a dusty mat',
    } },

  // ── Mirror / duality (crosses several archetypes) ────────────────────────
  { id: 'sym_mirror_self', label: 'The Mirror', category: 'symbolism',
    tags: ['duality', 'reflection', 'self', 'confrontation'],
    meaning: 'self-confrontation; the version of a person they have to look at',
    lineage: 'Lacan\'s mirror stage; the double / doppelgänger across folklore',
    archetypes: ['MELANCHOLY', 'DREAD', 'CEREBRAL'], scope: 'universal',
    anchor: { darkness: 0.5, intimacy: 0.5, valence: 0.4 },
    staging: {
      normal: 'a mirrored or doubled self standing for duality and self-confrontation',
      luxury: 'a flawless mirrored plane returning the subject exactly, no frame visible',
      gritty: 'a cracked mirror splitting the reflection into misaligned pieces',
    } },

  { id: 'sym_piercing_object', label: 'The Intruding Object', category: 'symbolism',
    tags: ['conflict', 'pain', 'tension', 'object'],
    meaning: 'inner conflict externalised as something the body must accommodate',
    lineage: 'Surrealist object displacement — Magritte, Oppenheim',
    archetypes: ['DREAD', 'MELANCHOLY', 'POWER'], scope: 'universal',
    anchor: { aggression: 0.6, darkness: 0.6, valence: 0.25 },
    staging: {
      normal: 'a physical object interacting with the body under tension, standing for inner conflict',
      luxury: 'one precise sculptural form intersecting the silhouette, immaculately made',
      gritty: 'a crude found object pressed against the body, edges raw',
    } },

  // ── Absence of symbol ────────────────────────────────────────────────────
  { id: 'sym_none', label: 'No Motif', category: 'symbolism',
    tags: ['literal', 'no-metaphor'],
    meaning: 'the emotion carried by light and posture alone',
    lineage: 'Restraint as a choice — the straight portrait needs no prop',
    archetypes: [], scope: 'universal',
    anchor: { valence: 0.5, energy: 0.55, grit: 0.4 },
    staging: {
      normal: 'no added symbolic object — the emotion carried by light and posture alone',
      luxury: 'no added symbolic object — the emotion carried by light and posture alone',
      gritty: 'no added symbolic object — the emotion carried by light and posture alone',
    } },
]

// `fragment` is what the assembler welds into the prompt. Default it to the
// Normal staging so every consumer keeps working unchanged; the DNA engine
// swaps in the state-specific staging once the emotion read is known.
for (const s of SYMBOLISM) {
  if (!s.fragment) s.fragment = s.staging.normal
}

module.exports = { SYMBOLISM }

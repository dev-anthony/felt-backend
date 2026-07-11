/**
 * FELT Visual Operating System — Type Contracts
 * ------------------------------------------------------------------
 * These are documentation/tooling types only. The engine runs as
 * CommonJS `.js` (no build step), so nothing here is executed — it
 * exists so editors can type-check consumers of the engine and so the
 * shape of every layer is written down in one place.
 *
 * Vocabulary = FELT's KNOWLEDGE (reusable visual concepts, no logic).
 * Visual DNA = FELT's REASONING (selects concepts from music math).
 * Technique  = FELT's STORYTELLING method (soft-biases the DNA).
 * Compiler   = FELT's STORYTELLER (Gemini → scene JSON only).
 * Assembler  = FELT's COMPILER (deterministic final prompt string).
 */

// ── Enums ─────────────────────────────────────────────────────────
export type TechniqueName =
  | 'FLASH_DOCUMENTARY'
  | 'VINTAGE_FILM_NOSTALGIA'
  | 'SILHOUETTE_ATMOSPHERE'
  | 'SURREAL_PRACTICAL_METAPHOR'
  | 'DUOTONE_COLOR_WASH'
  | 'MACRO_INTIMATE_DETAIL'
  | 'MOTION_BLUR_STROBE'
  | 'MIRROR_DOUBLE_EXPOSURE'
  | 'STUDIO_SEAMLESS_EDITORIAL'
  | 'MONUMENTAL_SCALE_ISOLATION';

export type VocabularyCategory =
  | 'camera'
  | 'lens'
  | 'filmStock'
  | 'lighting'
  | 'composition'
  | 'motion'
  | 'texture'
  | 'color'
  | 'environment'
  | 'subject'
  | 'editorial'
  | 'graphic'
  | 'artMedium'
  | 'typography'
  | 'postProcessing'
  | 'symbolism';

/** Canonical 0..1 signal names the scoring engine understands. */
export type SignalName =
  | 'tempo' | 'energy' | 'danceability' | 'valence' | 'brightness'
  | 'loudness' | 'acousticness' | 'speechiness' | 'scaleMajor'
  // derived
  | 'aggression' | 'warmth' | 'darkness' | 'intimacy'
  | 'motion' | 'grit' | 'euphoria';

// ── Feature vector ────────────────────────────────────────────────
export interface RawAudioFeatures {
  bpm?: number; key?: string; scale?: string;
  energy?: number; valence?: number; danceability?: number;
  acousticness?: number; spectral_brightness?: number; brightness?: number;
  loudness?: number; speechiness?: number;
  mood?: string; genre?: string;
}

export type FeatureVector = Record<SignalName, number> & {
  /** Non-numeric context carried alongside the normalized signals. */
  meta: { key: string; scale: string; mood: string; genre: string; seed: number };
};

// ── Vocabulary ────────────────────────────────────────────────────
/** A single reusable visual concept. Knowledge only — never a prompt. */
export interface VocabularyConcept {
  id: string;
  category: VocabularyCategory;
  /** The camera-crew-grade phrase this concept contributes to a prompt. */
  fragment: string;
  /** Free-text tags for retrieval/merging (e.g. 'warm','analog','flash'). */
  tags: string[];
  /** Ideal music signal values this concept expresses; used for scoring. */
  anchor?: Partial<Record<SignalName, number>>;
  /** Per-dimension importance overrides for the anchor (defaults to 1). */
  weights?: Partial<Record<SignalName, number>>;
  /** Techniques this concept is stylistically compatible with (soft bias). */
  techniques?: TechniqueName[];
  /** Human note on where the concept was reverse-engineered from. */
  source?: string;
}

// ── Visual DNA ────────────────────────────────────────────────────
export interface DnaSelection {
  layer: VocabularyCategory | string;
  conceptId: string;
  fragment: string;
  /** 0..1 — margin of the winner over the runner-up. */
  confidence: number;
  /** True when the layer fell back to its default (no confident match). */
  fallback: boolean;
  /** Debug: the ranked alternatives that were considered. */
  alternatives?: Array<{ conceptId: string; score: number }>;
}

export interface VisualDNA {
  technique: TechniqueName;
  vector: FeatureVector;
  selections: Record<string, DnaSelection>;
  /** Convenience map layer→fragment for the assembler. */
  fragments: Record<string, string>;
  /** Mean confidence across layers. */
  confidence: number;
}

// ── Compiler (Gemini) ─────────────────────────────────────────────
export interface SceneBlueprint {
  subject: string;
  wardrobe: string;
  environment?: string;
  pose: string;
  expression: string;
  sceneAction: string;
  narrative: string;
  symbolism: string;
}

// ── Assembler ─────────────────────────────────────────────────────
export interface AssembledPrompt {
  prompt: string;
  technique: TechniqueName;
  dna: VisualDNA;
  scene: SceneBlueprint;
}

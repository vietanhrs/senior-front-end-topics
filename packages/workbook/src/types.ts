import type { ComponentType } from 'react';

/**
 * A single concept entry in a level workbook.
 *
 * Each concept owns three things:
 *  - `doc`   : raw markdown theory (imported via `?raw`), rendered in the UI.
 *  - `Demo`  : an interactive, observable demonstration of the concept.
 *  - `Exercise` (optional): a hands-on task — usually a broken/incomplete
 *    implementation the reader has to complete/fix/improve, with a reveal-able
 *    solution.
 */
export interface ConceptModule {
  /** URL-safe identifier, also used as the route param. */
  slug: string;
  /** Short human title shown in the nav and page header. */
  title: string;
  /** One-line description shown in nav tooltips and the overview grid. */
  summary: string;
  /** Difficulty / focus tag(s) shown as badges. */
  tags: string[];
  /** Raw markdown theory document. */
  doc: string;
  /** Interactive demo component. */
  Demo: ComponentType;
  /** Optional exercise component. */
  Exercise?: ComponentType;
}

export interface LevelMeta {
  /** e.g. 1 */
  level: number;
  /** e.g. "Fundamentals" */
  title: string;
  /** Tagline shown under the title. */
  tagline: string;
  concepts: ConceptModule[];
}

/** One row in the global roadmap sidebar (all levels of the curriculum). */
export interface RoadmapLevel {
  level: number;
  title: string;
  concepts: string[];
}

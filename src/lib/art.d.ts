export const NOIMG: string
export const VIDIMG: string
export function genURL(gen: unknown[], old?: boolean, big?: boolean): string
export function awardArtURL(a: { k: string; title: string }): string
export function hash(s: string): number
export function rng(seed: number): () => number

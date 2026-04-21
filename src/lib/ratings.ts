export type RatingBreakdown = {
	production: number;
	acting: number;
	storyPlot: number;
	intent: number;
	daveFactor: number;
};

export const RATING_MIN = 0;
export const RATING_MAX = 6;
export const RATING_STEP = 0.25;

export const CATEGORIES = [
	{ key: 'production', label: 'production', hint: 'craft, camera, sound' },
	{ key: 'acting', label: 'acting', hint: 'performances, casting' },
	{ key: 'storyPlot', label: 'story / plot', hint: 'writing, pacing, payoff' },
	{ key: 'intent', label: 'intent', hint: 'humor, world, vibes' },
	{ key: 'daveFactor', label: 'dave factor', hint: 'personal enjoyment' }
] as const satisfies ReadonlyArray<{
	key: keyof RatingBreakdown;
	label: string;
	hint: string;
}>;

export function combinedScore(r: RatingBreakdown): number {
	return ((r.production + r.acting + r.storyPlot + r.intent + r.daveFactor) / 5) * 2;
}

export function isFlex(score: number): boolean {
	return score > 10;
}

/**
 * Raw score display, one decimal. Trailing ".0" is only dropped when the
 * integer part is ≥ 10 — keeps everything a consistent width (e.g. "9.0",
 * "8.5") while making perfect/flex scores pop as a bare "10", "12", etc.
 */
export function formatScore(score: number): string {
	const s = score.toFixed(1);
	const [int, dec] = s.split('.');
	return dec === '0' && Number(int) >= 10 ? int : s;
}

/** Public score display: capped at 10, same ".0-strip-only-at-10+" rule. */
export function formatPublicScore(score: number): string {
	return formatScore(Math.min(score, 10));
}

/** Tier used for colour coding */
export type ScoreTier = 'low' | 'mid' | 'high' | 'peak' | 'flex';

export function scoreTier(score: number): ScoreTier {
	if (score > 10) return 'flex';
	if (score >= 9) return 'peak';
	if (score >= 7) return 'high';
	if (score >= 5) return 'mid';
	return 'low';
}

/** Coerce any numeric-ish input (string from drizzle, or number) to a plain number. */
export function toNumber(v: number | string | null | undefined): number {
	if (v == null) return 0;
	if (typeof v === 'number') return v;
	const n = Number(v);
	return Number.isFinite(n) ? n : 0;
}

export function toBreakdown(r: {
	production: number | string;
	acting: number | string;
	storyPlot: number | string;
	intent: number | string;
	daveFactor: number | string;
}): RatingBreakdown {
	return {
		production: toNumber(r.production),
		acting: toNumber(r.acting),
		storyPlot: toNumber(r.storyPlot),
		intent: toNumber(r.intent),
		daveFactor: toNumber(r.daveFactor)
	};
}

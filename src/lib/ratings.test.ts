import { describe, expect, it } from 'vitest';
import {
	combinedScore,
	formatPublicScore,
	formatScore,
	isFlex,
	scoreTier,
	toBreakdown,
	toNumber
} from './ratings';

describe('combinedScore', () => {
	it('averages all five categories × 2', () => {
		expect(
			combinedScore({ production: 4, acting: 4, storyPlot: 4, intent: 4, daveFactor: 4 })
		).toBe(8);
	});

	it('handles fractional ratings', () => {
		expect(
			combinedScore({ production: 4.5, acting: 4.5, storyPlot: 4, intent: 5, daveFactor: 4.5 })
		).toBeCloseTo(9, 10);
	});

	it('production and acting contribute independently', () => {
		const a = combinedScore({ production: 6, acting: 2, storyPlot: 4, intent: 4, daveFactor: 4 });
		const b = combinedScore({ production: 2, acting: 6, storyPlot: 4, intent: 4, daveFactor: 4 });
		expect(a).toBe(b);
		expect(a).toBe(8);
	});

	it('caps out at 12 for five 6/5 ratings (the flex)', () => {
		expect(
			combinedScore({ production: 6, acting: 6, storyPlot: 6, intent: 6, daveFactor: 6 })
		).toBe(12);
	});

	it('a zero across the board is a zero', () => {
		expect(
			combinedScore({ production: 0, acting: 0, storyPlot: 0, intent: 0, daveFactor: 0 })
		).toBe(0);
	});
});

describe('isFlex', () => {
	it('only true for scores strictly > 10', () => {
		expect(isFlex(10)).toBe(false);
		expect(isFlex(10.01)).toBe(true);
		expect(isFlex(12)).toBe(true);
	});
});

describe('scoreTier', () => {
	it('tiers by range', () => {
		expect(scoreTier(0)).toBe('low');
		expect(scoreTier(4.99)).toBe('low');
		expect(scoreTier(5)).toBe('mid');
		expect(scoreTier(6.5)).toBe('mid');
		expect(scoreTier(7)).toBe('high');
		expect(scoreTier(8.99)).toBe('high');
		expect(scoreTier(9)).toBe('peak');
		expect(scoreTier(10)).toBe('peak');
		expect(scoreTier(10.01)).toBe('flex');
		expect(scoreTier(12)).toBe('flex');
	});
});

describe('formatScore', () => {
	it('keeps one decimal under 10, strips .0 at 10+', () => {
		expect(formatScore(9)).toBe('9.0');
		expect(formatScore(9.75)).toBe('9.8');
		expect(formatScore(8.5)).toBe('8.5');
		expect(formatScore(0)).toBe('0.0');
		expect(formatScore(10)).toBe('10');
		expect(formatScore(10.5)).toBe('10.5');
		expect(formatScore(12)).toBe('12');
	});
});

describe('formatPublicScore', () => {
	it('caps at 10 and strips .0 at 10+', () => {
		expect(formatPublicScore(8.5)).toBe('8.5');
		expect(formatPublicScore(9)).toBe('9.0');
		expect(formatPublicScore(9.75)).toBe('9.8');
		expect(formatPublicScore(10)).toBe('10');
		expect(formatPublicScore(10.01)).toBe('10');
		expect(formatPublicScore(12)).toBe('10');
	});
});

describe('toNumber', () => {
	it('handles drizzle numeric strings', () => {
		expect(toNumber('9.75')).toBe(9.75);
		expect(toNumber(4.5)).toBe(4.5);
		expect(toNumber(null)).toBe(0);
		expect(toNumber(undefined)).toBe(0);
		expect(toNumber('not a number')).toBe(0);
	});
});

describe('toBreakdown', () => {
	it('coerces drizzle row shape to a RatingBreakdown', () => {
		const breakdown = toBreakdown({
			production: '4.50',
			acting: '4.50',
			storyPlot: '4.00',
			intent: '5.00',
			daveFactor: '6.00'
		});
		expect(breakdown).toEqual({
			production: 4.5,
			acting: 4.5,
			storyPlot: 4,
			intent: 5,
			daveFactor: 6
		});
		expect(combinedScore(breakdown)).toBeCloseTo(9.6, 10);
	});
});

import { describe, expect, it } from 'vitest';
import {
	combinedScore,
	formatScore,
	isFlex,
	scoreTier,
	toBreakdown,
	toNumber
} from './ratings';

describe('combinedScore', () => {
	it('averages all four categories × 2', () => {
		expect(combinedScore({ production: 4, storyPlot: 4, misc: 4, daveFactor: 4 })).toBe(8);
	});

	it('handles fractional ratings', () => {
		expect(
			combinedScore({ production: 4.5, storyPlot: 4, misc: 5, daveFactor: 4.5 })
		).toBe(9);
	});

	it('matches the plan example (4.5 + 4 + 5 + 6)', () => {
		expect(
			combinedScore({ production: 4.5, storyPlot: 4, misc: 5, daveFactor: 6 })
		).toBe(9.75);
	});

	it('caps out at 12 for four 6/5 ratings (the flex)', () => {
		expect(combinedScore({ production: 6, storyPlot: 6, misc: 6, daveFactor: 6 })).toBe(12);
	});

	it('a zero across the board is a zero', () => {
		expect(combinedScore({ production: 0, storyPlot: 0, misc: 0, daveFactor: 0 })).toBe(0);
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
	it('always shows two decimals', () => {
		expect(formatScore(9)).toBe('9.00');
		expect(formatScore(9.75)).toBe('9.75');
		expect(formatScore(12)).toBe('12.00');
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
			storyPlot: '4.00',
			misc: '5.00',
			daveFactor: '6.00'
		});
		expect(breakdown).toEqual({ production: 4.5, storyPlot: 4, misc: 5, daveFactor: 6 });
		expect(combinedScore(breakdown)).toBe(9.75);
	});
});

import { describe, expect, it } from 'vitest';
import { slugify } from './slug';

describe('slugify', () => {
	it('lowercases + hyphenates basic titles', () => {
		expect(slugify('Dune')).toBe('dune');
		expect(slugify('2001: A Space Odyssey')).toBe('2001-a-space-odyssey');
	});

	it('strips accents', () => {
		expect(slugify('Amélie')).toBe('amelie');
		expect(slugify('Léon')).toBe('leon');
	});

	it('collapses consecutive separators', () => {
		expect(slugify('The   Good,  the    Bad & the Ugly')).toBe('the-good-the-bad-the-ugly');
	});

	it('trims leading/trailing hyphens', () => {
		expect(slugify('---hello---')).toBe('hello');
	});

	it('caps at 64 chars', () => {
		const long = 'a'.repeat(100);
		expect(slugify(long).length).toBeLessThanOrEqual(64);
	});

	it('handles emoji and strange characters by dropping them', () => {
		expect(slugify('The 🎬 Movie!')).toBe('the-movie');
	});
});

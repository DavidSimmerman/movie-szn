import { describe, expect, it } from 'vitest';
import { profileHref, profilePrefix, stripProfilePrefix, viewUsernameFromPath } from './profile';

describe('viewUsernameFromPath', () => {
	it('returns null on owner (un-prefixed) paths', () => {
		expect(viewUsernameFromPath('/reviews')).toBeNull();
		expect(viewUsernameFromPath('/')).toBeNull();
		expect(viewUsernameFromPath('/seasons/summer-2026')).toBeNull();
	});
	it('extracts the username from a /user/<name> prefix', () => {
		expect(viewUsernameFromPath('/user/rob/reviews')).toBe('rob');
		expect(viewUsernameFromPath('/user/rob')).toBe('rob');
		expect(viewUsernameFromPath('/user/r-o-b/reviews/inception-2010')).toBe('r-o-b');
	});
});

describe('stripProfilePrefix', () => {
	it('strips the prefix to the canonical route', () => {
		expect(stripProfilePrefix('/user/rob/reviews/inception-2010')).toBe('/reviews/inception-2010');
		expect(stripProfilePrefix('/user/rob/seasons')).toBe('/seasons');
	});
	it('maps a bare profile path to root', () => {
		expect(stripProfilePrefix('/user/rob')).toBe('/');
	});
	it('leaves un-prefixed paths untouched', () => {
		expect(stripProfilePrefix('/reviews')).toBe('/reviews');
		expect(stripProfilePrefix('/')).toBe('/');
	});
});

describe('profileHref', () => {
	it('uses the bare path for the owner', () => {
		expect(profileHref('/reviews/x', 'dave', 'dave')).toBe('/reviews/x');
	});
	it('prefixes for everyone else', () => {
		expect(profileHref('/reviews/x', 'rob', 'dave')).toBe('/user/rob/reviews/x');
		expect(profileHref('/seasons', 'rob', 'dave')).toBe('/user/rob/seasons');
	});
});

describe('profilePrefix', () => {
	it('returns the prefix for a profile path', () => {
		expect(profilePrefix('/user/rob/reviews')).toBe('/user/rob');
		expect(profilePrefix('/user/rob')).toBe('/user/rob');
	});
	it('returns empty for the owner', () => {
		expect(profilePrefix('/reviews')).toBe('');
		expect(profilePrefix('/')).toBe('');
	});
});

describe('round-trip', () => {
	it('strip + href reconstructs the original prefixed path', () => {
		const original = '/user/rob/reviews/inception-2010';
		const canonical = stripProfilePrefix(original);
		expect(profileHref(canonical, 'rob', 'dave')).toBe(original);
	});
});

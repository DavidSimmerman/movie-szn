import { describe, expect, it } from 'vitest';
import { hashIp, voterHash } from './visitor';

describe('hashIp', () => {
	it('returns a 32-char hex digest', () => {
		const h = hashIp('1.2.3.4');
		expect(h).toHaveLength(32);
		expect(h).toMatch(/^[0-9a-f]+$/);
	});

	it('is stable for the same input', () => {
		expect(hashIp('10.0.0.1')).toBe(hashIp('10.0.0.1'));
	});

	it('changes with different inputs', () => {
		expect(hashIp('10.0.0.1')).not.toBe(hashIp('10.0.0.2'));
	});

	it('handles null', () => {
		expect(hashIp(null)).toHaveLength(32);
	});
});

describe('voterHash', () => {
	it('combines ip and visitor id', () => {
		const a = voterHash('1.1.1.1', 'visitor-a');
		const b = voterHash('1.1.1.1', 'visitor-b');
		const c = voterHash('2.2.2.2', 'visitor-a');
		expect(a).not.toBe(b);
		expect(a).not.toBe(c);
	});

	it('is deterministic', () => {
		expect(voterHash('1.1.1.1', 'v')).toBe(voterHash('1.1.1.1', 'v'));
	});

	it('returns a 64-char hex digest', () => {
		const h = voterHash('1.1.1.1', 'v');
		expect(h).toHaveLength(64);
		expect(h).toMatch(/^[0-9a-f]+$/);
	});
});

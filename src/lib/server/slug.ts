import { eq } from 'drizzle-orm';
import { db } from './db';
import { movies } from './db/schema';

export function slugify(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 64);
}

/**
 * Build a unique movie slug from title + year, appending -2, -3... on collision.
 * Slug is stable after insert — never regenerate when the title changes.
 */
export async function buildMovieSlug(title: string, year: number): Promise<string> {
	if (!db) throw new Error('database not configured');

	const base = `${slugify(title)}-${year}`;
	let candidate = base;
	let n = 2;

	// Cap at 100 attempts to avoid pathological loops.
	for (let i = 0; i < 100; i++) {
		const existing = await db.query.movies.findFirst({
			where: eq(movies.slug, candidate),
			columns: { id: true }
		});
		if (!existing) return candidate;
		candidate = `${base}-${n++}`;
	}
	throw new Error(`could not allocate unique slug for ${title} (${year})`);
}

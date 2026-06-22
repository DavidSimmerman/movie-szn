import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { error, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$server/db';
import { movies, reviews } from '$db/schema';
import { getViewUser } from '$server/users';
import type { RequestHandler } from './$types';

const cacheDir = resolve(process.env.OG_CACHE_DIR ?? '/app/og-cache');
const selfOrigin = process.env.OG_SELF_ORIGIN ?? `http://127.0.0.1:${process.env.PORT ?? 3000}`;

// Coalesce concurrent generations of the same file (e.g. two crawlers at once).
const inflight = new Map<string, Promise<void>>();

function generate(ogPagePath: string, outPath: string): Promise<void> {
	const existing = inflight.get(outPath);
	if (existing) return existing;
	const run = new Promise<void>((res, rej) => {
		const child = spawn(process.execPath, ['scripts/og-screenshot.js'], {
			stdio: 'inherit',
			env: {
				...process.env,
				OG_SCREENSHOT_URL: `${selfOrigin}${ogPagePath}`,
				OG_OUT: outPath
			}
		});
		child.on('exit', (code) => (code === 0 ? res() : rej(new Error(`og-screenshot exit ${code}`))));
		child.on('error', rej);
	}).finally(() => inflight.delete(outPath));
	inflight.set(outPath, run);
	return run;
}

export const GET: RequestHandler = async ({ params, locals, url }) => {
	if (!db) throw error(503, 'database not configured');

	const viewUser = await getViewUser(locals.viewUsername);
	if (!viewUser) throw error(404, 'not found');

	const movie = await db.query.movies.findFirst({
		where: eq(movies.slug, params.slug),
		columns: { id: true }
	});
	if (!movie) throw error(404, 'not found');

	const review = await db.query.reviews.findFirst({
		where: and(eq(reviews.movieId, movie.id), eq(reviews.userId, viewUser.id)),
		columns: { updatedAt: true }
	});
	if (!review) throw error(404, 'no review yet for this movie');

	// URL → filesystem path: keep only slug-safe chars (these are trust boundaries).
	const safeSlug = params.slug.replace(/[^a-z0-9-]/gi, '');
	const safeUser = viewUser.username.replace(/[^a-z0-9-]/gi, '');
	const version = review.updatedAt.getTime();
	const outPath = resolve(cacheDir, `review-${safeUser}-${safeSlug}-${version}.png`);
	// `url.pathname` keeps any /user/<name> prefix; strip `.png` to get the og page to shoot.
	const ogPagePath = url.pathname.replace(/\.png$/, '');

	let png: Buffer;
	try {
		png = await readFile(outPath);
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
		try {
			await mkdir(cacheDir, { recursive: true });
			await generate(ogPagePath, outPath);
			png = await readFile(outPath);
		} catch (genErr) {
			// generation failed (e.g. browser crash) — fall back to the site card, not a broken preview
			console.error('[og review] generation failed, falling back to /og.png', genErr);
			throw redirect(302, '/og.png');
		}
	}

	return new Response(new Uint8Array(png), {
		headers: {
			'content-type': 'image/png',
			// filename is versioned by updatedAt, so a hit is safe to cache hard
			'cache-control': 'public, max-age=86400, s-maxage=604800, immutable'
		}
	});
};

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const cacheDir = resolve(process.env.OG_CACHE_DIR ?? '/app/og-cache');
const pngPath = resolve(cacheDir, 'og.png');

export const GET: RequestHandler = async () => {
	let png: Buffer;
	try {
		png = await readFile(pngPath);
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
			throw error(404, 'og image not generated yet');
		}
		throw err;
	}
	return new Response(new Uint8Array(png), {
		headers: {
			'content-type': 'image/png',
			'cache-control': 'public, max-age=3600, s-maxage=3600'
		}
	});
};

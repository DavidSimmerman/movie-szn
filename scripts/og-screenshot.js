#!/usr/bin/env node
// Captures the homepage hero into <OG_CACHE_DIR>/og.png for social previews.
// Invoked on a 3-hour interval by src/lib/server/og-schedule.ts; also runnable by hand.

import { chromium } from 'playwright';
import { mkdir, rename, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';

const port = process.env.PORT ?? '3000';
const url = process.env.OG_SCREENSHOT_URL ?? `http://127.0.0.1:${port}/`;
const cacheDir = resolve(process.env.OG_CACHE_DIR ?? '/app/og-cache');
const finalPath = resolve(cacheDir, 'og.png');
const tmpPath = resolve(cacheDir, `og.${process.pid}.tmp.png`);

const WIDTH = 1200;
const HEIGHT = 630;

async function run() {
	await mkdir(cacheDir, { recursive: true });

	const browser = await chromium.launch({ headless: true });
	try {
		const context = await browser.newContext({
			viewport: { width: WIDTH, height: HEIGHT },
			deviceScaleFactor: 2,
			reducedMotion: 'reduce'
		});
		const page = await context.newPage();

		await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
		await page.waitForSelector('h1', { timeout: 15_000 });

		await page.addStyleTag({
			content: `[data-og-hide]{display:none!important}body{overflow:hidden!important}`
		});
		await page.evaluate(() => window.scrollTo(0, 0));

		await page.screenshot({
			path: tmpPath,
			type: 'png',
			clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT }
		});
	} finally {
		await browser.close();
	}

	await rename(tmpPath, finalPath);
	console.log(`[og-screenshot] wrote ${finalPath}`);
}

try {
	await run();
} catch (err) {
	console.error('[og-screenshot] failed', err);
	try {
		await unlink(tmpPath);
	} catch {
		// ignore
	}
	process.exit(1);
}

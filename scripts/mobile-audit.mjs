// ponytail: throwaway audit harness — screenshots + overflow/touch-target report per route
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.AUDIT_BASE || 'http://localhost:5273';
const OUT = 'audit-shots';
mkdirSync(OUT, { recursive: true });

const PUBLIC = [
	'/',
	'/reviews',
	'/reviews/dune-part-two-2024',
	'/seasons',
	'/seasons/movie-szn-2025',
	'/seasons/movie-szn-2025/awards',
	'/seasons/movie-szn-2026',
	'/watchlist',
	'/suggest',
	'/reviewers',
	'/login'
];
const ADMIN = [
	'/admin',
	'/admin/movies',
	'/admin/movies/new',
	'/admin/reviews',
	'/admin/reviews/new?movieSlug=dune-part-two-2024',
	'/admin/seasons',
	'/admin/seasons/movie-szn-2025',
	'/admin/seasons/movie-szn-2025/awards',
	'/admin/suggestions',
	'/admin/users',
	'/admin/watchlist'
];
const VIEWPORTS = [
	{ name: '320', width: 320, height: 568 },
	{ name: '390', width: 390, height: 844 }
];

const browser = await chromium.launch();

async function audit(page, path, vp) {
	await page.goto(BASE + path, { waitUntil: 'networkidle' }).catch(() => {});
	await page.waitForTimeout(400);
	const slug = (path === '/' ? 'home' : path.replaceAll('/', '_').slice(1)) + '-' + vp.name;
	await page.screenshot({ path: `${OUT}/${slug}.png`, fullPage: true });
	return page.evaluate(() => {
		const iw = document.documentElement.clientWidth;
		const problems = [];
		// horizontal overflow offenders
		for (const el of document.querySelectorAll('body *')) {
			const r = el.getBoundingClientRect();
			if (r.width > 0 && (r.right > iw + 1 || r.left < -1)) {
				const s = getComputedStyle(el);
				if (
					s.position === 'fixed' ||
					s.overflowX === 'hidden' ||
					s.overflowX === 'auto' ||
					s.overflowX === 'scroll'
				)
					continue;
				const parentScrolls = el.closest(
					'[style*="overflow"], .overflow-x-auto, .overflow-hidden, .overflow-x-hidden'
				);
				if (parentScrolls) continue;
				problems.push(
					`OVERFLOW <${el.tagName.toLowerCase()} class="${(el.className + '').slice(0, 70)}"> right=${Math.round(r.right)} left=${Math.round(r.left)} vw=${iw}`
				);
				if (problems.length > 8) break;
			}
		}
		const scrollW = document.scrollingElement.scrollWidth;
		if (scrollW > iw + 1) problems.unshift(`PAGE-SCROLL scrollWidth=${scrollW} > viewport=${iw}`);
		// touch targets: visible interactive elements smaller than 40px in both dims
		const tiny = [];
		for (const el of document.querySelectorAll(
			'a, button, input, select, textarea, [role="button"]'
		)) {
			const r = el.getBoundingClientRect();
			if (r.width === 0 || r.height === 0) continue;
			if (r.height < 32 && r.width < 40) {
				tiny.push(
					`TINY <${el.tagName.toLowerCase()}> "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`
				);
			}
		}
		return [...problems, ...tiny.slice(0, 8)];
	});
}

for (const vp of VIEWPORTS) {
	const ctx = await browser.newContext({
		viewport: { width: vp.width, height: vp.height },
		isMobile: true,
		hasTouch: true,
		deviceScaleFactor: 2
	});
	const page = await ctx.newPage();

	for (const path of PUBLIC) {
		const problems = await audit(page, path, vp);
		console.log(`\n=== ${path} @${vp.name} ===`);
		problems.forEach((p) => console.log('  ' + p));
	}

	// login for admin routes
	await page.goto(BASE + '/login');
	await page.fill('#username', 'dave');
	await page.fill('#pw', 'devtest123');
	await page.click('button[type=submit]');
	await page
		.waitForURL('**/admin**', { timeout: 5000 })
		.catch(() => console.log('LOGIN FAILED — url: ' + page.url()));

	for (const path of ADMIN) {
		const problems = await audit(page, path, vp);
		console.log(`\n=== ${path} @${vp.name} ===`);
		problems.forEach((p) => console.log('  ' + p));
	}
	await ctx.close();
}
await browser.close();

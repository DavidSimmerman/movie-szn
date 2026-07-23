// Renders PWA icons from static/favicon.svg via Playwright (no image deps).
// Regenerate after changing the favicon: node scripts/make-icons.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const favicon = readFileSync('static/favicon.svg', 'utf8');
// full-bleed variant for maskable/apple: bg fills the canvas, glyph scaled into the safe zone
const fullBleed = favicon
	.replace('<rect width="32" height="32" rx="6" fill="#0b0b12" />', '')
	.replace(
		'viewBox="0 0 32 32">',
		'viewBox="0 0 32 32"><rect width="32" height="32" fill="#0b0b12"/><g transform="translate(16 16) scale(0.72) translate(-16 -16)">'
	)
	.replace('</svg>', '</g></svg>');

const jobs = [
	{ file: 'static/icon-192.png', size: 192, svg: favicon },
	{ file: 'static/icon-512.png', size: 512, svg: favicon },
	{ file: 'static/icon-maskable-512.png', size: 512, svg: fullBleed },
	{ file: 'static/apple-touch-icon.png', size: 180, svg: fullBleed }
];

const browser = await chromium.launch();
for (const { file, size, svg } of jobs) {
	const page = await browser.newPage({ viewport: { width: size, height: size } });
	await page.setContent(
		`<body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`
	);
	await page.screenshot({ path: file, omitBackground: true });
	await page.close();
	console.log(file);
}
await browser.close();

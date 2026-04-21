import { spawn } from 'node:child_process';
import { building } from '$app/environment';

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
const BOOT_DELAY_MS = 60_000;

declare global {
	// eslint-disable-next-line no-var
	var __ogScheduler: boolean | undefined;
	// eslint-disable-next-line no-var
	var __ogSchedulerRunning: boolean | undefined;
}

function runOnce() {
	if (globalThis.__ogSchedulerRunning) {
		console.log('[og-schedule] previous run still active, skipping');
		return;
	}
	globalThis.__ogSchedulerRunning = true;
	console.log('[og-schedule] capturing og image');
	const child = spawn(process.execPath, ['scripts/og-screenshot.js'], {
		stdio: 'inherit',
		env: process.env
	});
	child.on('exit', (code) => {
		globalThis.__ogSchedulerRunning = false;
		if (code !== 0) console.warn(`[og-schedule] run failed (exit ${code})`);
		else console.log('[og-schedule] run complete');
	});
	child.on('error', (err) => {
		globalThis.__ogSchedulerRunning = false;
		console.error('[og-schedule] spawn error', err);
	});
}

if (!building && !globalThis.__ogScheduler && process.env.OG_SCHEDULER !== 'off') {
	globalThis.__ogScheduler = true;
	const tickMs = Number(process.env.OG_TICK_MS) || THREE_HOURS_MS;
	const bootDelay = Number(process.env.OG_BOOT_DELAY_MS) || BOOT_DELAY_MS;
	setTimeout(() => {
		runOnce();
		setInterval(runOnce, tickMs).unref();
	}, bootDelay).unref();
	console.log(`[og-schedule] armed (tick=${tickMs}ms, bootDelay=${bootDelay}ms)`);
}

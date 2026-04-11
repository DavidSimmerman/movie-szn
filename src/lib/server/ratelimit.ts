import { sql } from 'drizzle-orm';
import { db } from './db';
import { rateLimits } from './db/schema';

export type RateLimitResult = {
	allowed: boolean;
	count: number;
	limit: number;
	remaining: number;
	resetAt: Date;
};

function windowStart(now: Date, granularity: 'hour' | 'day'): Date {
	const d = new Date(now);
	d.setMinutes(0, 0, 0);
	if (granularity === 'day') d.setHours(0);
	return d;
}

function windowEnd(start: Date, granularity: 'hour' | 'day'): Date {
	const d = new Date(start);
	if (granularity === 'hour') d.setHours(d.getHours() + 1);
	else d.setDate(d.getDate() + 1);
	return d;
}

/**
 * Fixed-window rate limit. Upserts a counter keyed by (bucket, window_start)
 * and returns the new count. Not a true sliding window, but honest and cheap.
 */
export async function checkRateLimit(
	bucket: string,
	limit: number,
	granularity: 'hour' | 'day' = 'hour'
): Promise<RateLimitResult> {
	if (!db) {
		return { allowed: true, count: 0, limit, remaining: limit, resetAt: new Date() };
	}

	const now = new Date();
	const start = windowStart(now, granularity);
	const reset = windowEnd(start, granularity);

	const rows = await db
		.insert(rateLimits)
		.values({ bucket, windowStart: start, count: 1 })
		.onConflictDoUpdate({
			target: [rateLimits.bucket, rateLimits.windowStart],
			set: { count: sql`${rateLimits.count} + 1` }
		})
		.returning({ count: rateLimits.count });

	const count = rows[0]?.count ?? 1;
	return {
		allowed: count <= limit,
		count,
		limit,
		remaining: Math.max(0, limit - count),
		resetAt: reset
	};
}

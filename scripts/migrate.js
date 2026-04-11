#!/usr/bin/env node
// Idempotent migration runner. Runs on container boot before the app starts.
// Exits non-zero on failure so Coolify marks the deploy bad.

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('[migrate] DATABASE_URL is not set — skipping');
	process.exit(0);
}

const client = postgres(url, { max: 1 });
const db = drizzle(client);

try {
	console.log('[migrate] running migrations from ./drizzle');
	await migrate(db, { migrationsFolder: './drizzle' });
	console.log('[migrate] done');
} catch (err) {
	console.error('[migrate] failed', err);
	process.exit(1);
} finally {
	await client.end();
}

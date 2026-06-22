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

	// Owner account: the migration seeds a placeholder "dave"; set the real
	// password hash (and display name) from env here so it stays out of git.
	const adminHash = process.env.ADMIN_PASSWORD_HASH;
	if (adminHash) {
		const name = process.env.ADMIN_NAME || 'Dave';
		await client`UPDATE users SET password_hash = ${adminHash}, name = ${name} WHERE is_admin = true`;
		console.log('[migrate] owner account synced');
	} else {
		console.warn('[migrate] ADMIN_PASSWORD_HASH not set — owner login disabled');
	}

	console.log('[migrate] done');
} catch (err) {
	console.error('[migrate] failed', err);
	process.exit(1);
} finally {
	await client.end();
}

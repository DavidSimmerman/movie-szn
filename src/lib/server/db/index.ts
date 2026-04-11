import { env } from '$env/dynamic/private';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = env.DATABASE_URL;

const client = connectionString
	? postgres(connectionString, {
			max: 10,
			idle_timeout: 30,
			connect_timeout: 10
		})
	: null;

export const db = client ? drizzle(client, { schema }) : null;

export async function checkDbConnection() {
	if (!client) {
		return { ok: false, reason: 'DATABASE_URL not set' };
	}
	await client`select 1`;
	return { ok: true };
}

import { json } from '@sveltejs/kit';
import { checkDbConnection } from '$server/db';

export const GET = async () => {
	const checks: Record<string, string> = { app: 'ok' };

	try {
		const result = await checkDbConnection();
		checks.db = result.ok ? 'ok' : `skipped: ${result.reason}`;
	} catch (err) {
		checks.db = err instanceof Error ? `error: ${err.message}` : 'error';
	}

	const critical = ['app'];
	const healthy = critical.every((k) => checks[k] === 'ok');
	return json({ status: healthy ? 'ok' : 'degraded', checks }, { status: healthy ? 200 : 503 });
};

import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter(),
		// /token takes the OAuth exchange as a cross-origin (sometimes Origin-less)
		// form POST, which SvelteKit's built-in check always rejects. The check is
		// re-implemented in hooks.server.ts, exempting only /token — whose security
		// is the single-use code + PKCE verifier, not the Origin header.
		csrf: { trustedOrigins: ['*'] },
		alias: {
			$db: 'src/lib/server/db',
			$server: 'src/lib/server'
		}
	}
};

export default config;

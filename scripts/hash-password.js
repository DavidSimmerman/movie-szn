#!/usr/bin/env node
// Generate an argon2id hash of the admin password for ADMIN_PASSWORD_HASH env var.
// Usage: npm run hash-password -- yourpassword
//    or: node scripts/hash-password.js yourpassword

import { hash } from '@node-rs/argon2';

const password = process.argv[2];
if (!password) {
	console.error('usage: npm run hash-password -- <password>');
	process.exit(1);
}

const digest = await hash(password, {
	memoryCost: 19456,
	timeCost: 2,
	outputLen: 32,
	parallelism: 1
});

console.log(digest);

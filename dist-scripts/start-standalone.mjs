import nextEnv from '@next/env';
import { existsSync, mkdirSync, symlinkSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const { loadEnvConfig } = nextEnv;
const rootDir = process.cwd();
const standaloneDir = join(rootDir, '.next', 'standalone');

function ensureDirectoryLink(source, target) {
	if (existsSync(target)) return;

	mkdirSync(dirname(target), { recursive: true });
	symlinkSync(relative(dirname(target), source), target, 'dir');
}

loadEnvConfig(rootDir, false);

ensureDirectoryLink(join(rootDir, '.next', 'static'), join(standaloneDir, '.next', 'static'));
ensureDirectoryLink(join(rootDir, 'public'), join(standaloneDir, 'public'));

await import('../.next/standalone/server.js');

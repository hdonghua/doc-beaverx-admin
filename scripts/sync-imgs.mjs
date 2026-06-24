import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'imgs');
const dest = join(root, 'docs', 'public', 'imgs');

if (!existsSync(src)) {
  console.warn('[sync-imgs] skip: imgs/ not found');
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true, force: true });
console.log('[sync-imgs] copied imgs/ -> docs/public/imgs/');

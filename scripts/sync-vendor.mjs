import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const vendorFiles = [
  {
    from: resolve(root, 'node_modules/feather-icons/dist/feather.min.js'),
    to: resolve(root, 'web/vendor/feather.min.js'),
  },
  {
    from: resolve(root, 'node_modules/sortablejs/Sortable.min.js'),
    to: resolve(root, 'web/vendor/Sortable.min.js'),
  },
];

mkdirSync(resolve(root, 'web/vendor'), { recursive: true });

for (const file of vendorFiles) {
  copyFileSync(file.from, file.to);
  console.log(`Synced ${file.to}`);
}

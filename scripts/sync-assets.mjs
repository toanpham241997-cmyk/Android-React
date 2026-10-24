import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'dist');
const target = path.join(root, 'android', 'app', 'src', 'main', 'assets');
if (!fs.existsSync(path.join(source, 'index.html'))) {
  throw new Error('Khong tim thay dist/index.html. Chay npm run build truoc.');
}
fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });
const index = fs.readFileSync(path.join(target, 'index.html'), 'utf8');
if (!index.includes('assets/')) throw new Error('Vite assets did not compile correctly');
console.log(`Android assets synced: ${target}`);

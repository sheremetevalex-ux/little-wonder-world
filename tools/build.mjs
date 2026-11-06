// Assembles dist/ for hosting. No bundler and no dependencies: it copies the app,
// lists every file in the service worker, stamps a content hash as the version and
// adds modulepreload tags, so a first visit fetches all code in one parallel burst.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
mkdirSync(dist);
for (const f of ['index.html', 'manifest.webmanifest', 'sw.js', 'src', 'icons']) cpSync(join(root, f), join(dist, f), { recursive: true });
writeFileSync(join(dist, '.nojekyll'), '');

const walk = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

const code = walk(join(dist, 'src')).filter((f) => f.endsWith('.js'));
const rel = (f) => relative(dist, f).replaceAll('\\', '/');

// Startup images are only requested by iOS while installing: no need to cache them.
const icons = walk(join(dist, 'icons')).filter((f) => !f.includes('/splash/'));
const files = ['./', './index.html', './manifest.webmanifest', ...code.map((f) => './' + rel(f)), ...icons.map((f) => './' + rel(f))];

const hash = createHash('sha256');
for (const f of [...code, ...icons, join(dist, 'index.html'), join(dist, 'manifest.webmanifest')]) hash.update(readFileSync(f));
const version = hash.digest('hex').slice(0, 12);

let sw = readFileSync(join(dist, 'sw.js'), 'utf8');
sw = sw.replace('__VERSION__', version).replace(/const FILES = \[.*\];/, `const FILES = ${JSON.stringify(files)};`);
writeFileSync(join(dist, 'sw.js'), sw);

let html = readFileSync(join(dist, 'index.html'), 'utf8');
const preload = code.map((f) => `<link rel="modulepreload" href="${rel(f)}">`).join('\n');
html = html.replace('<!--STARTUP-IMAGES-->', (existsSync(join(root, 'tools/startup-links.html')) ? readFileSync(join(root, 'tools/startup-links.html'), 'utf8') : '') + preload);
writeFileSync(join(dist, 'index.html'), html);

const kb = walk(dist).filter((f) => !f.includes('/splash/')).reduce((s, f) => s + statSync(f).size, 0) / 1024;
console.log(`Built version ${version}: ${files.length} cached files, ${kb.toFixed(0)} KB before compression`);

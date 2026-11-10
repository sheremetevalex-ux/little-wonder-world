// Bundles three.js into src/vendor/three.js: one minified ES module that the game
// loads like any of its own files, so it works offline and needs no CDN.
// The committed output means deploys never need npm.  Run: node tools/vendor.mjs
import { build } from 'esbuild';
const root = new URL('..', import.meta.url).pathname;
await build({
  entryPoints: [root + 'tools/vendor/three-entry.js'],
  bundle: true, minify: true, format: 'esm', target: 'es2020', legalComments: 'none',
  outfile: root + 'src/vendor/three.js',
  banner: { js: '/* three.js r187, MIT License, Copyright 2010-2025 three.js authors. Bundled for offline play. */' }
});
console.log('src/vendor/three.js written');

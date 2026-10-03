#!/usr/bin/env node
/* Downloads the latin subsets of the two typefaces and writes src/fonts.css
   with the woff2 payloads inlined as data URIs. Run once; the generated CSS is
   committed so the build is reproducible with no network and the delivered
   HTML renders identically on any machine. */
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const API = 'https://fonts.googleapis.com/css2?family=Inter:wght@400..900&family=JetBrains+Mono:wght@400..800&display=swap';

/* curl is used deliberately: it honours the environment's proxy CA bundle. */
const curl = (url, binary = false) =>
  execFileSync('curl', ['-sSL', '-A', UA, url], {
    encoding: binary ? 'buffer' : 'utf8', maxBuffer: 64 * 1024 * 1024,
  });

const css = curl(API);
const want = new Set(['latin', 'latin-ext']);
const out = ['/* Typefaces inlined by tools/fetch-fonts.mjs — do not hand-edit. */'];
let bytes = 0;

/* Google's CSS labels each @font-face with a /* subset *\/ comment just above
   it, so the two are matched together and everything but latin is dropped. */
const re = /\/\* ([\w-]+) \*\/\s*@font-face \{([^}]+)\}/g;
let mm;
while ((mm = re.exec(css))) {
  const [, sub, body] = mm;
  if (!want.has(sub)) continue;
  const url = body.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
  const fam = body.match(/font-family:\s*'([^']+)'/)?.[1];
  const wght = body.match(/font-weight:\s*([^;]+);/)?.[1]?.trim();
  const range = body.match(/unicode-range:\s*([^;]+);/)?.[1]?.trim();
  if (!url || !fam) continue;
  const buf = curl(url, true);
  bytes += buf.length;
  out.push(
    `@font-face{font-family:'${fam}';font-style:normal;font-weight:${wght};font-display:block;` +
    `src:url(data:font/woff2;base64,${buf.toString('base64')}) format('woff2');` +
    `unicode-range:${range};}`
  );
  console.log(`  ${fam.padEnd(16)} ${sub.padEnd(10)} ${(buf.length / 1024).toFixed(1)} KB`);
}

if (out.length < 2) throw new Error('no font faces captured — check network access');
await writeFile(join(here, '..', 'src', 'fonts.css'), out.join('\n') + '\n');
console.log(`wrote src/fonts.css · ${(bytes / 1024).toFixed(1)} KB of font data · ${out.length - 1} faces`);

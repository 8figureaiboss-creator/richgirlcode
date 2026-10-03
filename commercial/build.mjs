#!/usr/bin/env node
/* Inlines src/* into a single portable HTML file. No bundler, no deps. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, 'src');
const OUT = join(here, 'dist', 'ota-commercial-30s.html');

const shell = await readFile(join(SRC, 'shell.html'), 'utf8');
const seen = [];

const html = await replaceAsync(shell, /^[ \t]*<!--#include\s+([\w.-]+)-->[ \t]*$/gm, async (_m, file) => {
  const body = await readFile(join(SRC, file), 'utf8');
  seen.push(file);
  return body.trimEnd();
});

if (/<!--#include/.test(html)) throw new Error('unresolved include directive');

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, html);

const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
console.log(`built  ${OUT}`);
console.log(`       ${seen.length} modules inlined · ${kb} KB · ${html.split('\n').length} lines`);

async function replaceAsync(str, re, fn) {
  const jobs = [];
  str.replace(re, (...args) => { jobs.push(fn(...args)); return ''; });
  const done = await Promise.all(jobs);
  let i = 0;
  return str.replace(re, () => done[i++]);
}

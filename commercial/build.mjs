#!/usr/bin/env node
/* Inlines src/* into a single portable HTML file. No bundler, no deps. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, 'src');
/* Two films share one engine; each has its own shell and its own scenes. */
const FILMS = [
  ['shell.html',       'ota-commercial.html'],
  ['shell-howto.html', 'ota-howto.html'],
];

await mkdir(join(here, 'dist'), { recursive: true });
for (const [shellFile, outFile] of FILMS) {
  const OUT = join(here, 'dist', outFile);
  const shell = await readFile(join(SRC, shellFile), 'utf8');
  const seen = [];

  const html = await replaceAsync(shell, /^[ \t]*<!--#include\s+([\w.-]+)-->[ \t]*$/gm, async (_m, file) => {
    const body = await readFile(join(SRC, file), 'utf8');
    seen.push(file);
    return body.trimEnd();
  });

  if (/<!--#include/.test(html)) throw new Error(`unresolved include directive in ${shellFile}`);

  await writeFile(OUT, html);
  const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
  console.log(`built  ${OUT}`);
  console.log(`       ${seen.length} modules inlined · ${kb} KB · ${html.split('\n').length} lines`);
}

async function replaceAsync(str, re, fn) {
  const jobs = [];
  str.replace(re, (...args) => { jobs.push(fn(...args)); return ''; });
  const done = await Promise.all(jobs);
  let i = 0;
  return str.replace(re, () => done[i++]);
}

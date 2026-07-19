#!/usr/bin/env node

import { execFile, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { promisify } from 'node:util';

import { CURRENT_RELEASE_CONFIG, REPOSITORY_ROOT } from './release-config.mjs';
import { examplePacksForConfig, sha256 } from './release-lib.mjs';

const execFileAsync = promisify(execFile);
const capture = process.argv.includes('--capture');
const captureRoot = resolve(REPOSITORY_ROOT, 'release', 'browser-captures');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function chromeExecutable() {
  const candidates = [
    process.env.CHROME_BIN,
    process.platform === 'win32' && process.env.PROGRAMFILES
      ? join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe') : null,
    process.platform === 'win32' && process.env['PROGRAMFILES(X86)']
      ? join(process.env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe') : null,
    process.platform === 'win32' && process.env.LOCALAPPDATA
      ? join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe') : null,
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ].filter(Boolean);
  const executable = candidates.find((candidate) => existsSync(candidate));
  assert(executable, 'Chrome or Chromium is required. Set CHROME_BIN if necessary.');
  return executable;
}

async function freePort() {
  const { createServer } = await import('node:net');
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close((error) => error ? reject(error) : resolvePort(address.port));
    });
  });
}

async function waitForServer(url, processHandle) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    assert(processHandle.exitCode === null, `Vite exited early (${processHandle.exitCode}).`);
    try { if ((await fetch(url)).ok) return; } catch { /* retry */ }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  throw new Error('Timed out waiting for the Alpha.7 browser harness.');
}

function decodeDom(dom) {
  const state = dom.match(/<html\b[^>]*\bdata-state="([^"]+)"/i)?.[1];
  const error = dom.match(/<pre\s+id="error"[^>]*>([\s\S]*?)<\/pre>/i)?.[1]?.trim();
  assert(state === 'ready', `Alpha.7 browser harness failed (state=${String(state)}${error ? `, error=${error}` : ''}).`);
  const result = dom.match(/<pre\s+id="result"([^>]*)>([\s\S]*?)<\/pre>/i);
  assert(result, 'Alpha.7 browser harness returned no result.');
  const version = result[1].match(/\bdata-version="([^"]+)"/i)?.[1];
  const count = Number(result[1].match(/\bdata-count="([^"]+)"/i)?.[1]);
  const text = result[2].replaceAll('&quot;', '"').replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>');
  return { version, count, exports: JSON.parse(text) };
}

async function verify() {
  assert(CURRENT_RELEASE_CONFIG.packVersion === '0.1.0-alpha.7', 'The current release must retain the Alpha.7 pack contract.');
  const packs = examplePacksForConfig();
  assert(packs.length === 3, 'Alpha.7 release registry must contain exactly three example packs.');
  const port = await freePort();
  const url = `http://127.0.0.1:${port}/tests/browser/alpha7-export.html`;
  const profile = await mkdtemp(join(tmpdir(), 'mapsoo-alpha7-browser-'));
  const vite = spawn(process.execPath, [join(REPOSITORY_ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: REPOSITORY_ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  });
  let viteErrors = '';
  vite.stderr.on('data', (chunk) => { viteErrors += String(chunk); });
  try {
    await waitForServer(url, vite);
    const { stdout } = await execFileAsync(chromeExecutable(), [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
      '--disable-background-networking', '--disable-component-update', '--no-first-run',
      `--user-data-dir=${profile}`, '--virtual-time-budget=120000', '--dump-dom', url,
    ], { maxBuffer: 32 * 1024 * 1024, timeout: 90_000, windowsHide: true });
    const result = decodeDom(stdout);
    assert(result.version === CURRENT_RELEASE_CONFIG.packVersion && result.count === 3, 'Alpha.7 browser envelope differs from the registered pack contract.');
    assert(Array.isArray(result.exports) && result.exports.length === 3, 'Alpha.7 browser result must contain three exports.');
    const hashes = [];
    for (const [index, descriptor] of packs.entries()) {
      const exported = result.exports[index];
      const fileName = CURRENT_RELEASE_CONFIG.release.files[descriptor.releaseFileKey];
      assert(exported.id === descriptor.id, `Alpha.7 browser pack order/ID mismatch at ${index}.`);
      assert(exported.filename === fileName, `${descriptor.id} browser filename differs from the registry.`);
      const bytes = Buffer.from(exported.bytes, 'base64');
      const hash = sha256(bytes);
      hashes.push({ id: descriptor.id, file: fileName, bytes: bytes.length, sha256: hash });
      if (capture) {
        const output = resolve(captureRoot, fileName);
        assert(output.startsWith(`${captureRoot}${sep}`) && output.slice(captureRoot.length + 1) === fileName, 'Unsafe Alpha.7 browser capture path.');
        await mkdir(captureRoot, { recursive: true });
        await writeFile(output, bytes);
      } else {
        assert(hash === descriptor.expectedSha256, `${descriptor.id} browser hash differs from the pinned candidate hash.`);
      }
    }
    console.log(`MAPSOO_BROWSER_ALPHA7_${capture ? 'CAPTURED' : 'OK'} ${hashes.map(({ id, bytes, sha256: hash }) => `${id}:bytes=${bytes}:sha256=${hash}`).join(' ')}`);
  } finally {
    vite.kill();
    await rm(profile, { recursive: true, force: true });
    if (vite.exitCode !== null && vite.exitCode !== 0 && viteErrors.trim()) process.stderr.write(viteErrors);
  }
}

try { await verify(); } catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}

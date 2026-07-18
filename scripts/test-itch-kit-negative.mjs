#!/usr/bin/env node

import { readFile, writeFile, mkdir, symlink, unlink } from 'node:fs/promises';
import { join, win32 } from 'node:path';

import JSZip from 'jszip';

import {
  ITCH_RELEASE_ROOT,
  buildItchKit,
  removeItchOutput,
  verifyPackZip,
  verifyItchKit,
} from './itch-kit-lib.mjs';
import {
  CURRENT_RELEASE_CONFIG,
  RELEASE_FILES,
  assertDescendantPath,
  sha256,
} from './release-lib.mjs';

const testRoot = join(ITCH_RELEASE_ROOT, '.negative-test');
const linkTarget = join(ITCH_RELEASE_ROOT, '.negative-link-target');
const linkPath = join(ITCH_RELEASE_ROOT, '.negative-link');
let passed = 0;

async function expectFailure(name, mutate, expectedPattern) {
  await buildItchKit(testRoot);
  await mutate();
  try {
    await verifyItchKit(testRoot);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!expectedPattern.test(message)) {
      throw new Error(`${name} failed for the wrong reason: ${message}`);
    }
    passed += 1;
    return;
  }
  throw new Error(`${name} was accepted unexpectedly`);
}

function expectSyncFailure(name, action, expectedPattern) {
  try {
    action();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!expectedPattern.test(message)) {
      throw new Error(`${name} failed for the wrong reason: ${message}`);
    }
    passed += 1;
    return;
  }
  throw new Error(`${name} was accepted unexpectedly`);
}

async function expectPackFailure(name, createBytes, expectedPattern) {
  await buildItchKit(testRoot);
  const packPath = join(testRoot, 'uploads', RELEASE_FILES.examplePack);
  const bytes = await createBytes();
  await writeFile(packPath, bytes);
  try {
    await verifyPackZip(packPath, sha256(bytes));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!expectedPattern.test(message)) {
      throw new Error(`${name} failed for the wrong reason: ${message}`);
    }
    passed += 1;
    return;
  }
  throw new Error(`${name} was accepted unexpectedly`);
}

async function createZip(entries) {
  const zip = new JSZip();
  for (const [path, bytes] of entries) {
    zip.file(path, bytes, { createFolders: false });
  }
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

async function rewriteLegacyReceipt(mutator) {
  await buildItchKit(testRoot);
  const packPath = join(testRoot, 'uploads', RELEASE_FILES.examplePack);
  const zip = await JSZip.loadAsync(await readFile(packPath), { createFolders: false });
  const packRoot = CURRENT_RELEASE_CONFIG.release.examplePack.archiveRoot;
  const receiptPath = `${packRoot}/generation-receipt.json`;
  const manifestPath = `${packRoot}/mapsoo.manifest.json`;
  const receiptEntry = zip.file(receiptPath);
  const manifestEntry = zip.file(manifestPath);
  if (!receiptEntry || !manifestEntry) throw new Error('negative fixture is missing receipt or manifest');

  const receipt = JSON.parse(await receiptEntry.async('string'));
  const manifest = JSON.parse(await manifestEntry.async('string'));
  await mutator({ receipt, manifest });
  const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  const receiptRecord = manifest.files.find((record) => record.path === 'generation-receipt.json');
  if (!receiptRecord) throw new Error('negative fixture manifest is missing its receipt record');
  receiptRecord.bytes = receiptBytes.length;
  receiptRecord.sha256 = sha256(receiptBytes);
  zip.file(receiptPath, receiptBytes, { createFolders: false });
  zip.file(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { createFolders: false });
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
}

async function rewriteKitIntegrityRecords(packBytes) {
  const packHash = sha256(packBytes);
  const checksumBytes = Buffer.from(`${packHash}  ${RELEASE_FILES.examplePack}\n`, 'utf8');
  await writeFile(join(testRoot, 'uploads', 'SHA256SUMS'), checksumBytes);
  const manifestPath = join(testRoot, 'itch-upload-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  for (const record of manifest.files) {
    if (record.path === `uploads/${RELEASE_FILES.examplePack}`) {
      record.bytes = packBytes.length;
      record.sha256 = packHash;
    } else if (record.path === 'uploads/SHA256SUMS') {
      record.bytes = checksumBytes.length;
      record.sha256 = sha256(checksumBytes);
    }
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

async function runReceiptPolicyNegativeCases() {
  switch (CURRENT_RELEASE_CONFIG.receiptVerifier) {
    case 'legacy-alpha1':
      await expectPackFailure(
        'receipt and manifest AI semantic conflict with recomputed inner integrity',
        () => rewriteLegacyReceipt(({ receipt }) => {
          receipt.contains_generative_ai = true;
        }),
        /legacy receipt must declare contains_generative_ai=false/,
      );

      await expectPackFailure(
        'forged non-builtin receipt generator with recomputed inner integrity',
        () => rewriteLegacyReceipt(({ receipt }) => {
          receipt.generator = { id: 'future-ai-provider', version: '1.0.0' };
        }),
        /legacy receipt must use builtin procedural-pixel-v1@0\.1\.0/,
      );

      await expectPackFailure(
        'future receipt schema hidden inside alpha1 pack',
        () => rewriteLegacyReceipt(({ receipt }) => {
          receipt.schema_version = '0.2.0';
        }),
        /legacy receipt schema must be 0\.1\.0/,
      );

      await expectPackFailure(
        'forged manifest pack ID',
        () => rewriteLegacyReceipt(({ manifest }) => {
          manifest.pack.id = 'forged-pack';
        }),
        /pack ID mismatch|pack ID must match trusted release config/,
      );

      await expectPackFailure(
        'forged manifest pack version',
        () => rewriteLegacyReceipt(({ manifest }) => {
          manifest.pack.version = '9999.0.0';
        }),
        /manifest version mismatch|pack version must match trusted release config/,
      );
      return;
    default:
      throw new Error(
        `No negative receipt test suite is registered for ${CURRENT_RELEASE_CONFIG.receiptVerifier}`,
      );
  }
}

try {
  await removeItchOutput(testRoot);

  expectSyncFailure(
    'cross-volume output path',
    () => assertDescendantPath('C:\\safe', 'D:\\victim', 'unsafe output', win32),
    /unsafe output/,
  );
  expectSyncFailure(
    'exact output parent',
    () => assertDescendantPath('C:\\safe', 'C:\\safe', 'unsafe output', win32),
    /unsafe output/,
  );
  expectSyncFailure(
    'outside output parent',
    () => assertDescendantPath('C:\\safe', 'C:\\victim', 'unsafe output', win32),
    /unsafe output/,
  );
  const allowedOutput = assertDescendantPath('C:\\safe', 'C:\\safe\\..safe', 'unsafe output', win32);
  if (allowedOutput !== 'C:\\safe\\..safe') {
    throw new Error(`safe descendant path resolved unexpectedly: ${allowedOutput}`);
  }

  await removeItchOutput(linkTarget);
  await mkdir(linkTarget, { recursive: true });
  try {
    await unlink(linkPath);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  await symlink(linkTarget, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
  try {
    await buildItchKit(join(linkPath, 'victim'));
    throw new Error('symbolic output path was accepted unexpectedly');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/symbolic link or junction/.test(message)) throw error;
    passed += 1;
  } finally {
    await unlink(linkPath);
    await removeItchOutput(linkTarget);
  }

  await expectFailure(
    'bundled importer',
    () => writeFile(join(testRoot, 'uploads', RELEASE_FILES.godotImporter), Buffer.from('forbidden')),
    /file list is invalid/,
  );

  await expectFailure(
    'OS platform claim',
    async () => {
      const path = join(testRoot, 'page', 'metadata.json');
      const metadata = JSON.parse(await readFile(path, 'utf8'));
      metadata.platforms = ['Windows'];
      await writeFile(path, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
    },
    /must not claim OS platforms/,
  );

  await expectFailure(
    'unexpected metadata field',
    async () => {
      const path = join(testRoot, 'page', 'metadata.json');
      const metadata = JSON.parse(await readFile(path, 'utf8'));
      metadata.download_count = 10_000;
      await writeFile(path, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
    },
    /unexpected or missing fields/,
  );

  await expectFailure(
    'missing AI code disclosure',
    async () => {
      const path = join(testRoot, 'page', 'metadata.json');
      const metadata = JSON.parse(await readFile(path, 'utf8'));
      metadata.generative_ai_disclosure.categories = ['Text & Dialog'];
      metadata.generative_ai_disclosure.code = false;
      await writeFile(path, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
    },
    /Text & Dialog and Code|code disclosure must be true/,
  );

  await expectFailure(
    'placeholder page copy',
    async () => {
      const path = join(testRoot, 'page', 'page.md');
      await writeFile(path, `${await readFile(path, 'utf8')}\n[REPLACE: ITCH_URL]\n`, 'utf8');
    },
    /replacement placeholder/,
  );

  await expectFailure(
    'untested Godot compatibility claim',
    async () => {
      const path = join(testRoot, 'page', 'page.md');
      await writeFile(path, `${await readFile(path, 'utf8')}\nSupports Godot 4.3+.\n`, 'utf8');
    },
    /untested Godot 4\.3\+ compatibility/,
  );

  await expectFailure(
    'CRLF page copy',
    async () => {
      const path = join(testRoot, 'page', 'page.md');
      const page = await readFile(path, 'utf8');
      await writeFile(path, page.replace(/\n/g, '\r\n'), 'utf8');
    },
    /must use LF line endings/,
  );

  await expectFailure(
    'incorrect checksum',
    () => writeFile(
      join(testRoot, 'uploads', 'SHA256SUMS'),
      `${'0'.repeat(64)}  ${RELEASE_FILES.examplePack}\n`,
      'utf8',
    ),
    /must contain only the uploaded asset ZIP/,
  );

  await expectFailure(
    'invalid pack ZIP',
    () => writeFile(join(testRoot, 'uploads', RELEASE_FILES.examplePack), Buffer.from('not a zip')),
    /zip|signature|archive|central directory/i,
  );

  await expectFailure(
    'tampered pack with recomputed kit integrity records',
    async () => {
      const path = join(testRoot, 'uploads', RELEASE_FILES.examplePack);
      const original = await readFile(path);
      const tampered = Buffer.concat([original, Buffer.from([0])]);
      await writeFile(path, tampered);
      await rewriteKitIntegrityRecords(tampered);
    },
    /differs from the verified GitHub release pack/,
  );

  const packRoot = CURRENT_RELEASE_CONFIG.release.examplePack.archiveRoot;
  await expectPackFailure(
    'ZIP traversal path',
    () => createZip([[`${packRoot}/../../escape.json`, '{}']]),
    /unsafe path|unsafe segment|outside its versioned root|sanitized unsafe path/,
  );
  await expectPackFailure(
    'ZIP addon path',
    () => createZip([[`${packRoot}/addons/malicious.gd`, 'extends Node']]),
    /forbidden engine path/,
  );
  await expectPackFailure(
    'ZIP oversized entry',
    () => createZip([[`${packRoot}/oversized.json`, Buffer.alloc(10 * 1024 * 1024 + 1)]]),
    /declared size limit/,
  );

  await runReceiptPolicyNegativeCases();

  await expectFailure(
    'invalid cover',
    async () => {
      const path = join(testRoot, 'media', 'cover-1260x1000.png');
      const bytes = await readFile(path);
      bytes[0] = 0;
      await writeFile(path, bytes);
    },
    /invalid PNG signature/,
  );

  await expectFailure(
    'stale upload manifest',
    async () => {
      const path = join(testRoot, 'itch-upload-manifest.json');
      const manifest = JSON.parse(await readFile(path, 'utf8'));
      manifest.files[0].bytes += 1;
      await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    },
    /records differ from final output bytes/,
  );

  console.log(`MAPSOO_ITCH_NEGATIVE_OK cases=${passed}`);
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
} finally {
  await removeItchOutput(testRoot);
}

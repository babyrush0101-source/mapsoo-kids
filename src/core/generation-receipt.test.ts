import { describe, expect, it } from 'vitest';
import receiptSchema from '../../schemas/mapsoo-generation-receipt.schema.json';
import { generateWorld } from './generate-world';
import {
  buildBuiltinProceduralReceipt,
  generationReceiptManifestProjection,
  validateGenerationReceipt,
  type GenerationReceipt,
  type GenerationReceiptProvider,
} from './generation-receipt';
import { DEFAULT_WORLD_SPEC } from './world-spec';

const CREATED_AT = '2026-07-18T11:43:25.533Z';
const INPUT_PATH = 'worlds/sunny-meadow.world.json';
const INPUT_HASH = 'a'.repeat(64);
const LICENSE_HASH = 'b'.repeat(64);
const SOURCE_HASH = 'c'.repeat(64);

function buildReceipt(): GenerationReceipt {
  return buildBuiltinProceduralReceipt({
    world: generateWorld(DEFAULT_WORLD_SPEC),
    inputSpec: { path: INPUT_PATH, sha256: INPUT_HASH },
    createdAt: CREATED_AT,
  });
}

function issueCodes(value: unknown): string[] {
  return validateGenerationReceipt(value).map((entry) => entry.code);
}

describe('generation receipt contract', () => {
  it('keeps schema identity, SemVer, and HTTPS credential rules aligned with runtime validation', () => {
    const semver = new RegExp(receiptSchema.$defs.semver.pattern);
    const httpsUrl = new RegExp(receiptSchema.$defs.httpsUrl.pattern);
    const supportedLicenses = receiptSchema.$defs.licenseId.oneOf[0].enum ?? [];
    const licenseRef = new RegExp(receiptSchema.$defs.licenseId.oneOf[1].pattern ?? '(?!)');

    expect(receiptSchema.$defs.semver.maxLength).toBe(80);
    expect(semver.test('1.2.3-alpha.1+build.7')).toBe(true);
    expect(semver.test('1.0.0-01')).toBe(false);
    expect(semver.test('1.0.0-alpha.01')).toBe(false);
    expect(httpsUrl.test('https://example.com/terms')).toBe(true);
    expect(httpsUrl.test('https://user:secret@example.com/terms')).toBe(false);
    expect(httpsUrl.test('https://example.com/source?token=secret')).toBe(false);
    expect(httpsUrl.test('https://example.com/source#secret')).toBe(false);
    expect(supportedLicenses).toContain('CC0-1.0');
    expect(supportedLicenses).not.toContain('TotallyMadeUpLicense');
    expect(licenseRef.test('LicenseRef-Example-Terms')).toBe(true);

    const receipt = buildReceipt();
    receipt.provider.id = 'provider.name_v2';
    receipt.provider.version = '1.2.3-alpha.1+build.7';
    expect(validateGenerationReceipt(receipt)).toEqual([]);
  });

  it('builds the exact built-in procedural receipt and manifest projection', () => {
    const receipt = buildReceipt();

    expect(receipt).toEqual({
      schema_version: '0.2.0',
      created_at: CREATED_AT,
      world: {
        id: 'sunny-meadow',
        input_spec: { path: INPUT_PATH, sha256: INPUT_HASH },
        seed: 'mapsoo-demo-001',
      },
      provider: {
        id: 'procedural-pixel-v1',
        version: '0.1.0',
        execution: 'local',
        output_provenance: 'procedural',
      },
      model: null,
      workflow: {
        id: 'mapsoo-procedural-world-pack',
        version: '0.1.0',
        definition_sha256: null,
      },
      transformations: [
        { id: 'seeded-map-layout', version: '0.1.0' },
        { id: 'procedural-pixel-atlas', version: '0.1.0' },
        { id: 'png-rgba-export', version: '0.1.0' },
      ],
      ai_disclosure: {
        contains_generative_ai: false,
        human_curated: false,
        statement: null,
      },
      licensing: {
        output: { id: 'CC0-1.0', notice_path: 'license-assets.md' },
        provider_terms: null,
      },
      sources: [],
    });
    expect(generationReceiptManifestProjection(receipt)).toEqual({
      contains_generative_ai: false,
      model_provider: null,
      model: null,
      seed: 'mapsoo-demo-001',
      human_curated: false,
    });
    expect(validateGenerationReceipt(receipt, {
      world: generateWorld(DEFAULT_WORLD_SPEC),
      inputSpec: { path: INPUT_PATH, sha256: INPUT_HASH },
      createdAt: CREATED_AT,
      provider: receipt.provider,
      outputLicense: { id: 'CC0-1.0', noticePath: 'license-assets.md' },
      manifestProvenance: generationReceiptManifestProjection(receipt),
      files: [
        { path: INPUT_PATH, sha256: INPUT_HASH },
        { path: 'license-assets.md', sha256: LICENSE_HASH },
      ],
    })).toEqual([]);
  });

  it('rejects unknown and missing fields at every strict object boundary', () => {
    const candidate = structuredClone(buildReceipt()) as GenerationReceipt & {
      unexpected?: boolean;
      provider: GenerationReceiptProvider & { secret?: string };
    };
    candidate.unexpected = true;
    candidate.provider.secret = 'must-not-pass-through';
    delete (candidate.world as Partial<GenerationReceipt['world']>).seed;

    const issues = validateGenerationReceipt(candidate);
    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'receipt.unknown-field', message: expect.stringContaining('unexpected') }),
      expect.objectContaining({ code: 'receipt.unknown-field', message: expect.stringContaining('secret') }),
      expect.objectContaining({ code: 'receipt.missing-field', message: expect.stringContaining('seed') }),
    ]));
  });

  it('enforces canonical timestamps and rejects hostile roots without throwing', () => {
    const candidate = structuredClone(buildReceipt()) as unknown as {
      schema_version: string;
      created_at: string;
    };
    candidate.schema_version = '0.1.0';
    candidate.created_at = '2026-07-18T11:43:25Z';
    expect(issueCodes(candidate)).toEqual(expect.arrayContaining([
      'receipt.schema-version',
      'receipt.created-at',
    ]));

    const hostile = new Proxy({}, {
      ownKeys() {
        throw new Error('hostile receipt');
      },
    });
    expect(validateGenerationReceipt(hostile)).toEqual([
      expect.objectContaining({ code: 'receipt.invalid-root', severity: 'error' }),
    ]);
  });

  it('rejects non-JSON receipt structures before reading provider fields', () => {
    const sparse = buildReceipt();
    sparse.transformations = new Array(1);
    expect(issueCodes(sparse)).toContain('receipt.non-json-value');

    const circular = buildReceipt() as GenerationReceipt & { loop?: unknown };
    circular.loop = circular;
    expect(issueCodes(circular)).toContain('receipt.circular-json');

    const accessor = buildReceipt();
    Object.defineProperty(accessor.provider, 'execution', {
      enumerable: true,
      get: () => 'local',
    });
    expect(issueCodes(accessor)).toContain('receipt.non-json-value');

    const secretUrl = buildReceipt();
    secretUrl.sources = [{
      id: 'secret-source',
      kind: 'reference-asset',
      sha256: SOURCE_HASH,
      uri: 'https://token@example.com/reference.png',
      license: { id: 'CC0-1.0', url: null, attribution: null },
    }];
    expect(issueCodes(secretUrl)).toContain('receipt.sources');
  });

  it('fails fast on oversized strings and wide untrusted structures', () => {
    const oversized = buildReceipt();
    oversized.ai_disclosure.statement = 'x'.repeat(300 * 1024);
    expect(validateGenerationReceipt(oversized)).toEqual([
      expect.objectContaining({ code: 'receipt.too-large' }),
    ]);

    const tooWide = buildReceipt();
    tooWide.transformations = Array.from(
      { length: 4_097 },
      (_, index) => ({ id: `step-${index}`, version: '1.0.0' }),
    );
    expect(validateGenerationReceipt(tooWide)).toEqual([
      expect.objectContaining({ code: 'receipt.too-complex' }),
    ]);
  });

  it('rejects unknown bare license names and requires public terms for custom source licenses', () => {
    const unknownOutput = buildReceipt();
    unknownOutput.licensing.output.id = 'TotallyMadeUpLicense';
    expect(issueCodes(unknownOutput)).toContain('receipt.license');

    const explicitOutput = buildReceipt();
    explicitOutput.licensing.output.id = 'LicenseRef-Example-Output-Terms';
    expect(validateGenerationReceipt(explicitOutput)).toEqual([]);

    const customSource = buildReceipt();
    customSource.sources = [{
      id: 'custom-source',
      kind: 'third-party-asset',
      sha256: SOURCE_HASH,
      uri: 'https://example.com/source.png',
      license: { id: 'LicenseRef-Example-Source-Terms', url: null, attribution: null },
    }];
    expect(issueCodes(customSource)).toContain('receipt.license');

    customSource.sources[0].license.url = 'https://example.com/source-license';
    expect(validateGenerationReceipt(customSource)).toEqual([]);
  });

  it('accepts a fully disclosed AI receipt and rejects incomplete AI evidence', () => {
    const aiReceipt = buildReceipt();
    aiReceipt.provider = {
      id: 'future-ai-provider',
      version: '1.2.3',
      execution: 'remote',
      output_provenance: 'generative-ai',
    };
    aiReceipt.model = { provider: 'Example AI', id: 'image-model-v1', revision: '2026-07-01' };
    aiReceipt.workflow.definition_sha256 = 'd'.repeat(64);
    aiReceipt.ai_disclosure = {
      contains_generative_ai: true,
      human_curated: true,
      statement: 'Generated by Example AI and reviewed by a human before packaging.',
    };
    aiReceipt.licensing.provider_terms = {
      url: 'https://example.com/terms',
      version: '2026-07',
    };
    expect(validateGenerationReceipt(aiReceipt)).toEqual([]);

    aiReceipt.model = null;
    aiReceipt.workflow.definition_sha256 = null;
    aiReceipt.ai_disclosure.contains_generative_ai = false;
    aiReceipt.ai_disclosure.statement = null;
    aiReceipt.licensing.provider_terms = null;
    expect(issueCodes(aiReceipt)).toEqual(expect.arrayContaining([
      'receipt.ai-condition',
      'receipt.ai-condition',
      'receipt.ai-condition',
      'receipt.ai-condition',
      'receipt.ai-condition',
    ]));
  });

  it('prevents procedural receipts from carrying model or provider-terms claims', () => {
    const receipt = buildReceipt();
    receipt.model = { provider: 'Example AI', id: 'hidden-model', revision: null };
    receipt.ai_disclosure.statement = 'This must not be accepted as procedural.';
    receipt.licensing.provider_terms = { url: 'https://example.com/terms', version: null };

    const issues = validateGenerationReceipt(receipt);
    expect(issues.filter((entry) => entry.code === 'receipt.ai-condition')).toHaveLength(3);
  });

  it('cross-checks world, invocation, manifest, license, and exported-file context', () => {
    const receipt = buildReceipt();
    const mismatchedWorld = generateWorld(DEFAULT_WORLD_SPEC);
    mismatchedWorld.spec.id = 'other-world';
    mismatchedWorld.spec.seed = 'other-seed';
    mismatchedWorld.generator = { id: 'other-provider', version: '9.0.0' };

    const issues = validateGenerationReceipt(receipt, {
      world: mismatchedWorld,
      inputSpec: { path: 'worlds/other.world.json', sha256: 'e'.repeat(64) },
      createdAt: '2026-07-18T12:00:00.000Z',
      provider: {
        id: 'other-provider',
        version: '9.0.0',
        execution: 'remote',
        output_provenance: 'generative-ai',
      },
      outputLicense: { id: 'MIT', noticePath: 'licenses/mit.txt' },
      manifestProvenance: {
        contains_generative_ai: true,
        model_provider: 'Example AI',
        model: 'image-model-v1',
        seed: 'other-seed',
        human_curated: true,
      },
      files: [{ path: INPUT_PATH, sha256: 'f'.repeat(64) }],
    });
    expect(issues.map((entry) => entry.code)).toEqual(expect.arrayContaining([
      'receipt.context-world',
      'receipt.context-provider',
      'receipt.context-input-spec',
      'receipt.context-created-at',
      'receipt.context-license',
      'receipt.context-provenance',
      'receipt.context-file',
    ]));
  });

  it('validates source declarations and verifies packaged source hashes', () => {
    const receipt = buildReceipt();
    receipt.sources = [{
      id: 'reference-map',
      kind: 'reference-asset',
      sha256: SOURCE_HASH,
      path: 'sources/reference-map.png',
      uri: 'https://example.com/reference-map.png',
      license: {
        id: 'CC-BY-4.0',
        url: 'https://creativecommons.org/licenses/by/4.0/',
        attribution: 'Example Artist',
      },
    }];
    expect(validateGenerationReceipt(receipt, {
      files: [
        { path: INPUT_PATH, sha256: INPUT_HASH },
        { path: 'license-assets.md', sha256: LICENSE_HASH },
        { path: 'sources/reference-map.png', sha256: SOURCE_HASH },
      ],
    })).toEqual([]);

    const wrongFiles = validateGenerationReceipt(receipt, {
      files: [
        { path: INPUT_PATH, sha256: INPUT_HASH },
        { path: 'license-assets.md', sha256: LICENSE_HASH },
        { path: 'sources/reference-map.png', sha256: 'd'.repeat(64) },
      ],
    });
    expect(wrongFiles).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'receipt.context-file', message: expect.stringContaining('reference-map') }),
    ]));

    receipt.sources.push({
      id: 'reference-map',
      kind: 'third-party-asset',
      sha256: 'NOT-A-HASH',
      path: '../escape.png',
      uri: 'http://example.com/asset.png',
      license: { id: 'not a license', url: 'http://example.com/license', attribution: null },
    });
    expect(issueCodes(receipt)).toEqual(expect.arrayContaining([
      'receipt.duplicate-source',
      'receipt.sources',
      'receipt.license',
    ]));

    const incompleteSource = buildReceipt();
    incompleteSource.sources = [{
      id: 'unlocated-source',
      kind: 'reference-asset',
      sha256: SOURCE_HASH,
      license: { id: 'CC-BY-4.0', url: null, attribution: null },
    }];
    expect(issueCodes(incompleteSource)).toEqual(expect.arrayContaining([
      'receipt.sources',
      'receipt.license',
    ]));

    incompleteSource.sources[0].uri = 'https://example.com/source.png?token=secret';
    incompleteSource.sources[0].license.attribution = 'Example Artist';
    expect(issueCodes(incompleteSource)).toContain('receipt.sources');

    for (const suffix of ['?', '#']) {
      const trailingMarker = buildReceipt();
      trailingMarker.sources = [structuredClone(incompleteSource.sources[0])];
      trailingMarker.sources[0].uri = `https://example.com/source.png${suffix}`;
      expect(issueCodes(trailingMarker)).toContain('receipt.sources');
    }
  });

  it('refuses to build a built-in receipt for a different provider or invalid export identity', () => {
    const world = generateWorld(DEFAULT_WORLD_SPEC);
    world.generator = { id: 'future-provider', version: '1.0.0' };
    expect(() => buildBuiltinProceduralReceipt({
      world,
      inputSpec: { path: INPUT_PATH, sha256: INPUT_HASH },
      createdAt: CREATED_AT,
    })).toThrow(/receipt\.context-provider/);

    expect(() => buildBuiltinProceduralReceipt({
      world: generateWorld(DEFAULT_WORLD_SPEC),
      inputSpec: { path: '../escape.json', sha256: 'not-a-hash' },
      createdAt: 'not-a-time',
    })).toThrow(/receipt\.created-at/);
  });
});

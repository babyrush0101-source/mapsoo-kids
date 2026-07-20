import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

import requestSchema from '../../schemas/mapsoo-generation-request-1.0.schema.json';
import { WORLD_ASSET_PROFILES } from './asset-profile';
import {
  bindGenerationRequestV2,
  materializeGenerationRequestV2,
  type GenerationRequestV2,
} from './generation-request-v2';

const PNG_2_BY_3_SHA256 = 'b63355f9a1f6274e48ef9c27ab6d683c460bf87cb4eefe3139711bcbea77c75c';

function png(width = 2, height = 3): Uint8Array {
  const bytes = new Uint8Array(33);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 13);
  bytes.set([73, 72, 68, 82], 12);
  view.setUint32(16, width);
  view.setUint32(20, height);
  bytes.set([8, 6, 0, 0, 0], 24);
  return bytes;
}

function reference(bytes: Uint8Array, role: 'environment-style' | 'character') {
  const shortRole = role === 'environment-style' ? 'environment' : role;
  return {
    id: `${shortRole}-reference`,
    role,
    path: `references/${shortRole}.png`,
    mediaType: 'image/png',
    byteLength: bytes.byteLength,
    width: 2,
    height: 3,
    sha256: PNG_2_BY_3_SHA256,
    rights: {
      basis: 'owned',
      license: 'LicenseRef-User-Owned',
      allowGenerativeAdaptation: true,
      allowOutputRedistribution: true,
      allowOutputCc0Dedication: true,
    },
  } as const;
}

function request() {
  const environment = png();
  const character = png();
  return {
    bytes: { environment, character },
    value: {
      schemaVersion: '1.0.0',
      id: 'river-farm-job',
      profile: 'topdown-farm',
      description: 'A friendly riverside farm with a small barn.',
      seed: 'farm-reference-001',
      references: [reference(environment, 'environment-style'), reference(character, 'character')],
    },
  };
}

describe('generation request v2 contract', () => {
  it('keeps all four final profiles in one authoritative enum and schema', () => {
    const validate = new Ajv2020({ strict: true, allErrors: true }).compile(requestSchema);
    for (const profile of WORLD_ASSET_PROFILES) {
      const fixture = request().value;
      const candidate = { ...fixture, profile };
      expect(materializeGenerationRequestV2(candidate).profile).toBe(profile);
      expect(validate(candidate), JSON.stringify(validate.errors)).toBe(true);
    }
    expect(requestSchema.properties.profile.enum).toEqual([...WORLD_ASSET_PROFILES]);
  });

  it('requires exactly one environment and one character image with unique ids and paths', () => {
    const fixture = request().value;
    expect(() => materializeGenerationRequestV2({
      ...fixture,
      references: [fixture.references[0], { ...fixture.references[1], path: fixture.references[0].path }],
    })).toThrow(/paths must be unique/);
    expect(() => materializeGenerationRequestV2({
      ...fixture,
      references: [fixture.references[0], { ...fixture.references[1], id: fixture.references[0].id }],
    })).toThrow(/ids must be unique/);
    expect(() => materializeGenerationRequestV2({
      ...fixture,
      references: [fixture.references[0], { ...fixture.references[1], role: 'environment-style' }],
    })).toThrow(/one environment-style and one character/);
    expect(() => materializeGenerationRequestV2({ ...fixture, references: [fixture.references[0]] })).toThrow(/exactly two/);
  });

  it('rejects unknown JSON fields and keeps runtime bytes outside the JSON request', async () => {
    const fixture = request();
    expect(() => materializeGenerationRequestV2({ ...fixture.value, childId: 'private' })).toThrow(/contain exactly/);
    expect(() => materializeGenerationRequestV2({
      ...fixture.value,
      references: [{ ...fixture.value.references[0], prompt: 'private' }, fixture.value.references[1]],
    })).toThrow(/invalid reference image/);

    const job = await bindGenerationRequestV2(fixture.value, [
      { path: fixture.value.references[0].path, bytes: fixture.bytes.environment },
      { path: fixture.value.references[1].path, bytes: fixture.bytes.character },
    ]);
    const serializedRequest = JSON.stringify(job.request);
    expect(serializedRequest).not.toContain('"bytes"');
    expect(serializedRequest).not.toContain('137,80,78');
    expect(job.references).toHaveLength(2);
    expect(JSON.stringify(job)).not.toContain('137,80,78');
    expect(job.references[0].readBytes()[0]).toBe(137);
  });

  it('fails closed on missing, duplicate, or undeclared runtime paths', async () => {
    const fixture = request();
    const environmentPath = fixture.value.references[0].path;
    const characterPath = fixture.value.references[1].path;
    await expect(bindGenerationRequestV2(fixture.value, [
      { path: environmentPath, bytes: fixture.bytes.environment },
    ])).rejects.toMatchObject({ code: 'request.missing-runtime-reference' });
    await expect(bindGenerationRequestV2(fixture.value, [
      { path: environmentPath, bytes: fixture.bytes.environment },
      { path: environmentPath, bytes: fixture.bytes.character },
    ])).rejects.toMatchObject({ code: 'request.unexpected-runtime-reference' });
    await expect(bindGenerationRequestV2(fixture.value, [
      { path: environmentPath, bytes: fixture.bytes.environment },
      { path: 'references/undeclared.png', bytes: fixture.bytes.character },
    ])).rejects.toMatchObject({ code: 'request.unexpected-runtime-reference' });
    await expect(bindGenerationRequestV2(fixture.value, [
      { path: environmentPath, bytes: fixture.bytes.environment },
      { path: characterPath, bytes: fixture.bytes.character },
    ])).resolves.toMatchObject({ request: { id: 'river-farm-job' } satisfies Partial<GenerationRequestV2> });
  });
});

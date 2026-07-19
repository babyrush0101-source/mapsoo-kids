import { describe, expect, it } from 'vitest';
import exampleRequest from '../../../examples/integrations/stoyo/river-valley-asset-request.json';
import requestSchema from '../../../integrations/stoyo/stoyo-asset-request.schema.json';
import {
  STOYO_ASSET_REQUEST_EXTENSION,
  StoyoAssetRequestError,
  canonicalizeStoyoAssetRequest,
  projectStoyoAssetRequest,
} from './asset-request';

function clone<T>(value: T): T {
  return structuredClone(value);
}

describe('STOYO Asset Request projection', () => {
  it('keeps the published schema identity, closed objects, and target tuple aligned with runtime validation', () => {
    expect(requestSchema).toMatchObject({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      additionalProperties: false,
      properties: {
        world: { additionalProperties: false },
        scene: { additionalProperties: false },
        visual: { additionalProperties: false },
        map: { additionalProperties: false },
        output: {
          additionalProperties: false,
          properties: {
            targets: {
              type: 'array',
              minItems: 3,
              maxItems: 3,
              items: false,
              prefixItems: [{ const: 'common' }, { const: 'godot' }, { const: 'itch' }],
            },
          },
        },
      },
    });
  });

  it('projects the synthetic allowlisted request into a strict Mapsoo World Spec', async () => {
    const projection = await projectStoyoAssetRequest(exampleRequest);
    expect(projection.assetRequestSha256).toBe(
      'ea279ebbfd3c12693469472fbca6bbc1286e07515632bd5e34b7bf698602a144',
    );
    expect(projection.worldSpec).toMatchObject({
      schemaVersion: '0.1.0',
      id: 'river-valley-observation',
      map: { width: 24, height: 16, biome: 'meadow' },
      output: { targets: ['common', 'godot', 'itch'], assetLicense: 'CC0-1.0' },
    });
    expect(projection.worldSpec.extensions?.[STOYO_ASSET_REQUEST_EXTENSION]).toEqual({
      schemaVersion: 'dev.stoyo.asset-request/1.0.0',
      assetRequestSha256: projection.assetRequestSha256,
      stoyoWorldId: 'river-valley',
      stoyoWorldVersion: '1.0.0',
      sceneId: 'riverbank-observation',
      requiredSceneTags: ['riverbank', 'old-bridge', 'observation-point'],
      contentRating: 'ages-7-plus',
    });
  });

  it('uses canonical key ordering so equivalent requests have the same hash', async () => {
    const reordered = {
      output: clone(exampleRequest.output),
      map: clone(exampleRequest.map),
      visual: clone(exampleRequest.visual),
      seed: exampleRequest.seed,
      scene: {
        contentRating: exampleRequest.scene.contentRating,
        requiredSceneTags: clone(exampleRequest.scene.requiredSceneTags),
        id: exampleRequest.scene.id,
      },
      world: {
        description: exampleRequest.world.description,
        title: exampleRequest.world.title,
        version: exampleRequest.world.version,
        id: exampleRequest.world.id,
      },
      packId: exampleRequest.packId,
      schemaVersion: exampleRequest.schemaVersion,
    };
    const [first, second] = await Promise.all([
      projectStoyoAssetRequest(exampleRequest),
      projectStoyoAssetRequest(reordered),
    ]);
    expect(second.assetRequestSha256).toBe(first.assetRequestSha256);
    expect(canonicalizeStoyoAssetRequest(reordered)).toBe(canonicalizeStoyoAssetRequest(exampleRequest));
  });

  it.each(['childId', 'parentEmail', 'learningProgress', 'privateServiceUrl', 'apiKey'])(
    'rejects the non-allowlisted private field %s',
    async (field) => {
      const request = clone(exampleRequest) as typeof exampleRequest & Record<string, unknown>;
      request[field] = 'must-not-cross-the-boundary';
      await expect(projectStoyoAssetRequest(request)).rejects.toMatchObject({
        code: 'request.invalid-shape',
      });
    },
  );

  it('rejects private fields hidden inside public sections', async () => {
    const request = clone(exampleRequest);
    const privateWorld = request.world as typeof request.world & { childId: string };
    privateWorld.childId = 'private-child';
    await expect(projectStoyoAssetRequest(request)).rejects.toMatchObject({
      code: 'request.invalid-shape',
    });
  });

  it('rejects duplicate or malformed semantic scene tags', async () => {
    const duplicate = clone(exampleRequest);
    duplicate.scene.requiredSceneTags = ['riverbank', 'riverbank'];
    await expect(projectStoyoAssetRequest(duplicate)).rejects.toMatchObject({
      code: 'request.invalid-value',
    });

    const malformed = clone(exampleRequest);
    malformed.scene.requiredSceneTags = ['Child Name'];
    await expect(projectStoyoAssetRequest(malformed)).rejects.toMatchObject({
      code: 'request.invalid-value',
    });
  });

  it('rejects unsupported versions, styles, dimensions, and licenses', async () => {
    const wrongVersion = clone(exampleRequest);
    wrongVersion.schemaVersion = 'dev.stoyo.asset-request/2.0.0';
    await expect(projectStoyoAssetRequest(wrongVersion)).rejects.toBeInstanceOf(StoyoAssetRequestError);

    const wrongStyle = clone(exampleRequest);
    wrongStyle.visual.style = 'photorealistic';
    await expect(projectStoyoAssetRequest(wrongStyle)).rejects.toBeInstanceOf(StoyoAssetRequestError);

    const oversized = clone(exampleRequest);
    oversized.map.width = 49;
    await expect(projectStoyoAssetRequest(oversized)).rejects.toBeInstanceOf(StoyoAssetRequestError);

    const wrongLicense = clone(exampleRequest);
    wrongLicense.output.assetLicense = 'Proprietary';
    await expect(projectStoyoAssetRequest(wrongLicense)).rejects.toBeInstanceOf(StoyoAssetRequestError);
  });

  it('rejects control characters in every public text field', async () => {
    const request = clone(exampleRequest);
    request.world.description = 'public description\u0000hidden suffix';
    await expect(projectStoyoAssetRequest(request)).rejects.toMatchObject({
      code: 'request.invalid-value',
    });
  });

  it('returns detached arrays so callers cannot mutate the request or projection across boundaries', async () => {
    const request = clone(exampleRequest);
    const projection = await projectStoyoAssetRequest(request);
    request.visual.palette[0] = '#000000';
    request.scene.requiredSceneTags[0] = 'changed';

    expect(projection.worldSpec.visual.palette[0]).toBe('#2F5D3A');
    expect(
      (projection.worldSpec.extensions?.[STOYO_ASSET_REQUEST_EXTENSION] as { requiredSceneTags: string[] })
        .requiredSceneTags[0],
    ).toBe('riverbank');
  });
});

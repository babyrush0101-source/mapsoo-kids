import { describe, expect, it } from 'vitest';

import fixture from '../../../examples/integrations/stoyo/river-valley-asset-request.json';
import { validateWorldSpec } from '../../core/validate-world';
import { prepareStoyoPackExport, StoyoExportBridgeError } from './export-bridge';

describe('STOYO pack export bridge', () => {
  it('losslessly advances the public request to World Spec 0.3 without inventing semantics', async () => {
    const prepared = await prepareStoyoPackExport(JSON.stringify(fixture));

    expect(prepared.worldSpec.schemaVersion).toBe('0.3.0');
    expect(prepared.worldSpec.id).toBe('river-valley-observation');
    expect(prepared.worldSpec.places).toBeUndefined();
    expect(prepared.worldSpec.structures).toBeUndefined();
    expect(validateWorldSpec(prepared.worldSpec).some((issue) => issue.severity === 'error')).toBe(false);
    expect(prepared.binding).toEqual({
      packId: 'river-valley-observation',
      assetRequestSha256: 'ea279ebbfd3c12693469472fbca6bbc1286e07515632bd5e34b7bf698602a144',
      stoyoWorldId: 'river-valley',
      stoyoWorldVersion: '1.0.0',
      sceneId: 'riverbank-observation',
      requiredSceneTags: ['riverbank', 'old-bridge', 'observation-point'],
      contentRating: 'ages-7-plus',
    });
  });

  it('keeps strict JSON and privacy allowlist failures fail-closed', async () => {
    await expect(prepareStoyoPackExport('{"schemaVersion":1,"schemaVersion":2}')).rejects.toMatchObject({
      code: 'import.duplicate-key',
    });
    await expect(prepareStoyoPackExport(JSON.stringify({ childId: 'private' }))).rejects.toBeInstanceOf(
      StoyoExportBridgeError,
    );
  });
});

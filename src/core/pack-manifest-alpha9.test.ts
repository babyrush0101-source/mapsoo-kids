import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

import packSchema from '../../schemas/mapsoo-pack-0.6.schema.json';
import { TOPDOWN_FARM_COMPLETENESS_POLICY, TOPDOWN_FARM_REQUIRED_ROLES } from './generated-asset-bundle';
import {
  ALPHA9_ATLAS_IDS,
  ALPHA9_CLIP_IDS,
  ALPHA9_LAYER_IDS,
  validateAlpha9PackManifest,
  type Alpha9PackManifest,
} from './pack-manifest-alpha9';

const HASH = 'a'.repeat(64);
const atlasPaths = ['atlases/terrain.png', 'atlases/props.png', 'atlases/structures.png', 'atlases/crops.png', 'atlases/character.png'];
const rolePath = (role: string) => role === 'world.collision' ? 'runtime/collision.json'
  : role === 'world.navigation' ? 'runtime/navigation.json'
    : role === 'world.scene' ? 'runtime/scene.json'
      : role === 'world.preview' ? 'previews/world.png'
        : role.startsWith('terrain.') ? atlasPaths[0]
          : role.startsWith('prop.') ? atlasPaths[1]
            : role.startsWith('structure.') ? atlasPaths[2]
              : role.startsWith('crop.') ? atlasPaths[3] : atlasPaths[4];

function fixture(): Alpha9PackManifest {
  const paths = [...new Set([...atlasPaths, ...TOPDOWN_FARM_REQUIRED_ROLES.map(rolePath), 'license-assets.md'])];
  return {
    schema_version: '0.6.0',
    pack: { id: 'complete-farm', title: 'Complete Farm', version: '0.1.0-alpha.9', generator: { name: 'Mapsoo Worldsmith', version: '0.1.0-alpha.9' }, created_at: '2026-07-20T08:00:00.000Z' },
    profile: 'topdown-farm', completeness_policy: TOPDOWN_FARM_COMPLETENESS_POLICY,
    compatibility: { godot_min: '4.3', grid: 'orthogonal', art_style: 'pixel_art', importer: { id: 'mapsoo_importer', min_version: '0.1.0-alpha.9' } },
    layers: ALPHA9_LAYER_IDS.map((id, order) => ({ id, order })),
    atlases: ALPHA9_ATLAS_IDS.map((id, index) => ({ id, path: atlasPaths[index] })),
    roles: TOPDOWN_FARM_REQUIRED_ROLES.map((role) => ({ role, path: rolePath(role) })),
    character: {
      id: 'player', atlas: atlasPaths[4], frame_size: [32, 32], pivot: [16, 28],
      clips: ALPHA9_CLIP_IDS.map((id, index) => ({ id, action: id.startsWith('idle') ? 'idle' : 'walk', direction: id.split('.')[1] as 'north' | 'east' | 'south' | 'west', fps: 8, frames: [{ x: (index % 4) * 32, y: Math.floor(index / 4) * 32 }] })),
    },
    runtime: { scene: { path: 'runtime/scene.json' }, collision: { path: 'runtime/collision.json' }, navigation: { path: 'runtime/navigation.json' }, spawn: { x: 7, y: 6 } },
    files: paths.map((path) => ({ path, media_type: path.endsWith('.png') ? 'image/png' : path.endsWith('.md') ? 'text/markdown' : 'application/json', bytes: 10, sha256: HASH })),
    license: { output: { id: 'CC0-1.0', notice_path: 'license-assets.md', permits_redistribution: true } },
    provenance: { provider: { id: 'procedural-topdown-farm', version: '1.0.0' }, output_provenance: 'procedural', contains_generative_ai: false, model_provider: null, model: null, seed: 'public-seed', human_curated: false },
  };
}

describe('Pack 0.6 Alpha.9 contract', () => {
  it('accepts the complete privacy-safe farm manifest in TypeScript and JSON Schema', () => {
    const value = fixture();
    expect(validateAlpha9PackManifest(value)).toEqual([]);
    const validate = new Ajv2020({ strict: true, strictTypes: false, allErrors: true, formats: { 'date-time': true } }).compile(packSchema);
    expect(validate(value), JSON.stringify(validate.errors)).toBe(true);
    expect(value.layers.map(({ id }) => id)).toEqual(['ground', 'water', 'paths', 'soil', 'props', 'structures', 'crops']);
    expect(value.atlases).toHaveLength(5);
    expect(value.roles).toHaveLength(21);
    expect(value.character.clips).toHaveLength(8);
  });

  it('fails closed for a missing role, duplicate path, or absent runtime sidecar', () => {
    const missingRole = fixture();
    (missingRole.roles as unknown as unknown[]).pop();
    expect(validateAlpha9PackManifest(missingRole).map(({ code }) => code)).toContain('manifest.roles');
    const duplicate = fixture();
    (duplicate.files as unknown as { path: string }[])[1].path = duplicate.files[0].path;
    expect(validateAlpha9PackManifest(duplicate).map(({ code }) => code)).toContain('file.path');
    const absent = fixture();
    (absent.runtime.scene as { path: string }).path = 'runtime/missing.json';
    expect(validateAlpha9PackManifest(absent).map(({ code }) => code)).toContain('file.missing-reference');
  });

  it('rejects original reference metadata and a non-redistributable output license', () => {
    const leaked = fixture() as Alpha9PackManifest & { description: string; reference_path: string };
    leaked.description = 'private prompt'; leaked.reference_path = 'private/reference.png';
    expect(validateAlpha9PackManifest(leaked).map(({ code }) => code)).toContain('privacy.reference-metadata');
    const license = fixture();
    (license.license.output as { permits_redistribution: boolean }).permits_redistribution = false;
    expect(validateAlpha9PackManifest(license).map(({ code }) => code)).toContain('license.output');
  });
});

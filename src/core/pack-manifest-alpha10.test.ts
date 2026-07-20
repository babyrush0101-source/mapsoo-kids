import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

import packSchema from '../../schemas/mapsoo-pack-0.7.schema.json';
import sceneSchema from '../../schemas/mapsoo-side-platformer-scene-0.2.schema.json';
import collisionSchema from '../../schemas/mapsoo-side-platformer-collision-0.2.schema.json';
import navigationSchema from '../../schemas/mapsoo-side-platformer-navigation-0.2.schema.json';
import { SIDE_PLATFORMER_COMPLETENESS_POLICY, SIDE_PLATFORMER_REQUIRED_ROLES } from './side-platformer-asset-bundle';
import {
  ALPHA10_ATLAS_IDS, ALPHA10_CLIP_IDS, ALPHA10_LAYER_IDS,
  materializeAlpha10Runtime, validateAlpha10PackManifest,
  type Alpha10CollisionSidecar, type Alpha10NavigationSidecar, type Alpha10PackManifest, type Alpha10SceneSidecar,
} from './pack-manifest-alpha10';

const HASH = 'a'.repeat(64);
const atlasPaths = ALPHA10_ATLAS_IDS.map((id) => `atlases/${id}.png`);
const rolePath = (role: string): string => role === 'world.collision' ? 'runtime/collision.json' : role === 'world.navigation' ? 'runtime/navigation.json' : role === 'world.scene' ? 'runtime/scene.json' : role === 'world.preview' ? 'previews/world.png' : role === 'character.player.atlas' ? 'atlases/character.png' : `atlases/${role.split('.')[0] === 'background' ? 'backgrounds' : role.split('.')[0]}.png`;

function manifest(): Alpha10PackManifest {
  const paths = [...new Set([...atlasPaths, ...SIDE_PLATFORMER_REQUIRED_ROLES.map(rolePath), 'license-assets.md'])];
  return {
    schema_version: '0.7.0', pack: { id: 'side-world', title: 'Side World', version: '0.1.0-alpha.10', generator: { name: 'Mapsoo Worldsmith', version: '0.1.0-alpha.10' }, created_at: '2026-07-20T10:00:00.000Z' },
    profile: 'side-platformer', completeness_policy: SIDE_PLATFORMER_COMPLETENESS_POLICY,
    compatibility: { godot_min: '4.3', grid: 'pixel', art_style: 'pixel_art', importer: { id: 'mapsoo_importer', min_version: '0.1.0-alpha.10' } },
    layers: ALPHA10_LAYER_IDS.map((id, order) => ({ id, order })), atlases: ALPHA10_ATLAS_IDS.map((id, i) => ({ id, path: atlasPaths[i] })), roles: SIDE_PLATFORMER_REQUIRED_ROLES.map((role) => ({ role, path: rolePath(role) })),
    character: { id: 'player', atlas: 'atlases/character.png', frame_size: [32, 32], pivot: [16, 30], clips: ALPHA10_CLIP_IDS.map((id, i) => { const [action, direction] = id.split('.') as [typeof import('./side-platformer-asset-bundle').SIDE_PLATFORMER_ACTIONS[number], 'left' | 'right']; return { id, action, direction, fps: 8, frames: [{ x: i * 32, y: 0 }] }; }) },
    runtime: { scene: { path: 'runtime/scene.json' }, collision: { path: 'runtime/collision.json' }, navigation: { path: 'runtime/navigation.json' }, spawn: { x: 32, y: 160 } },
    files: paths.map((path) => ({ path, media_type: path.endsWith('.png') ? 'image/png' as const : path.endsWith('.md') ? 'text/markdown' as const : 'application/json' as const, bytes: 10, sha256: HASH })),
    license: { output: { id: 'CC0-1.0', notice_path: 'license-assets.md', permits_redistribution: true } },
    provenance: { provider: { id: 'procedural-side-platformer', version: '1.0.0' }, output_provenance: 'procedural', contains_generative_ai: false, model_provider: null, model: null, seed: 'public-seed', human_curated: false },
  };
}
function runtime(): [Alpha10SceneSidecar, Alpha10CollisionSidecar, Alpha10NavigationSidecar] {
  const common = { schema_version: '0.2.0' as const, profile: 'side-platformer' as const, completeness_policy: SIDE_PLATFORMER_COMPLETENESS_POLICY, bounds: { x: 0, y: 0, width: 640, height: 360 }, spawn: { x: 32, y: 160 } };
  return [
    { ...common, layers: ALPHA10_LAYER_IDS, placements: [{ id: 'exit-placement', role: 'structure.exit', layer: 'world', x: 600, y: 160 }] },
    { ...common, surfaces: [{ id: 'start-floor', kind: 'solid', rect: { x: 0, y: 160, width: 96, height: 32 } }, { id: 'end-floor', kind: 'one-way', rect: { x: 560, y: 160, width: 80, height: 16 } }], hazards: [] },
    { ...common, nodes: [{ id: 'spawn-node', x: 32, y: 160, kind: 'spawn' }, { id: 'exit-node', x: 600, y: 160, kind: 'exit' }], edges: [{ from: 'spawn-node', to: 'exit-node', kind: 'jump' }], exit_node_id: 'exit-node' },
  ];
}
const ajv = () => new Ajv2020({ strict: true, strictTypes: false, allErrors: true, formats: { 'date-time': true } });

describe('Alpha10 Pack 0.7 and side-platformer runtime', () => {
  it('accepts the canonical 30-role, 12-clip manifest and all strict schemas', () => {
    const value = manifest(); const [scene, collision, navigation] = runtime();
    expect(validateAlpha10PackManifest(value)).toEqual([]);
    for (const [schema, document] of [[packSchema, value], [sceneSchema, scene], [collisionSchema, collision], [navigationSchema, navigation]] as const) {
      const validate = ajv().compile(schema); expect(validate(document), JSON.stringify(validate.errors)).toBe(true);
    }
    expect(value.roles).toHaveLength(30); expect(value.character.clips).toHaveLength(12);
    expect(materializeAlpha10Runtime(value, scene, collision, navigation).spawn).toEqual({ x: 32, y: 160 });
  });

  it('rejects non-canonical roles and clips in both validators', () => {
    const badRole = manifest(); (badRole.roles as unknown as { role: string }[])[0].role = 'terrain.fake';
    expect(validateAlpha10PackManifest(badRole).map((x) => x.code)).toContain('manifest.roles');
    expect(ajv().compile(packSchema)(badRole)).toBe(false);
    const badClip = manifest(); (badClip.character.clips as unknown as { id: string }[])[0].id = 'walk.left';
    expect(validateAlpha10PackManifest(badClip).map((x) => x.code)).toContain('manifest.clips');
    expect(ajv().compile(packSchema)(badClip)).toBe(false);
  });

  it('fails closed on mismatched spawn, out-of-bounds geometry, dangling edges and unreachable exit', () => {
    const value = manifest();
    const [scene1, collision1, navigation1] = runtime(); (collision1.spawn as { x: number }).x = 33;
    expect(() => materializeAlpha10Runtime(value, scene1, collision1, navigation1)).toThrow('runtime.spawn-mismatch');
    const [scene2, collision2, navigation2] = runtime(); (scene2.placements[0] as { x: number }).x = 800;
    expect(() => materializeAlpha10Runtime(value, scene2, collision2, navigation2)).toThrow('runtime.out-of-bounds');
    const [scene3, collision3, navigation3] = runtime(); (navigation3.edges[0] as { to: string }).to = 'missing';
    expect(() => materializeAlpha10Runtime(value, scene3, collision3, navigation3)).toThrow(/navigation.edge-reference.*navigation.unreachable-exit/);
  });

  it('requires spawn support and rejects extra sidecar properties at the schema boundary', () => {
    const value = manifest(); const [scene, collision, navigation] = runtime();
    (collision.surfaces[0].rect as { y: number }).y = 161;
    expect(() => materializeAlpha10Runtime(value, scene, collision, navigation)).toThrow('collision.unsupported-spawn');
    const withExtra = { ...scene, private_prompt: 'must not ship' };
    expect(ajv().compile(sceneSchema)(withExtra)).toBe(false);
  });
});

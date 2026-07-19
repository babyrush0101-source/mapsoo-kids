import sunnyMeadowJson from '../../examples/sunny-meadow-v0.3.world.json';
import dustwindOutpostJson from '../../examples/dustwind-outpost-v0.3.world.json';
import frostwatchValeJson from '../../examples/frostwatch-vale-v0.3.world.json';
import { cloneWorldSpec, type BiomeId, type WorldSpec, type WorldSpecV030 } from '../core/world-spec';
import { validateWorldSpec } from '../core/validate-world';

export type WorldExampleId = 'sunny-meadow' | 'dustwind-outpost' | 'frostwatch-vale';
export type WorldExampleStatus = 'candidate';

export interface WorldExample {
  id: WorldExampleId;
  title: string;
  biome: BiomeId;
  summary: string;
  worldSpecPath: string;
  status: WorldExampleStatus;
  spec: WorldSpecV030;
}

const RAW_EXAMPLES: WorldExample[] = [
  {
    id: 'sunny-meadow',
    title: 'Sunny Meadow',
    biome: 'meadow',
    summary: 'River meadow · cottage · shrine',
    worldSpecPath: 'examples/sunny-meadow-v0.3.world.json',
    status: 'candidate',
    spec: sunnyMeadowJson as WorldSpecV030,
  },
  {
    id: 'dustwind-outpost',
    title: 'Dustwind Outpost',
    biome: 'desert',
    summary: 'Guarded oasis · workshop · tower',
    worldSpecPath: 'examples/dustwind-outpost-v0.3.world.json',
    status: 'candidate',
    spec: dustwindOutpostJson as WorldSpecV030,
  },
  {
    id: 'frostwatch-vale',
    title: 'Frostwatch Vale',
    biome: 'snow',
    summary: 'Snowbound vale · shrine · tower',
    worldSpecPath: 'examples/frostwatch-vale-v0.3.world.json',
    status: 'candidate',
    spec: frostwatchValeJson as WorldSpecV030,
  },
];

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function validateRegistry(examples: readonly WorldExample[]): void {
  const ids = new Set<string>();
  const paths = new Set<string>();
  const biomes = new Set<BiomeId>();

  for (const example of examples) {
    if (ids.has(example.id)) throw new Error(`Duplicate world example ID: ${example.id}`);
    if (paths.has(example.worldSpecPath)) throw new Error(`Duplicate world example path: ${example.worldSpecPath}`);
    if (biomes.has(example.biome)) throw new Error(`Duplicate world example biome: ${example.biome}`);
    if (example.spec.id !== example.id || example.spec.title !== example.title || example.spec.map.biome !== example.biome) {
      throw new Error(`World example metadata does not match its World Spec: ${example.id}`);
    }
    const errors = validateWorldSpec(example.spec).filter((issue) => issue.severity === 'error');
    if (errors.length > 0) {
      throw new Error(`Invalid registered World Spec ${example.id}: ${errors.map((issue) => issue.code).join(', ')}`);
    }
    ids.add(example.id);
    paths.add(example.worldSpecPath);
    biomes.add(example.biome);
  }

  if (examples.length !== 3 || biomes.size !== 3) {
    throw new Error('Alpha.7 candidate registry must contain exactly one meadow, desert, and snow example.');
  }
}

validateRegistry(RAW_EXAMPLES);

export const WORLD_EXAMPLES: readonly WorldExample[] = deepFreeze(RAW_EXAMPLES);

export function getWorldExample(id: string): WorldExample | undefined {
  return WORLD_EXAMPLES.find((example) => example.id === id);
}

export function findMatchingWorldExample(spec: WorldSpec): WorldExample | undefined {
  const serialized = JSON.stringify(spec);
  return WORLD_EXAMPLES.find((example) => JSON.stringify(example.spec) === serialized);
}

export function cloneWorldExampleSpec(id: WorldExampleId): WorldSpecV030 {
  const example = getWorldExample(id);
  if (!example) throw new Error(`Unknown world example: ${id}`);
  return cloneWorldSpec(example.spec) as WorldSpecV030;
}

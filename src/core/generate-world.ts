import { createSeededRandom } from './seeded-random';
import {
  PROCEDURAL_PIXEL_GENERATOR_ID,
  PROCEDURAL_PIXEL_GENERATOR_VERSION,
} from './generator-identity';
import {
  cloneWorldSpec,
  type GeneratedWorld,
  type PropKind,
  type TileDefinition,
  type WorldProp,
  type WorldSpec,
} from './world-spec';
import { validateWorldSpec } from './validate-world';

function buildTiles(spec: WorldSpec): TileDefinition[] {
  const [dark, ground, detail, water, path] = spec.visual.palette;

  return [
    { id: 0, name: 'ground', color: ground, accent: detail, walkable: true },
    { id: 1, name: 'water', color: water, accent: dark, walkable: false },
    { id: 2, name: 'path', color: path, accent: dark, walkable: true },
    { id: 3, name: 'detail', color: detail, accent: ground, walkable: true },
  ];
}

export function generateWorld(specInput: WorldSpec): GeneratedWorld {
  const errors = validateWorldSpec(specInput).filter((issue) => issue.severity === 'error');
  if (errors.length > 0) {
    throw new Error(`Invalid world spec: ${errors.map((issue) => issue.code).join(', ')}`);
  }

  const spec = cloneWorldSpec(specInput);
  const random = createSeededRandom(`${spec.schemaVersion}:${spec.seed}:${spec.map.biome}`);
  const { width, height } = spec.map;
  const ground = Array.from<number>({ length: width * height }).fill(0);

  let riverX = Math.max(2, Math.floor(width * (0.25 + random() * 0.5)));
  const pathY = Math.max(2, Math.min(height - 3, Math.floor(height * (0.35 + random() * 0.3))));

  for (let y = 0; y < height; y += 1) {
    if (random() > 0.62) riverX += random() > 0.5 ? 1 : -1;
    riverX = Math.max(2, Math.min(width - 3, riverX));

    for (let offset = -1; offset <= 1; offset += 1) {
      ground[y * width + riverX + offset] = 1;
    }
  }

  for (let x = 0; x < width; x += 1) {
    const y = Math.max(1, Math.min(height - 2, pathY + (random() > 0.78 ? (random() > 0.5 ? 1 : -1) : 0)));
    ground[y * width + x] = 2;

    if (x > 0 && ground[y * width + x - 1] === 1) {
      ground[y * width + x - 1] = 2;
    }
  }

  for (let index = 0; index < ground.length; index += 1) {
    if (ground[index] === 0 && random() > 0.88) ground[index] = 3;
  }

  const propKinds: PropKind[] = ['tree', 'rock', 'flower'];
  const props: WorldProp[] = [];
  const targetPropCount = Math.round(width * height * 0.075);

  for (let attempt = 0; attempt < width * height && props.length < targetPropCount; attempt += 1) {
    const x = Math.floor(random() * width);
    const y = Math.floor(random() * height);
    const cell = ground[y * width + x];
    const occupied = props.some((prop) => prop.x === x && prop.y === y);

    if (cell === 0 && !occupied) {
      const kind = propKinds[Math.floor(random() * propKinds.length)];
      props.push({ id: `${kind}-${x}-${y}`, kind, x, y });
    }
  }

  return {
    generator: { id: PROCEDURAL_PIXEL_GENERATOR_ID, version: PROCEDURAL_PIXEL_GENERATOR_VERSION },
    spec,
    tiles: buildTiles(spec),
    ground,
    props,
  };
}

import { WORLD_SCHEMA_VERSION, type GeneratedWorld, type WorldSpec } from './world-spec';

export interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const WORLD_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EXTENSION_NAMESPACE = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)+$/;
const BIOMES = new Set(['meadow', 'desert', 'snow']);
const TILE_SIZES = new Set([16, 32, 64]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBoundedString(value: unknown, minimum: number, maximum: number): value is string {
  return typeof value === 'string' && value.length >= minimum && value.length <= maximum;
}

function addUnknownKeyIssue(
  issues: ValidationIssue[],
  value: Record<string, unknown>,
  allowed: readonly string[],
  scope: string,
): void {
  const unknownKeys = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknownKeys.length > 0) {
    issues.push({
      code: `spec.unknown-${scope}-field`,
      severity: 'error',
      message: `Unknown ${scope} field${unknownKeys.length > 1 ? 's' : ''}: ${unknownKeys.join(', ')}.`,
    });
  }
}

export function validateWorldSpec(spec: WorldSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const candidate: unknown = spec;

  if (!isRecord(candidate)) {
    return [{ code: 'spec.invalid-root', severity: 'error', message: 'World spec must be an object.' }];
  }

  addUnknownKeyIssue(
    issues,
    candidate,
    ['schemaVersion', 'id', 'title', 'description', 'seed', 'visual', 'map', 'output', 'extensions'],
    'root',
  );

  if (candidate.schemaVersion !== WORLD_SCHEMA_VERSION) {
    issues.push({
      code: 'spec.schema-version',
      severity: 'error',
      message: `Schema version must be ${WORLD_SCHEMA_VERSION}.`,
    });
  }

  if (typeof candidate.id !== 'string' || candidate.id.length > 80 || !WORLD_ID.test(candidate.id)) {
    issues.push({
      code: 'spec.invalid-id',
      severity: 'error',
      message: 'World ID must use lowercase letters, numbers, and single hyphens.',
      suggestion: 'Example: sunny-meadow',
    });
  }

  if (!isBoundedString(candidate.title, 1, 120) || !candidate.title.trim()) {
    issues.push({
      code: 'spec.title',
      severity: 'error',
      message: 'World title is required and must be no more than 120 characters.',
    });
  }

  if (!isBoundedString(candidate.description, 0, 1000)) {
    issues.push({
      code: 'spec.description',
      severity: 'error',
      message: 'World description must be a string no longer than 1,000 characters.',
    });
  } else if (candidate.description.trim().length < 12) {
    issues.push({
      code: 'spec.short-description',
      severity: 'warning',
      message: 'A more specific world description will help future AI providers stay coherent.',
    });
  }

  if (!isBoundedString(candidate.seed, 1, 160) || !candidate.seed.trim()) {
    issues.push({
      code: 'spec.seed',
      severity: 'error',
      message: 'A seed from 1 to 160 characters is required for reproducible generation.',
    });
  }

  const visual = candidate.visual;
  if (!isRecord(visual)) {
    issues.push({ code: 'spec.visual', severity: 'error', message: 'Visual settings must be an object.' });
  } else {
    addUnknownKeyIssue(issues, visual, ['style', 'tileSize', 'palette'], 'visual');
    if (visual.style !== 'pixel-art') {
      issues.push({ code: 'spec.style', severity: 'error', message: 'Visual style must be pixel-art in v0.1.' });
    }

    if (typeof visual.tileSize !== 'number' || !TILE_SIZES.has(visual.tileSize)) {
      issues.push({ code: 'spec.tile-size', severity: 'error', message: 'Tile size must be 16, 32, or 64 pixels.' });
    }

    if (
      !Array.isArray(visual.palette)
      || visual.palette.length !== 5
      || visual.palette.some((color) => typeof color !== 'string' || !HEX_COLOR.test(color))
    ) {
      issues.push({
        code: 'spec.palette',
        severity: 'error',
        message: 'Palette must contain exactly five six-digit hex colors.',
      });
    }
  }

  const map = candidate.map;
  if (!isRecord(map)) {
    issues.push({ code: 'spec.map', severity: 'error', message: 'Map settings must be an object.' });
  } else {
    addUnknownKeyIssue(issues, map, ['width', 'height', 'biome'], 'map');
    const validWidth = typeof map.width === 'number'
      && Number.isFinite(map.width)
      && Number.isInteger(map.width)
      && map.width >= 8
      && map.width <= 48;
    const validHeight = typeof map.height === 'number'
      && Number.isFinite(map.height)
      && Number.isInteger(map.height)
      && map.height >= 8
      && map.height <= 32;

    if (!validWidth || !validHeight) {
      issues.push({
        code: 'spec.map-size',
        severity: 'error',
        message: 'The v0.1 preview requires integer map dimensions from 8x8 to 48x32 cells.',
      });
    }

    if (typeof map.biome !== 'string' || !BIOMES.has(map.biome)) {
      issues.push({
        code: 'spec.biome',
        severity: 'error',
        message: 'Biome must be meadow, desert, or snow.',
      });
    }
  }

  const output = candidate.output;
  if (!isRecord(output)) {
    issues.push({ code: 'spec.output', severity: 'error', message: 'Output settings must be an object.' });
  } else {
    addUnknownKeyIssue(issues, output, ['targets', 'assetLicense'], 'output');
    const targets = output.targets;
    if (
      !Array.isArray(targets)
      || targets.length !== 3
      || targets[0] !== 'common'
      || targets[1] !== 'godot'
      || targets[2] !== 'itch'
    ) {
      issues.push({
        code: 'spec.output-targets',
        severity: 'error',
        message: 'Output targets must be the ordered common, godot, and itch tuple.',
      });
    }

    if (output.assetLicense !== 'CC0-1.0') {
      issues.push({
        code: 'spec.asset-license',
        severity: 'error',
        message: 'Generated v0.1 assets must use the CC0-1.0 license.',
      });
    }
  }

  if (candidate.extensions !== undefined) {
    if (!isRecord(candidate.extensions)) {
      issues.push({
        code: 'spec.extensions',
        severity: 'error',
        message: 'Extensions must be an object keyed by a reverse-DNS namespace.',
      });
    } else if (Object.keys(candidate.extensions).some((key) => !EXTENSION_NAMESPACE.test(key))) {
      issues.push({
        code: 'spec.extension-namespace',
        severity: 'error',
        message: 'Every extension key must use a reverse-DNS namespace such as dev.stoyo.',
      });
    }
  }

  return issues;
}

export function validateGeneratedWorld(world: GeneratedWorld): ValidationIssue[] {
  const candidate: unknown = world;
  if (!isRecord(candidate)) {
    return [{ code: 'world.invalid-root', severity: 'error', message: 'Generated world must be an object.' }];
  }

  const spec = candidate.spec as WorldSpec;
  const issues = validateWorldSpec(spec);
  if (!isRecord(spec) || !isRecord(spec.map)) return issues;

  const width = spec.map.width;
  const height = spec.map.height;
  const dimensionsAreValid = Number.isFinite(width) && Number.isInteger(width)
    && Number.isFinite(height) && Number.isInteger(height);
  const ground = Array.isArray(candidate.ground) ? candidate.ground : null;
  const tiles = Array.isArray(candidate.tiles) ? candidate.tiles : null;
  const props = Array.isArray(candidate.props) ? candidate.props : null;

  if (!ground) {
    issues.push({ code: 'world.ground', severity: 'error', message: 'Ground layer must be an array.' });
  } else if (dimensionsAreValid) {
    const expectedCells = width * height;
    if (ground.length !== expectedCells) {
      issues.push({
        code: 'world.cell-count',
        severity: 'error',
        message: `Ground layer has ${ground.length} cells; expected ${expectedCells}.`,
      });
    }
  }

  if (!tiles) {
    issues.push({ code: 'world.tiles', severity: 'error', message: 'Tile definitions must be an array.' });
  } else if (ground) {
    const tileIds = new Set(
      tiles.flatMap((tile) => (isRecord(tile) && typeof tile.id === 'number' ? [tile.id] : [])),
    );
    if (ground.some((tileId) => typeof tileId !== 'number' || !tileIds.has(tileId))) {
      issues.push({ code: 'world.unknown-tile', severity: 'error', message: 'The map references an unknown tile ID.' });
    }
  }

  if (!props) {
    issues.push({ code: 'world.props', severity: 'error', message: 'Props must be an array.' });
  } else if (dimensionsAreValid && props.some((prop) => (
    !isRecord(prop)
    || typeof prop.x !== 'number'
    || typeof prop.y !== 'number'
    || !Number.isFinite(prop.x)
    || !Number.isFinite(prop.y)
    || !Number.isInteger(prop.x)
    || !Number.isInteger(prop.y)
    || prop.x < 0
    || prop.y < 0
    || prop.x >= width
    || prop.y >= height
  ))) {
    issues.push({ code: 'world.prop-bounds', severity: 'error', message: 'One or more props have invalid map coordinates.' });
  }

  if (!issues.some((issue) => issue.severity === 'error') && ground && props) {
    issues.push({
      code: 'world.ready',
      severity: 'info',
      message: `${ground.length} cells and ${props.length} props are ready for pack assembly.`,
    });
  }

  return issues;
}

import {
  cloneWorldSpec,
  type BiomeId,
  type GeneratedWorld,
  type TileSize,
  type WorldSpec,
} from './world-spec';
import {
  isValidGeneratorId,
  isValidGeneratorVersion,
  PROCEDURAL_PIXEL_GENERATOR_ID,
  PROCEDURAL_PIXEL_GENERATOR_VERSION,
} from './generator-identity';
import { validateGeneratedWorld, validateWorldSpec, type ValidationIssue } from './validate-world';

const BIOMES = new Set<BiomeId>(['meadow', 'desert', 'snow']);
const TILE_SIZES = new Set<TileSize>([16, 32, 64]);

export interface GeneratorCapabilities {
  readonly execution: 'local' | 'remote';
  readonly determinism: 'seeded' | 'best-effort';
  readonly requiresCredentials: boolean;
  readonly outputProvenance: 'procedural' | 'generative-ai';
  readonly supportedStyles: readonly WorldSpec['visual']['style'][];
  readonly supportedBiomes: readonly BiomeId[];
  readonly supportedTileSizes: readonly TileSize[];
  readonly maxMapSize: { readonly width: number; readonly height: number };
  readonly supportsAbort: boolean;
  readonly supportsPartialRegeneration: boolean;
}

export interface GenerationOptions {
  readonly signal?: AbortSignal;
}

export interface GeneratorProvider {
  readonly id: string;
  readonly version: string;
  readonly displayName: string;
  readonly capabilities: GeneratorCapabilities;
  generate(spec: WorldSpec, options?: GenerationOptions): Promise<GeneratedWorld>;
}

export type GenerationProviderErrorCode =
  | 'provider.invalid-metadata'
  | 'provider.invalid-spec'
  | 'provider.unsupported-spec'
  | 'provider.aborted'
  | 'provider.execution-failed'
  | 'provider.invalid-output'
  | 'provider.identity-mismatch'
  | 'provider.spec-mismatch'
  | 'provider.not-found';

export class GenerationProviderError extends Error {
  constructor(
    readonly code: GenerationProviderErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'GenerationProviderError';
  }
}

function invalidMetadata(message: string): never {
  throw new GenerationProviderError('provider.invalid-metadata', message);
}

function assertUniqueSupportedValues<T>(
  values: unknown,
  allowed: ReadonlySet<T>,
  field: string,
): asserts values is readonly T[] {
  if (
    !Array.isArray(values)
    || values.length === 0
    || new Set(values).size !== values.length
    || values.some((value) => !allowed.has(value))
  ) {
    invalidMetadata(`Provider ${field} must be a non-empty list of unique supported values.`);
  }
}

export function assertValidProviderMetadata(provider: GeneratorProvider): void {
  if (typeof provider !== 'object' || provider === null) {
    invalidMetadata('Provider must be an object.');
  }
  if (!isValidGeneratorId(provider.id)) {
    invalidMetadata('Provider ID must be a lowercase, path-safe identifier no longer than 80 characters.');
  }
  if (!isValidGeneratorVersion(provider.version)) {
    invalidMetadata('Provider version must be a semantic version no longer than 80 characters.');
  }
  if (
    typeof provider.displayName !== 'string'
    || !provider.displayName.trim()
    || provider.displayName.length > 120
    || /[\u0000-\u001f\u007f-\u009f]/.test(provider.displayName)
  ) {
    invalidMetadata('Provider display name must be a non-empty, control-character-free string.');
  }
  if (typeof provider.generate !== 'function') {
    invalidMetadata('Provider must implement generate().');
  }

  const capabilities = provider.capabilities;
  if (typeof capabilities !== 'object' || capabilities === null) {
    invalidMetadata('Provider capabilities must be an object.');
  }
  if (!['local', 'remote'].includes(capabilities.execution)) {
    invalidMetadata('Provider execution capability must be local or remote.');
  }
  if (!['seeded', 'best-effort'].includes(capabilities.determinism)) {
    invalidMetadata('Provider determinism capability must be seeded or best-effort.');
  }
  if (!['procedural', 'generative-ai'].includes(capabilities.outputProvenance)) {
    invalidMetadata('Provider output provenance must be procedural or generative-ai.');
  }
  for (const field of ['requiresCredentials', 'supportsAbort', 'supportsPartialRegeneration'] as const) {
    if (typeof capabilities[field] !== 'boolean') invalidMetadata(`Provider ${field} capability must be boolean.`);
  }

  assertUniqueSupportedValues(capabilities.supportedStyles, new Set(['pixel-art']), 'supportedStyles');
  assertUniqueSupportedValues(capabilities.supportedBiomes, BIOMES, 'supportedBiomes');
  assertUniqueSupportedValues(capabilities.supportedTileSizes, TILE_SIZES, 'supportedTileSizes');

  if (
    typeof capabilities.maxMapSize !== 'object'
    || capabilities.maxMapSize === null
    || !Number.isInteger(capabilities.maxMapSize.width)
    || !Number.isInteger(capabilities.maxMapSize.height)
    || capabilities.maxMapSize.width < 1
    || capabilities.maxMapSize.height < 1
  ) {
    invalidMetadata('Provider maxMapSize must contain positive integer dimensions.');
  }

  const claimsBuiltinIdentity = provider.id === PROCEDURAL_PIXEL_GENERATOR_ID
    && provider.version === PROCEDURAL_PIXEL_GENERATOR_VERSION;
  if (claimsBuiltinIdentity && capabilities.outputProvenance !== 'procedural') {
    invalidMetadata('The built-in procedural provider identity cannot declare generative-AI provenance.');
  }
}

function snapshotCapabilities(capabilities: GeneratorCapabilities): GeneratorCapabilities {
  return Object.freeze({
    ...capabilities,
    supportedStyles: Object.freeze([...capabilities.supportedStyles]),
    supportedBiomes: Object.freeze([...capabilities.supportedBiomes]),
    supportedTileSizes: Object.freeze([...capabilities.supportedTileSizes]),
    maxMapSize: Object.freeze({ ...capabilities.maxMapSize }),
  });
}

export function snapshotGeneratorProvider(provider: GeneratorProvider): GeneratorProvider {
  assertValidProviderMetadata(provider);
  const generate = provider.generate.bind(provider);
  return Object.freeze({
    id: provider.id,
    version: provider.version,
    displayName: provider.displayName,
    capabilities: snapshotCapabilities(provider.capabilities),
    generate: (spec: WorldSpec, options?: GenerationOptions) => generate(spec, options),
  });
}

function structurallyEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => structurallyEqual(value, right[index]));
  }
  if (typeof left !== 'object' || left === null || typeof right !== 'object' || right === null) return false;

  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) => key === rightKeys[index] && structurallyEqual(leftRecord[key], rightRecord[key]));
}

export function assertProviderSupportsSpec(provider: GeneratorProvider, spec: WorldSpec): void {
  const { capabilities } = provider;
  const unsupported =
    !capabilities.supportedStyles.includes(spec.visual.style)
    || !capabilities.supportedBiomes.includes(spec.map.biome)
    || !capabilities.supportedTileSizes.includes(spec.visual.tileSize)
    || spec.map.width > capabilities.maxMapSize.width
    || spec.map.height > capabilities.maxMapSize.height;

  if (unsupported) {
    throw new GenerationProviderError(
      'provider.unsupported-spec',
      `Provider ${provider.id}@${provider.version} does not support this World Spec.`,
    );
  }
}

function throwIfAborted(provider: GeneratorProvider, signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new GenerationProviderError('provider.aborted', `Generation with ${provider.id} was aborted.`);
  }
}

export async function runGenerationProvider(
  provider: GeneratorProvider,
  specInput: WorldSpec,
  options: GenerationOptions = {},
): Promise<GeneratedWorld> {
  const providerContract = snapshotGeneratorProvider(provider);

  const specErrors = validateWorldSpec(specInput).filter((issue) => issue.severity === 'error');
  if (specErrors.length > 0) {
    throw new GenerationProviderError(
      'provider.invalid-spec',
      `World Spec validation failed: ${specErrors.map((issue) => issue.code).join(', ')}.`,
    );
  }

  let requestedSpec: WorldSpec;
  try {
    requestedSpec = cloneWorldSpec(specInput);
  } catch (error) {
    throw new GenerationProviderError(
      'provider.invalid-spec',
      'World Spec could not be copied as JSON-safe provider input.',
      { cause: error },
    );
  }

  assertProviderSupportsSpec(providerContract, requestedSpec);
  throwIfAborted(providerContract, options.signal);

  let world: GeneratedWorld;
  try {
    world = await providerContract.generate(cloneWorldSpec(requestedSpec), options);
  } catch (error) {
    throwIfAborted(providerContract, options.signal);
    if (error instanceof GenerationProviderError) throw error;
    throw new GenerationProviderError(
      'provider.execution-failed',
      `Generation with ${providerContract.id}@${providerContract.version} failed.`,
      { cause: error },
    );
  }

  throwIfAborted(providerContract, options.signal);
  let outputErrors: ValidationIssue[];
  try {
    outputErrors = validateGeneratedWorld(world).filter((issue) => issue.severity === 'error');
  } catch (error) {
    throw new GenerationProviderError(
      'provider.invalid-output',
      'Provider output could not be inspected safely.',
      { cause: error },
    );
  }
  if (outputErrors.length > 0) {
    throw new GenerationProviderError(
      'provider.invalid-output',
      `Provider output validation failed: ${outputErrors.map((issue) => issue.code).join(', ')}.`,
    );
  }
  if (world.generator.id !== providerContract.id || world.generator.version !== providerContract.version) {
    throw new GenerationProviderError(
      'provider.identity-mismatch',
      `Provider output identifies ${world.generator.id}@${world.generator.version}, expected ${providerContract.id}@${providerContract.version}.`,
    );
  }
  if (!structurallyEqual(world.spec, requestedSpec)) {
    throw new GenerationProviderError(
      'provider.spec-mismatch',
      `Provider ${providerContract.id}@${providerContract.version} changed the requested World Spec.`,
    );
  }

  return world;
}

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
import {
  createGenerationRun,
  GenerationEvidenceError,
  materializeGeneratedWorld,
  type GenerationRunResult,
  type ProviderGenerationClaims,
  type ProviderGenerationOutput,
} from './generation-evidence';
import { validateWorldSpec } from './validate-world';
import { PROCEDURAL_PIXEL_PROVIDER } from '../providers/procedural-pixel-provider';
import { PROCEDURAL_TERRAIN_PROVIDER } from '../providers/procedural-terrain-provider';
import {
  PROCEDURAL_TERRAIN_GENERATOR_ID,
  PROCEDURAL_TERRAIN_GENERATOR_VERSION,
} from './generator-identity';

const BIOMES = new Set<BiomeId>(['meadow', 'desert', 'snow']);
const TILE_SIZES = new Set<TileSize>([16, 32, 64]);
const CAPABILITY_KEYS = [
  'execution',
  'determinism',
  'requiresCredentials',
  'outputProvenance',
  'supportedStyles',
  'supportedBiomes',
  'supportedTileSizes',
  'maxMapSize',
  'supportsAbort',
  'supportsPartialRegeneration',
] as const;
const MAX_MAP_SIZE_KEYS = ['width', 'height'] as const;
const reservedBuiltinProviderInstances = new WeakSet<object>([
  PROCEDURAL_PIXEL_PROVIDER,
  PROCEDURAL_TERRAIN_PROVIDER,
]);
const trustedRuns = new WeakSet<object>();

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

export interface GenerationRunOptions extends GenerationOptions {
  /** Test seam for the runner-owned completion timestamp. Providers never receive this callback. */
  readonly now?: () => Date;
}

export interface GeneratorProvider {
  readonly id: string;
  readonly version: string;
  readonly displayName: string;
  readonly capabilities: GeneratorCapabilities;
  generate(spec: WorldSpec, options?: GenerationOptions): Promise<ProviderGenerationOutput>;
}

export type GenerationProviderErrorCode =
  | 'provider.invalid-metadata'
  | 'provider.invalid-spec'
  | 'provider.unsupported-spec'
  | 'provider.aborted'
  | 'provider.execution-failed'
  | 'provider.invalid-output'
  | 'provider.invalid-evidence'
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

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function snapshotExactDataObject(value: unknown, expected: readonly string[], field: string): Record<string, unknown> {
  if (!isPlainRecord(value)) invalidMetadata(`Provider ${field} must be a plain object.`);
  const actual = Object.getOwnPropertyNames(value).sort();
  const sortedExpected = [...expected].sort();
  const snapshot: Record<string, unknown> = {};
  if (
    Object.getOwnPropertySymbols(value).length > 0
    || actual.length !== sortedExpected.length
    || actual.some((key, index) => key !== sortedExpected[index])
  ) {
    invalidMetadata(`Provider ${field} must contain only its declared data fields.`);
  }
  for (const key of actual) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
      invalidMetadata(`Provider ${field} must contain only its declared data fields.`);
    }
    snapshot[key] = descriptor.value;
  }
  return snapshot;
}

function snapshotProviderField(provider: object, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(provider, key);
  if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
    invalidMetadata(`Provider ${key} must be an enumerable data field.`);
  }
  return descriptor.value;
}

function snapshotSupportedValues<T>(
  value: unknown,
  allowed: ReadonlySet<T>,
  field: string,
): readonly T[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    invalidMetadata(`Provider ${field} must be a non-empty list of unique supported values.`);
  }
  if (Object.getOwnPropertySymbols(value).length > 0) {
    invalidMetadata(`Provider ${field} must be a non-empty list of unique supported values.`);
  }
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
  const length = lengthDescriptor && 'value' in lengthDescriptor ? lengthDescriptor.value : -1;
  if (
    !Number.isSafeInteger(length)
    || length < 1
    || length > allowed.size
  ) {
    invalidMetadata(`Provider ${field} must be a non-empty list of unique supported values.`);
  }
  const names = Object.getOwnPropertyNames(value);
  if (
    names.length !== length + 1
    || names.some((key) => key !== 'length' && !/^(0|[1-9][0-9]*)$/.test(key))
  ) {
    invalidMetadata(`Provider ${field} must be a non-empty list of unique supported values.`);
  }
  const snapshot: T[] = [];
  for (let index = 0; index < length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, `${index}`);
    if (!descriptor || !descriptor.enumerable || !('value' in descriptor) || !allowed.has(descriptor.value as T)) {
      invalidMetadata(`Provider ${field} must be a non-empty list of unique supported values.`);
    }
    snapshot.push(descriptor.value as T);
  }
  if (new Set(snapshot).size !== snapshot.length) {
    invalidMetadata(`Provider ${field} must be a non-empty list of unique supported values.`);
  }
  return snapshot;
}

interface MaterializedProviderMetadata {
  readonly id: string;
  readonly version: string;
  readonly displayName: string;
  readonly capabilities: GeneratorCapabilities;
  readonly generate: GeneratorProvider['generate'];
}

function materializeProviderMetadata(provider: GeneratorProvider): MaterializedProviderMetadata {
  if (!isPlainRecord(provider)) {
    invalidMetadata('Provider must be an object.');
  }
  const id = snapshotProviderField(provider, 'id');
  const version = snapshotProviderField(provider, 'version');
  const displayName = snapshotProviderField(provider, 'displayName');
  const generate = snapshotProviderField(provider, 'generate');
  const capabilityInput = snapshotProviderField(provider, 'capabilities');
  const capabilityRecord = snapshotExactDataObject(capabilityInput, CAPABILITY_KEYS, 'capabilities');
  const maxMapSize = snapshotExactDataObject(capabilityRecord.maxMapSize, MAX_MAP_SIZE_KEYS, 'maxMapSize');
  const supportedStyles = snapshotSupportedValues(
    capabilityRecord.supportedStyles,
    new Set(['pixel-art'] as const),
    'supportedStyles',
  );
  const supportedBiomes = snapshotSupportedValues(capabilityRecord.supportedBiomes, BIOMES, 'supportedBiomes');
  const supportedTileSizes = snapshotSupportedValues(capabilityRecord.supportedTileSizes, TILE_SIZES, 'supportedTileSizes');

  if (!isValidGeneratorId(id)) {
    invalidMetadata('Provider ID must be a lowercase, path-safe identifier no longer than 80 characters.');
  }
  if (!isValidGeneratorVersion(version)) {
    invalidMetadata('Provider version must be a semantic version no longer than 80 characters.');
  }
  if (
    typeof displayName !== 'string'
    || !displayName.trim()
    || displayName.length > 120
    || /[\u0000-\u001f\u007f-\u009f]/.test(displayName)
  ) {
    invalidMetadata('Provider display name must be a non-empty, control-character-free string.');
  }
  if (typeof generate !== 'function') {
    invalidMetadata('Provider must implement generate().');
  }

  if (!['local', 'remote'].includes(capabilityRecord.execution as string)) {
    invalidMetadata('Provider execution capability must be local or remote.');
  }
  if (!['seeded', 'best-effort'].includes(capabilityRecord.determinism as string)) {
    invalidMetadata('Provider determinism capability must be seeded or best-effort.');
  }
  if (!['procedural', 'generative-ai'].includes(capabilityRecord.outputProvenance as string)) {
    invalidMetadata('Provider output provenance must be procedural or generative-ai.');
  }
  for (const field of ['requiresCredentials', 'supportsAbort', 'supportsPartialRegeneration'] as const) {
    if (typeof capabilityRecord[field] !== 'boolean') invalidMetadata(`Provider ${field} capability must be boolean.`);
  }
  if (
    !Number.isInteger(maxMapSize.width)
    || !Number.isInteger(maxMapSize.height)
    || (maxMapSize.width as number) < 1
    || (maxMapSize.height as number) < 1
  ) {
    invalidMetadata('Provider maxMapSize must contain positive integer dimensions.');
  }

  const claimsBuiltinIdentity = (
    id === PROCEDURAL_PIXEL_GENERATOR_ID
    && version === PROCEDURAL_PIXEL_GENERATOR_VERSION
  ) || (
    id === PROCEDURAL_TERRAIN_GENERATOR_ID
    && version === PROCEDURAL_TERRAIN_GENERATOR_VERSION
  );
  if (claimsBuiltinIdentity && capabilityRecord.outputProvenance !== 'procedural') {
    invalidMetadata('The built-in procedural provider identity cannot declare generative-AI provenance.');
  }
  if (claimsBuiltinIdentity && !reservedBuiltinProviderInstances.has(provider)) {
    invalidMetadata('The built-in procedural provider identity is reserved for the bundled integration.');
  }

  return {
    id,
    version,
    displayName,
    generate: generate as GeneratorProvider['generate'],
    capabilities: Object.freeze({
      execution: capabilityRecord.execution as GeneratorCapabilities['execution'],
      determinism: capabilityRecord.determinism as GeneratorCapabilities['determinism'],
      requiresCredentials: capabilityRecord.requiresCredentials as boolean,
      outputProvenance: capabilityRecord.outputProvenance as GeneratorCapabilities['outputProvenance'],
      supportedStyles: Object.freeze([...supportedStyles]),
      supportedBiomes: Object.freeze([...supportedBiomes]),
      supportedTileSizes: Object.freeze([...supportedTileSizes]),
      maxMapSize: Object.freeze({
        width: maxMapSize.width as number,
        height: maxMapSize.height as number,
      }),
      supportsAbort: capabilityRecord.supportsAbort as boolean,
      supportsPartialRegeneration: capabilityRecord.supportsPartialRegeneration as boolean,
    }),
  };
}

export function assertValidProviderMetadata(provider: GeneratorProvider): void {
  materializeProviderMetadata(provider);
}

export function snapshotGeneratorProvider(provider: GeneratorProvider): GeneratorProvider {
  const metadata = materializeProviderMetadata(provider);
  const generate = metadata.generate.bind(provider);
  const snapshot = Object.freeze({
    id: metadata.id,
    version: metadata.version,
    displayName: metadata.displayName,
    capabilities: metadata.capabilities,
    generate: (spec: WorldSpec, options?: GenerationOptions) => generate(spec, options),
  });
  if (
    (metadata.id === PROCEDURAL_PIXEL_GENERATOR_ID && metadata.version === PROCEDURAL_PIXEL_GENERATOR_VERSION)
    || (metadata.id === PROCEDURAL_TERRAIN_GENERATOR_ID && metadata.version === PROCEDURAL_TERRAIN_GENERATOR_VERSION)
  ) {
    reservedBuiltinProviderInstances.add(snapshot);
  }
  return snapshot;
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

function snapshotProviderOutputRoot(value: unknown): { world: unknown; claims: unknown } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new GenerationProviderError('provider.invalid-output', 'Provider output must contain world and claims.');
  }
  const prototype = Object.getPrototypeOf(value);
  const keys = Object.keys(value).sort();
  const hasInvalidDescriptor = keys.some((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return !descriptor || !descriptor.enumerable || !('value' in descriptor);
  });
  if (
    (prototype !== Object.prototype && prototype !== null)
    || Object.getOwnPropertySymbols(value).length > 0
    || hasInvalidDescriptor
    || keys.length !== 2
    || keys[0] !== 'claims'
    || keys[1] !== 'world'
  ) {
    throw new GenerationProviderError(
      'provider.invalid-output',
      'Provider output must be a plain object containing only world and claims.',
    );
  }
  const world = Object.getOwnPropertyDescriptor(value, 'world');
  const claims = Object.getOwnPropertyDescriptor(value, 'claims');
  if (!world || !('value' in world) || !claims || !('value' in claims)) {
    throw new GenerationProviderError('provider.invalid-output', 'Provider output fields must be data properties.');
  }
  return { world: world.value, claims: claims.value };
}

function runnerTimestamp(now?: () => Date): string {
  let date: Date;
  try {
    date = now ? now() : new Date();
  } catch (error) {
    throw new GenerationProviderError(
      'provider.invalid-evidence',
      'Runner completion time could not be captured.',
      { cause: error },
    );
  }
  if (!(date instanceof Date) || !Number.isFinite(date.valueOf())) {
    throw new GenerationProviderError('provider.invalid-evidence', 'Runner completion time is invalid.');
  }
  return date.toISOString();
}

export async function runGenerationProviderWithEvidence(
  provider: GeneratorProvider,
  specInput: WorldSpec,
  options: GenerationRunOptions = {},
): Promise<GenerationRunResult> {
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

  let output: ProviderGenerationOutput;
  try {
    output = await providerContract.generate(
      cloneWorldSpec(requestedSpec),
      options.signal ? { signal: options.signal } : {},
    );
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
  let outputRoot: { world: unknown; claims: unknown };
  let world: GeneratedWorld;
  try {
    outputRoot = snapshotProviderOutputRoot(output);
    world = materializeGeneratedWorld(outputRoot.world, requestedSpec);
  } catch (error) {
    if (error instanceof GenerationProviderError) throw error;
    if (error instanceof GenerationEvidenceError && error.codes.includes('evidence.spec-mismatch')) {
      throw new GenerationProviderError(
        'provider.spec-mismatch',
        `Provider ${providerContract.id}@${providerContract.version} changed the requested World Spec.`,
        { cause: error },
      );
    }
    throw new GenerationProviderError(
      'provider.invalid-output',
      'Provider output could not be inspected safely.',
      { cause: error },
    );
  }
  if (
    world.generator.id !== providerContract.id
    || world.generator.version !== providerContract.version
  ) {
    throw new GenerationProviderError(
      'provider.identity-mismatch',
      `Provider output identifies ${world.generator.id}@${world.generator.version}, expected ${providerContract.id}@${providerContract.version}.`,
    );
  }

  let run: GenerationRunResult;
  try {
    run = createGenerationRun({
      world,
      requestSpec: requestedSpec,
      provider: {
        id: providerContract.id,
        version: providerContract.version,
        displayName: providerContract.displayName,
        capabilities: providerContract.capabilities,
      },
      claims: outputRoot.claims as ProviderGenerationClaims,
      createdAt: runnerTimestamp(options.now),
    });
  } catch (error) {
    const codes = error instanceof GenerationEvidenceError ? error.codes.join(', ') : 'evidence.invalid';
    throw new GenerationProviderError(
      'provider.invalid-evidence',
      `Provider evidence validation failed: ${codes}.`,
      { cause: error },
    );
  }
  throwIfAborted(providerContract, options.signal);
  trustedRuns.add(run);
  return run;
}

export function assertTrustedGenerationRun(value: unknown): asserts value is GenerationRunResult {
  if (
    typeof value !== 'object'
    || value === null
    || !trustedRuns.has(value)
    || !Object.isFrozen(value)
  ) {
    throw new GenerationEvidenceError(['evidence.untrusted-run']);
  }
}

export function isTrustedGenerationRun(value: unknown): value is GenerationRunResult {
  try {
    assertTrustedGenerationRun(value);
    return true;
  } catch {
    return false;
  }
}

export async function runGenerationProvider(
  provider: GeneratorProvider,
  specInput: WorldSpec,
  options: GenerationRunOptions = {},
): Promise<GeneratedWorld> {
  return (await runGenerationProviderWithEvidence(provider, specInput, options)).world;
}

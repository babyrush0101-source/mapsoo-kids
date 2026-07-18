# Generation Provider SDK

This document describes the first provider boundary in Mapsoo Worldsmith. It is an experimental contributor API for adding generation backends without weakening the deterministic v0.1 export contract.

## Current status

- The built-in `procedural-pixel-v1@0.1.0` provider is local, seeded, credential-free, and non-AI.
- `runGenerationProvider()` and `GeneratorProviderRegistry` are implemented and tested.
- The Workbench uses the runner for its initial world, edited specs, and imported specs; provider identity and declared capabilities are visible in the preview.
- A single request session aborts superseded work and prevents stale completions from replacing the last successful world. UI and console errors expose only stable Mapsoo error codes.
- No optional AI provider is shipped yet.
- The portable/itch exporter accepts only the built-in procedural identity. A provider being runnable does **not** make its output publishable.

## Contract

```ts
interface GeneratorProvider {
  readonly id: string;
  readonly version: string;
  readonly displayName: string;
  readonly capabilities: GeneratorCapabilities;
  generate(spec: WorldSpec, options?: { signal?: AbortSignal }): Promise<GeneratedWorld>;
}
```

Provider IDs are lowercase path-safe identifiers. Versions use SemVer 2.0. Capabilities declare:

- local or remote execution;
- seeded or best-effort determinism;
- whether credentials are required;
- procedural or generative-AI output provenance;
- supported styles, biomes, tile sizes, and maximum map dimensions;
- abort and partial-regeneration support.

The declaration is a runtime contract, not UI copy. A provider must not claim abort support if it can only observe cancellation after generation has finished.

## Safe execution path

Call providers through `runGenerationProvider()` rather than invoking `generate()` from application code:

```ts
const world = await runGenerationProvider(provider, worldSpec, {
  signal: abortController.signal,
});
```

The runner performs these boundaries in order:

1. validates and snapshots provider identity, display name, capabilities, and callable;
2. validates the World Spec as bounded JSON and saves an immutable comparison snapshot;
3. rejects unsupported styles, biomes, tile sizes, or dimensions before provider work;
4. checks cancellation, then passes a separate World Spec clone to the provider;
5. wraps unknown vendor failures in a stable `provider.execution-failed` error;
6. validates tile definitions, tile references, prop definitions, coordinates, and uniqueness;
7. verifies the returned provider identity and confirms the requested World Spec was not changed.

The registry also stores frozen provider snapshots. Mutating the object originally passed to the registry cannot rename or reconfigure the registered provider.

## Stable errors

`GenerationProviderError.code` is intended for application control flow:

| Code | Meaning |
| --- | --- |
| `provider.invalid-metadata` | Provider identity, capabilities, or callable is malformed. |
| `provider.invalid-spec` | Input is not a valid, bounded, JSON-safe World Spec. |
| `provider.unsupported-spec` | Valid input is outside the provider's declared capabilities. |
| `provider.aborted` | The supplied signal was aborted before or after provider execution. |
| `provider.execution-failed` | A non-Mapsoo vendor/provider exception was wrapped; the original is in `cause`. |
| `provider.invalid-output` | The generated world fails the runtime output contract. |
| `provider.identity-mismatch` | Output identifies a different provider/version than the invocation snapshot. |
| `provider.spec-mismatch` | Output changed the requested World Spec. |
| `provider.not-found` | A registry lookup used an unknown provider ID. |

A provider may throw an existing `GenerationProviderError` when one of these meanings applies. Do not expose vendor response bodies, credentials, prompts containing private data, or raw remote error payloads to end users.

## Minimal provider example

```ts
export const EXAMPLE_PROVIDER = {
  id: 'example-provider',
  version: '0.1.0',
  displayName: 'Example Provider',
  capabilities: {
    execution: 'remote',
    determinism: 'best-effort',
    requiresCredentials: true,
    outputProvenance: 'generative-ai',
    supportedStyles: ['pixel-art'],
    supportedBiomes: ['meadow'],
    supportedTileSizes: [32],
    maxMapSize: { width: 24, height: 16 },
    supportsAbort: true,
    supportsPartialRegeneration: false,
  },
  async generate(spec, { signal } = {}) {
    // Call the backend, normalize its result, and return a complete GeneratedWorld.
    // Never return API keys, private prompts, or unlicensed source images.
  },
} satisfies GeneratorProvider;
```

The example is deliberately incomplete: copying it must not create a provider that appears production-ready.

## Publication gate for future AI providers

Before any AI provider can enter portable or itch.io output, the project still needs:

- a versioned provider receipt schema and receipt validation;
- model/provider/workflow identifiers and transformation records;
- a license decision for every output and any source/reference asset;
- truthful `contains_generative_ai` manifest and itch.io AI Disclosure mapping;
- secret handling outside browser bundles and repository history;
- deterministic normalization tests plus failure, cancellation, and malformed-output tests;
- a reviewed removal of the v0.1 procedural-only exporter allowlist.

Until all of those are implemented, an optional provider may be developed behind the SDK boundary but its output must not be labeled CC0 procedural content or uploaded through the v0.1 release kit.

## Verification

Run:

```bash
pnpm check
pnpm release:itch
```

Provider tests live in `src/core/generation-provider.test.ts`. The release command additionally proves that the existing Sunny Meadow pack and itch.io operator kit remain byte-reproducible.

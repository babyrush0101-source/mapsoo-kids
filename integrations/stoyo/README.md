# STOYO integration contract

This directory defines the public, privacy-minimized boundary between a STOYO world/scene request and Mapsoo Worldsmith. It is an integration example, not a private STOYO SDK and not evidence that STOYO production adoption is complete.

## Contract files

- [`stoyo-asset-request.schema.json`](stoyo-asset-request.schema.json) — strict Draft 2020-12 request schema;
- [`../../examples/integrations/stoyo/river-valley-asset-request.json`](../../examples/integrations/stoyo/river-valley-asset-request.json) — synthetic public fixture;
- [`../../src/integrations/stoyo/asset-request.ts`](../../src/integrations/stoyo/asset-request.ts) — validated projection and canonical SHA-256 binding;
- [`../../src/integrations/stoyo/asset-request.test.ts`](../../src/integrations/stoyo/asset-request.test.ts) — projection, determinism, privacy allowlist, invalid version, tag, dimension, style, and license tests.
- [`../../src/adapters/import-stoyo-asset-request.ts`](../../src/adapters/import-stoyo-asset-request.ts) — strict local file import sharing the World Spec UTF-8/size/structure boundary;
- [`../../src/adapters/import-stoyo-asset-request.test.ts`](../../src/adapters/import-stoyo-asset-request.test.ts) — file, duplicate-key, private-field, size, UTF-8, and safe-error tests.

Run the focused contract gate:

```bash
pnpm exec vitest run src/integrations/stoyo/asset-request.test.ts src/adapters/import-stoyo-asset-request.test.ts
```

The same tests are included in `pnpm check`. The Workbench exposes **Load STOYO Asset Request** beside the ordinary World Spec loader; both paths supersede stale requests and preserve the last successful world on failure.

## Data flow

```text
STOYO private World State
        │ explicit allowlist projection
        ▼
StoyoAssetRequest 1.0.0
        │ canonical key ordering + SHA-256
        ▼
Mapsoo World Spec 0.1.0
        │ dev.stoyo.assetrequest.v1 metadata
        ▼
Mapsoo Workbench/provider → executable-free pack → trusted Godot importer
```

`packId` identifies one scene/variant pack and must be unique when multiple variants need to coexist in Godot. `world.id` and `world.version` identify the parent STOYO world; `scene.id` and `requiredSceneTags` provide stable public semantics. The request hash binds every allowlisted request field. Reordering JSON object keys does not change the hash, while changing tag array order does because arrays are ordered contract data.

The alpha preserves scene tags as namespaced World Spec metadata; it does not yet place semantic interaction anchors into the generated map. Reimporting the same `packId` intentionally replaces Mapsoo-derived Godot resources. Hand-authored gameplay logic must stay outside `res://mapsoo_imports/<packId>/`.

## Privacy boundary

The request schema is an allowlist and rejects unknown keys at every level. Do not add any of the following:

- child identity, voice, chat, learning progress, or growth records;
- parent identity, contact information, household settings, or relationship data;
- private URLs, service credentials, paid provider keys, or internal commercial data;
- unlicensed character/IP references or content-safety conclusions.

The adapter rejects non-allowlisted fields; it is not a PII detector. A name, internal identifier, email address, secret, or private URL encoded in any allowlisted string—including IDs, tags, content rating, seed, title, or description—would still cross the boundary. The STOYO-side projection must therefore supply synthetic or explicitly public-safe values for every field before calling Mapsoo.

Namespaced `extensions` are exported inside the asset pack. They are an interoperability mechanism, not a privacy sandbox. STOYO remains responsible for age suitability, family controls, story state, tasks, printing, and content safety; Mapsoo produces reproducible visual source assets and verifiable pack metadata.

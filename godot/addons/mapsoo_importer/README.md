# Mapsoo Pack Importer

This Godot 4.3+ editor plugin turns an extracted Mapsoo portable pack into a `TileSet` and a scene containing `TileMapLayer` terrain plus `Sprite2D` props.

## Install and import

1. Obtain `addons/mapsoo_importer` only from the official Mapsoo repository or, once published, the Godot Asset Library, then copy it into the root of your Godot project.
2. Open **Project Settings → Plugins** and enable **Mapsoo Pack Importer**.
3. Extract the Mapsoo pack; do not select an untrusted ZIP directly.
4. Choose **Project → Tools → Import Mapsoo Pack...**.
5. Select the extracted pack's `mapsoo.manifest.json`.
6. Open the generated scene in `res://mapsoo_imports/<pack-id>/`.

The importer validates paths, declared byte sizes, SHA-256 hashes, map dimensions, atlas bounds, IDs, and supported schema/engine metadata before writing resources. PNG and JSON stay authoritative; `.tres` and `.tscn` files are derived.

Mapsoo data packs intentionally contain no executable addon. Never enable GDScript copied from a third-party asset pack: manifest hashes prove internal consistency, not publisher identity.

## Safe re-import contract (`alpha.3-dev` source)

Each managed output directory contains exactly three files:

```text
res://mapsoo_imports/<pack-id>/
  <pack-id>.tileset.tres
  <pack-id>.world.tscn
  mapsoo.import-state.json
```

The state file records the validated manifest hash, importer generation, Godot serialization generation, cell/prop counts, and SHA-256 of both derived resources. It is local ownership metadata—not a publisher signature.

Import results are explicit:

| Status | Meaning |
| --- | --- |
| `created` | No prior output directory existed; a complete staged directory was promoted. |
| `unchanged` | Manifest, importer/engine generation, state, exact file set, and both resource hashes still match; no managed bytes or mtimes are touched. |
| `updated` | The prior baseline is clean, but the manifest/importer/engine generation changed; a complete staged directory replaces it. |
| `conflict` | A file is missing, changed, unmanaged, or has invalid state; the importer preserves every existing byte and asks the user to move or resolve the directory. |

For an update, Mapsoo captures the parsed manifest and declared payload hashes, saves and reload-validates both resources plus state in a sibling staging directory, then rechecks the source snapshot. It checks the original output baseline before commit and again after moving the old directory to a backup, before promoting staging. A changed baseline returns `conflict` and restores the changed backup; a failed promote restores the previous backup. Successful normal returns therefore never expose a mixed old/new resource set.

This is a process-level transaction with rollback, not a claim of power-loss atomicity. Keep the selected source pack and its managed output quiescent while import runs, do not run concurrent imports or writers for the same pack, and keep hand-authored scenes/scripts outside the managed directory. Outputs made by alpha.1/alpha.2 have no ownership state and intentionally fail closed; preserve any work, then move or delete that old derived directory before its first alpha.3 import.

## Current development boundaries

- Orthogonal 2D packs using schema `0.1.0`.
- Godot 4.3 or newer.
- Extracted packs only; direct ZIP import is intentionally excluded until zip-bomb limits can be enforced before decompression.
- Collision metadata is currently limited to `none`.
- Prop sprites follow the `<kind>_01` naming convention.
- Scene currently embeds its generated TileSet while the standalone `.tres` is also provided for direct reuse. Externalizing that scene dependency is a separate UID/path migration.
- A hard process or machine crash can leave a staging/backup directory that requires manual inspection; crash journal recovery is not yet claimed.

The full state machine, ownership schema, transaction sequence, and recovery boundary are documented in [`docs/11_SAFE_GODOT_REIMPORT.md`](../../../docs/11_SAFE_GODOT_REIMPORT.md).

Plugin source is MIT-licensed. Generated example assets carry the license declared by each pack.

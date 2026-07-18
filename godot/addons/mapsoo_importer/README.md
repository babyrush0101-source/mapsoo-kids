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

## Current alpha boundaries

- Orthogonal 2D packs using schema `0.1.0`.
- Godot 4.3 or newer.
- Extracted packs only; direct ZIP import is intentionally excluded until zip-bomb limits can be enforced before decompression.
- Collision metadata is currently limited to `none`.
- Prop sprites follow the `<kind>_01` naming convention.
- Re-importing the same pack ID replaces its derived `.tres` and `.tscn`; keep hand edits outside `res://mapsoo_imports/<pack-id>/`.

Plugin source is MIT-licensed. Generated example assets carry the license declared by each pack.

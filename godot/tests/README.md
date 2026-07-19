# Godot importer smoke tests

`run-smoke.ps1` generates and tests the historical schema `0.1.0` contract, schema `0.2.0` playable terrain, and schema `0.3.0` semantic places in isolated Godot processes:

1. generate a deterministic PNG/JSON/manifest fixture;
2. let the editor import the new PNG resources;
3. call `MapsooPackImporter.import_pack()` and validate the resulting resources.

The schema `0.2.0` contract additionally proves:

- Ground/Water/Roads/Props scene nodes with z-index 0/1/2/3;
- 35 explicit atlas tiles, including all 16 Water and 16 Roads N/E/S/W masks;
- two independent `TERRAIN_MODE_MATCH_SIDES` TerrainSets whose peering bits match the manifest;
- one `world-blocking` physics layer/mask 1, full-cell Water polygons, and no Ground/Road collision;
- six hyphen-named prop sprite definitions and exact explicit tile-ID placement;
- fail-closed rejection of missing Water collision and terrain tiles used in the wrong layer;
- `created → unchanged` with identical bytes and mtimes.

The schema `0.3.0` contract additionally proves exact `runtime.places` and schema hash binding; strict sidecar/World Spec projection; unique IDs/cells, stable order, kind/sprite mapping, walkability, placement, bounds, and pixel-center checks; stable `Place_0000`-style `Marker2D` nodes with queryable metadata and places-atlas icons; and fail-closed re-import preservation after a managed-scene edit.

The positive contract covers `TileMapLayer`, `TileSetAtlasSource`, stable source/alternative IDs and atlas coordinates, exact non-empty cell and prop counts, nearest filtering, `AtlasTexture.filter_clip`, metadata, and loadable `.tres`/`.tscn` files.

The negative contract covers traversal, backslash, missing-file, SHA-256 mismatch, nonstandard empty-tile IDs, unsupported collision, oversized PNG-header, and cumulative decoded-pixel-budget manifests. Every failure must return actionable errors and leave no partial Godot resources.

The re-import transaction contract additionally proves:

- clean first import → `created` with a valid ownership state file;
- identical manifest → true `unchanged` with identical bytes and mtimes;
- a valid changed map/TileSet → `updated` with 64 cells and 3 props;
- edited resource, extra file, missing file, corrupt state, and state-less legacy directory → `conflict` without overwriting;
- validation failure against an existing clean import leaves all three managed files unchanged;
- a changed manifest byte invalidates the parsed source snapshot before commit;
- a deterministic promote failure restores the complete previous directory;
- a deterministic edit after `final → backup` returns `conflict`, restores that edit, and leaves no backup/staging residue.

The exact-pack CLI imports a fixed candidate or published release pack twice and requires `created → unchanged`. For schemas `0.2.0`/`0.3.0`, it also requires Water/Roads layers, two TerrainSets, one physics layer, and the documented z-order. Schema `0.3.0` additionally checks every stable marker against the validated places sidecar. PR and tag CI are configured to run the synthetic and exact-pack contracts on Linux and Windows with Godot 4.3 and 4.7. Windows archive SHA-512 values are pinned from the official Godot release checksum files.

Run when `godot4` or `godot` is on `PATH` (or `GODOT_BIN` points to the console executable):

```powershell
powershell -ExecutionPolicy Bypass -File godot/tests/run-smoke.ps1
```

Or specify another Godot 4.3+ console binary:

```powershell
powershell -ExecutionPolicy Bypass -File godot/tests/run-smoke.ps1 -GodotConsole C:\path\to\Godot_console.exe
```

Use `-KeepGenerated` to inspect the fixture and generated resources in the editor after the test.

To verify a real browser-exported pack after extracting the ZIP, pass its manifest to the reusable CLI contract:

```powershell
Godot_v4.3-stable_win64_console.exe --headless --path godot `
  --script res://tests/import_pack_cli.gd -- `
  --manifest=C:\absolute\path\to\the-extracted-pack\mapsoo.manifest.json
```

The command imports the pack, reloads the generated `TileSet` and scene, confirms that placed cell/prop counts match, then imports the same manifest again and proves the second operation is an unchanged no-op.

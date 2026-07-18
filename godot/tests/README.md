# Godot importer smoke tests

`run-smoke.ps1` runs three isolated Godot processes:

1. generate a deterministic PNG/JSON/manifest fixture;
2. let the editor import the new PNG resources;
3. call `MapsooPackImporter.import_pack()` and validate the resulting resources.

The positive contract covers `TileMapLayer`, `TileSetAtlasSource`, stable source/alternative IDs and atlas coordinates, exact non-empty cell and prop counts, nearest filtering, `AtlasTexture.filter_clip`, metadata, and loadable `.tres`/`.tscn` files.

The negative contract covers traversal, backslash, missing-file, SHA-256 mismatch, nonstandard empty-tile IDs, unsupported collision, oversized PNG-header, and cumulative decoded-pixel-budget manifests. Every failure must return actionable errors and leave no partial Godot resources.

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

The command imports the pack, reloads the generated `TileSet` and scene, and confirms that the placed cell and prop counts match the import result.

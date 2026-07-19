# Godot importer smoke tests

`run-smoke.ps1` runs three isolated Godot processes:

1. generate a deterministic PNG/JSON/manifest fixture;
2. let the editor import the new PNG resources;
3. call `MapsooPackImporter.import_pack()` and validate the resulting resources.

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

The exact published pack CLI imports the fixed alpha.2 attachment twice and requires `created → unchanged`. Public CI runs the synthetic and exact-pack contracts on Linux and Windows with Godot 4.3 and 4.7. Windows archive SHA-512 values are pinned from the official Godot release checksum files.

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

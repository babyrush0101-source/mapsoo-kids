# Godot importer example

This is the smallest Godot 4.3+ project that hosts the Mapsoo importer addon and its automated fixture.

From the repository root, run:

```powershell
powershell -ExecutionPolicy Bypass -File godot/tests/run-smoke.ps1
```

The runner generates a deterministic 8×8 pack, asks Godot to import its PNG files, then verifies the generated `TileSet` and `.tscn` resources. It also exercises unsafe-path, missing-file, and checksum-failure cases. Generated test data is removed unless `-KeepGenerated` is supplied.

After a successful run with `-KeepGenerated`, open `godot/project.godot`. The example automatically instantiates the generated world below the instructions.

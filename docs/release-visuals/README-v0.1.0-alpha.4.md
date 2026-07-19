# v0.1.0-alpha.4 release visuals

`renderer-v0.1.0-alpha.4.html` is the versioned source for the Alpha.4 candidate cover and five screenshots. It uses only local, auditable inputs from the exact `examples/packs/sunny-meadow-v0.1.0-alpha.4/` fixture: its preview, terrain atlas, props atlas, manifest facts, and pinned pack SHA-256 `a57e810baaf2f015d7db96bf0e88ab7b6340d476a61ade7447735a6109b8fb35`.

Available frames:

- `?frame=cover` → 1260 × 1000
- `?frame=hero` → 1600 × 900
- `?frame=workbench` → 1600 × 900
- `?frame=contents` → 1600 × 900
- `?frame=godot` → 1600 × 900
- `?frame=contract` → 1600 × 900

The six rendered outputs in `docs/media/v0.1.0-alpha.4/itch/` were produced from this exact HTML and visually checked against the committed fixture. Any replacement must use the same versioned renderer and pass the configured dimension, byte-size, local-source, and visual-review gates.

The Godot frame describes required release gates for Godot 4.3 and Godot 4.7 on Linux and Windows; it does not claim that public CI or the GitHub prerelease has completed. Alpha.4 remains a fixed-hash candidate, and itch.io upload remains postponed. The visuals deliberately describe layered terrain, Terrain Set metadata, and basic Water collision—not a complete game, navigation, or pathfinding system.

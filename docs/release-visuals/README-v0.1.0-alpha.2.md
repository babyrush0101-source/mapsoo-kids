# v0.1.0-alpha.2 release visuals

`renderer-v0.1.0-alpha.2.html` is the versioned source for the alpha.2 itch.io cover and five screenshots. It uses only local, auditable inputs:

- the exact `sunny-meadow-v0.1.0-alpha.2` fixture;
- a fresh 1600 × 900 capture of the current default workbench;
- the fixed candidate SHA-256 and exact required Godot CLI acceptance line;
- release facts declared in the alpha.2 registry.

Render these query-string frames at their declared dimensions:

- `?frame=cover` → 1260 × 1000;
- `?frame=hero` → 1600 × 900;
- `?frame=workbench` → 1600 × 900;
- `?frame=contents` → 1600 × 900;
- `?frame=godot` → 1600 × 900;
- `?frame=contract` → 1600 × 900.

Outputs belong in `docs/media/v0.1.0-alpha.2/itch/`. The Godot frame specifies the required public CI evidence tied to the fixed candidate hash; it does not claim that a local editor screenshot proves execution. After the candidate runs publicly, its linked GitHub checks are the authoritative proof of whether both matrix jobs passed. Alpha.1 images, captions, and video are historical evidence and must not be reused as alpha.2 outputs.

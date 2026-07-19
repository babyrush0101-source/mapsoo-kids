# v0.1.0-alpha.3 release visuals

`renderer-v0.1.0-alpha.3.html` is the versioned source for the alpha.3 cover and five screenshots. It uses only local, auditable inputs: the exact alpha.3 fixture, a fresh current-workbench capture, the pinned pack SHA-256, and the safe re-import contract.

Render these query-string frames at their declared dimensions:

- `?frame=cover` → 1260 × 1000
- `?frame=hero` → 1600 × 900
- `?frame=workbench` → 1600 × 900
- `?frame=contents` → 1600 × 900
- `?frame=godot` → 1600 × 900
- `?frame=contract` → 1600 × 900

Outputs belong in `docs/media/v0.1.0-alpha.3/itch/`. Every PNG is regenerated for this version and must differ byte-for-byte from both historical visual sets. Static images describe required release evidence; the public CI and tag workflow remain authoritative. itch.io upload is postponed, so these files form a verified offline operator kit only.

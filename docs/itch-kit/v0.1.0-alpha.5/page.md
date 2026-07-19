# Deterministic semantic places for a layered Godot world

Mapsoo Sunny Meadow is a **versioned, verified example pack** generated locally by Mapsoo Worldsmith. Alpha.5 keeps the Ground / Water / Roads / Props terrain from Alpha.4 and adds stable semantic place IDs that game code can query without treating coordinates as identity.

## Included

- pack schema `0.3.0` and World Spec `0.2.0`;
- places sidecar `0.1.0` at `runtime/places.json`;
- 35 terrain tiles, 6 prop sprites, and 6 semantic place markers;
- deterministic spawn, landmark, and exit anchors in the Sunny Meadow example;
- `mapsoo.manifest.json` with per-payload-file SHA-256 records;
- `generation-receipt.json` with `schema_version: 0.2.0`;
- `schema/mapsoo-generation-receipt.schema.json` and the versioned pack, world, and places schemas;
- CC0-1.0 generated assets and an MIT License for source/schema documentation.

The file `mapsoo-sunny-meadow-v0.1.0-alpha.5.zip` contains exactly **15 files**: one manifest and **14 payload records**. It is an **Executable-free asset ZIP** containing PNG, JSON, and Markdown only, with no GDScript or addon.

Canonical pack SHA-256: `8d86124a4a37fa4a78487c4e91cb7f5024561f140814a5fd139c5b93fde54f36`.

## Godot import

After the matching GitHub prerelease is published, install importer `0.1.0-alpha.5` separately from that official release. The required verification targets are Godot 4.3 and Godot 4.7. The importer derives the terrain layers, props, and queryable `Marker2D` place anchors while preserving created / unchanged / updated / conflict ownership rules.

The pack does not provide navigation or pathfinding, quests, dialogue, NPC logic, or save data. It is not a complete game. Stable place IDs are the compatibility contract; the resolved coordinates belong to this world/pack version.

## License, security, and AI disclosure

The generated pixel atlases, preview, map, and place data are CC0-1.0. Source code and bundled schema/documentation are under the MIT License. The pack contains no executable scripts. SHA-256 proves consistency, not publisher identity.

The pixel art is deterministic procedural output, **not by an image-generation model**. Codex assisted **Text & Dialog** and **Code**, so the offline page draft discloses those categories. `contains_generative_ai: false` describes the pack graphics and map payload, not the development process.

## Publication status and feedback

The itch.io upload remains postponed. This is an offline Draft source and does not claim that a public itch.io page exists.

- Repository: https://github.com/babyrush0101-source/mapsoo-kids
- Intended GitHub release: https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.5
- Generator demo: https://babyrush0101-source.github.io/mapsoo-kids/
- Reproducible feedback: https://github.com/babyrush0101-source/mapsoo-kids/issues/new?template=first-import-feedback.yml

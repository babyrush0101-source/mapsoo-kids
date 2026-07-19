# Place-linked exterior structures for a layered Godot world

Mapsoo Sunny Meadow Alpha.6 is an unpublished **versioned, verified example pack candidate** generated locally by Mapsoo Worldsmith. It retains the Ground / Water / Roads / Props terrain and semantic places from the published Alpha.5 baseline, then adds deterministic exterior structures linked to stable place IDs.

Alpha.6 is an **unpublished release candidate**; this copy is not a live store listing.

The candidate adds **place-linked exterior structures** and exactly **4 reusable structure archetypes** to the portable contract.

## Candidate contents

- pack schema `0.4.0` and World Spec `0.3.0`;
- places sidecar `0.2.0` and structures sidecar `0.1.0` at `runtime/structures.json`;
- 35 terrain tiles, 6 prop sprites, 6 semantic place markers, and 4 reusable structure archetypes;
- cottage, workshop, tower, and shrine on a transparent atlas: exactly `4 structure sprites` in the reusable public set;
- two place-linked structure instances in the Sunny Meadow candidate example;
- `mapsoo.manifest.json` with per-payload-file SHA-256 records;
- `generation-receipt.json` with `schema_version: 0.2.0`;
- the versioned pack, world, places, structures, and receipt schemas, including `schema/mapsoo-generation-receipt.schema.json`;
- CC0-1.0 generated assets and an MIT License for source/schema documentation.

The candidate file `mapsoo-sunny-meadow-v0.1.0-alpha.6.zip` contains exactly **18 files**: one manifest and **17 payload records**. It is an **Executable-free asset ZIP** containing PNG, JSON, and Markdown only, with no GDScript or addon.

Candidate pack SHA-256: `4563552187977b38cdba86c7d3cbf5429a67b7a0a6049e978c2ef2992ef3a054`.

This digest is not a public-release digest until the matching tag workflow and attachment audit complete. The immutable public baseline remains [v0.1.0-alpha.5](https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.5).

## Godot import

The candidate importer derives terrain layers, props, queryable `Marker2D` place anchors, and a managed `Structures` container with `Sprite2D` children. Structure metadata retains stable IDs, `place_id`, archetype, cell position, pivot, and atlas region while preserving created / unchanged / updated / conflict ownership rules.

The candidate targets Godot 4.3 and Godot 4.7. Do not install addon code copied from the asset ZIP: the asset pack is deliberately executable-free, and the importer is distributed separately from the official repository.

The pack does not provide interiors, doors, interaction, collision for structures, navigation or pathfinding, quests, dialogue, NPC logic, economy, or save data. It is not a complete game.

In particular, this asset pack **does not provide navigation or pathfinding**.

## License, security, and AI disclosure

The generated pixel atlases, preview, map, place data, and structure data are CC0-1.0. Source code and bundled schema/documentation are under the MIT License. SHA-256 proves consistency, not publisher identity.

The pixel art is deterministic procedural output, **not by an image-generation model**. Codex assisted **Text & Dialog** and **Code**, so this offline page draft discloses those categories. `contains_generative_ai: false` describes the pack graphics and map payload, not the development process.

## Publication status and feedback

The itch.io upload remains postponed. This is an offline Draft source and does not claim that a public itch.io page exists. Alpha.6 has not been tagged or published, and this page must not be presented as a live download page.

- Repository: https://github.com/babyrush0101-source/mapsoo-kids
- Current published release: https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.5
- Expected candidate release URL after the matching tag workflow (not live or downloadable yet): https://github.com/babyrush0101-source/mapsoo-kids/releases/tag/v0.1.0-alpha.6
- Generator demo: https://babyrush0101-source.github.io/mapsoo-kids/
- Reproducible feedback: https://github.com/babyrush0101-source/mapsoo-kids/issues/new?template=first-import-feedback.yml

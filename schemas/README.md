# Mapsoo schemas

These schemas are the portable contract between the browser workbench, future CLI tools, Godot importers, and external generators.

- `mapsoo-world.schema.json` validates the versioned input World Spec.
- `mapsoo-pack.schema.json` validates the immutable `0.1.0` portable asset-pack manifest used by the published alpha.1–alpha.3 packs.
- `mapsoo-pack-0.2.schema.json` defines the strict `0.2.0` terrain-aware pack manifest for alpha.4. It fixes the ordered layer contract to `ground`, `water`, `roads`, and `props`; fixes the two side-matching terrain sets, the `world-blocking` physics layer, the 35 terrain tiles, and the six prop sprites; and requires importer `0.1.0-alpha.4` or newer.
- `mapsoo-generation-receipt.schema.json` defines the strict `0.2.0` Provider Receipt planned for the next pack release. It records provider/model/workflow identity, the exact World Spec hash, ordered transformations, AI disclosure, licensing, and source declarations.

The JSON files are the source of truth. Godot `.tres` and `.tscn` resources are derived artifacts created by the importer. Schema major versions are compatibility boundaries; changing an existing field's meaning requires a migration or a new major version.

The published alpha.1–alpha.3 packs and their embedded `0.1.0` pack schema remain byte-for-byte frozen. Legacy `0.1.0` receipts are valid only for allowlisted procedural releases and must never authorize AI output. The `0.2.0` pack and receipt contracts enter a new alpha.4 release directory instead of silently changing an existing tag.

JSON Schema enforces the closed alpha.4 manifest shape, field bounds, ordered IDs, fixed atlas coordinates, terrain peering, and collision declarations. The semantic validator remains authoritative for relationships JSON Schema cannot express safely: referenced files must exist and match their declared bytes and hashes; layer dimensions and sprite/atlas coordinates must agree with the selected tile size and payload contents; every reference must resolve; and the receipt, World Spec, files, and manifest provenance must be the exact trusted projections of the same generation run.

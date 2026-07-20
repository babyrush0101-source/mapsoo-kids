# Mapsoo schemas

These schemas are the portable contract between the browser workbench, future CLI tools, Godot importers, and external generators.

- `mapsoo-world.schema.json` validates the versioned input World Spec.
- `mapsoo-pack.schema.json` validates the immutable `0.1.0` portable asset-pack manifest used by the published alpha.1–alpha.3 packs.
- `mapsoo-pack-0.2.schema.json` defines the strict `0.2.0` terrain-aware pack manifest for alpha.4. It fixes the ordered layer contract to `ground`, `water`, `roads`, and `props`; fixes the two side-matching terrain sets, the `world-blocking` physics layer, the 35 terrain tiles, and the six prop sprites; and requires importer `0.1.0-alpha.4` or newer.
- `mapsoo-generation-receipt.schema.json` defines the strict `0.2.0` Provider Receipt planned for the next pack release. It records provider/model/workflow identity, the exact World Spec hash, ordered transformations, AI disclosure, licensing, and source declarations.

The JSON files are the source of truth. Godot `.tres` and `.tscn` resources are derived artifacts created by the importer. Schema major versions are compatibility boundaries; changing an existing field's meaning requires a migration or a new major version.

Alpha9 and Alpha10 add separate immutable contracts rather than widening an already published schema:

- `mapsoo-pack-0.6.schema.json` is the published Alpha9 `topdown-farm` Pack 0.6 contract.
- `mapsoo-world-asset-receipt-0.1.schema.json` is the published Alpha9, owned-reference-only public receipt.
- `mapsoo-pack-0.7.schema.json` is the Alpha10 candidate `side-platformer` Pack 0.7 contract with 30 canonical roles and 12 explicit left/right character clips.
- `mapsoo-side-platformer-scene-0.2.schema.json`, `mapsoo-side-platformer-collision-0.2.schema.json`, and `mapsoo-side-platformer-navigation-0.2.schema.json` define bounded pixel-coordinate scene placement, collision/hazard geometry, and a directed platform traversal graph.
- `mapsoo-world-asset-receipt-0.2.schema.json` is the Alpha10 candidate receipt. It remains owned-reference-only, binds the full request fingerprint, and omits reference bytes, paths, raw digests, attribution text, and the source description.

Pack 0.7 does not alter Pack 0.6, and receipt 0.2 does not alter receipt 0.1. Alpha10 remains a candidate until the real browser ZIP and Godot 4.3/4.7 cross-platform importer evidence are complete.

The published alpha.1–alpha.3 packs and their embedded `0.1.0` pack schema remain byte-for-byte frozen. Legacy `0.1.0` receipts are valid only for allowlisted procedural releases and must never authorize AI output. The `0.2.0` pack and receipt contracts enter a new alpha.4 release directory instead of silently changing an existing tag.

JSON Schema enforces the closed alpha.4 manifest shape, field bounds, ordered IDs, fixed atlas coordinates, terrain peering, and collision declarations. The semantic validator remains authoritative for relationships JSON Schema cannot express safely: referenced files must exist and match their declared bytes and hashes; layer dimensions and sprite/atlas coordinates must agree with the selected tile size and payload contents; every reference must resolve; and the receipt, World Spec, files, and manifest provenance must be the exact trusted projections of the same generation run.

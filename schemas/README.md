# Mapsoo schemas

These schemas are the portable contract between the browser workbench, future CLI tools, Godot importers, and external generators.

- `mapsoo-world.schema.json` validates the versioned input World Spec.
- `mapsoo-pack.schema.json` validates the portable asset-pack manifest.
- `mapsoo-generation-receipt.schema.json` defines the strict `0.2.0` Provider Receipt planned for the next pack release. It records provider/model/workflow identity, the exact World Spec hash, ordered transformations, AI disclosure, licensing, and source declarations.

The JSON files are the source of truth. Godot `.tres` and `.tscn` resources are derived artifacts created by the importer. Schema major versions are compatibility boundaries; changing an existing field's meaning requires a migration or a new major version.

The public `v0.1.0-alpha.1` Sunny Meadow pack intentionally remains byte-for-byte frozen with its legacy `generation-receipt.json` shape. Legacy `0.1.0` receipts are valid only for that allowlisted procedural release and must never authorize AI output. The full `0.2.0` receipt will enter a new release directory instead of silently changing the existing tag.

# Mapsoo schemas

These schemas are the portable contract between the browser workbench, future CLI tools, Godot importers, and external generators.

- `mapsoo-world.schema.json` validates the versioned input World Spec.
- `mapsoo-pack.schema.json` validates the portable asset-pack manifest.

The JSON files are the source of truth. Godot `.tres` and `.tscn` resources are derived artifacts created by the importer. Schema major versions are compatibility boundaries; changing an existing field's meaning requires a migration or a new major version.

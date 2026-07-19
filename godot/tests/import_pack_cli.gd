extends SceneTree

const Importer = preload("res://addons/mapsoo_importer/mapsoo_pack_importer.gd")
const OUTPUT_ROOT := "res://mapsoo_imports"
const PLAYABLE_SCHEMAS := ["0.2.0", "0.3.0", "0.4.0", "0.5.0"]
const PLACES_SCHEMAS := ["0.3.0", "0.4.0", "0.5.0"]
const STRUCTURES_SCHEMAS := ["0.4.0", "0.5.0"]


func _init() -> void:
	var manifest_path := _argument_value("--manifest=")
	if manifest_path.is_empty():
		_fail("Pass an extracted pack manifest with --manifest=<absolute-or-res-path>.")
		return
	var expectations := _read_expectations()
	if expectations.get("ok", false) != true:
		_fail(str(expectations.get("error", "Invalid exact-pack expectations.")))
		return

	var result: Dictionary = Importer.import_pack(manifest_path, OUTPUT_ROOT)
	if result.get("ok", false) != true:
		_fail("Import failed: %s" % result.get("errors", []))
		return
	var first_status := str(result.get("status", ""))
	if first_status not in ["created", "unchanged"]:
		_fail("First exact-pack import must be created or unchanged, got %s." % first_status)
		return

	var tileset_path := str(result.get("tileset_path", ""))
	var scene_path := str(result.get("scene_path", ""))
	var state_path := str(result.get("state_path", ""))
	if not ResourceLoader.exists(tileset_path, "TileSet"):
		_fail("Generated TileSet is not loadable: %s" % tileset_path)
		return
	if not ResourceLoader.exists(scene_path, "PackedScene"):
		_fail("Generated scene is not loadable: %s" % scene_path)
		return
	if not FileAccess.file_exists(state_path):
		_fail("Generated ownership state is missing: %s" % state_path)
		return

	var packed := ResourceLoader.load(scene_path, "PackedScene", ResourceLoader.CACHE_MODE_IGNORE) as PackedScene
	if packed == null:
		_fail("Generated scene could not be loaded: %s" % scene_path)
		return
	var world := packed.instantiate()
	var ground := world.get_node_or_null("Ground") as TileMapLayer
	var water := world.get_node_or_null("Water") as TileMapLayer
	var roads := world.get_node_or_null("Roads") as TileMapLayer
	var props := world.get_node_or_null("Props")
	if ground == null:
		world.free()
		_fail("Generated scene is missing Ground: TileMapLayer.")
		return
	if props == null:
		world.free()
		_fail("Generated scene is missing Props.")
		return

	var expected_cells := int(result.get("cell_count", -1))
	var expected_props := int(result.get("prop_count", -1))
	if ground.get_used_cells().size() != expected_cells:
		world.free()
		_fail("Ground cell count differs from the importer result.")
		return
	if props.get_child_count() != expected_props:
		world.free()
		_fail("Prop count differs from the importer result.")
		return
	var manifest_parser := JSON.new()
	if manifest_parser.parse(FileAccess.get_file_as_string(manifest_path)) != OK or typeof(manifest_parser.data) != TYPE_DICTIONARY:
		world.free()
		_fail("Validated manifest could not be re-read for the CLI scene contract.")
		return
	var schema_version := str((manifest_parser.data as Dictionary).get("schema_version", ""))
	var expected_places_count := 0
	var expected_structures_count := 0
	if schema_version in PLAYABLE_SCHEMAS:
		if water == null or roads == null:
			world.free()
			_fail("Playable-terrain scene is missing Water or Roads: TileMapLayer.")
			return
		var tile_set := ResourceLoader.load(tileset_path, "TileSet", ResourceLoader.CACHE_MODE_IGNORE) as TileSet
		if tile_set == null or tile_set.get_terrain_sets_count() != 2 or tile_set.get_physics_layers_count() != 1:
			world.free()
			_fail("Playable-terrain TileSet is missing terrain or physics metadata.")
			return
		if water.z_index != 1 or roads.z_index != 2 or props.z_index != 3:
			world.free()
			_fail("Playable-terrain scene layer z-order differs from the portable contract.")
			return
	if schema_version in PLACES_SCHEMAS:
		var manifest: Dictionary = manifest_parser.data
		var runtime: Dictionary = manifest.get("runtime", {})
		var places_ref: Dictionary = runtime.get("places", {})
		var places_path := manifest_path.get_base_dir().path_join(str(places_ref.get("path", "")))
		var sidecar_parser := JSON.new()
		if sidecar_parser.parse(FileAccess.get_file_as_string(places_path)) != OK or typeof(sidecar_parser.data) != TYPE_DICTIONARY:
			world.free()
			_fail("Schema %s places sidecar could not be re-read for the CLI scene contract." % schema_version)
			return
		var expected_places: Array = (sidecar_parser.data as Dictionary).get("places", [])
		expected_places_count = expected_places.size()
		var places_root := world.get_node_or_null("Places") as Node2D
		if (places_root == null and not expected_places.is_empty()) or (places_root != null and places_root.get_child_count() != expected_places.size()):
			world.free()
			_fail("Schema %s scene Places count differs from the validated sidecar." % schema_version)
			return
		for index: int in expected_places.size():
			var marker := places_root.get_node_or_null("Place_%04d" % index) as Marker2D
			var expected_place: Dictionary = expected_places[index]
			if marker == null or marker.get_meta("mapsoo_id", "") != expected_place.get("id") or marker.get_child_count() != 1 or not (marker.get_child(0) is Sprite2D):
				world.free()
				_fail("Schema %s scene marker %d differs from the validated sidecar." % [schema_version, index])
				return
	if schema_version in STRUCTURES_SCHEMAS:
		var manifest: Dictionary = manifest_parser.data
		var structures_ref: Dictionary = (manifest.get("runtime", {}) as Dictionary).get("structures", {})
		var structures_path := manifest_path.get_base_dir().path_join(str(structures_ref.get("path", "")))
		var structures_parser := JSON.new()
		if structures_parser.parse(FileAccess.get_file_as_string(structures_path)) != OK or typeof(structures_parser.data) != TYPE_DICTIONARY:
			world.free()
			_fail("Schema %s structures sidecar could not be re-read for the CLI scene contract." % schema_version)
			return
		var expected_structures: Array = (structures_parser.data as Dictionary).get("structures", [])
		expected_structures_count = expected_structures.size()
		var structures_root := world.get_node_or_null("Structures") as Node2D
		var places_root := world.get_node_or_null("Places") as Node2D
		if (structures_root == null and not expected_structures.is_empty()) or (structures_root != null and structures_root.get_child_count() != expected_structures.size()):
			world.free()
			_fail("Schema %s scene Structures count differs from the validated sidecar." % schema_version)
			return
		for index: int in expected_structures.size():
			var expected: Dictionary = expected_structures[index]
			var sprite := structures_root.get_node_or_null("Structure_%04d" % index) as Sprite2D
			var marker: Marker2D = null
			if places_root != null:
				for candidate: Node in places_root.get_children():
					if candidate.get_meta("mapsoo_id", "") == expected.get("place_id"):
						marker = candidate as Marker2D
						break
			var expected_region: Array = expected.get("region_px", [])
			var atlas_texture := sprite.texture as AtlasTexture if sprite != null else null
			if (
				sprite == null or marker == null or sprite.position != marker.position
				or sprite.get_meta("mapsoo_id", "") != expected.get("id")
				or sprite.get_meta("mapsoo_place_id", "") != expected.get("place_id")
				or sprite.get_meta("mapsoo_archetype", "") != expected.get("archetype")
				or sprite.get_meta("mapsoo_order", -1) != index or not sprite.has_meta("mapsoo_cell")
				or atlas_texture == null or expected_region.size() != 4
				or atlas_texture.region != Rect2(expected_region[0], expected_region[1], expected_region[2], expected_region[3])
			):
				world.free()
				_fail("Schema %s scene structure %d differs from the validated sidecar/place linkage." % [schema_version, index])
				return

	var pack_id := str(result.get("pack_id", ""))
	var expectation_error := _expectation_error(
		expectations,
		pack_id,
		schema_version,
		expected_cells,
		expected_props,
		expected_places_count,
		expected_structures_count
	)
	if not expectation_error.is_empty():
		world.free()
		_fail(expectation_error)
		return
	world.free()
	var managed_paths := [tileset_path, scene_path, state_path]
	var before_bytes := {}
	var before_mtimes := {}
	for path: String in managed_paths:
		before_bytes[path] = FileAccess.get_file_as_bytes(path)
		before_mtimes[path] = FileAccess.get_modified_time(path)
	OS.delay_msec(1100)
	var repeated: Dictionary = Importer.import_pack(manifest_path, OUTPUT_ROOT)
	if repeated.get("ok", false) != true or repeated.get("status", "") != "unchanged":
		_fail("Second exact-pack import must be unchanged: %s" % repeated)
		return
	for path: String in managed_paths:
		if FileAccess.get_file_as_bytes(path) != before_bytes[path] or FileAccess.get_modified_time(path) != before_mtimes[path]:
			_fail("Unchanged exact-pack import rewrote %s." % path)
			return
	var conflict_status := "not-checked"
	if expectations.check_conflict:
		var scene_file := FileAccess.open(scene_path, FileAccess.READ_WRITE)
		if scene_file == null:
			_fail("Managed scene could not be opened for the exact-pack conflict check.")
			return
		scene_file.seek_end()
		scene_file.store_string("\n# exact-pack conflict preservation check\n")
		scene_file.close()
		var tampered_scene := FileAccess.get_file_as_bytes(scene_path)
		var conflict: Dictionary = Importer.import_pack(manifest_path, OUTPUT_ROOT)
		if conflict.get("ok", true) != false or conflict.get("status", "") != "conflict":
			_fail("Edited exact-pack output must fail closed: %s" % conflict)
			return
		if FileAccess.get_file_as_bytes(scene_path) != tampered_scene:
			_fail("Exact-pack conflict did not preserve the edited scene bytes.")
			return
		conflict_status = "preserved"
	if expectations.has_trusted_values:
		print("MAPSOO_PACK_CLI_OK pack_id=%s schema=%s cells=%d props=%d places=%d structures=%d first=%s second=unchanged conflict=%s" % [pack_id, schema_version, expected_cells, expected_props, expected_places_count, expected_structures_count, first_status, conflict_status])
	else:
		print("MAPSOO_PACK_CLI_OK pack_id=%s schema=%s cells=%d props=%d first=%s second=unchanged" % [pack_id, schema_version, expected_cells, expected_props, first_status])
	quit(0)


func _argument_value(prefix: String) -> String:
	for argument in OS.get_cmdline_user_args():
		if argument.begins_with(prefix):
			return argument.trim_prefix(prefix)
	return ""


func _read_expectations() -> Dictionary:
	var expectations := {
		"ok": true,
		"error": "",
		"has_trusted_values": false,
		"pack_id": _argument_value("--expected-pack-id="),
		"schema": _argument_value("--expected-schema="),
		"cells": -1,
		"props": -1,
		"places": -1,
		"structures": -1,
		"check_conflict": false,
	}
	var numeric_arguments := {
		"cells": "--expected-cells=",
		"props": "--expected-props=",
		"places": "--expected-places=",
		"structures": "--expected-structures=",
	}
	for key: String in numeric_arguments:
		var raw := _argument_value(numeric_arguments[key])
		if raw.is_empty():
			continue
		if not raw.is_valid_int() or int(raw) < 0:
			return {"ok": false, "error": "%s must be a non-negative integer." % numeric_arguments[key]}
		expectations[key] = int(raw)
	var conflict_raw := _argument_value("--check-conflict=")
	if not conflict_raw.is_empty():
		if conflict_raw not in ["true", "false"]:
			return {"ok": false, "error": "--check-conflict must be true or false."}
		expectations.check_conflict = conflict_raw == "true"
	var supplied := [
		not expectations.pack_id.is_empty(),
		not expectations.schema.is_empty(),
		expectations.cells >= 0,
		expectations.props >= 0,
		expectations.places >= 0,
		expectations.structures >= 0,
	]
	var supplied_count := 0
	for value: bool in supplied:
		if value:
			supplied_count += 1
	if supplied_count not in [0, supplied.size()]:
		return {"ok": false, "error": "All trusted --expected-* values must be supplied together."}
	expectations.has_trusted_values = supplied_count == supplied.size()
	return expectations


func _expectation_error(
	expectations: Dictionary,
	pack_id: String,
	schema_version: String,
	cells: int,
	props: int,
	places: int,
	structures: int
) -> String:
	if not expectations.has_trusted_values:
		return ""
	var actual := {
		"pack_id": pack_id,
		"schema": schema_version,
		"cells": cells,
		"props": props,
		"places": places,
		"structures": structures,
	}
	for key: String in actual:
		if actual[key] != expectations[key]:
			return "Exact-pack %s differs from trusted expectation: expected %s, got %s." % [key, expectations[key], actual[key]]
	return ""


func _fail(message: String) -> void:
	push_error("MAPSOO_PACK_CLI_FAILURE: %s" % message)
	quit(1)

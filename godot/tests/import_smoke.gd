extends SceneTree

const Importer = preload("res://addons/mapsoo_importer/mapsoo_pack_importer.gd")
const FIXTURE_ROOT := "res://tests/.generated/pack"
const OUTPUT_ROOT := "res://mapsoo_imports"
const EXPECTED_CELLS: Array[int] = [
	0, 1, 2, 3, 0, 1, 2, 3,
	1, 2, 3, 0, 1, 2, 3, 0,
	2, 3, 0, 1, 2, 3, 0, 1,
	3, 0, 1, -1, 3, 0, 1, 2,
	0, 1, 2, 3, 0, 1, 2, 3,
	1, 2, 3, 0, 1, 2, 3, 0,
	2, 3, 0, 1, 2, 3, 0, 1,
	3, 0, 1, 2, 3, 0, 1, 2,
]
const EXPECTED_COORDS := [
	Vector2i(0, 0),
	Vector2i(1, 0),
	Vector2i(2, 0),
	Vector2i(3, 0),
]
const EXPECTED_WALKABLE := [true, false, true, true]

var _failures: Array[String] = []


func _init() -> void:
	_verify_plugin_version()
	if not _activate_png_fixture("oversized"):
		_failures.append("unable to activate oversized PNG fixture")
	if not _activate_png_fixture("budget-a") or not _activate_png_fixture("budget-b"):
		_failures.append("unable to activate cumulative PNG budget fixtures")
	_run_negative_smoke("path traversal", "mapsoo.manifest.path-traversal.json", "unsafe referenced path")
	_run_negative_smoke("backslash path", "mapsoo.manifest.backslash.json", "unsafe referenced path")
	_run_negative_smoke("missing file", "mapsoo.manifest.missing.json", "missing pack file")
	_run_negative_smoke("checksum mismatch", "mapsoo.manifest.checksum.json", "world_spec.sha256 does not match")
	_run_negative_smoke("nonstandard empty tile", "mapsoo.manifest.empty-tile.json", "empty_tile_id must be -1")
	_run_negative_smoke("unsupported collision", "mapsoo.manifest.collision.json", "collision must be")
	_run_negative_smoke("oversized PNG header", "mapsoo.manifest.oversized-png.json", "png dimensions exceed")
	_run_negative_smoke("cumulative PNG budget", "mapsoo.manifest.png-budget.json", "pack budget")
	_activate_manifest("mapsoo.manifest.valid.json")
	_run_positive_smoke()

	if _failures.is_empty():
		print("MAPSOO_GODOT_SMOKE_OK positive=1 negative=8 reimport=created,unchanged,updated,conflict,rollback,race-guard grid_cells=64 used_cells=63 props=2")
		quit(0)
		return

	for failure in _failures:
		push_error("MAPSOO_GODOT_SMOKE_FAILURE: %s" % failure)
	quit(1)


func _verify_plugin_version() -> void:
	var config := ConfigFile.new()
	var load_error := config.load("res://addons/mapsoo_importer/plugin.cfg")
	_expect(load_error == OK, "plugin.cfg must load")
	if load_error == OK:
		_expect(config.get_value("plugin", "version", "") == Importer.IMPORTER_VERSION, "plugin.cfg and importer version must match")


func _run_positive_smoke() -> void:
	var result: Dictionary = Importer.import_pack(
		FIXTURE_ROOT.path_join("mapsoo.manifest.json"),
		OUTPUT_ROOT
	)
	_expect(result.get("ok", false) == true, "valid fixture must import: %s" % result)
	_expect(result.get("status", "") == "created", "first import must return created: %s" % result)
	_expect((result.get("errors", []) as Array).is_empty(), "valid fixture must not report errors")
	_expect(result.get("pack_id", "") == "smoke-pack", "result must return the stable pack id")
	_expect(result.get("cell_count", -1) == 63, "result cell_count must count non-empty placed cells")
	_expect(result.get("prop_count", -1) == 2, "result prop_count must equal fixture props")

	var tileset_path: String = result.get("tileset_path", "")
	var scene_path: String = result.get("scene_path", "")
	var state_path: String = result.get("state_path", "")
	var pack_output := OUTPUT_ROOT.path_join("smoke-pack")
	_expect(tileset_path == pack_output.path_join("smoke-pack.tileset.tres"), "unexpected tileset output path")
	_expect(scene_path == pack_output.path_join("smoke-pack.world.tscn"), "unexpected scene output path")
	_expect(state_path == pack_output.path_join("mapsoo.import-state.json"), "unexpected import state path")
	_expect(ResourceLoader.exists(tileset_path, "TileSet"), "generated TileSet resource must exist")
	_expect(ResourceLoader.exists(scene_path, "PackedScene"), "generated .tscn must exist and be recognized")
	_expect(FileAccess.file_exists(state_path), "first import must create ownership state")
	_assert_import_state(result)
	if not ResourceLoader.exists(tileset_path, "TileSet") or not ResourceLoader.exists(scene_path, "PackedScene"):
		return

	var tile_set := ResourceLoader.load(tileset_path, "TileSet", ResourceLoader.CACHE_MODE_IGNORE) as TileSet
	_expect(tile_set != null, "generated .tres must load as TileSet")
	if tile_set == null:
		return
	_expect(tile_set.tile_size == Vector2i(16, 16), "TileSet tile_size must match manifest")
	_expect(tile_set.get_custom_data_layers_count() == 2, "TileSet must preserve two custom-data layers")
	_expect(tile_set.has_source(0), "TileSet must preserve source_id 0")
	var atlas := tile_set.get_source(0) as TileSetAtlasSource
	_expect(atlas != null, "source 0 must be TileSetAtlasSource")
	if atlas != null:
		_expect(atlas.texture_region_size == Vector2i(16, 16), "atlas region size must match cell_size_px")
		_expect(atlas.use_texture_padding, "atlas must preserve texture_padding=true")
		_expect(atlas.get_tiles_count() == 4, "atlas must contain four explicit tiles")
		_expect(atlas.texture is PortableCompressedTexture2D, "terrain texture must be self-contained and lossless")
		for tile_index in EXPECTED_COORDS.size():
			var coords: Vector2i = EXPECTED_COORDS[tile_index]
			_expect(atlas.has_tile(coords), "atlas is missing tile at %s" % coords)
			if atlas.has_tile(coords):
				_expect(atlas.has_alternative_tile(coords, 0), "tile %s must preserve alternative_id 0" % coords)
				var tile_data := atlas.get_tile_data(coords, 0)
				_expect(tile_data.get_custom_data("walkable") == EXPECTED_WALKABLE[tile_index], "tile %s walkable metadata differs" % coords)
				_expect(tile_data.get_custom_data("biome") == "meadow", "tile %s biome metadata differs" % coords)

	var packed := ResourceLoader.load(scene_path, "PackedScene", ResourceLoader.CACHE_MODE_IGNORE) as PackedScene
	_expect(packed != null, "generated .tscn must load as PackedScene")
	if packed == null:
		return
	var world := packed.instantiate()
	_expect(world is Node2D, "scene root must be Node2D")
	_expect(world.name == &"MapsooWorld", "scene root must be named MapsooWorld")
	var ground := world.get_node_or_null("Ground") as TileMapLayer
	_expect(ground != null, "scene must contain Ground: TileMapLayer")
	if ground != null:
		_expect(ground.texture_filter == CanvasItem.TEXTURE_FILTER_NEAREST, "Ground must use nearest texture filtering")
		_expect(ground.get_used_cells().size() == 63, "Ground must contain 63 non-empty cells")
		for index in range(EXPECTED_CELLS.size()):
			var position := Vector2i(index % 8, index / 8)
			var expected_tile_id: int = EXPECTED_CELLS[index]
			if expected_tile_id < 0:
				_expect(ground.get_cell_source_id(position) == -1, "empty cell %s must stay empty" % position)
				continue
			_expect(ground.get_cell_source_id(position) == 0, "cell %s must use source_id 0" % position)
			_expect(ground.get_cell_atlas_coords(position) == EXPECTED_COORDS[expected_tile_id], "cell %s atlas coordinates differ" % position)
			_expect(ground.get_cell_alternative_tile(position) == 0, "cell %s must use alternative_id 0" % position)

	var props := world.get_node_or_null("Props")
	_expect(props is Node2D, "scene must contain Props: Node2D")
	if props != null:
		_expect(props.get_child_count() == 2, "Props must contain two Sprite2D nodes")
		var seen_ids: Array[String] = []
		for child in props.get_children():
			_expect(child is Sprite2D, "every prop must be a Sprite2D")
			if child is Sprite2D:
				var sprite := child as Sprite2D
				_expect(sprite.texture_filter == CanvasItem.TEXTURE_FILTER_NEAREST, "prop %s must use nearest filtering" % sprite.name)
				_expect(sprite.texture is AtlasTexture, "prop %s must use AtlasTexture" % sprite.name)
				if sprite.texture is AtlasTexture:
					_expect((sprite.texture as AtlasTexture).filter_clip, "prop %s AtlasTexture must set filter_clip" % sprite.name)
				_expect(sprite.has_meta("mapsoo_id"), "prop %s must preserve mapsoo_id metadata" % sprite.name)
				_expect(sprite.has_meta("mapsoo_kind"), "prop %s must preserve mapsoo_kind metadata" % sprite.name)
				seen_ids.append(str(sprite.get_meta("mapsoo_id", "")))
		_expect(seen_ids.has("tree-0-1"), "tree prop id must survive import")
		_expect(seen_ids.has("rock-7-7"), "rock prop id must survive import")
	world.free()

	_run_reimport_contract(result)


func _run_reimport_contract(created_result: Dictionary) -> void:
	var output_dir := str(created_result.get("output_dir", ""))
	var tileset_path := str(created_result.get("tileset_path", ""))
	var scene_path := str(created_result.get("scene_path", ""))
	var state_path := str(created_result.get("state_path", ""))
	var managed_paths: Array[String] = [tileset_path, scene_path, state_path]
	var created_snapshot := _snapshot_files(managed_paths)
	var created_mtimes := _snapshot_mtimes(managed_paths)
	OS.delay_msec(1100)

	var unchanged_result: Dictionary = Importer.import_pack(FIXTURE_ROOT.path_join("mapsoo.manifest.json"), OUTPUT_ROOT)
	_expect(unchanged_result.get("ok", false) == true, "same-manifest re-import must succeed")
	_expect(unchanged_result.get("status", "") == "unchanged", "same-manifest re-import must return unchanged: %s" % unchanged_result)
	_expect(unchanged_result.get("tileset_path", "") == tileset_path, "unchanged import must preserve the TileSet path")
	_expect(unchanged_result.get("scene_path", "") == scene_path, "unchanged import must preserve the scene path")
	_expect(_snapshot_files(managed_paths) == created_snapshot, "unchanged import must not rewrite managed bytes")
	_expect(_snapshot_mtimes(managed_paths) == created_mtimes, "unchanged import must not change managed mtimes")
	_assert_no_transaction_directories("unchanged import")
	_assert_source_snapshot_guard()

	_expect(_activate_manifest("mapsoo.manifest.updated.json"), "unable to activate updated fixture manifest")
	var updated_result: Dictionary = Importer.import_pack(FIXTURE_ROOT.path_join("mapsoo.manifest.json"), OUTPUT_ROOT)
	_expect(updated_result.get("ok", false) == true, "clean updated pack must import: %s" % updated_result)
	_expect(updated_result.get("status", "") == "updated", "changed manifest on a clean baseline must return updated: %s" % updated_result)
	_expect(updated_result.get("cell_count", -1) == 64, "updated pack must contain 64 placed cells")
	_expect(updated_result.get("prop_count", -1) == 3, "updated pack must contain 3 props")
	_assert_import_state(updated_result)
	var updated_snapshot := _snapshot_files(managed_paths)
	_expect(updated_snapshot[tileset_path] != created_snapshot[tileset_path], "updated TileSet bytes must change")
	_expect(updated_snapshot[scene_path] != created_snapshot[scene_path], "updated scene bytes must change")
	_assert_updated_resources(updated_result)
	_assert_no_transaction_directories("updated import")

	var protected_snapshot := _snapshot_files(managed_paths)
	_expect(_activate_manifest("mapsoo.manifest.checksum.json"), "unable to activate invalid update manifest")
	var invalid_result: Dictionary = Importer.import_pack(FIXTURE_ROOT.path_join("mapsoo.manifest.json"), OUTPUT_ROOT)
	_expect(invalid_result.get("ok", true) == false, "invalid update must fail")
	_expect(invalid_result.get("status", "") == "failed", "invalid update must be a validation failure, not a conflict")
	_expect(_snapshot_files(managed_paths) == protected_snapshot, "invalid update must preserve every managed byte")
	_expect(_activate_manifest("mapsoo.manifest.updated.json"), "unable to restore updated fixture manifest")

	var edited_scene := (updated_snapshot[scene_path] as PackedByteArray).duplicate()
	edited_scene.append_array("\n# manual edit that the importer must preserve\n".to_utf8_buffer())
	_expect(_write_bytes(scene_path, edited_scene) == OK, "unable to create scene conflict fixture")
	var conflict_snapshot := _snapshot_files(managed_paths)
	var conflict_result: Dictionary = Importer.import_pack(FIXTURE_ROOT.path_join("mapsoo.manifest.json"), OUTPUT_ROOT)
	_expect(conflict_result.get("ok", true) == false, "manual scene edit must block re-import")
	_expect(conflict_result.get("status", "") == "conflict", "manual scene edit must return conflict: %s" % conflict_result)
	_expect(_snapshot_files(managed_paths) == conflict_snapshot, "conflict must preserve all managed bytes")
	_expect(_write_bytes(scene_path, updated_snapshot[scene_path]) == OK, "unable to restore scene after conflict test")
	_assert_no_transaction_directories("scene conflict")

	var extra_path := output_dir.path_join("manual-notes.txt")
	_expect(_write_bytes(extra_path, "do not delete\n".to_utf8_buffer()) == OK, "unable to create extra-file conflict fixture")
	var extra_result: Dictionary = Importer.import_pack(FIXTURE_ROOT.path_join("mapsoo.manifest.json"), OUTPUT_ROOT)
	_expect(extra_result.get("status", "") == "conflict", "extra output file must return conflict")
	_expect(FileAccess.get_file_as_string(extra_path) == "do not delete\n", "extra-file conflict must preserve the user file")
	_expect(DirAccess.remove_absolute(ProjectSettings.globalize_path(extra_path)) == OK, "unable to remove extra-file conflict fixture")

	var tileset_bytes: PackedByteArray = updated_snapshot[tileset_path]
	_expect(DirAccess.remove_absolute(ProjectSettings.globalize_path(tileset_path)) == OK, "unable to create missing-output conflict fixture")
	var missing_result: Dictionary = Importer.import_pack(FIXTURE_ROOT.path_join("mapsoo.manifest.json"), OUTPUT_ROOT)
	_expect(missing_result.get("status", "") == "conflict", "missing managed output must return conflict")
	_expect(not FileAccess.file_exists(tileset_path), "missing-output conflict must not recreate the missing file")
	_expect(_write_bytes(tileset_path, tileset_bytes) == OK, "unable to restore missing TileSet fixture")

	var state_bytes: PackedByteArray = updated_snapshot[state_path]
	_expect(_write_bytes(state_path, "{}\n".to_utf8_buffer()) == OK, "unable to create corrupt-state fixture")
	var corrupt_state_snapshot := _snapshot_files(managed_paths)
	var state_result: Dictionary = Importer.import_pack(FIXTURE_ROOT.path_join("mapsoo.manifest.json"), OUTPUT_ROOT)
	_expect(state_result.get("status", "") == "conflict", "corrupt ownership state must return conflict")
	_expect(_snapshot_files(managed_paths) == corrupt_state_snapshot, "corrupt-state conflict must preserve every byte")
	_expect(_write_bytes(state_path, state_bytes) == OK, "unable to restore ownership state")
	_assert_import_state(updated_result)

	var rollback_snapshot := _snapshot_files(managed_paths)
	var rollback_baseline: Dictionary = Importer._inspect_existing_import(
		output_dir,
		str(updated_result.get("pack_id", "")),
		tileset_path,
		scene_path,
		state_path,
		str(updated_result.get("manifest_sha256", ""))
	)
	var staging_dir: String = Importer._unique_transaction_dir("staging", "smoke-pack")
	var staging_error := DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(staging_dir))
	_expect(staging_error == OK, "unable to create rollback staging directory")
	if staging_error == OK:
		for managed_path: String in managed_paths:
			_expect(
				_write_bytes(staging_dir.path_join(managed_path.get_file()), rollback_snapshot[managed_path]) == OK,
				"unable to copy rollback staging file %s" % managed_path
			)
		var rollback_result: Dictionary = Importer._commit_staged_directory(
			staging_dir,
			output_dir,
			true,
			str(rollback_baseline.get("baseline_sha256", "")),
			true
		)
		_expect(rollback_result.get("ok", true) == false, "injected promote failure must fail")
		_expect(" ".join(rollback_result.get("errors", [])).contains("restored without changes"), "rollback failure must report restoration")
		_expect(_snapshot_files(managed_paths) == rollback_snapshot, "rollback must restore all managed bytes")
		_expect(Importer._remove_transaction_directory(staging_dir) == OK, "unable to remove rollback staging directory")
	_assert_no_transaction_directories("rollback")
	var guarded_snapshot := _snapshot_files(managed_paths)
	var invalid_path_result: Dictionary = Importer._commit_staged_directory(
		FIXTURE_ROOT,
		output_dir,
		true,
		str(rollback_baseline.get("baseline_sha256", ""))
	)
	_expect(invalid_path_result.get("ok", true) == false, "commit helper must reject a staging directory outside the transaction parent")
	_expect(_snapshot_files(managed_paths) == guarded_snapshot, "invalid commit paths must not move or rewrite managed output")

	var race_staging_dir: String = Importer._unique_transaction_dir("staging", "smoke-pack")
	var race_other_paths: Array[String] = [tileset_path, state_path]
	var race_other_snapshot := _snapshot_files(race_other_paths)
	var race_staging_error := DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(race_staging_dir))
	_expect(race_staging_error == OK, "unable to create baseline-race staging directory")
	if race_staging_error == OK:
		for managed_path: String in managed_paths:
			_expect(
				_write_bytes(race_staging_dir.path_join(managed_path.get_file()), rollback_snapshot[managed_path]) == OK,
				"unable to copy baseline-race staging file %s" % managed_path
			)
		var race_result: Dictionary = Importer._commit_staged_directory(
			race_staging_dir,
			output_dir,
			true,
			str(rollback_baseline.get("baseline_sha256", "")),
			false,
			true
		)
		_expect(race_result.get("ok", true) == false, "concurrent baseline change must block promotion")
		_expect(race_result.get("status", "") == "conflict", "concurrent baseline change must return conflict")
		_expect(FileAccess.get_file_as_string(scene_path).contains("simulated concurrent edit"), "concurrent output edit must be restored, not discarded")
		_expect(_snapshot_files(race_other_paths) == race_other_snapshot, "baseline-race recovery must preserve the other managed files")
		_expect(Importer._remove_transaction_directory(race_staging_dir) == OK, "unable to remove baseline-race staging directory")
		_expect(_write_bytes(scene_path, rollback_snapshot[scene_path]) == OK, "unable to restore scene after baseline-race test")
	_assert_no_transaction_directories("baseline race")

	_remove_managed_output(output_dir, managed_paths)
	var legacy_scene_path := output_dir.path_join("smoke-pack.world.tscn")
	_expect(DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output_dir)) == OK, "unable to create legacy output directory")
	_expect(_write_bytes(legacy_scene_path, "legacy user output\n".to_utf8_buffer()) == OK, "unable to create legacy output fixture")
	_expect(_activate_manifest("mapsoo.manifest.valid.json"), "unable to restore valid manifest for legacy conflict")
	var legacy_result: Dictionary = Importer.import_pack(FIXTURE_ROOT.path_join("mapsoo.manifest.json"), OUTPUT_ROOT)
	_expect(legacy_result.get("status", "") == "conflict", "unmanaged legacy output must fail closed")
	_expect(FileAccess.get_file_as_string(legacy_scene_path) == "legacy user output\n", "legacy conflict must preserve unmanaged bytes")
	_expect(not FileAccess.file_exists(output_dir.path_join("mapsoo.import-state.json")), "legacy conflict must not silently claim ownership")
	_assert_no_transaction_directories("legacy conflict")


func _assert_import_state(result: Dictionary) -> void:
	var state_path := str(result.get("state_path", ""))
	var parser := JSON.new()
	var parse_error := parser.parse(FileAccess.get_file_as_string(state_path))
	_expect(parse_error == OK and typeof(parser.data) == TYPE_DICTIONARY, "import state must be valid JSON")
	if parse_error != OK or typeof(parser.data) != TYPE_DICTIONARY:
		return
	var state: Dictionary = parser.data
	_expect(state.get("schema_version") == Importer.IMPORT_STATE_SCHEMA_VERSION, "unexpected import state schema")
	_expect(state.get("pack_id") == result.get("pack_id"), "state pack_id must match result")
	_expect(state.get("manifest_sha256") == result.get("manifest_sha256"), "state manifest hash must match result")
	_expect(state.get("cell_count") == result.get("cell_count"), "state cell count must match result")
	_expect(state.get("prop_count") == result.get("prop_count"), "state prop count must match result")
	var generated: Dictionary = state.get("generated_files", {})
	for path_key in ["tileset_path", "scene_path"]:
		var path := str(result.get(path_key, ""))
		_expect(generated.get(path.get_file()) == Importer._sha256_file(path), "state hash must match %s" % path)
	var recorded_integrity := str(state.get("integrity_sha256", ""))
	var core := Importer._canonical_import_state_core(state)
	_expect(recorded_integrity == Importer._sha256_text(JSON.stringify(core, "", true)), "state integrity hash must match canonical fields")


func _assert_source_snapshot_guard() -> void:
	var manifest_path := FIXTURE_ROOT.path_join("mapsoo.manifest.json")
	var manifest_bytes := FileAccess.get_file_as_bytes(manifest_path)
	var manifest_read: Dictionary = Importer._read_json_file(manifest_path)
	_expect(manifest_read.get("ok", false) == true, "source snapshot fixture manifest must parse")
	if not manifest_read.get("ok", false):
		return
	var baseline: Dictionary = Importer._capture_source_snapshot(
		manifest_path,
		FIXTURE_ROOT,
		manifest_read.value,
		manifest_read.sha256
	)
	_expect(baseline.get("ok", false) == true, "validated source snapshot must be captured")
	var changed_manifest := manifest_bytes.duplicate()
	changed_manifest.append_array("\n".to_utf8_buffer())
	_expect(_write_bytes(manifest_path, changed_manifest) == OK, "unable to create source snapshot race fixture")
	var changed: Dictionary = Importer._capture_source_snapshot(
		manifest_path,
		FIXTURE_ROOT,
		manifest_read.value,
		manifest_read.sha256
	)
	_expect(changed.get("ok", true) == false, "changed manifest bytes must invalidate the captured source snapshot")
	_expect(_write_bytes(manifest_path, manifest_bytes) == OK, "unable to restore source snapshot fixture")
	var payload_path := FIXTURE_ROOT.path_join("worlds/demo-world.json")
	var payload_bytes := FileAccess.get_file_as_bytes(payload_path)
	var changed_payload := payload_bytes.duplicate()
	changed_payload.append_array("\n".to_utf8_buffer())
	_expect(_write_bytes(payload_path, changed_payload) == OK, "unable to create payload snapshot race fixture")
	var payload_changed: Dictionary = Importer._capture_source_snapshot(
		manifest_path,
		FIXTURE_ROOT,
		manifest_read.value,
		manifest_read.sha256
	)
	_expect(payload_changed.get("ok", true) == false, "changed declared payload bytes must invalidate the source snapshot")
	_expect(_write_bytes(payload_path, payload_bytes) == OK, "unable to restore payload snapshot fixture")


func _assert_updated_resources(result: Dictionary) -> void:
	var tileset := ResourceLoader.load(str(result.tileset_path), "TileSet", ResourceLoader.CACHE_MODE_IGNORE_DEEP) as TileSet
	_expect(tileset != null, "updated TileSet must load")
	if tileset != null:
		var atlas := tileset.get_source(0) as TileSetAtlasSource
		_expect(atlas != null, "updated TileSet must contain source 0")
		if atlas != null:
			_expect(atlas.get_tile_data(Vector2i.ZERO, 0).get_custom_data("walkable") == false, "updated TileSet metadata must be applied")
	var packed := ResourceLoader.load(str(result.scene_path), "PackedScene", ResourceLoader.CACHE_MODE_IGNORE_DEEP) as PackedScene
	_expect(packed != null, "updated scene must load")
	if packed == null:
		return
	var world := packed.instantiate()
	var ground := world.get_node_or_null("Ground") as TileMapLayer
	var props := world.get_node_or_null("Props")
	_expect(ground != null and ground.get_used_cells().size() == 64, "updated scene must contain 64 cells")
	_expect(props != null and props.get_child_count() == 3, "updated scene must contain 3 props")
	world.free()


func _snapshot_files(paths: Array[String]) -> Dictionary:
	var snapshot := {}
	for path: String in paths:
		snapshot[path] = FileAccess.get_file_as_bytes(path)
	return snapshot


func _snapshot_mtimes(paths: Array[String]) -> Dictionary:
	var snapshot := {}
	for path: String in paths:
		snapshot[path] = FileAccess.get_modified_time(path)
	return snapshot


func _write_bytes(path: String, bytes: PackedByteArray) -> Error:
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		return FileAccess.get_open_error()
	file.store_buffer(bytes)
	file.close()
	return OK


func _assert_no_transaction_directories(label: String) -> void:
	var directory := DirAccess.open(ProjectSettings.globalize_path(OUTPUT_ROOT))
	if directory == null:
		return
	directory.include_hidden = true
	for dirname: String in directory.get_directories():
		_expect(not dirname.begins_with(".mapsoo-staging-") and not dirname.begins_with(".mapsoo-backup-"), "%s must not leave transaction directory %s" % [label, dirname])


func _remove_managed_output(output_dir: String, managed_paths: Array[String]) -> void:
	for path: String in managed_paths:
		if FileAccess.file_exists(path):
			_expect(DirAccess.remove_absolute(ProjectSettings.globalize_path(path)) == OK, "unable to remove managed fixture %s" % path)
	if DirAccess.dir_exists_absolute(ProjectSettings.globalize_path(output_dir)):
		_expect(DirAccess.remove_absolute(ProjectSettings.globalize_path(output_dir)) == OK, "unable to remove managed output directory")


func _run_negative_smoke(label: String, manifest_name: String, expected_error_fragment: String) -> void:
	var output_dir := OUTPUT_ROOT.path_join("smoke-pack")
	if not _activate_manifest(manifest_name):
		_failures.append("unable to activate %s fixture manifest" % label)
		return
	var result: Dictionary = Importer.import_pack(FIXTURE_ROOT.path_join("mapsoo.manifest.json"), OUTPUT_ROOT)
	_expect(result.get("ok", true) == false, "%s manifest must fail" % label)
	var errors := result.get("errors", []) as Array
	_expect(not errors.is_empty(), "%s failure must include actionable errors" % label)
	var joined_errors := " ".join(errors).to_lower()
	_expect(joined_errors.contains(expected_error_fragment), "%s must fail for the intended reason: %s" % [label, errors])
	_expect(not FileAccess.file_exists(output_dir.path_join("smoke-pack.tileset.tres")), "%s failure must not leave a .tres" % label)
	_expect(not FileAccess.file_exists(output_dir.path_join("smoke-pack.world.tscn")), "%s failure must not leave a .tscn" % label)


func _activate_manifest(source_name: String) -> bool:
	var source_path := FIXTURE_ROOT.path_join(source_name)
	var source := FileAccess.open(source_path, FileAccess.READ)
	if source == null:
		return false
	var contents := source.get_as_text()
	source.close()
	var active := FileAccess.open(FIXTURE_ROOT.path_join("mapsoo.manifest.json"), FileAccess.WRITE)
	if active == null:
		return false
	active.store_string(contents)
	active.close()
	return true


func _activate_png_fixture(name: String) -> bool:
	var fixture_path := FIXTURE_ROOT.path_join("atlases/%s.png.fixture" % name)
	var output_path := FIXTURE_ROOT.path_join("atlases/%s.png" % name)
	var fixture := FileAccess.open(fixture_path, FileAccess.READ)
	if fixture == null:
		return false
	var bytes := fixture.get_buffer(fixture.get_length())
	fixture.close()
	var output := FileAccess.open(output_path, FileAccess.WRITE)
	if output == null:
		return false
	output.store_buffer(bytes)
	output.close()
	return true


func _expect(condition: bool, message: String) -> void:
	if not condition:
		_failures.append(message)

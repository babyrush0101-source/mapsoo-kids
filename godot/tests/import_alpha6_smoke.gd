extends SceneTree

const Importer = preload("res://addons/mapsoo_importer/mapsoo_pack_importer.gd")
const ROOT := "res://tests/.generated/pack-alpha6"
const OUTPUT_ROOT := "res://mapsoo_imports"
const MANIFEST_PATH := ROOT + "/mapsoo.manifest.json"
const VALID_MANIFEST_PATH := ROOT + "/mapsoo.manifest.valid.json"
const STRUCTURES_PATH := ROOT + "/runtime/structures.json"

var _failures: Array[String] = []


func _init() -> void:
	_run_manifest_negative("structures hash", func(manifest: Dictionary) -> void: manifest.runtime.structures.sha256 = "0".repeat(64), "runtime.structures.sha256")
	_run_sidecar_negative("orphan place", func(sidecar: Dictionary) -> void: sidecar.structures[0].place_id = "missing-place", "resolved place_id")
	_run_sidecar_negative("wrong cell", func(sidecar: Dictionary) -> void: sidecar.structures[0].cell.x += 1, "resolved place cell")
	_run_sidecar_negative("wrong center", func(sidecar: Dictionary) -> void: sidecar.structures[0].pixel_center.x += 1, "resolved place center")
	_run_sidecar_negative("wrong order", func(sidecar: Dictionary) -> void: sidecar.structures[1].order = 7, "zero-based")
	_run_sidecar_negative("wrong sprite", func(sidecar: Dictionary) -> void: sidecar.structures[0].sprite_id = "structure-shrine-01", "archetype-matched")
	_run_sidecar_negative("wrong region", func(sidecar: Dictionary) -> void: sidecar.structures[0].region_px[0] = 32, "canonical atlas slot")
	_run_empty_contract()
	_expect(_restore_valid(), "valid Alpha.6 fixture must restore")
	_run_positive()
	if _failures.is_empty():
		print("MAPSOO_ALPHA6_GODOT_SMOKE_OK structures=4 sprites=Sprite2D atlas=structures metadata=id,place_id,archetype,cell,order linkage=Places reimport=created,unchanged,conflict")
		quit(0)
		return
	for failure: String in _failures:
		push_error("MAPSOO_ALPHA6_GODOT_SMOKE_FAILURE: %s" % failure)
	quit(1)


func _run_manifest_negative(label: String, mutate: Callable, expected: String) -> void:
	var manifest := _read_json(VALID_MANIFEST_PATH)
	mutate.call(manifest)
	_expect(_write_json(MANIFEST_PATH, manifest) == OK, "%s manifest must write" % label)
	var result: Dictionary = Importer.import_pack(MANIFEST_PATH, OUTPUT_ROOT)
	_expect(result.get("ok", true) == false, "%s must fail closed" % label)
	_expect(" ".join(result.get("errors", [])).contains(expected), "%s must report %s: %s" % [label, expected, result])
	_assert_no_output(label)


func _run_sidecar_negative(label: String, mutate: Callable, expected: String) -> void:
	var sidecar := _read_json(ROOT + "/runtime/structures.valid.json") if FileAccess.file_exists(ROOT + "/runtime/structures.valid.json") else _read_json(STRUCTURES_PATH)
	if not FileAccess.file_exists(ROOT + "/runtime/structures.valid.json"):
		_expect(_write_json(ROOT + "/runtime/structures.valid.json", sidecar) == OK, "canonical structures backup must write")
	mutate.call(sidecar)
	_expect(_write_json(STRUCTURES_PATH, sidecar) == OK, "%s sidecar must write" % label)
	var manifest := _read_json(VALID_MANIFEST_PATH)
	var digest := _sha256(STRUCTURES_PATH)
	manifest.runtime.structures.sha256 = digest
	for record: Dictionary in manifest.files:
		if record.path == "runtime/structures.json":
			record.bytes = FileAccess.get_file_as_bytes(STRUCTURES_PATH).size()
			record.sha256 = digest
	_expect(_write_json(MANIFEST_PATH, manifest) == OK, "%s manifest must write" % label)
	var result: Dictionary = Importer.import_pack(MANIFEST_PATH, OUTPUT_ROOT)
	_expect(result.get("ok", true) == false, "%s must fail closed" % label)
	_expect(" ".join(result.get("errors", [])).to_lower().contains(expected.to_lower()), "%s must report %s: %s" % [label, expected, result])
	_assert_no_output(label)


func _run_empty_contract() -> void:
	var manifest := _read_json(VALID_MANIFEST_PATH)
	var world_path := ROOT + "/worlds/alpha6-smoke-pack.world.json"
	var places_path := ROOT + "/runtime/places.json"
	var original_world := _read_json(world_path)
	var original_places := _read_json(places_path)
	var original_structures := _read_json(ROOT + "/runtime/structures.valid.json")
	var empty_world := original_world.duplicate(true)
	empty_world.erase("structures")
	_expect(_write_json(world_path, empty_world) == OK, "empty World Spec must write")
	var world_digest := _sha256(world_path)
	var empty_places := original_places.duplicate(true)
	empty_places.world_spec.sha256 = world_digest
	_expect(_write_json(places_path, empty_places) == OK, "empty-contract places must write")
	var places_digest := _sha256(places_path)
	var empty_structures := original_structures.duplicate(true)
	empty_structures.world_spec.sha256 = world_digest
	empty_structures.places.sha256 = places_digest
	empty_structures.structures = []
	_expect(_write_json(STRUCTURES_PATH, empty_structures) == OK, "empty structures sidecar must write")
	var structures_digest := _sha256(STRUCTURES_PATH)
	manifest.world_spec.sha256 = world_digest
	manifest.runtime.places.sha256 = places_digest
	manifest.runtime.structures.sha256 = structures_digest
	for record: Dictionary in manifest.files:
		var full_path := ""
		if record.path == "worlds/alpha6-smoke-pack.world.json": full_path = world_path
		elif record.path == "runtime/places.json": full_path = places_path
		elif record.path == "runtime/structures.json": full_path = STRUCTURES_PATH
		if not full_path.is_empty():
			record.bytes = FileAccess.get_file_as_bytes(full_path).size()
			record.sha256 = _sha256(full_path)
	var validation: Dictionary = Importer._validate_and_prepare(manifest, ROOT)
	_expect(validation.errors.is_empty(), "omitted World Spec structures with empty sidecar must validate: %s" % str(validation.errors))
	_expect(validation.structures.is_empty(), "empty structures contract must not infer buildings")
	_expect(_write_json(world_path, original_world) == OK, "canonical world must restore")
	_expect(_write_json(places_path, original_places) == OK, "canonical places must restore")
	_expect(_write_json(STRUCTURES_PATH, original_structures) == OK, "canonical structures must restore")
	_expect(_write_json(MANIFEST_PATH, _read_json(VALID_MANIFEST_PATH)) == OK, "canonical manifest must restore")


func _run_positive() -> void:
	var result: Dictionary = Importer.import_pack(MANIFEST_PATH, OUTPUT_ROOT)
	_expect(result.get("ok", false) == true and result.get("status", "") == "created", "valid Alpha.6 import must create: %s" % result)
	if result.get("ok", false) != true:
		return
	var scene_path := str(result.scene_path)
	var packed := ResourceLoader.load(scene_path, "PackedScene", ResourceLoader.CACHE_MODE_IGNORE) as PackedScene
	_expect(packed != null, "Alpha.6 scene must load")
	if packed == null:
		return
	var world := packed.instantiate()
	var structures := world.get_node_or_null("Structures") as Node2D
	var places := world.get_node_or_null("Places") as Node2D
	_expect(structures != null and structures.z_index == 4 and structures.get_child_count() == 4, "Structures must be a four-sprite managed layer at z=4")
	_expect(places != null and places.z_index == 5, "Places must render after structures")
	if structures != null and places != null:
		var expected_ids := ["spawn-cottage", "lookout-workshop", "camp-tower", "exit-shrine"]
		var expected_places := ["spawn", "water-lookout", "road-camp", "north-exit"]
		for index: int in expected_ids.size():
			var sprite := structures.get_node_or_null("Structure_%04d" % index) as Sprite2D
			var marker := places.get_node_or_null("Place_%04d" % index) as Marker2D
			_expect(sprite != null and marker != null, "stable structure and place nodes %d must exist" % index)
			if sprite != null and marker != null:
				_expect(sprite.position == marker.position, "structure %d must anchor to its place marker" % index)
				_expect(sprite.get_meta("mapsoo_id", "") == expected_ids[index], "structure %d id metadata differs" % index)
				_expect(sprite.get_meta("mapsoo_place_id", "") == expected_places[index] and marker.get_meta("mapsoo_id", "") == expected_places[index], "structure %d place linkage differs" % index)
				_expect(sprite.get_meta("mapsoo_order", -1) == index and sprite.has_meta("mapsoo_archetype") and sprite.has_meta("mapsoo_cell"), "structure %d query metadata missing" % index)
				var texture := sprite.texture as AtlasTexture
				_expect(texture != null and texture.region == Rect2(index * 32, 0, 32, 32), "structure %d atlas region differs" % index)
	world.free()

	var managed_paths: Array[String] = [str(result.tileset_path), scene_path, str(result.state_path)]
	var bytes := {}
	var mtimes := {}
	for path: String in managed_paths:
		bytes[path] = FileAccess.get_file_as_bytes(path)
		mtimes[path] = FileAccess.get_modified_time(path)
	OS.delay_msec(1100)
	var repeated: Dictionary = Importer.import_pack(MANIFEST_PATH, OUTPUT_ROOT)
	_expect(repeated.get("ok", false) == true and repeated.get("status", "") == "unchanged", "second Alpha.6 import must be unchanged: %s" % repeated)
	for path: String in managed_paths:
		_expect(FileAccess.get_file_as_bytes(path) == bytes[path], "unchanged Alpha.6 import rewrote bytes: %s" % path)
		_expect(FileAccess.get_modified_time(path) == mtimes[path], "unchanged Alpha.6 import changed mtime: %s" % path)
	var scene_file := FileAccess.open(scene_path, FileAccess.READ_WRITE)
	_expect(scene_file != null, "managed scene must open for conflict injection")
	if scene_file != null:
		scene_file.seek_end()
		scene_file.store_string("\n# user edit must be preserved\n")
		scene_file.close()
	var tampered := FileAccess.get_file_as_bytes(scene_path)
	var conflict: Dictionary = Importer.import_pack(MANIFEST_PATH, OUTPUT_ROOT)
	_expect(conflict.get("ok", true) == false and conflict.get("status", "") == "conflict", "edited Alpha.6 output must fail closed: %s" % conflict)
	_expect(FileAccess.get_file_as_bytes(scene_path) == tampered, "Alpha.6 conflict must preserve edited scene bytes")


func _restore_valid() -> bool:
	var backup := ROOT + "/runtime/structures.valid.json"
	if not FileAccess.file_exists(backup):
		return false
	var bytes := FileAccess.get_file_as_bytes(backup)
	var file := FileAccess.open(STRUCTURES_PATH, FileAccess.WRITE)
	if file == null:
		return false
	file.store_buffer(bytes)
	file.close()
	var manifest := _read_json(VALID_MANIFEST_PATH)
	var digest := _sha256(STRUCTURES_PATH)
	manifest.runtime.structures.sha256 = digest
	for record: Dictionary in manifest.files:
		if record.path == "runtime/structures.json":
			record.bytes = bytes.size()
			record.sha256 = digest
	return _write_json(MANIFEST_PATH, manifest) == OK


func _assert_no_output(label: String) -> void:
	_expect(not DirAccess.dir_exists_absolute(ProjectSettings.globalize_path(OUTPUT_ROOT + "/alpha6-smoke-pack")), "%s failure must not write output" % label)


func _read_json(path: String) -> Dictionary:
	var json := JSON.new()
	_expect(json.parse(FileAccess.get_file_as_string(path)) == OK and typeof(json.data) == TYPE_DICTIONARY, "JSON fixture must parse: %s" % path)
	return json.data if typeof(json.data) == TYPE_DICTIONARY else {}


func _write_json(path: String, value: Variant) -> Error:
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		return FileAccess.get_open_error()
	file.store_string(JSON.stringify(value, "  ", true) + "\n")
	file.close()
	return OK


func _sha256(path: String) -> String:
	var context := HashingContext.new()
	context.start(HashingContext.HASH_SHA256)
	context.update(FileAccess.get_file_as_bytes(path))
	return context.finish().hex_encode()


func _expect(condition: bool, message: String) -> void:
	if not condition:
		_failures.append(message)

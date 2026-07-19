extends SceneTree

const Importer = preload("res://addons/mapsoo_importer/mapsoo_pack_importer.gd")
const FIXTURE_ROOT := "res://tests/.generated/pack-alpha5"
const OUTPUT_ROOT := "res://mapsoo_imports"
const MANIFEST_PATH := FIXTURE_ROOT + "/mapsoo.manifest.json"
const VALID_MANIFEST_PATH := FIXTURE_ROOT + "/mapsoo.manifest.valid.json"
const PLACES_PATH := FIXTURE_ROOT + "/runtime/places.json"

var _failures: Array[String] = []


func _init() -> void:
	_run_manifest_negative("pack version", func(manifest: Dictionary) -> void: manifest.pack.version = "0.1.0-alpha.4", "pack.version")
	_run_manifest_negative("generator name", func(manifest: Dictionary) -> void: manifest.pack.generator.name = "Other Generator", "pack.generator")
	_run_manifest_negative("generator version", func(manifest: Dictionary) -> void: manifest.pack.generator.version = "0.1.0-alpha.4", "pack.generator")
	_run_hash_binding_negative()
	_run_sidecar_negative("sidecar pack version", func(sidecar: Dictionary) -> void: sidecar.pack.version = "0.1.0-alpha.4", "pack identity")
	_run_sidecar_negative("duplicate id", func(sidecar: Dictionary) -> void: sidecar.places[1].id = sidecar.places[0].id, "unique")
	_run_sidecar_negative("order", func(sidecar: Dictionary) -> void: sidecar.places[1].order = 7, "order")
	_run_sidecar_negative("kind sprite", func(sidecar: Dictionary) -> void: sidecar.places[0].sprite_id = "place-exit-01", "kind-matched")
	_run_sidecar_negative("bounds", func(sidecar: Dictionary) -> void: sidecar.places[0].cell.x = 99, "bounds")
	_run_sidecar_negative("pixel center", func(sidecar: Dictionary) -> void: sidecar.places[0].pixel_center.x += 1, "pixel_center")
	_run_sidecar_negative("noncanonical feasible cell", func(sidecar: Dictionary) -> void:
		sidecar.places[0].cell = {"x": 4, "y": 4}
		sidecar.places[0].pixel_center = {"x": 72, "y": 72}, "deterministic resolver output")
	_run_sidecar_negative("placement", func(sidecar: Dictionary) -> void:
		sidecar.places[2].cell = {"x": 4, "y": 4}
		sidecar.places[2].pixel_center = {"x": 72, "y": 72}, "does not satisfy")
	_expect(_restore_valid(), "valid fixture must restore before positive import")
	_run_positive()
	if _failures.is_empty():
		print("MAPSOO_ALPHA5_GODOT_SMOKE_OK places=4 markers=stable metadata=queryable atlas=places validation=hash,version,shape,identity,order,kind,deterministic-cell,placement,bounds reimport=created,unchanged,conflict")
		quit(0)
		return
	for failure: String in _failures:
		push_error("MAPSOO_ALPHA5_GODOT_SMOKE_FAILURE: %s" % failure)
	quit(1)


func _run_hash_binding_negative() -> void:
	var manifest := _read_json(VALID_MANIFEST_PATH)
	manifest.runtime.places.sha256 = "0".repeat(64)
	_expect(_write_json(MANIFEST_PATH, manifest) == OK, "hash-binding manifest must write")
	var result: Dictionary = Importer.import_pack(MANIFEST_PATH, OUTPUT_ROOT)
	_expect(result.get("ok", true) == false, "runtime hash mismatch must fail")
	_expect(" ".join(result.get("errors", [])).contains("runtime.places.sha256"), "runtime hash mismatch must name binding: %s" % result)
	_assert_no_output("hash-binding")


func _run_manifest_negative(label: String, mutate: Callable, expected_fragment: String) -> void:
	var manifest := _read_json(VALID_MANIFEST_PATH)
	mutate.call(manifest)
	_expect(_write_json(MANIFEST_PATH, manifest) == OK, "%s manifest must write" % label)
	var result: Dictionary = Importer.import_pack(MANIFEST_PATH, OUTPUT_ROOT)
	_expect(result.get("ok", true) == false, "%s mutation must fail" % label)
	_expect(" ".join(result.get("errors", [])).to_lower().contains(expected_fragment.to_lower()), "%s mutation must report %s: %s" % [label, expected_fragment, result])
	_assert_no_output(label)


func _run_sidecar_negative(label: String, mutate: Callable, expected_fragment: String) -> void:
	var sidecar := _read_json(FIXTURE_ROOT + "/runtime/places.valid.json") if FileAccess.file_exists(FIXTURE_ROOT + "/runtime/places.valid.json") else _read_json(PLACES_PATH)
	if not FileAccess.file_exists(FIXTURE_ROOT + "/runtime/places.valid.json"):
		_expect(_write_json(FIXTURE_ROOT + "/runtime/places.valid.json", sidecar) == OK, "canonical sidecar backup must write")
	mutate.call(sidecar)
	_expect(_write_json(PLACES_PATH, sidecar) == OK, "%s sidecar must write" % label)
	var manifest := _read_json(VALID_MANIFEST_PATH)
	var digest := _sha256(PLACES_PATH)
	manifest.runtime.places.sha256 = digest
	for record: Dictionary in manifest.files:
		if record.path == "runtime/places.json":
			record.bytes = FileAccess.get_file_as_bytes(PLACES_PATH).size()
			record.sha256 = digest
	_expect(_write_json(MANIFEST_PATH, manifest) == OK, "%s manifest must write" % label)
	var result: Dictionary = Importer.import_pack(MANIFEST_PATH, OUTPUT_ROOT)
	_expect(result.get("ok", true) == false, "%s mutation must fail" % label)
	_expect(" ".join(result.get("errors", [])).to_lower().contains(expected_fragment.to_lower()), "%s mutation must report %s: %s" % [label, expected_fragment, result])
	_assert_no_output(label)


func _run_positive() -> void:
	var result: Dictionary = Importer.import_pack(MANIFEST_PATH, OUTPUT_ROOT)
	_expect(result.get("ok", false) == true and result.get("status", "") == "created", "valid Alpha.5 fixture must create: %s" % result)
	if result.get("ok", false) != true:
		return
	var scene_path := str(result.scene_path)
	var packed := ResourceLoader.load(scene_path, "PackedScene", ResourceLoader.CACHE_MODE_IGNORE) as PackedScene
	_expect(packed != null, "Alpha.5 scene must load")
	if packed == null:
		return
	var world := packed.instantiate()
	var places := world.get_node_or_null("Places") as Node2D
	_expect(places != null, "Alpha.5 scene must contain Places Node2D")
	if places != null:
		_expect(places.z_index == 4, "Places must render after terrain and props")
		_expect(places.get_child_count() == 4, "Places must contain four Marker2D children")
		var expected_ids := ["spawn", "water-lookout", "road-camp", "north-exit"]
		var expected_positions := [Vector2(56, 56), Vector2(56, 40), Vector2(72, 56), Vector2(8, 56)]
		var expected_atlas_x := [0, 32, 16, 80]
		for index: int in expected_ids.size():
			var marker := places.get_node_or_null("Place_%04d" % index) as Marker2D
			_expect(marker != null, "stable marker Place_%04d must exist" % index)
			if marker != null:
				_expect(marker.position == expected_positions[index], "marker %d position differs" % index)
				_expect(marker.get_meta("mapsoo_id", "") == expected_ids[index], "marker %d external ID metadata differs" % index)
				_expect(marker.has_meta("mapsoo_kind") and marker.has_meta("mapsoo_placement") and marker.has_meta("mapsoo_tags") and marker.has_meta("mapsoo_cell"), "marker %d must expose query metadata" % index)
				_expect(marker.get_child_count() == 1 and marker.get_child(0) is Sprite2D, "marker %d must have one Sprite2D icon" % index)
				if marker.get_child_count() == 1 and marker.get_child(0) is Sprite2D:
					var sprite := marker.get_child(0) as Sprite2D
					var atlas_texture := sprite.texture as AtlasTexture
					_expect(atlas_texture != null and atlas_texture.region.position.x == expected_atlas_x[index], "marker %d must use its places-atlas region" % index)
	world.free()

	var managed_paths: Array[String] = [str(result.tileset_path), scene_path, str(result.state_path)]
	var bytes := {}
	var mtimes := {}
	for path: String in managed_paths:
		bytes[path] = FileAccess.get_file_as_bytes(path)
		mtimes[path] = FileAccess.get_modified_time(path)
	OS.delay_msec(1100)
	var repeated: Dictionary = Importer.import_pack(MANIFEST_PATH, OUTPUT_ROOT)
	_expect(repeated.get("ok", false) == true and repeated.get("status", "") == "unchanged", "second Alpha.5 import must be unchanged: %s" % repeated)
	for path: String in managed_paths:
		_expect(FileAccess.get_file_as_bytes(path) == bytes[path], "unchanged Alpha.5 import rewrote bytes: %s" % path)
		_expect(FileAccess.get_modified_time(path) == mtimes[path], "unchanged Alpha.5 import changed mtime: %s" % path)
	var scene_file := FileAccess.open(scene_path, FileAccess.READ_WRITE)
	_expect(scene_file != null, "managed scene must open for conflict injection")
	if scene_file != null:
		scene_file.seek_end()
		scene_file.store_string("\n# user edit must be preserved\n")
		scene_file.close()
	var tampered := FileAccess.get_file_as_bytes(scene_path)
	var conflict: Dictionary = Importer.import_pack(MANIFEST_PATH, OUTPUT_ROOT)
	_expect(conflict.get("ok", true) == false and conflict.get("status", "") == "conflict", "edited Alpha.5 output must fail closed: %s" % conflict)
	_expect(FileAccess.get_file_as_bytes(scene_path) == tampered, "Alpha.5 conflict must preserve edited scene bytes")


func _restore_valid() -> bool:
	var sidecar_backup := FIXTURE_ROOT + "/runtime/places.valid.json"
	if not FileAccess.file_exists(sidecar_backup):
		return false
	var sidecar_bytes := FileAccess.get_file_as_bytes(sidecar_backup)
	var sidecar_file := FileAccess.open(PLACES_PATH, FileAccess.WRITE)
	if sidecar_file == null:
		return false
	sidecar_file.store_buffer(sidecar_bytes)
	sidecar_file.close()
	var manifest := _read_json(VALID_MANIFEST_PATH)
	var digest := _sha256(PLACES_PATH)
	manifest.runtime.places.sha256 = digest
	for record: Dictionary in manifest.files:
		if record.path == "runtime/places.json":
			record.bytes = sidecar_bytes.size()
			record.sha256 = digest
	return _write_json(MANIFEST_PATH, manifest) == OK


func _assert_no_output(label: String) -> void:
	_expect(not DirAccess.dir_exists_absolute(ProjectSettings.globalize_path(OUTPUT_ROOT + "/alpha5-smoke-pack")), "%s failure must not write output" % label)


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

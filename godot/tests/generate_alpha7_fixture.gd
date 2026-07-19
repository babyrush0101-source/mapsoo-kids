extends SceneTree

const SOURCE_ROOT := "res://tests/.generated/pack-alpha6"
const ROOT := "res://tests/.generated/pack-alpha7"
const SOURCE_WORLD := "worlds/alpha6-smoke-pack.world.json"
const WORLD_PATH := "worlds/alpha7-smoke-pack.world.json"


func _init() -> void:
	var error := _generate_fixture()
	if error != OK:
		push_error("MAPSOO_ALPHA7_FIXTURE_FAILURE: error=%d" % error)
		quit(1)
		return
	print("MAPSOO_ALPHA7_FIXTURE_OK %s" % ROOT)
	quit(0)


func _generate_fixture() -> Error:
	for directory: String in ["atlases", "previews", "runtime", "schema", "worlds"]:
		var mkdir_error := DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(ROOT.path_join(directory)))
		if mkdir_error != OK:
			return mkdir_error
	for path: String in [
		"atlases/places.png", "atlases/props.png", "atlases/structures.png", "atlases/terrain.png",
		"previews/map-preview.png", "generation-receipt.json", "license-assets.md", "worlds/demo-world.json",
	]:
		var copy_error := _copy_file(SOURCE_ROOT.path_join(path), ROOT.path_join(path))
		if copy_error != OK:
			return copy_error

	var world := _read_json(SOURCE_ROOT.path_join(SOURCE_WORLD))
	if not world.ok:
		return ERR_PARSE_ERROR
	world.value.id = "alpha7-smoke-pack"
	world.value.title = "Alpha 7 Importer Smoke Pack"
	world.value.seed = "alpha7-godot-smoke-001"
	var write_error := _write_json(ROOT.path_join(WORLD_PATH), world.value)
	if write_error != OK:
		return write_error

	var demo := _read_json(ROOT.path_join("worlds/demo-world.json"))
	if not demo.ok:
		return ERR_PARSE_ERROR
	demo.value.schema_version = "0.5.0"
	write_error = _write_json(ROOT.path_join("worlds/demo-world.json"), demo.value)
	if write_error != OK:
		return write_error

	var places := _read_json(SOURCE_ROOT.path_join("runtime/places.json"))
	if not places.ok:
		return ERR_PARSE_ERROR
	places.value.schema_version = "0.3.0"
	places.value.pack = {"id": "alpha7-smoke-pack", "version": "0.1.0-alpha.7"}
	places.value.world_spec = {"path": WORLD_PATH, "sha256": _sha256(ROOT.path_join(WORLD_PATH))}
	write_error = _write_json(ROOT.path_join("runtime/places.json"), places.value)
	if write_error != OK:
		return write_error

	var structures := _read_json(SOURCE_ROOT.path_join("runtime/structures.json"))
	if not structures.ok:
		return ERR_PARSE_ERROR
	structures.value.schema_version = "0.2.0"
	structures.value.pack = {"id": "alpha7-smoke-pack", "version": "0.1.0-alpha.7"}
	structures.value.world_spec = {"path": WORLD_PATH, "sha256": _sha256(ROOT.path_join(WORLD_PATH))}
	structures.value.places = {"path": "runtime/places.json", "sha256": _sha256(ROOT.path_join("runtime/places.json"))}
	write_error = _write_json(ROOT.path_join("runtime/structures.json"), structures.value)
	if write_error != OK:
		return write_error

	for schema_path: String in [
		"schema/mapsoo-generation-receipt.schema.json", "schema/mapsoo-pack-0.5.schema.json",
		"schema/mapsoo-places-0.3.schema.json", "schema/mapsoo-structures-0.2.schema.json",
		"schema/mapsoo-world-0.3.schema.json",
	]:
		write_error = _write_json(ROOT.path_join(schema_path), {"fixture": schema_path})
		if write_error != OK:
			return write_error
	write_error = _write_text(ROOT.path_join("readme.md"), "# Alpha 7 Godot smoke fixture\n")
	if write_error != OK:
		return write_error

	var manifest := _read_json(SOURCE_ROOT.path_join("mapsoo.manifest.valid.json"))
	if not manifest.ok:
		return ERR_PARSE_ERROR
	manifest.value.schema_version = "0.5.0"
	manifest.value.pack.id = "alpha7-smoke-pack"
	manifest.value.pack.title = "Alpha 7 Importer Smoke Pack"
	manifest.value.pack.version = "0.1.0-alpha.7"
	manifest.value.pack.generator.version = "0.1.0-alpha.7"
	manifest.value.compatibility.importer.min_version = "0.1.0-alpha.7"
	manifest.value.world_spec = {"path": WORLD_PATH, "sha256": _sha256(ROOT.path_join(WORLD_PATH))}
	manifest.value.provenance.seed = "alpha7-godot-smoke-001"
	manifest.value.runtime.places = {
		"path": "runtime/places.json", "sha256": _sha256(ROOT.path_join("runtime/places.json")),
		"schema": {"path": "schema/mapsoo-places-0.3.schema.json", "sha256": _sha256(ROOT.path_join("schema/mapsoo-places-0.3.schema.json"))},
	}
	manifest.value.runtime.structures = {
		"path": "runtime/structures.json", "sha256": _sha256(ROOT.path_join("runtime/structures.json")),
		"schema": {"path": "schema/mapsoo-structures-0.2.schema.json", "sha256": _sha256(ROOT.path_join("schema/mapsoo-structures-0.2.schema.json"))},
	}
	var file_paths: Array[String] = [
		"atlases/places.png", "atlases/props.png", "atlases/structures.png", "atlases/terrain.png",
		"generation-receipt.json", "license-assets.md", "previews/map-preview.png", "readme.md",
		"runtime/places.json", "runtime/structures.json", "schema/mapsoo-generation-receipt.schema.json",
		"schema/mapsoo-pack-0.5.schema.json", "schema/mapsoo-places-0.3.schema.json",
		"schema/mapsoo-structures-0.2.schema.json", "schema/mapsoo-world-0.3.schema.json",
		WORLD_PATH, "worlds/demo-world.json",
	]
	manifest.value.files = []
	for path: String in file_paths:
		var full_path := ROOT.path_join(path)
		manifest.value.files.append({"path": path, "media_type": _media_type(path), "bytes": FileAccess.get_file_as_bytes(full_path).size(), "sha256": _sha256(full_path)})
	write_error = _write_json(ROOT.path_join("mapsoo.manifest.valid.json"), manifest.value)
	if write_error != OK:
		return write_error
	return _write_json(ROOT.path_join("mapsoo.manifest.json"), manifest.value)


func _copy_file(source: String, target: String) -> Error:
	var file := FileAccess.open(target, FileAccess.WRITE)
	if file == null:
		return FileAccess.get_open_error()
	file.store_buffer(FileAccess.get_file_as_bytes(source))
	file.close()
	return OK


func _read_json(path: String) -> Dictionary:
	var json := JSON.new()
	if json.parse(FileAccess.get_file_as_string(path)) != OK or typeof(json.data) != TYPE_DICTIONARY:
		return {"ok": false, "value": {}}
	return {"ok": true, "value": json.data}


func _write_json(path: String, value: Variant) -> Error:
	return _write_text(path, JSON.stringify(value, "  ", true) + "\n")


func _write_text(path: String, value: String) -> Error:
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		return FileAccess.get_open_error()
	file.store_string(value)
	file.close()
	return OK


func _sha256(path: String) -> String:
	var context := HashingContext.new()
	context.start(HashingContext.HASH_SHA256)
	context.update(FileAccess.get_file_as_bytes(path))
	return context.finish().hex_encode()


func _media_type(path: String) -> String:
	if path.ends_with(".png"):
		return "image/png"
	if path.ends_with(".json"):
		return "application/json"
	return "text/markdown"

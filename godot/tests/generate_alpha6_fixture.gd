extends SceneTree

const SOURCE_ROOT := "res://tests/.generated/pack-alpha5"
const ROOT := "res://tests/.generated/pack-alpha6"
const TILE_SIZE := 16
const ARCHETYPES: Array[String] = ["cottage", "workshop", "tower", "shrine"]


func _init() -> void:
	var error := _generate_fixture()
	if error != OK:
		push_error("MAPSOO_ALPHA6_FIXTURE_FAILURE: error=%d" % error)
		quit(1)
		return
	print("MAPSOO_ALPHA6_FIXTURE_OK %s" % ROOT)
	quit(0)


func _generate_fixture() -> Error:
	for directory: String in ["atlases", "previews", "runtime", "schema", "worlds"]:
		var mkdir_error := DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(ROOT.path_join(directory)))
		if mkdir_error != OK:
			return mkdir_error
	for path: String in ["atlases/places.png", "atlases/props.png", "atlases/terrain.png", "previews/map-preview.png", "generation-receipt.json", "license-assets.md", "worlds/demo-world.json"]:
		var copy_error := _copy_file(SOURCE_ROOT.path_join(path), ROOT.path_join(path))
		if copy_error != OK:
			return copy_error

	var sprite_size := TILE_SIZE * 2
	var structures_image := Image.create(sprite_size * ARCHETYPES.size(), sprite_size, false, Image.FORMAT_RGBA8)
	structures_image.fill(Color(0, 0, 0, 0))
	for index: int in ARCHETYPES.size():
		var left := index * sprite_size
		var color := Color.from_hsv(float(index) / ARCHETYPES.size(), 0.55, 0.9)
		structures_image.fill_rect(Rect2i(left + 4, 12, 24, 19), color.darkened(0.25))
		structures_image.fill_rect(Rect2i(left + 7, 15, 18, 15), color)
		structures_image.fill_rect(Rect2i(left + 11, 21, 6, 9), Color(0.22, 0.15, 0.1, 1))
	var image_error := structures_image.save_png(ROOT.path_join("atlases/structures.png"))
	if image_error != OK:
		return image_error

	var source_world := _read_json(SOURCE_ROOT.path_join("worlds/alpha5-smoke-pack.world.json"))
	if not source_world.ok:
		return ERR_PARSE_ERROR
	var world: Dictionary = source_world.value
	world.schemaVersion = "0.3.0"
	world.id = "alpha6-smoke-pack"
	world.title = "Alpha 6 Importer Smoke Pack"
	world.seed = "alpha6-godot-smoke-001"
	world.structures = [
		{"id": "spawn-cottage", "placeId": "spawn", "archetype": "cottage"},
		{"id": "lookout-workshop", "placeId": "water-lookout", "archetype": "workshop"},
		{"id": "camp-tower", "placeId": "road-camp", "archetype": "tower"},
		{"id": "exit-shrine", "placeId": "north-exit", "archetype": "shrine"},
	]
	var world_path := "worlds/alpha6-smoke-pack.world.json"
	var write_error := _write_json(ROOT.path_join(world_path), world)
	if write_error != OK:
		return write_error
	var demo := _read_json(ROOT.path_join("worlds/demo-world.json"))
	if not demo.ok:
		return ERR_PARSE_ERROR
	demo.value.schema_version = "0.4.0"
	write_error = _write_json(ROOT.path_join("worlds/demo-world.json"), demo.value)
	if write_error != OK:
		return write_error

	var places_read := _read_json(SOURCE_ROOT.path_join("runtime/places.json"))
	if not places_read.ok:
		return ERR_PARSE_ERROR
	var places: Dictionary = places_read.value
	places.schema_version = "0.2.0"
	places.pack = {"id": "alpha6-smoke-pack", "version": "0.1.0-alpha.6"}
	places.world_spec = {"path": world_path, "sha256": _sha256(ROOT.path_join(world_path))}
	write_error = _write_json(ROOT.path_join("runtime/places.json"), places)
	if write_error != OK:
		return write_error

	var resolved: Array = []
	for index: int in world.structures.size():
		var declaration: Dictionary = world.structures[index]
		var place: Dictionary = places.places[index]
		resolved.append({
			"id": declaration.id, "order": index, "place_id": declaration.placeId,
			"archetype": declaration.archetype, "sprite_id": "structure-%s-01" % declaration.archetype,
			"cell": place.cell.duplicate(), "pixel_center": place.pixel_center.duplicate(),
			"region_px": [index * sprite_size, 0, sprite_size, sprite_size],
			"pivot_px": [TILE_SIZE, sprite_size],
		})
	var structures := {
		"schema_version": "0.1.0",
		"pack": {"id": "alpha6-smoke-pack", "version": "0.1.0-alpha.6"},
		"world_spec": {"path": world_path, "sha256": _sha256(ROOT.path_join(world_path))},
		"places": {"path": "runtime/places.json", "sha256": _sha256(ROOT.path_join("runtime/places.json"))},
		"coordinate_space": {"origin": "top-left", "unit": "cell", "tile_size": TILE_SIZE},
		"resolution_algorithm": {"id": "mapsoo-semantic-structure-resolver", "version": "0.1.0"},
		"atlas": {"path": "atlases/structures.png", "sprite_size_px": [sprite_size, sprite_size], "pivot_px": [TILE_SIZE, sprite_size]},
		"structures": resolved,
	}
	write_error = _write_json(ROOT.path_join("runtime/structures.json"), structures)
	if write_error != OK:
		return write_error
	for schema_path: String in ["schema/mapsoo-generation-receipt.schema.json", "schema/mapsoo-pack-0.4.schema.json", "schema/mapsoo-places-0.2.schema.json", "schema/mapsoo-structures-0.1.schema.json", "schema/mapsoo-world-0.3.schema.json"]:
		write_error = _write_json(ROOT.path_join(schema_path), {"fixture": schema_path})
		if write_error != OK:
			return write_error
	write_error = _write_text(ROOT.path_join("readme.md"), "# Alpha 6 Godot smoke fixture\n")
	if write_error != OK:
		return write_error

	var manifest_read := _read_json(SOURCE_ROOT.path_join("mapsoo.manifest.valid.json"))
	if not manifest_read.ok:
		return ERR_PARSE_ERROR
	var manifest: Dictionary = manifest_read.value
	manifest.schema_version = "0.4.0"
	manifest.pack.id = "alpha6-smoke-pack"
	manifest.pack.title = "Alpha 6 Importer Smoke Pack"
	manifest.pack.version = "0.1.0-alpha.6"
	manifest.pack.generator.version = "0.1.0-alpha.6"
	manifest.compatibility.importer.min_version = "0.1.0-alpha.6"
	manifest.world_spec = {"path": world_path, "sha256": _sha256(ROOT.path_join(world_path))}
	manifest.provenance.seed = "alpha6-godot-smoke-001"
	manifest.runtime.places.path = "runtime/places.json"
	manifest.runtime.places.sha256 = _sha256(ROOT.path_join("runtime/places.json"))
	manifest.runtime.places.schema = {"path": "schema/mapsoo-places-0.2.schema.json", "sha256": _sha256(ROOT.path_join("schema/mapsoo-places-0.2.schema.json"))}
	manifest.runtime.structures = {
		"path": "runtime/structures.json", "sha256": _sha256(ROOT.path_join("runtime/structures.json")),
		"schema": {"path": "schema/mapsoo-structures-0.1.schema.json", "sha256": _sha256(ROOT.path_join("schema/mapsoo-structures-0.1.schema.json"))},
	}
	for index: int in ARCHETYPES.size():
		manifest.sprites.append({
			"id": "structure-%s-01" % ARCHETYPES[index], "atlas": "atlases/structures.png",
			"region_px": [index * sprite_size, 0, sprite_size, sprite_size], "pivot_px": [TILE_SIZE, sprite_size],
			"footprint_cells": [2, 2], "tags": ["structure", ARCHETYPES[index]],
		})
	var file_paths: Array[String] = [
		"atlases/places.png", "atlases/props.png", "atlases/structures.png", "atlases/terrain.png",
		"generation-receipt.json", "license-assets.md", "previews/map-preview.png", "readme.md",
		"runtime/places.json", "runtime/structures.json", "schema/mapsoo-generation-receipt.schema.json",
		"schema/mapsoo-pack-0.4.schema.json", "schema/mapsoo-places-0.2.schema.json",
		"schema/mapsoo-structures-0.1.schema.json", "schema/mapsoo-world-0.3.schema.json",
		world_path, "worlds/demo-world.json",
	]
	manifest.files = []
	for path: String in file_paths:
		var full_path := ROOT.path_join(path)
		manifest.files.append({"path": path, "media_type": _media_type(path), "bytes": FileAccess.get_file_as_bytes(full_path).size(), "sha256": _sha256(full_path)})
	write_error = _write_json(ROOT.path_join("mapsoo.manifest.valid.json"), manifest)
	if write_error != OK:
		return write_error
	return _write_json(ROOT.path_join("mapsoo.manifest.json"), manifest)


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

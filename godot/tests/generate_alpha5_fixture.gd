extends SceneTree

const SOURCE_ROOT := "res://tests/.generated/pack-alpha4"
const ROOT := "res://tests/.generated/pack-alpha5"
const TILE_SIZE := 16
const PLACE_KINDS: Array[String] = ["spawn", "settlement", "landmark", "resource", "encounter", "exit"]


func _init() -> void:
	var error := _generate_fixture()
	if error != OK:
		push_error("MAPSOO_ALPHA5_FIXTURE_FAILURE: error=%d" % error)
		quit(1)
		return
	print("MAPSOO_ALPHA5_FIXTURE_OK %s" % ROOT)
	quit(0)


func _generate_fixture() -> Error:
	for directory: String in ["atlases", "previews", "runtime", "schema", "worlds"]:
		var mkdir_error := DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(ROOT.path_join(directory)))
		if mkdir_error != OK:
			return mkdir_error
	for path: String in ["atlases/props.png", "atlases/terrain.png", "previews/map-preview.png", "generation-receipt.json", "license-assets.md", "worlds/demo-world.json"]:
		var copy_error := _copy_file(SOURCE_ROOT.path_join(path), ROOT.path_join(path))
		if copy_error != OK:
			return copy_error

	var places_image := Image.create(TILE_SIZE * PLACE_KINDS.size(), TILE_SIZE, false, Image.FORMAT_RGBA8)
	places_image.fill(Color(0, 0, 0, 0))
	for index: int in PLACE_KINDS.size():
		_draw_marker(places_image, index, Color.from_hsv(float(index) / PLACE_KINDS.size(), 0.75, 1.0))
	var image_error := places_image.save_png(ROOT.path_join("atlases/places.png"))
	if image_error != OK:
		return image_error

	var places := [
		{"id": "spawn", "label": "Smoke Spawn", "kind": "spawn", "placement": "center", "tags": ["start", "safe"]},
		{"id": "water-lookout", "label": "Water Lookout", "kind": "landmark", "placement": "near-water", "tags": ["water"]},
		{"id": "road-camp", "label": "Road Camp", "kind": "settlement", "placement": "on-road", "tags": ["road", "safe"]},
		{"id": "north-exit", "label": "North Exit", "kind": "exit", "placement": "map-edge", "tags": ["travel"]},
	]
	var world_spec := {
		"schemaVersion": "0.2.0",
		"id": "alpha5-smoke-pack",
		"title": "Alpha 5 Importer Smoke Pack",
		"seed": "alpha5-godot-smoke-001",
		"map": {"width": 8, "height": 8, "biome": "meadow"},
		"visual": {"tileSize": TILE_SIZE, "palette": ["#274C36", "#4A904E", "#B8D66E", "#3273D2", "#AE7E44"]},
		"output": {"assetLicense": "CC0-1.0", "targets": ["common", "godot", "itch"]},
		"places": places,
	}
	var world_path := "worlds/alpha5-smoke-pack.world.json"
	var write_error := _write_json(ROOT.path_join(world_path), world_spec)
	if write_error != OK:
		return write_error
	var demo_read := _read_json(ROOT.path_join("worlds/demo-world.json"))
	if not demo_read.ok:
		return ERR_PARSE_ERROR
	var demo: Dictionary = demo_read.value
	demo.schema_version = "0.3.0"
	write_error = _write_json(ROOT.path_join("worlds/demo-world.json"), demo)
	if write_error != OK:
		return write_error

	var resolved := [
		_resolved_place(places[0], 0, Vector2i(3, 3)),
		_resolved_place(places[1], 1, Vector2i(3, 2)),
		_resolved_place(places[2], 2, Vector2i(4, 3)),
		_resolved_place(places[3], 3, Vector2i(0, 3)),
	]
	var sidecar := {
		"schema_version": "0.1.0",
		"pack": {"id": "alpha5-smoke-pack", "version": "0.1.0-alpha.5"},
		"world_spec": {"path": world_path, "sha256": _sha256(ROOT.path_join(world_path))},
		"coordinate_space": {"origin": "top-left", "unit": "cell", "tile_size": TILE_SIZE},
		"placement_algorithm": {"id": "mapsoo-semantic-place-resolver", "version": "0.1.0"},
		"places": resolved,
	}
	write_error = _write_json(ROOT.path_join("runtime/places.json"), sidecar)
	if write_error != OK:
		return write_error
	for schema_path: String in ["schema/mapsoo-generation-receipt.schema.json", "schema/mapsoo-pack-0.3.schema.json", "schema/mapsoo-places-0.1.schema.json", "schema/mapsoo-world-0.2.schema.json"]:
		write_error = _write_json(ROOT.path_join(schema_path), {"fixture": schema_path})
		if write_error != OK:
			return write_error
	write_error = _write_text(ROOT.path_join("readme.md"), "# Alpha 5 Godot smoke fixture\n")
	if write_error != OK:
		return write_error

	var source_manifest_read := _read_json(SOURCE_ROOT.path_join("mapsoo.manifest.valid.json"))
	if not source_manifest_read.ok:
		return ERR_PARSE_ERROR
	var manifest: Dictionary = source_manifest_read.value
	manifest.schema_version = "0.3.0"
	manifest.pack.id = "alpha5-smoke-pack"
	manifest.pack.title = "Alpha 5 Importer Smoke Pack"
	manifest.pack.version = "0.1.0-alpha.5"
	manifest.pack.generator.version = "0.1.0-alpha.5"
	manifest.compatibility.importer.min_version = "0.1.0-alpha.5"
	manifest.world_spec = {"path": world_path, "sha256": _sha256(ROOT.path_join(world_path))}
	manifest.provenance.seed = "alpha5-godot-smoke-001"
	manifest.runtime = {
		"places": {
			"path": "runtime/places.json",
			"sha256": _sha256(ROOT.path_join("runtime/places.json")),
			"schema": {
				"path": "schema/mapsoo-places-0.1.schema.json",
				"sha256": _sha256(ROOT.path_join("schema/mapsoo-places-0.1.schema.json")),
			},
		},
	}
	for index: int in PLACE_KINDS.size():
		manifest.sprites.append({
			"id": "place-%s-01" % PLACE_KINDS[index],
			"atlas": "atlases/places.png",
			"region_px": [index * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE],
			"pivot_px": [TILE_SIZE / 2, TILE_SIZE],
			"footprint_cells": [1, 1],
			"tags": ["place", PLACE_KINDS[index]],
		})
	var file_paths: Array[String] = [
		"atlases/places.png", "atlases/props.png", "atlases/terrain.png", "generation-receipt.json",
		"license-assets.md", "previews/map-preview.png", "readme.md", "runtime/places.json",
		"schema/mapsoo-generation-receipt.schema.json", "schema/mapsoo-pack-0.3.schema.json",
		"schema/mapsoo-places-0.1.schema.json", "schema/mapsoo-world-0.2.schema.json",
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


func _resolved_place(place: Dictionary, order: int, cell: Vector2i) -> Dictionary:
	return {
		"id": place.id, "order": order, "label": place.label, "kind": place.kind,
		"placement": place.placement, "sprite_id": "place-%s-01" % place.kind,
		"tags": place.tags.duplicate(), "cell": {"x": cell.x, "y": cell.y},
		"pixel_center": {"x": cell.x * TILE_SIZE + TILE_SIZE / 2, "y": cell.y * TILE_SIZE + TILE_SIZE / 2},
	}


func _draw_marker(image: Image, index: int, color: Color) -> void:
	var x := index * TILE_SIZE
	image.fill_rect(Rect2i(x + 5, 2, 6, 10), color)
	image.fill_rect(Rect2i(x + 3, 4, 10, 5), color.lightened(0.15))
	image.fill_rect(Rect2i(x + 7, 11, 2, 4), color.darkened(0.2))


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

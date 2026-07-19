extends SceneTree

const ROOT := "res://tests/.generated/pack-alpha4"
const WIDTH := 8
const HEIGHT := 8
const TILE_SIZE := 16
const PROP_KINDS: Array[String] = ["tree", "rock", "flower", "shrub", "log", "marker"]


func _init() -> void:
	var error := _generate_fixture()
	if error != OK:
		push_error("MAPSOO_ALPHA4_FIXTURE_FAILURE: error=%d" % error)
		quit(1)
		return
	print("MAPSOO_ALPHA4_FIXTURE_OK %s" % ROOT)
	quit(0)


func _generate_fixture() -> Error:
	for directory: String in ["atlases", "previews", "worlds"]:
		var mkdir_error := DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(ROOT.path_join(directory)))
		if mkdir_error != OK:
			return mkdir_error

	var terrain_image := Image.create(TILE_SIZE * 8, TILE_SIZE * 6, false, Image.FORMAT_RGBA8)
	terrain_image.fill(Color(0, 0, 0, 0))
	for tile_id: int in [0, 1, 2]:
		_fill_tile(terrain_image, tile_id, Color8(74 + tile_id * 12, 144, 78))
	for mask: int in 16:
		_fill_tile(terrain_image, 16 + mask, Color8(50, 115 + mask * 3, 210))
		_fill_tile(terrain_image, 32 + mask, Color8(174 + mask * 2, 126, 68))
	var terrain_error := terrain_image.save_png(ROOT.path_join("atlases/terrain.png"))
	if terrain_error != OK:
		return terrain_error

	var props_image := Image.create(TILE_SIZE * PROP_KINDS.size(), TILE_SIZE, false, Image.FORMAT_RGBA8)
	props_image.fill(Color(0, 0, 0, 0))
	for index: int in PROP_KINDS.size():
		_draw_prop(props_image, index, Color.from_hsv(float(index) / PROP_KINDS.size(), 0.65, 0.9))
	var props_error := props_image.save_png(ROOT.path_join("atlases/props.png"))
	if props_error != OK:
		return props_error

	var preview := Image.create(WIDTH * TILE_SIZE, HEIGHT * TILE_SIZE, false, Image.FORMAT_RGBA8)
	preview.fill(Color8(74, 144, 78))
	var preview_error := preview.save_png(ROOT.path_join("previews/map-preview.png"))
	if preview_error != OK:
		return preview_error

	var world_spec := {
		"schemaVersion": "0.1.0",
		"id": "alpha4-smoke-pack",
		"title": "Alpha 4 Importer Smoke Pack",
		"seed": "alpha4-godot-smoke-001",
		"map": {"width": WIDTH, "height": HEIGHT, "biome": "meadow"},
		"visual": {
			"tileSize": TILE_SIZE,
			"palette": ["#274C36", "#4A904E", "#B8D66E", "#3273D2", "#AE7E44"],
		},
		"output": {"assetLicense": "CC0-1.0", "targets": ["common", "godot", "itch"]},
	}
	var world_error := _write_json(ROOT.path_join("worlds/alpha4-smoke-pack.world.json"), world_spec)
	if world_error != OK:
		return world_error

	var ground: Array[int] = []
	var water: Array[int] = []
	var roads: Array[int] = []
	for index: int in WIDTH * HEIGHT:
		ground.append(index % 3)
		water.append(16 + index if index < 16 else -1)
		roads.append(32 + index - 16 if index >= 16 and index < 32 else -1)
	var props: Array[Dictionary] = []
	for index: int in PROP_KINDS.size():
		props.append({"id": "%s-%d" % [PROP_KINDS[index], index], "kind": PROP_KINDS[index], "x": index, "y": HEIGHT - 1})
	var demo_map := {
		"schema_version": "0.2.0",
		"width": WIDTH,
		"height": HEIGHT,
		"layers": [
			{"id": "ground", "cells": ground},
			{"id": "water", "cells": water},
			{"id": "roads", "cells": roads},
		],
		"props": props,
	}
	var demo_error := _write_json(ROOT.path_join("worlds/demo-world.json"), demo_map)
	if demo_error != OK:
		return demo_error
	var receipt_error := _write_json(ROOT.path_join("generation-receipt.json"), {"fixture": "alpha4-godot-smoke"})
	if receipt_error != OK:
		return receipt_error
	var license_error := _write_text(ROOT.path_join("license-assets.md"), "# Asset license\n\nCC0-1.0\n")
	if license_error != OK:
		return license_error

	var file_paths: Array[String] = [
		"atlases/props.png",
		"atlases/terrain.png",
		"generation-receipt.json",
		"license-assets.md",
		"previews/map-preview.png",
		"worlds/alpha4-smoke-pack.world.json",
		"worlds/demo-world.json",
	]
	var files: Array[Dictionary] = []
	for path: String in file_paths:
		var full_path := ROOT.path_join(path)
		files.append({
			"path": path,
			"media_type": _media_type(path),
			"bytes": FileAccess.get_file_as_bytes(full_path).size(),
			"sha256": _sha256(full_path),
		})
	var manifest := _manifest(files)
	var write_error := _write_json(ROOT.path_join("mapsoo.manifest.valid.json"), manifest)
	if write_error != OK:
		return write_error
	write_error = _write_json(ROOT.path_join("mapsoo.manifest.json"), manifest)
	if write_error != OK:
		return write_error

	var invalid_water := manifest.duplicate(true)
	invalid_water["atlases"][0]["tiles"][3]["collision"] = {"type": "none"}
	write_error = _write_json(ROOT.path_join("mapsoo.manifest.water-collision.json"), invalid_water)
	if write_error != OK:
		return write_error
	var invalid_ground := manifest.duplicate(true)
	invalid_ground["layers"][0]["json_pointer"] = "/layers/1/cells"
	return _write_json(ROOT.path_join("mapsoo.manifest.ground-terrain.json"), invalid_ground)


func _manifest(files: Array[Dictionary]) -> Dictionary:
	var tiles: Array[Dictionary] = []
	for tile_id: int in [0, 1, 2]:
		tiles.append(_tile(tile_id, "ground-%02d" % (tile_id + 1), null, {"type": "none"}, true))
	for mask: int in 16:
		tiles.append(_tile(16 + mask, "water-mask-%d" % mask, _terrain("water", "water", mask), {"type": "full-cell", "physics_layer": "world-blocking"}, false))
	for mask: int in 16:
		tiles.append(_tile(32 + mask, "road-mask-%d" % mask, _terrain("roads", "road", mask), {"type": "none"}, true))
	var sprites: Array[Dictionary] = []
	for index: int in PROP_KINDS.size():
		sprites.append({
			"id": "%s-01" % PROP_KINDS[index],
			"atlas": "atlases/props.png",
			"region_px": [index * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE],
			"pivot_px": [TILE_SIZE / 2, TILE_SIZE],
			"footprint_cells": [1, 1],
			"tags": ["prop", PROP_KINDS[index], "meadow"],
		})
	return {
		"schema_version": "0.2.0",
		"pack": {
			"id": "alpha4-smoke-pack",
			"title": "Alpha 4 Importer Smoke Pack",
			"version": "0.1.0-alpha.4",
			"generator": {"name": "Mapsoo Worldsmith", "version": "0.1.0-alpha.4"},
			"created_at": "2026-07-19T00:00:00.000Z",
		},
		"compatibility": {
			"godot_min": "4.3",
			"grid": "orthogonal",
			"art_style": "pixel_art",
			"importer": {
				"id": "mapsoo_importer",
				"min_version": "0.1.0-alpha.4",
				"source": "https://github.com/babyrush0101-source/mapsoo-kids",
			},
		},
		"world_spec": {"path": "worlds/alpha4-smoke-pack.world.json", "sha256": _sha256(ROOT.path_join("worlds/alpha4-smoke-pack.world.json"))},
		"demo": {"map": "worlds/demo-world.json", "preview": "previews/map-preview.png"},
		"layers": [
			_tile_layer("ground", "/layers/0/cells"),
			_tile_layer("water", "/layers/1/cells"),
			_tile_layer("roads", "/layers/2/cells"),
			{"id": "props", "kind": "objects", "path": "worlds/demo-world.json", "json_pointer": "/props", "encoding": "objects", "sprite_atlas": "atlases/props.png"},
		],
		"terrain_sets": [
			{"id": "water", "mode": "match-sides", "terrains": [{"id": "water", "name": "Water", "color": "#3273D2"}]},
			{"id": "roads", "mode": "match-sides", "terrains": [{"id": "road", "name": "Road", "color": "#AE7E44"}]},
		],
		"physics_layers": [{"id": "world-blocking", "collision_layer": 1, "collision_mask": 1}],
		"receipt": {"path": "generation-receipt.json"},
		"atlases": [{
			"id": "terrain",
			"source_id": 0,
			"file": "atlases/terrain.png",
			"image_size_px": [TILE_SIZE * 8, TILE_SIZE * 6],
			"cell_size_px": [TILE_SIZE, TILE_SIZE],
			"margin_px": [0, 0],
			"separation_px": [0, 0],
			"texture_padding": true,
			"tiles": tiles,
		}],
		"sprites": sprites,
		"files": files,
		"license": {"assets": {"id": "CC0-1.0", "file": "license-assets.md"}},
		"provenance": {"contains_generative_ai": false, "model_provider": null, "model": null, "seed": "alpha4-godot-smoke-001", "human_curated": false},
	}


func _tile_layer(id: String, pointer: String) -> Dictionary:
	return {"id": id, "kind": "tilemap", "path": "worlds/demo-world.json", "json_pointer": pointer, "encoding": "row-major", "dimensions_cells": [WIDTH, HEIGHT], "atlas_id": "terrain", "empty_tile_id": -1}


func _tile(tile_id: int, id: String, terrain: Variant, collision: Dictionary, walkable: bool) -> Dictionary:
	return {
		"tile_id": tile_id,
		"id": id,
		"atlas_coords": [tile_id % 8, tile_id / 8],
		"size_cells": [1, 1],
		"alternative_id": 0,
		"collision": collision,
		"terrain": terrain,
		"custom_data": {"walkable": walkable, "biome": "meadow"},
		"tags": ["terrain", id],
	}


func _terrain(set_id: String, terrain_id: String, mask: int) -> Dictionary:
	return {
		"set_id": set_id,
		"terrain_id": terrain_id,
		"peering": {
			"north": terrain_id if mask & 1 else null,
			"east": terrain_id if mask & 2 else null,
			"south": terrain_id if mask & 4 else null,
			"west": terrain_id if mask & 8 else null,
		},
	}


func _fill_tile(image: Image, tile_id: int, color: Color) -> void:
	image.fill_rect(Rect2i((tile_id % 8) * TILE_SIZE, (tile_id / 8) * TILE_SIZE, TILE_SIZE, TILE_SIZE), color)


func _draw_prop(image: Image, index: int, color: Color) -> void:
	var origin_x := index * TILE_SIZE
	image.fill_rect(Rect2i(origin_x + 5, 4, 6, 11), color)
	image.fill_rect(Rect2i(origin_x + 3, 2, 10, 7), color.lightened(0.12))


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

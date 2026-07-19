extends SceneTree

const ROOT := "res://tests/.generated/pack"
const WIDTH := 8
const HEIGHT := 8
const TILE_SIZE := 16
const CELLS: Array[int] = [
	0, 1, 2, 3, 0, 1, 2, 3,
	1, 2, 3, 0, 1, 2, 3, 0,
	2, 3, 0, 1, 2, 3, 0, 1,
	3, 0, 1, -1, 3, 0, 1, 2,
	0, 1, 2, 3, 0, 1, 2, 3,
	1, 2, 3, 0, 1, 2, 3, 0,
	2, 3, 0, 1, 2, 3, 0, 1,
	3, 0, 1, 2, 3, 0, 1, 2,
]


func _init() -> void:
	var error := _generate_fixture()
	if error != OK:
		push_error("Fixture generation failed with error %d" % error)
		quit(1)
		return
	print("MAPSOO_FIXTURE_OK %s" % ROOT)
	quit(0)


func _generate_fixture() -> Error:
	var absolute_root := ProjectSettings.globalize_path(ROOT)
	var make_error := DirAccess.make_dir_recursive_absolute(absolute_root.path_join("atlases"))
	if make_error != OK:
		return make_error
	make_error = DirAccess.make_dir_recursive_absolute(absolute_root.path_join("worlds"))
	if make_error != OK:
		return make_error
	make_error = DirAccess.make_dir_recursive_absolute(absolute_root.path_join("previews"))
	if make_error != OK:
		return make_error

	var terrain := Image.create(TILE_SIZE * 4, TILE_SIZE, false, Image.FORMAT_RGBA8)
	var terrain_colors := [
		Color("76a950"),
		Color("4f91ad"),
		Color("d6c18b"),
		Color("b8d978"),
	]
	for tile_index in range(terrain_colors.size()):
		_fill_tile(terrain, tile_index, terrain_colors[tile_index])
	var save_error := terrain.save_png(ROOT.path_join("atlases/terrain.png"))
	if save_error != OK:
		return save_error

	var props := Image.create(TILE_SIZE * 3, TILE_SIZE, false, Image.FORMAT_RGBA8)
	props.fill(Color(0, 0, 0, 0))
	_draw_prop(props, 0, Color("2f5d3a"))
	_draw_prop(props, 1, Color("78858b"))
	_draw_prop(props, 2, Color("f6c445"))
	save_error = props.save_png(ROOT.path_join("atlases/props.png"))
	if save_error != OK:
		return save_error

	var preview := Image.create(WIDTH * TILE_SIZE, HEIGHT * TILE_SIZE, false, Image.FORMAT_RGBA8)
	for cell_index in range(CELLS.size()):
		var tile_id: int = CELLS[cell_index]
		var color: Color = Color("202733") if tile_id < 0 else terrain_colors[tile_id]
		var cell_x := cell_index % WIDTH
		var cell_y := cell_index / WIDTH
		preview.fill_rect(Rect2i(cell_x * TILE_SIZE, cell_y * TILE_SIZE, TILE_SIZE, TILE_SIZE), color)
	save_error = preview.save_png(ROOT.path_join("previews/map-preview.png"))
	if save_error != OK:
		return save_error

	var world_spec := {
		"schemaVersion": "0.1.0",
		"id": "smoke-pack",
		"title": "Importer Smoke Pack",
		"description": "A deterministic fixture for the Godot importer.",
		"seed": "mapsoo-godot-smoke-001",
		"visual": {
			"style": "pixel-art",
			"tileSize": TILE_SIZE,
			"palette": ["#2f5d3a", "#76a950", "#b8d978", "#4f91ad", "#d6c18b"],
		},
		"map": {"width": WIDTH, "height": HEIGHT, "biome": "meadow"},
		"output": {"targets": ["common", "godot", "itch"], "assetLicense": "CC0-1.0"},
	}
	var demo_map := {
		"schema_version": "0.1.0",
		"width": WIDTH,
		"height": HEIGHT,
		"layers": [{"id": "ground", "encoding": "row-major", "cells": CELLS}],
		"props": [
			{"id": "tree-0-1", "kind": "tree", "x": 0, "y": 1},
			{"id": "rock-7-7", "kind": "rock", "x": 7, "y": 7},
		],
	}
	var receipt := {
		"schema_version": "0.1.0",
		"generator": {"id": "procedural-pixel-v1", "version": "0.1.0"},
		"world_id": "smoke-pack",
		"seed": "mapsoo-godot-smoke-001",
		"contains_generative_ai": false,
		"transformations": ["deterministic-test-fixture"],
	}

	var write_error := _write_json(ROOT.path_join("worlds/smoke-pack.world.json"), world_spec)
	if write_error != OK:
		return write_error
	write_error = _write_json(ROOT.path_join("worlds/demo-world.json"), demo_map)
	if write_error != OK:
		return write_error
	write_error = _write_json(ROOT.path_join("generation-receipt.json"), receipt)
	if write_error != OK:
		return write_error
	write_error = _write_text(ROOT.path_join("license-assets.md"), "# Asset license\n\nCC0-1.0 deterministic smoke-test assets.\n")
	if write_error != OK:
		return write_error
	write_error = _write_text(ROOT.path_join("readme.md"), "# Importer Smoke Pack\n")
	if write_error != OK:
		return write_error

	var payload_paths: Array[String] = [
		"readme.md",
		"license-assets.md",
		"generation-receipt.json",
		"worlds/smoke-pack.world.json",
		"worlds/demo-world.json",
		"atlases/terrain.png",
		"atlases/props.png",
		"previews/map-preview.png",
	]
	var files: Array[Dictionary] = []
	for relative_path in payload_paths:
		var resource_path := ROOT.path_join(relative_path)
		var bytes := FileAccess.get_file_as_bytes(resource_path)
		files.append({
			"path": relative_path,
			"media_type": _media_type(relative_path),
			"bytes": bytes.size(),
			"sha256": _sha256(resource_path),
		})

	var manifest := _manifest(files)
	write_error = _write_json(ROOT.path_join("mapsoo.manifest.json"), manifest)
	if write_error != OK:
		return write_error
	write_error = _write_json(ROOT.path_join("mapsoo.manifest.valid.json"), manifest)
	if write_error != OK:
		return write_error

	var updated_demo := demo_map.duplicate(true)
	updated_demo["layers"][0]["cells"][27] = 0
	updated_demo["props"].append({"id": "flower-4-4", "kind": "flower", "x": 4, "y": 4})
	write_error = _write_json(ROOT.path_join("worlds/demo-world.updated.json"), updated_demo)
	if write_error != OK:
		return write_error
	var updated_manifest := manifest.duplicate(true)
	updated_manifest["pack"]["version"] = "0.1.0-alpha.3-test"
	updated_manifest["demo"]["map"] = "worlds/demo-world.updated.json"
	updated_manifest["layers"][0]["path"] = "worlds/demo-world.updated.json"
	updated_manifest["layers"][1]["path"] = "worlds/demo-world.updated.json"
	updated_manifest["atlases"][0]["tiles"][0]["custom_data"]["walkable"] = false
	var updated_map_path := ROOT.path_join("worlds/demo-world.updated.json")
	var updated_map_bytes := FileAccess.get_file_as_bytes(updated_map_path)
	updated_manifest["files"].append({
		"path": "worlds/demo-world.updated.json",
		"media_type": "application/json",
		"bytes": updated_map_bytes.size(),
		"sha256": _sha256(updated_map_path),
	})
	write_error = _write_json(ROOT.path_join("mapsoo.manifest.updated.json"), updated_manifest)
	if write_error != OK:
		return write_error

	var traversal := manifest.duplicate(true)
	traversal["atlases"][0]["file"] = "../outside.png"
	write_error = _write_json(ROOT.path_join("mapsoo.manifest.path-traversal.json"), traversal)
	if write_error != OK:
		return write_error

	var backslash := manifest.duplicate(true)
	backslash["atlases"][0]["file"] = "atlases\\terrain.png"
	write_error = _write_json(ROOT.path_join("mapsoo.manifest.backslash.json"), backslash)
	if write_error != OK:
		return write_error

	var missing := manifest.duplicate(true)
	missing["atlases"][0]["file"] = "atlases/missing.png"
	for record: Dictionary in missing["files"]:
		if record["path"] == "atlases/terrain.png":
			record["path"] = "atlases/missing.png"
			break
	write_error = _write_json(ROOT.path_join("mapsoo.manifest.missing.json"), missing)
	if write_error != OK:
		return write_error

	var checksum := manifest.duplicate(true)
	checksum["world_spec"]["sha256"] = "0".repeat(64)
	write_error = _write_json(ROOT.path_join("mapsoo.manifest.checksum.json"), checksum)
	if write_error != OK:
		return write_error

	var empty_tile := manifest.duplicate(true)
	empty_tile["layers"][0]["empty_tile_id"] = 7
	write_error = _write_json(ROOT.path_join("mapsoo.manifest.empty-tile.json"), empty_tile)
	if write_error != OK:
		return write_error

	var collision := manifest.duplicate(true)
	collision["atlases"][0]["tiles"][0]["collision"] = {"type": "rectangle"}
	write_error = _write_json(ROOT.path_join("mapsoo.manifest.collision.json"), collision)
	if write_error != OK:
		return write_error

	var oversized_png_header := PackedByteArray([
		0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
		0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
		0x00, 0x00, 0x20, 0x01, 0x00, 0x00, 0x00, 0x01,
	])
	var oversized_fixture_path := ROOT.path_join("atlases/oversized.png.fixture")
	write_error = _write_bytes(oversized_fixture_path, oversized_png_header)
	if write_error != OK:
		return write_error
	var oversized := manifest.duplicate(true)
	oversized["atlases"][0]["file"] = "atlases/oversized.png"
	oversized["atlases"][0]["image_size_px"] = [8193, 1]
	oversized["files"].append({
		"path": "atlases/oversized.png",
		"media_type": "image/png",
		"bytes": oversized_png_header.size(),
		"sha256": _sha256(oversized_fixture_path),
	})
	write_error = _write_json(ROOT.path_join("mapsoo.manifest.oversized-png.json"), oversized)
	if write_error != OK:
		return write_error

	var budget_png_header := PackedByteArray([
		0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
		0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
		0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10, 0x00,
	])
	var budget_a_fixture := ROOT.path_join("atlases/budget-a.png.fixture")
	var budget_b_fixture := ROOT.path_join("atlases/budget-b.png.fixture")
	write_error = _write_bytes(budget_a_fixture, budget_png_header)
	if write_error != OK:
		return write_error
	write_error = _write_bytes(budget_b_fixture, budget_png_header)
	if write_error != OK:
		return write_error
	var budget := manifest.duplicate(true)
	budget["sprites"].append(_sprite("budget_a_01", [0, 0, 1, 1]).merged({"atlas": "atlases/budget-a.png"}, true))
	budget["sprites"].append(_sprite("budget_b_01", [0, 0, 1, 1]).merged({"atlas": "atlases/budget-b.png"}, true))
	budget["files"].append({
		"path": "atlases/budget-a.png",
		"media_type": "image/png",
		"bytes": budget_png_header.size(),
		"sha256": _sha256(budget_a_fixture),
	})
	budget["files"].append({
		"path": "atlases/budget-b.png",
		"media_type": "image/png",
		"bytes": budget_png_header.size(),
		"sha256": _sha256(budget_b_fixture),
	})
	return _write_json(ROOT.path_join("mapsoo.manifest.png-budget.json"), budget)


func _manifest(files: Array[Dictionary]) -> Dictionary:
	return {
		"schema_version": "0.1.0",
		"pack": {
			"id": "smoke-pack",
			"title": "Importer Smoke Pack",
			"version": "0.1.0-alpha.1",
			"generator": {"name": "Mapsoo Worldsmith", "version": "0.1.0-alpha.1"},
			"created_at": "2026-07-18T00:00:00.000Z",
		},
		"compatibility": {
			"godot_min": "4.3",
			"grid": "orthogonal",
			"art_style": "pixel_art",
			"importer": {
				"id": "mapsoo_importer",
				"min_version": "0.1.0-alpha.1",
				"source": "https://github.com/babyrush0101-source/mapsoo-kids",
			},
		},
		"world_spec": {"path": "worlds/smoke-pack.world.json", "sha256": _sha256(ROOT.path_join("worlds/smoke-pack.world.json"))},
		"demo": {"map": "worlds/demo-world.json", "preview": "previews/map-preview.png"},
		"layers": [
			{
				"id": "ground",
				"kind": "tilemap",
				"path": "worlds/demo-world.json",
				"json_pointer": "/layers/0/cells",
				"encoding": "row-major",
				"dimensions_cells": [WIDTH, HEIGHT],
				"atlas_id": "terrain",
				"empty_tile_id": -1,
			},
			{
				"id": "props",
				"kind": "objects",
				"path": "worlds/demo-world.json",
				"json_pointer": "/props",
				"encoding": "objects",
				"sprite_atlas": "atlases/props.png",
			},
		],
		"receipt": {"path": "generation-receipt.json"},
		"atlases": [{
			"id": "terrain",
			"source_id": 0,
			"file": "atlases/terrain.png",
			"image_size_px": [TILE_SIZE * 4, TILE_SIZE],
			"cell_size_px": [TILE_SIZE, TILE_SIZE],
			"margin_px": [0, 0],
			"separation_px": [0, 0],
			"texture_padding": true,
			"tiles": [
				_tile(0, "ground_01", [0, 0], true),
				_tile(1, "water_01", [1, 0], false),
				_tile(2, "path_01", [2, 0], true),
				_tile(3, "detail_01", [3, 0], true),
			],
		}],
		"sprites": [
			_sprite("tree_01", [0, 0, TILE_SIZE, TILE_SIZE]),
			_sprite("rock_01", [TILE_SIZE, 0, TILE_SIZE, TILE_SIZE]),
			_sprite("flower_01", [TILE_SIZE * 2, 0, TILE_SIZE, TILE_SIZE]),
		],
		"files": files,
		"license": {
			"assets": {"id": "CC0-1.0", "file": "license-assets.md"},
		},
		"provenance": {
			"contains_generative_ai": false,
			"model_provider": null,
			"model": null,
			"seed": "mapsoo-godot-smoke-001",
			"human_curated": false,
		},
	}


func _tile(tile_id: int, id: String, atlas_coords: Array, walkable: bool) -> Dictionary:
	return {
		"tile_id": tile_id,
		"id": id,
		"atlas_coords": atlas_coords,
		"size_cells": [1, 1],
		"alternative_id": 0,
		"collision": {"type": "none"},
		"terrain": null,
		"custom_data": {"walkable": walkable, "biome": "meadow"},
		"tags": ["terrain", id.trim_suffix("_01")],
	}


func _sprite(id: String, region: Array) -> Dictionary:
	return {
		"id": id,
		"atlas": "atlases/props.png",
		"region_px": region,
		"pivot_px": [TILE_SIZE / 2, TILE_SIZE],
		"footprint_cells": [1, 1],
		"tags": ["prop", id.trim_suffix("_01"), "meadow"],
	}


func _fill_tile(image: Image, tile_index: int, color: Color) -> void:
	var rect := Rect2i(tile_index * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE)
	image.fill_rect(rect, color)
	for offset in range(2, TILE_SIZE, 5):
		image.set_pixel(tile_index * TILE_SIZE + offset, offset % TILE_SIZE, color.lightened(0.15))


func _draw_prop(image: Image, prop_index: int, color: Color) -> void:
	var origin_x := prop_index * TILE_SIZE
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


func _write_bytes(path: String, value: PackedByteArray) -> Error:
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		return FileAccess.get_open_error()
	file.store_buffer(value)
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

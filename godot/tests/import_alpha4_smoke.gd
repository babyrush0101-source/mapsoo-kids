extends SceneTree

const Importer = preload("res://addons/mapsoo_importer/mapsoo_pack_importer.gd")
const FIXTURE_ROOT := "res://tests/.generated/pack-alpha4"
const OUTPUT_ROOT := "res://mapsoo_imports"
const SIDE_BITS := {
	TileSet.CELL_NEIGHBOR_TOP_SIDE: 1,
	TileSet.CELL_NEIGHBOR_RIGHT_SIDE: 2,
	TileSet.CELL_NEIGHBOR_BOTTOM_SIDE: 4,
	TileSet.CELL_NEIGHBOR_LEFT_SIDE: 8,
}

var _failures: Array[String] = []


func _init() -> void:
	_run_negative("water collision", "mapsoo.manifest.water-collision.json", "must use full-cell collision")
	_run_negative("ground terrain", "mapsoo.manifest.ground-terrain.json", "incompatible terrain metadata")
	_expect(_activate_manifest("mapsoo.manifest.valid.json"), "unable to activate valid alpha.4 manifest")
	_run_positive()
	if _failures.is_empty():
		print("MAPSOO_ALPHA4_GODOT_SMOKE_OK layers=ground,water,roads,props tiles=35 masks=32 collision=water-full-cell reimport=created,unchanged")
		quit(0)
		return
	for failure: String in _failures:
		push_error("MAPSOO_ALPHA4_GODOT_SMOKE_FAILURE: %s" % failure)
	quit(1)


func _run_negative(label: String, source_name: String, expected_fragment: String) -> void:
	_expect(_activate_manifest(source_name), "%s fixture must activate" % label)
	var result: Dictionary = Importer.import_pack(FIXTURE_ROOT.path_join("mapsoo.manifest.json"), OUTPUT_ROOT)
	_expect(result.get("ok", true) == false, "%s fixture must fail" % label)
	_expect(" ".join(result.get("errors", [])).to_lower().contains(expected_fragment.to_lower()), "%s fixture must report %s: %s" % [label, expected_fragment, result])
	_expect(not DirAccess.dir_exists_absolute(ProjectSettings.globalize_path(OUTPUT_ROOT.path_join("alpha4-smoke-pack"))), "%s failure must not write output" % label)


func _run_positive() -> void:
	var result: Dictionary = Importer.import_pack(FIXTURE_ROOT.path_join("mapsoo.manifest.json"), OUTPUT_ROOT)
	_expect(result.get("ok", false) == true, "valid alpha.4 fixture must import: %s" % result)
	_expect(result.get("status", "") == "created", "first alpha.4 import must be created: %s" % result)
	_expect(result.get("cell_count", -1) == 64, "alpha.4 result must count 64 ground cells")
	_expect(result.get("prop_count", -1) == 6, "alpha.4 result must count six props")
	if result.get("ok", false) != true:
		return
	var tileset_path := str(result.get("tileset_path", ""))
	var scene_path := str(result.get("scene_path", ""))
	var state_path := str(result.get("state_path", ""))
	var tile_set := ResourceLoader.load(tileset_path, "TileSet", ResourceLoader.CACHE_MODE_IGNORE) as TileSet
	_expect(tile_set != null, "alpha.4 TileSet must load")
	if tile_set == null:
		return
	_assert_tile_set(tile_set)
	var packed := ResourceLoader.load(scene_path, "PackedScene", ResourceLoader.CACHE_MODE_IGNORE) as PackedScene
	_expect(packed != null, "alpha.4 scene must load")
	if packed == null:
		return
	var world := packed.instantiate()
	_assert_scene(world)
	world.free()

	var managed_paths: Array[String] = [tileset_path, scene_path, state_path]
	var bytes := {}
	var mtimes := {}
	for path: String in managed_paths:
		bytes[path] = FileAccess.get_file_as_bytes(path)
		mtimes[path] = FileAccess.get_modified_time(path)
	OS.delay_msec(1100)
	var repeated: Dictionary = Importer.import_pack(FIXTURE_ROOT.path_join("mapsoo.manifest.json"), OUTPUT_ROOT)
	_expect(repeated.get("ok", false) == true and repeated.get("status", "") == "unchanged", "second alpha.4 import must be unchanged: %s" % repeated)
	for path: String in managed_paths:
		_expect(FileAccess.get_file_as_bytes(path) == bytes[path], "unchanged alpha.4 import rewrote bytes: %s" % path)
		_expect(FileAccess.get_modified_time(path) == mtimes[path], "unchanged alpha.4 import changed mtime: %s" % path)


func _assert_tile_set(tile_set: TileSet) -> void:
	_expect(tile_set.tile_size == Vector2i(16, 16), "alpha.4 TileSet tile_size must be 16x16")
	_expect(tile_set.get_terrain_sets_count() == 2, "alpha.4 TileSet must have two TerrainSets")
	for set_index: int in 2:
		_expect(tile_set.get_terrain_set_mode(set_index) == TileSet.TERRAIN_MODE_MATCH_SIDES, "TerrainSet %d must use match-sides" % set_index)
		_expect(tile_set.get_terrains_count(set_index) == 1, "TerrainSet %d must have one terrain" % set_index)
	_expect(tile_set.get_terrain_name(0, 0) == "Water", "terrain set 0 must be Water")
	_expect(tile_set.get_terrain_name(1, 0) == "Road", "terrain set 1 must be Road")
	_expect(tile_set.get_physics_layers_count() == 1, "alpha.4 TileSet must have one physics layer")
	_expect(tile_set.get_physics_layer_collision_layer(0) == 1, "world-blocking collision layer must be 1")
	_expect(tile_set.get_physics_layer_collision_mask(0) == 1, "world-blocking collision mask must be 1")
	var atlas := tile_set.get_source(0) as TileSetAtlasSource
	_expect(atlas != null, "alpha.4 source 0 must be a TileSetAtlasSource")
	if atlas == null:
		return
	_expect(atlas.get_tiles_count() == 35, "alpha.4 atlas must contain 35 explicit tiles")
	for tile_id: int in [0, 1, 2]:
		var ground_data := atlas.get_tile_data(Vector2i(tile_id % 8, tile_id / 8), 0)
		_expect(ground_data.get_terrain_set() == -1, "ground tile %d must not belong to a TerrainSet" % tile_id)
		_expect(ground_data.get_collision_polygons_count(0) == 0, "ground tile %d must have no collision" % tile_id)
	for mask: int in 16:
		_assert_mask_tile(atlas, 16 + mask, mask, 0, true)
		_assert_mask_tile(atlas, 32 + mask, mask, 1, false)


func _assert_mask_tile(atlas: TileSetAtlasSource, tile_id: int, mask: int, terrain_set: int, expect_collision: bool) -> void:
	var coords := Vector2i(tile_id % 8, tile_id / 8)
	_expect(atlas.has_tile(coords), "mask tile %d must exist" % tile_id)
	if not atlas.has_tile(coords):
		return
	var data := atlas.get_tile_data(coords, 0)
	_expect(data.get_terrain_set() == terrain_set, "tile %d TerrainSet differs" % tile_id)
	_expect(data.get_terrain() == 0, "tile %d terrain index must be zero" % tile_id)
	for neighbor: int in SIDE_BITS:
		var expected := 0 if mask & int(SIDE_BITS[neighbor]) else -1
		_expect(data.get_terrain_peering_bit(neighbor) == expected, "tile %d peering bit %d differs" % [tile_id, neighbor])
	var polygon_count := data.get_collision_polygons_count(0)
	_expect(polygon_count == (1 if expect_collision else 0), "tile %d collision count differs" % tile_id)
	if expect_collision and polygon_count == 1:
		var points := data.get_collision_polygon_points(0, 0)
		_expect(points.size() == 4, "water tile %d collision must have four points" % tile_id)
		_expect(points.has(Vector2(-8, -8)) and points.has(Vector2(8, 8)), "water tile %d collision must cover the full centered cell" % tile_id)


func _assert_scene(world: Node) -> void:
	var expected := {"Ground": 64, "Water": 16, "Roads": 16}
	var z_index := 0
	for layer_name: String in expected:
		var layer := world.get_node_or_null(layer_name) as TileMapLayer
		_expect(layer != null, "scene must contain %s: TileMapLayer" % layer_name)
		if layer != null:
			_expect(layer.z_index == z_index, "%s z_index must be %d" % [layer_name, z_index])
			_expect(layer.texture_filter == CanvasItem.TEXTURE_FILTER_NEAREST, "%s must use nearest filtering" % layer_name)
			_expect(layer.get_used_cells().size() == expected[layer_name], "%s used-cell count differs" % layer_name)
		z_index += 1
	var ground := world.get_node_or_null("Ground") as TileMapLayer
	var water := world.get_node_or_null("Water") as TileMapLayer
	var roads := world.get_node_or_null("Roads") as TileMapLayer
	if ground != null and water != null and roads != null:
		_expect(ground.get_cell_atlas_coords(Vector2i(2, 0)) == Vector2i(2, 0), "ground must preserve explicit tile ID 2")
		_expect(water.get_cell_atlas_coords(Vector2i(7, 1)) == Vector2i(7, 3), "water must preserve explicit tile ID 31")
		_expect(roads.get_cell_atlas_coords(Vector2i(7, 3)) == Vector2i(7, 5), "roads must preserve explicit tile ID 47")
	var props := world.get_node_or_null("Props")
	_expect(props is Node2D, "scene must contain Props: Node2D")
	if props != null:
		_expect(props.z_index == 3, "Props z_index must be 3")
		_expect(props.get_child_count() == 6, "Props must contain six Sprite2D nodes")


func _activate_manifest(source_name: String) -> bool:
	var source := FIXTURE_ROOT.path_join(source_name)
	var target := FIXTURE_ROOT.path_join("mapsoo.manifest.json")
	var bytes := FileAccess.get_file_as_bytes(source)
	if bytes.is_empty():
		return false
	var file := FileAccess.open(target, FileAccess.WRITE)
	if file == null:
		return false
	file.store_buffer(bytes)
	file.close()
	return true


func _expect(condition: bool, message: String) -> void:
	if not condition:
		_failures.append(message)

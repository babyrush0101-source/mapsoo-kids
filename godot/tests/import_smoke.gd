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
		print("MAPSOO_GODOT_SMOKE_OK positive=1 negative=8 grid_cells=64 used_cells=63 props=2")
		quit(0)
		return

	for failure in _failures:
		push_error("MAPSOO_GODOT_SMOKE_FAILURE: %s" % failure)
	quit(1)


func _run_positive_smoke() -> void:
	var result: Dictionary = Importer.import_pack(
		FIXTURE_ROOT.path_join("mapsoo.manifest.json"),
		OUTPUT_ROOT
	)
	_expect(result.get("ok", false) == true, "valid fixture must import: %s" % result)
	_expect((result.get("errors", []) as Array).is_empty(), "valid fixture must not report errors")
	_expect(result.get("pack_id", "") == "smoke-pack", "result must return the stable pack id")
	_expect(result.get("cell_count", -1) == 63, "result cell_count must count non-empty placed cells")
	_expect(result.get("prop_count", -1) == 2, "result prop_count must equal fixture props")

	var tileset_path: String = result.get("tileset_path", "")
	var scene_path: String = result.get("scene_path", "")
	var pack_output := OUTPUT_ROOT.path_join("smoke-pack")
	_expect(tileset_path == pack_output.path_join("smoke-pack.tileset.tres"), "unexpected tileset output path")
	_expect(scene_path == pack_output.path_join("smoke-pack.world.tscn"), "unexpected scene output path")
	_expect(ResourceLoader.exists(tileset_path, "TileSet"), "generated TileSet resource must exist")
	_expect(ResourceLoader.exists(scene_path, "PackedScene"), "generated .tscn must exist and be recognized")
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

	var repeat_result: Dictionary = Importer.import_pack(FIXTURE_ROOT.path_join("mapsoo.manifest.json"), OUTPUT_ROOT)
	_expect(repeat_result.get("ok", false) == true, "re-importing the same validated pack must succeed")
	_expect(repeat_result.get("tileset_path", "") == tileset_path, "re-import must preserve the TileSet path")
	_expect(repeat_result.get("scene_path", "") == scene_path, "re-import must preserve the scene path")


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

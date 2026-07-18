extends SceneTree

const Importer = preload("res://addons/mapsoo_importer/mapsoo_pack_importer.gd")
const OUTPUT_ROOT := "res://mapsoo_imports"


func _init() -> void:
	var manifest_path := _argument_value("--manifest=")
	if manifest_path.is_empty():
		_fail("Pass an extracted pack manifest with --manifest=<absolute-or-res-path>.")
		return

	var result: Dictionary = Importer.import_pack(manifest_path, OUTPUT_ROOT)
	if result.get("ok", false) != true:
		_fail("Import failed: %s" % result.get("errors", []))
		return

	var tileset_path := str(result.get("tileset_path", ""))
	var scene_path := str(result.get("scene_path", ""))
	if not ResourceLoader.exists(tileset_path, "TileSet"):
		_fail("Generated TileSet is not loadable: %s" % tileset_path)
		return
	if not ResourceLoader.exists(scene_path, "PackedScene"):
		_fail("Generated scene is not loadable: %s" % scene_path)
		return

	var packed := ResourceLoader.load(scene_path, "PackedScene", ResourceLoader.CACHE_MODE_IGNORE) as PackedScene
	if packed == null:
		_fail("Generated scene could not be loaded: %s" % scene_path)
		return
	var world := packed.instantiate()
	var ground := world.get_node_or_null("Ground") as TileMapLayer
	var props := world.get_node_or_null("Props")
	if ground == null:
		world.free()
		_fail("Generated scene is missing Ground: TileMapLayer.")
		return
	if props == null:
		world.free()
		_fail("Generated scene is missing Props.")
		return

	var expected_cells := int(result.get("cell_count", -1))
	var expected_props := int(result.get("prop_count", -1))
	if ground.get_used_cells().size() != expected_cells:
		world.free()
		_fail("Ground cell count differs from the importer result.")
		return
	if props.get_child_count() != expected_props:
		world.free()
		_fail("Prop count differs from the importer result.")
		return

	var pack_id := str(result.get("pack_id", ""))
	world.free()
	print("MAPSOO_PACK_CLI_OK pack_id=%s cells=%d props=%d" % [pack_id, expected_cells, expected_props])
	quit(0)


func _argument_value(prefix: String) -> String:
	for argument in OS.get_cmdline_user_args():
		if argument.begins_with(prefix):
			return argument.trim_prefix(prefix)
	return ""


func _fail(message: String) -> void:
	push_error("MAPSOO_PACK_CLI_FAILURE: %s" % message)
	quit(1)

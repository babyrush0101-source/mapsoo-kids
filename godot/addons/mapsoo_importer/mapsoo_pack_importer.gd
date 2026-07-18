@tool
extends RefCounted

const SUPPORTED_SCHEMA_VERSION := "0.1.0"
const OUTPUT_ROOT := "res://mapsoo_imports"
const BUFFER_SIZE := 1024 * 1024
const MAX_JSON_BYTES := 2 * 1024 * 1024
const MAX_FILE_COUNT := 512
const MAX_FILE_BYTES := 64 * 1024 * 1024
const MAX_TOTAL_BYTES := 256 * 1024 * 1024
const MAX_IMAGE_DIMENSION := 8192
const MAX_IMAGE_PIXELS := 16 * 1024 * 1024
const MAX_TOTAL_IMAGE_PIXELS := 32 * 1024 * 1024
const MAX_ATLAS_COUNT := 8
const MAX_TILE_COUNT := 4096
const MAX_SPRITE_COUNT := 4096
const MAX_PROP_COUNT := 10000


static func import_pack(manifest_path: String, output_root: String = OUTPUT_ROOT) -> Dictionary:
	var errors: Array[String] = []
	var warnings: Array[String] = []

	if not _is_supported_runtime():
		errors.append("Mapsoo Importer requires Godot 4.3 or newer.")
		return _result(false, errors, warnings)

	if _normalise_resource_dir(output_root) != OUTPUT_ROOT:
		errors.append("The output root is fixed to %s for safety." % OUTPUT_ROOT)
		return _result(false, errors, warnings)

	var local_manifest_path := _normalise_input_path(manifest_path)
	if local_manifest_path.is_empty() or not FileAccess.file_exists(local_manifest_path):
		errors.append("Manifest does not exist: %s" % manifest_path)
		return _result(false, errors, warnings)
	if local_manifest_path.get_file() != "mapsoo.manifest.json":
		errors.append("Select an extracted pack's mapsoo.manifest.json file.")
		return _result(false, errors, warnings)

	var manifest_read := _read_json_file(local_manifest_path)
	if not manifest_read.ok:
		errors.append(manifest_read.error)
		return _result(false, errors, warnings)
	var manifest: Dictionary = manifest_read.value
	var pack_root := local_manifest_path.get_base_dir()

	var validation := _validate_and_prepare(manifest, pack_root)
	errors.assign(validation.errors)
	warnings.assign(validation.warnings)
	if not errors.is_empty():
		return _result(false, errors, warnings)

	var pack_id: String = validation.pack_id
	var output_dir := "%s/%s" % [OUTPUT_ROOT, pack_id]
	var tileset_path := "%s/%s.tileset.tres" % [output_dir, pack_id]
	var scene_path := "%s/%s.world.tscn" % [output_dir, pack_id]
	var absolute_output := ProjectSettings.globalize_path(output_dir)
	if FileAccess.file_exists(tileset_path) or FileAccess.file_exists(scene_path):
		warnings.append("Re-importing pack '%s' replaces its derived TileSet and scene; keep hand edits outside %s." % [pack_id, output_dir])
	var mkdir_error := DirAccess.make_dir_recursive_absolute(absolute_output)
	if mkdir_error != OK:
		errors.append("Unable to create output directory %s (error %d)." % [output_dir, mkdir_error])
		return _result(false, errors, warnings)

	var tile_set: TileSet = validation.tile_set
	var save_error := ResourceSaver.save(tile_set, tileset_path)
	if save_error != OK:
		errors.append("Unable to save TileSet %s (error %d)." % [tileset_path, save_error])
		return _result(false, errors, warnings)

	var scene_build := _build_scene(validation, tile_set)
	if not scene_build.ok:
		errors.append(scene_build.error)
		return _result(false, errors, warnings)
	var packed_scene := PackedScene.new()
	var pack_error := packed_scene.pack(scene_build.root)
	if pack_error != OK:
		scene_build.root.free()
		errors.append("Unable to pack the generated scene (error %d)." % pack_error)
		return _result(false, errors, warnings)
	var scene_save_error := ResourceSaver.save(packed_scene, scene_path)
	scene_build.root.free()
	if scene_save_error != OK:
		errors.append("Unable to save scene %s (error %d)." % [scene_path, scene_save_error])
		return _result(false, errors, warnings)

	var result := _result(true, errors, warnings)
	result.merge({
		"pack_id": pack_id,
		"output_dir": output_dir,
		"tileset_path": tileset_path,
		"scene_path": scene_path,
		"cell_count": validation.cell_count,
		"prop_count": validation.props.size(),
	}, true)
	return result


static func _validate_and_prepare(manifest: Dictionary, pack_root: String) -> Dictionary:
	var errors: Array[String] = []
	var warnings: Array[String] = []
	var prepared := {
		"errors": errors,
		"warnings": warnings,
		"pack_id": "",
		"tile_set": null,
		"tile_lookup": {},
		"atlas_ids": {},
		"textures": {},
		"sprites": {},
		"cells": [],
		"props": [],
		"width": 0,
		"height": 0,
		"tile_size": Vector2i.ZERO,
		"cell_count": 0,
	}

	if manifest.get("schema_version") != SUPPORTED_SCHEMA_VERSION:
		errors.append("Unsupported schema_version. Expected %s." % SUPPORTED_SCHEMA_VERSION)
		return prepared
	var pack := _dictionary_at(manifest, "pack", errors)
	var compatibility := _dictionary_at(manifest, "compatibility", errors)
	var license := _dictionary_at(manifest, "license", errors)
	if not errors.is_empty():
		return prepared
	var pack_id_value: Variant = pack.get("id")
	if typeof(pack_id_value) != TYPE_STRING or not _is_pack_id(pack_id_value):
		errors.append("pack.id must be lowercase kebab-case ASCII.")
	else:
		prepared.pack_id = pack_id_value
	if compatibility.get("godot_min") != "4.3":
		errors.append("compatibility.godot_min must be 4.3 for schema 0.1.0.")
	if compatibility.get("grid") != "orthogonal":
		errors.append("Only orthogonal Mapsoo packs are supported.")
	if compatibility.get("art_style") != "pixel_art":
		errors.append("Only pixel_art packs are supported by this importer version.")
	var importer_requirement := _dictionary_at(compatibility, "importer", errors)
	if importer_requirement.get("id") != "mapsoo_importer" or importer_requirement.get("min_version") != "0.1.0-alpha.1":
		errors.append("Pack requires an unsupported importer ID or minimum version.")
	if importer_requirement.get("source") != "https://github.com/babyrush0101-source/mapsoo-kids":
		errors.append("Pack importer source must reference the official Mapsoo repository.")
	var asset_license := _dictionary_at(license, "assets", errors)
	if asset_license.get("id") != "CC0-1.0":
		errors.append("Schema 0.1.0 generated assets must declare CC0-1.0.")
	if not errors.is_empty():
		return prepared

	var file_index := _validate_file_records(manifest.get("files"), pack_root, errors)
	if not errors.is_empty():
		return prepared
	var referenced_paths := _collect_referenced_paths(manifest, errors)
	if not errors.is_empty():
		return prepared
	for relative_path: String in referenced_paths:
		if not file_index.has(relative_path):
			errors.append("Referenced file is not declared in manifest.files: %s" % relative_path)
	if not errors.is_empty():
		return prepared
	_validate_png_budget(manifest, pack_root, errors)
	if not errors.is_empty():
		return prepared

	var world_spec_ref := _dictionary_at(manifest, "world_spec", errors)
	if not errors.is_empty():
		return prepared
	var world_path: String = world_spec_ref.get("path", "")
	var world_record: Dictionary = file_index.get(world_path, {})
	if world_spec_ref.get("sha256") != world_record.get("sha256"):
		errors.append("world_spec.sha256 does not match its manifest.files record.")
		return prepared
	var world_read := _read_json_file(_resolve_pack_path(pack_root, world_path))
	if not world_read.ok:
		errors.append(world_read.error)
		return prepared
	var world_spec: Dictionary = world_read.value
	if world_spec.get("schemaVersion") != SUPPORTED_SCHEMA_VERSION:
		errors.append("World Spec schemaVersion must be %s." % SUPPORTED_SCHEMA_VERSION)
	if world_spec.get("id") != prepared.pack_id:
		errors.append("World Spec id must match pack.id.")
	var world_visual := _dictionary_at(world_spec, "visual", errors)
	var world_map := _dictionary_at(world_spec, "map", errors)
	var world_output := _dictionary_at(world_spec, "output", errors)
	var world_tile_size_value: Variant = world_visual.get("tileSize")
	if not _is_json_integer(world_tile_size_value) or int(world_tile_size_value) not in [16, 32, 64]:
		errors.append("World Spec visual.tileSize must be 16, 32, or 64.")
	var world_width_value: Variant = world_map.get("width")
	var world_height_value: Variant = world_map.get("height")
	if not _is_json_integer(world_width_value) or not _is_json_integer(world_height_value) or world_width_value < 8 or world_width_value > 48 or world_height_value < 8 or world_height_value > 32:
		errors.append("World Spec map dimensions must be integers from 8x8 to 48x32.")
	if world_map.get("biome") not in ["meadow", "desert", "snow"]:
		errors.append("World Spec biome is not supported by schema 0.1.0.")
	if world_output.get("assetLicense") != "CC0-1.0" or world_output.get("targets") != ["common", "godot", "itch"]:
		errors.append("World Spec output contract must target common, godot, itch with CC0-1.0 assets.")

	var demo := _dictionary_at(manifest, "demo", errors)
	var map_path_value: Variant = demo.get("map")
	if typeof(map_path_value) != TYPE_STRING:
		errors.append("demo.map must be a relative file path.")
		return prepared
	var map_read := _read_json_file(_resolve_pack_path(pack_root, map_path_value))
	if not map_read.ok:
		errors.append(map_read.error)
		return prepared
	var map_data: Dictionary = map_read.value
	if map_data.get("schema_version") != SUPPORTED_SCHEMA_VERSION:
		errors.append("Demo map schema_version must be %s." % SUPPORTED_SCHEMA_VERSION)

	var atlas_build := _build_tile_set(manifest.get("atlases"), pack_root, errors)
	if not errors.is_empty():
		return prepared
	prepared.tile_set = atlas_build.tile_set
	prepared.tile_lookup = atlas_build.tile_lookup
	prepared.atlas_ids = atlas_build.atlas_ids
	prepared.textures = atlas_build.textures
	prepared.tile_size = atlas_build.tile_size
	if _is_json_integer(world_tile_size_value) and (prepared.tile_size.x != int(world_tile_size_value) or prepared.tile_size.y != int(world_tile_size_value)):
		errors.append("Atlas cell size must match the square World Spec tileSize.")

	var layers_value: Variant = manifest.get("layers")
	if typeof(layers_value) != TYPE_ARRAY:
		errors.append("manifest.layers must be an array.")
		return prepared
	var ground_layer: Dictionary = {}
	var props_layer: Dictionary = {}
	for layer_value: Variant in layers_value:
		if typeof(layer_value) != TYPE_DICTIONARY:
			errors.append("Each layer manifest entry must be an object.")
			continue
		var layer: Dictionary = layer_value
		if layer.get("id") == "ground" and layer.get("kind") == "tilemap":
			if not ground_layer.is_empty():
				errors.append("Only one ground tilemap layer is allowed in schema 0.1.0.")
			else:
				ground_layer = layer
		elif layer.get("id") == "props" and layer.get("kind") == "objects":
			if not props_layer.is_empty():
				errors.append("Only one props object layer is allowed in schema 0.1.0.")
			else:
				props_layer = layer
	if ground_layer.is_empty():
		errors.append("A ground tilemap layer is required.")
	if props_layer.is_empty():
		errors.append("A props object layer is required.")
	if not errors.is_empty():
		return prepared
	if ground_layer.get("encoding") != "row-major":
		errors.append("The ground layer must use row-major encoding.")
	if ground_layer.get("empty_tile_id") != -1:
		errors.append("The ground layer empty_tile_id must be -1 in schema 0.1.0.")
	if props_layer.get("encoding") != "objects":
		errors.append("The props layer must use objects encoding.")
	var ground_atlas_id: Variant = ground_layer.get("atlas_id")
	if typeof(ground_atlas_id) != TYPE_STRING or not prepared.atlas_ids.has(ground_atlas_id):
		errors.append("The ground layer references an undeclared atlas_id.")
	if ground_layer.get("path") != map_path_value or props_layer.get("path") != map_path_value:
		errors.append("The ground and props layer paths must match demo.map in schema 0.1.0.")

	var dimensions := _positive_int_pair(ground_layer.get("dimensions_cells"), "ground dimensions_cells", errors)
	if dimensions != Vector2i.ZERO:
		prepared.width = dimensions.x
		prepared.height = dimensions.y
	if map_data.get("width") != prepared.width or map_data.get("height") != prepared.height:
		errors.append("Demo map dimensions do not match the ground layer manifest.")
	if _is_json_integer(world_width_value) and _is_json_integer(world_height_value) and (prepared.width != int(world_width_value) or prepared.height != int(world_height_value)):
		errors.append("Ground layer dimensions do not match the World Spec.")

	var cell_pointer := _resolve_json_pointer(map_data, ground_layer.get("json_pointer", ""))
	if not cell_pointer.ok or typeof(cell_pointer.value) != TYPE_ARRAY:
		errors.append("Unable to resolve the ground layer JSON pointer to an array.")
	else:
		var raw_cells: Array = cell_pointer.value
		if raw_cells.size() != prepared.width * prepared.height:
			errors.append("Ground cell count does not match dimensions_cells.")
		for cell_value: Variant in raw_cells:
			if not _is_json_integer(cell_value):
				errors.append("Ground cells must contain integer tile IDs.")
				break
			var cell_id := int(cell_value)
			if cell_id != int(ground_layer.get("empty_tile_id", -1)):
				if not prepared.tile_lookup.has(cell_id):
					errors.append("Ground layer references undeclared tile ID %s." % cell_value)
					break
				if prepared.tile_lookup[cell_id].atlas_id != ground_atlas_id:
					errors.append("Ground tile ID %s belongs to a different atlas." % cell_value)
					break
			prepared.cells.append(cell_id)
	prepared.cell_count = 0
	for cell_value: Variant in prepared.cells:
		if cell_value != int(ground_layer.get("empty_tile_id", -1)):
			prepared.cell_count += 1

	var prop_pointer := _resolve_json_pointer(map_data, props_layer.get("json_pointer", ""))
	if not prop_pointer.ok or typeof(prop_pointer.value) != TYPE_ARRAY:
		errors.append("Unable to resolve the props layer JSON pointer to an array.")
	else:
		prepared.props = prop_pointer.value
		if prepared.props.size() > MAX_PROP_COUNT:
			errors.append("Props layer exceeds the importer limit of %d objects." % MAX_PROP_COUNT)

	var sprite_build := _validate_sprites(manifest.get("sprites"), pack_root, prepared.textures, errors)
	prepared.sprites = sprite_build.sprites
	prepared.textures = sprite_build.textures
	_validate_props(prepared.props, prepared.sprites, props_layer.get("sprite_atlas"), prepared.width, prepared.height, errors)
	return prepared


static func _validate_file_records(value: Variant, pack_root: String, errors: Array[String]) -> Dictionary:
	var index := {}
	if typeof(value) != TYPE_ARRAY:
		errors.append("manifest.files must be an array.")
		return index
	if value.size() > MAX_FILE_COUNT:
		errors.append("manifest.files exceeds the importer limit of %d files." % MAX_FILE_COUNT)
		return index
	var total_bytes := 0
	for record_value: Variant in value:
		if typeof(record_value) != TYPE_DICTIONARY:
			errors.append("Each manifest.files entry must be an object.")
			continue
		var record: Dictionary = record_value
		var path_value: Variant = record.get("path")
		if typeof(path_value) != TYPE_STRING or not _is_safe_relative_path(path_value):
			errors.append("manifest.files contains an unsafe path: %s" % path_value)
			continue
		var relative_path: String = path_value
		if index.has(relative_path):
			errors.append("Duplicate manifest.files path: %s" % relative_path)
			continue
		var absolute_path := _resolve_pack_path(pack_root, relative_path)
		if not FileAccess.file_exists(absolute_path):
			errors.append("Missing pack file: %s" % relative_path)
			continue
		var expected_hash: Variant = record.get("sha256")
		if typeof(expected_hash) != TYPE_STRING or not _is_sha256(expected_hash):
			errors.append("Invalid SHA-256 value for %s." % relative_path)
			continue
		var expected_bytes: Variant = record.get("bytes")
		if not _is_json_integer(expected_bytes) or expected_bytes < 0:
			errors.append("Invalid byte length for %s." % relative_path)
			continue
		if expected_bytes > MAX_FILE_BYTES:
			errors.append("Pack file exceeds the %d-byte per-file limit: %s" % [MAX_FILE_BYTES, relative_path])
			continue
		total_bytes += int(expected_bytes)
		if total_bytes > MAX_TOTAL_BYTES:
			errors.append("Pack payload exceeds the %d-byte total limit." % MAX_TOTAL_BYTES)
			return index
		var file := FileAccess.open(absolute_path, FileAccess.READ)
		if file == null:
			errors.append("Unable to open pack file: %s" % relative_path)
			continue
		if file.get_length() != int(expected_bytes):
			errors.append("Byte length mismatch for %s." % relative_path)
			file.close()
			continue
		file.close()
		var actual_hash := _sha256_file(absolute_path)
		if actual_hash != expected_hash:
			errors.append("SHA-256 mismatch for %s." % relative_path)
			continue
		index[relative_path] = record
	return index


static func _collect_referenced_paths(manifest: Dictionary, errors: Array[String]) -> Array[String]:
	var paths: Array[String] = []
	var refs: Array = []
	var world_spec: Variant = manifest.get("world_spec")
	var demo: Variant = manifest.get("demo")
	var receipt: Variant = manifest.get("receipt")
	var license: Variant = manifest.get("license")
	if typeof(world_spec) == TYPE_DICTIONARY: refs.append(world_spec.get("path"))
	if typeof(demo) == TYPE_DICTIONARY:
		refs.append(demo.get("map"))
		refs.append(demo.get("preview"))
	if typeof(receipt) == TYPE_DICTIONARY: refs.append(receipt.get("path"))
	if typeof(license) == TYPE_DICTIONARY:
		var asset_license: Variant = license.get("assets")
		if typeof(asset_license) == TYPE_DICTIONARY: refs.append(asset_license.get("file"))
	for layer_value: Variant in manifest.get("layers", []):
		if typeof(layer_value) == TYPE_DICTIONARY:
			refs.append(layer_value.get("path"))
			if layer_value.has("sprite_atlas"): refs.append(layer_value.get("sprite_atlas"))
	for atlas_value: Variant in manifest.get("atlases", []):
		if typeof(atlas_value) == TYPE_DICTIONARY: refs.append(atlas_value.get("file"))
	for sprite_value: Variant in manifest.get("sprites", []):
		if typeof(sprite_value) == TYPE_DICTIONARY: refs.append(sprite_value.get("atlas"))
	for value: Variant in refs:
		if typeof(value) != TYPE_STRING or not _is_safe_relative_path(value):
			errors.append("Manifest contains an unsafe referenced path: %s" % value)
		elif not paths.has(value):
			paths.append(value)
	return paths


static func _build_tile_set(value: Variant, pack_root: String, errors: Array[String]) -> Dictionary:
	var tile_set := TileSet.new()
	tile_set.add_custom_data_layer()
	tile_set.set_custom_data_layer_name(0, "walkable")
	tile_set.set_custom_data_layer_type(0, TYPE_BOOL)
	tile_set.add_custom_data_layer()
	tile_set.set_custom_data_layer_name(1, "biome")
	tile_set.set_custom_data_layer_type(1, TYPE_STRING)
	var tile_lookup := {}
	var atlas_ids := {}
	var textures := {}
	var expected_tile_size := Vector2i.ZERO
	var source_ids := {}
	if typeof(value) != TYPE_ARRAY or value.is_empty():
		errors.append("manifest.atlases must contain at least one atlas.")
		return {"tile_set": tile_set, "tile_lookup": tile_lookup, "atlas_ids": atlas_ids, "textures": textures, "tile_size": expected_tile_size}
	if value.size() > MAX_ATLAS_COUNT:
		errors.append("manifest.atlases exceeds the importer limit of %d atlases." % MAX_ATLAS_COUNT)
		return {"tile_set": tile_set, "tile_lookup": tile_lookup, "atlas_ids": atlas_ids, "textures": textures, "tile_size": expected_tile_size}
	for atlas_value: Variant in value:
		if typeof(atlas_value) != TYPE_DICTIONARY:
			errors.append("Each atlas entry must be an object.")
			continue
		var atlas: Dictionary = atlas_value
		var atlas_id: Variant = atlas.get("id")
		if typeof(atlas_id) != TYPE_STRING or not _is_asset_id(atlas_id) or atlas_ids.has(atlas_id):
			errors.append("Atlas IDs must be unique lowercase ASCII identifiers.")
			continue
		atlas_ids[atlas_id] = true
		var source_id_value: Variant = atlas.get("source_id")
		if not _is_json_integer(source_id_value) or source_id_value < 0:
			errors.append("Atlas source_id must be a unique non-negative integer.")
			continue
		var source_id := int(source_id_value)
		if source_ids.has(source_id):
			errors.append("Atlas source_id must be a unique non-negative integer.")
			continue
		source_ids[source_id] = true
		var atlas_path: Variant = atlas.get("file")
		if typeof(atlas_path) != TYPE_STRING or not _is_safe_relative_path(atlas_path):
			errors.append("Atlas file path is unsafe.")
			continue
		var pair_error_count := errors.size()
		var cell_size := _positive_int_pair(atlas.get("cell_size_px"), "atlas cell_size_px", errors)
		var margins := _non_negative_int_pair(atlas.get("margin_px"), "atlas margin_px", errors)
		var separation := _non_negative_int_pair(atlas.get("separation_px"), "atlas separation_px", errors)
		if errors.size() != pair_error_count:
			continue
		if expected_tile_size == Vector2i.ZERO:
			expected_tile_size = cell_size
			tile_set.tile_size = cell_size
		elif cell_size != expected_tile_size:
			errors.append("All v0.1 atlases must use one cell size.")
		pair_error_count = errors.size()
		var declared_size := _positive_int_pair(atlas.get("image_size_px"), "atlas image_size_px", errors)
		if errors.size() != pair_error_count:
			continue
		var texture: PortableCompressedTexture2D
		if textures.has(atlas_path):
			texture = textures[atlas_path]
			if Vector2i(texture.get_width(), texture.get_height()) != declared_size:
				errors.append("Atlas image dimensions do not match manifest: %s" % atlas_path)
				continue
		else:
			var image_result := _load_png(_resolve_pack_path(pack_root, atlas_path))
			if not image_result.ok:
				errors.append(image_result.error)
				continue
			var image: Image = image_result.image
			if image.get_size() != declared_size:
				errors.append("Atlas image dimensions do not match manifest: %s" % atlas_path)
				continue
			texture = _texture_from_image(image)
			textures[atlas_path] = texture
		var source := TileSetAtlasSource.new()
		source.texture = texture
		source.texture_region_size = cell_size
		source.margins = margins
		source.separation = separation
		if typeof(atlas.get("texture_padding")) != TYPE_BOOL:
			errors.append("Atlas texture_padding must be a boolean.")
			continue
		source.use_texture_padding = atlas.texture_padding
		var tiles_value: Variant = atlas.get("tiles")
		if typeof(tiles_value) != TYPE_ARRAY:
			errors.append("Atlas tiles must be an array.")
			continue
		if tiles_value.size() > MAX_TILE_COUNT:
			errors.append("Atlas exceeds the importer limit of %d tiles." % MAX_TILE_COUNT)
			continue
		var pending_custom_data: Array[Dictionary] = []
		for tile_value: Variant in tiles_value:
			if typeof(tile_value) != TYPE_DICTIONARY:
				errors.append("Each atlas tile must be an object.")
				continue
			var tile: Dictionary = tile_value
			var tile_id_value: Variant = tile.get("tile_id")
			var alternative_id_value: Variant = tile.get("alternative_id")
			if not _is_json_integer(tile_id_value) or tile_id_value < 0:
				errors.append("tile_id must be a unique non-negative integer.")
				continue
			var tile_id := int(tile_id_value)
			if tile_lookup.has(tile_id):
				errors.append("tile_id must be a unique non-negative integer.")
				continue
			if not _is_json_integer(alternative_id_value) or alternative_id_value < 0:
				errors.append("alternative_id must be a non-negative integer.")
				continue
			var alternative_id := int(alternative_id_value)
			var tile_pair_error_count := errors.size()
			var coords := _non_negative_int_pair(tile.get("atlas_coords"), "tile atlas_coords", errors)
			var size_cells := _positive_int_pair(tile.get("size_cells"), "tile size_cells", errors)
			if errors.size() != tile_pair_error_count:
				continue
			var collision_value: Variant = tile.get("collision")
			if typeof(collision_value) != TYPE_DICTIONARY or collision_value.get("type") != "none":
				errors.append("Tile %d collision must be {type: none} in this importer version." % tile_id)
				continue
			if not source.has_room_for_tile(coords, size_cells, 1, Vector2i.ZERO, 1):
				errors.append("Atlas tile does not fit or overlaps at %s." % coords)
				continue
			source.create_tile(coords, size_cells)
			if alternative_id > 0 and source.create_alternative_tile(coords, alternative_id) != alternative_id:
				errors.append("Unable to create alternative tile %d at %s." % [alternative_id, coords])
				continue
			var custom_data_value: Variant = tile.get("custom_data")
			if typeof(custom_data_value) != TYPE_DICTIONARY or typeof(custom_data_value.get("walkable")) != TYPE_BOOL or typeof(custom_data_value.get("biome")) != TYPE_STRING:
				errors.append("Tile %d custom_data must contain boolean walkable and string biome." % tile_id)
				continue
			pending_custom_data.append({
				"tile_id": tile_id,
				"coords": coords,
				"alternative_id": alternative_id,
				"walkable": custom_data_value.walkable,
				"biome": custom_data_value.biome,
			})
			tile_lookup[tile_id] = {"atlas_id": atlas_id, "source_id": source_id, "coords": coords, "alternative_id": alternative_id}
		if tile_set.add_source(source, source_id) != source_id:
			errors.append("Unable to preserve atlas source_id %d." % source_id)
			continue
		for pending: Dictionary in pending_custom_data:
			var tile_data := source.get_tile_data(pending.coords, pending.alternative_id)
			if tile_data == null:
				errors.append("Unable to access TileData for tile %d." % pending.tile_id)
				continue
			tile_data.set_custom_data("walkable", pending.walkable)
			tile_data.set_custom_data("biome", pending.biome)
	return {"tile_set": tile_set, "tile_lookup": tile_lookup, "atlas_ids": atlas_ids, "textures": textures, "tile_size": expected_tile_size}


static func _validate_sprites(value: Variant, pack_root: String, texture_cache: Dictionary, errors: Array[String]) -> Dictionary:
	var sprites := {}
	var textures := texture_cache.duplicate()
	if typeof(value) != TYPE_ARRAY:
		errors.append("manifest.sprites must be an array.")
		return {"sprites": sprites, "textures": textures}
	if value.size() > MAX_SPRITE_COUNT:
		errors.append("manifest.sprites exceeds the importer limit of %d sprites." % MAX_SPRITE_COUNT)
		return {"sprites": sprites, "textures": textures}
	for sprite_value: Variant in value:
		if typeof(sprite_value) != TYPE_DICTIONARY:
			errors.append("Each sprite entry must be an object.")
			continue
		var sprite: Dictionary = sprite_value
		var sprite_id: Variant = sprite.get("id")
		var atlas_path: Variant = sprite.get("atlas")
		if typeof(sprite_id) != TYPE_STRING or not _is_asset_id(sprite_id) or sprites.has(sprite_id):
			errors.append("Sprite IDs must be unique lowercase ASCII identifiers.")
			continue
		if typeof(atlas_path) != TYPE_STRING or not _is_safe_relative_path(atlas_path):
			errors.append("Sprite atlas path is unsafe.")
			continue
		if not textures.has(atlas_path):
			var image_result := _load_png(_resolve_pack_path(pack_root, atlas_path))
			if not image_result.ok:
				errors.append(image_result.error)
				continue
			textures[atlas_path] = _texture_from_image(image_result.image)
		var region := _int_quad(sprite.get("region_px"), "sprite region_px", errors)
		var pivot := _non_negative_int_pair(sprite.get("pivot_px"), "sprite pivot_px", errors)
		if region.size != Vector2.ZERO:
			var texture: Texture2D = textures[atlas_path]
			if region.position.x < 0 or region.position.y < 0 or region.end.x > texture.get_width() or region.end.y > texture.get_height():
				errors.append("Sprite region is outside its atlas: %s" % sprite_id)
				continue
		sprites[sprite_id] = {"atlas": atlas_path, "region": region, "pivot": pivot}
	return {"sprites": sprites, "textures": textures}


static func _validate_props(props: Array, sprites: Dictionary, layer_atlas: Variant, width: int, height: int, errors: Array[String]) -> void:
	if typeof(layer_atlas) != TYPE_STRING or not _is_safe_relative_path(layer_atlas):
		errors.append("The props layer sprite_atlas path is unsafe.")
		return
	var ids := {}
	for prop_value: Variant in props:
		if typeof(prop_value) != TYPE_DICTIONARY:
			errors.append("Each prop must be an object.")
			continue
		var prop: Dictionary = prop_value
		var prop_id: Variant = prop.get("id")
		var kind: Variant = prop.get("kind")
		var x: Variant = prop.get("x")
		var y: Variant = prop.get("y")
		if typeof(prop_id) != TYPE_STRING or not _is_asset_id(prop_id) or ids.has(prop_id):
			errors.append("Prop IDs must be unique lowercase ASCII identifiers.")
			continue
		ids[prop_id] = true
		if typeof(kind) != TYPE_STRING or not sprites.has("%s_01" % kind):
			errors.append("Prop %s does not have a matching <kind>_01 sprite." % prop_id)
		elif sprites["%s_01" % kind].atlas != layer_atlas:
			errors.append("Prop %s sprite is not in the props layer atlas." % prop_id)
		if not _is_json_integer(x) or not _is_json_integer(y) or x < 0 or y < 0 or x >= width or y >= height:
			errors.append("Prop %s is outside the map bounds." % prop_id)
		else:
			prop.x = int(x)
			prop.y = int(y)


static func _build_scene(prepared: Dictionary, tile_set: TileSet) -> Dictionary:
	var root := Node2D.new()
	root.name = "MapsooWorld"
	root.set_meta("mapsoo_pack_id", prepared.pack_id)
	var ground := TileMapLayer.new()
	ground.name = "Ground"
	ground.tile_set = tile_set
	ground.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	root.add_child(ground)
	ground.owner = root
	var width: int = prepared.width
	for index: int in prepared.cells.size():
		var tile_id: int = prepared.cells[index]
		if tile_id == -1:
			continue
		var tile: Dictionary = prepared.tile_lookup[tile_id]
		ground.set_cell(Vector2i(index % width, index / width), tile.source_id, tile.coords, tile.alternative_id)

	var props_root := Node2D.new()
	props_root.name = "Props"
	props_root.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	props_root.z_index = 1
	root.add_child(props_root)
	props_root.owner = root
	var tile_size: Vector2i = prepared.tile_size
	for prop_value: Variant in prepared.props:
		var prop: Dictionary = prop_value
		var sprite_def: Dictionary = prepared.sprites["%s_01" % prop.kind]
		var atlas_texture := AtlasTexture.new()
		atlas_texture.atlas = prepared.textures[sprite_def.atlas]
		atlas_texture.region = sprite_def.region
		atlas_texture.filter_clip = true
		var sprite := Sprite2D.new()
		sprite.name = prop.id
		sprite.texture = atlas_texture
		sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		sprite.centered = true
		var pivot: Vector2 = sprite_def.pivot
		sprite.offset = sprite_def.region.size * 0.5 - pivot
		sprite.position = Vector2((prop.x + 0.5) * tile_size.x, (prop.y + 1.0) * tile_size.y)
		sprite.set_meta("mapsoo_id", prop.id)
		sprite.set_meta("mapsoo_kind", prop.kind)
		props_root.add_child(sprite)
		sprite.owner = root
	return {"ok": true, "root": root, "error": ""}


static func _resolve_json_pointer(root: Variant, pointer: Variant) -> Dictionary:
	if typeof(pointer) != TYPE_STRING or pointer.is_empty() or not pointer.begins_with("/"):
		return {"ok": false, "value": null}
	var current: Variant = root
	for encoded_token: String in pointer.trim_prefix("/").split("/", true):
		var token := encoded_token.replace("~1", "/").replace("~0", "~")
		if typeof(current) == TYPE_DICTIONARY:
			if not current.has(token): return {"ok": false, "value": null}
			current = current[token]
		elif typeof(current) == TYPE_ARRAY:
			if not token.is_valid_int(): return {"ok": false, "value": null}
			var index := token.to_int()
			if index < 0 or index >= current.size(): return {"ok": false, "value": null}
			current = current[index]
		else:
			return {"ok": false, "value": null}
	return {"ok": true, "value": current}


static func _read_json_file(path: String) -> Dictionary:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return {"ok": false, "value": {}, "error": "Unable to open JSON file: %s" % path}
	if file.get_length() > MAX_JSON_BYTES:
		file.close()
		return {"ok": false, "value": {}, "error": "JSON file exceeds the %d-byte limit: %s" % [MAX_JSON_BYTES, path]}
	var parser := JSON.new()
	var parse_error := parser.parse(file.get_as_text())
	file.close()
	if parse_error != OK:
		return {"ok": false, "value": {}, "error": "Invalid JSON in %s at line %d: %s" % [path, parser.get_error_line(), parser.get_error_message()]}
	if typeof(parser.data) != TYPE_DICTIONARY:
		return {"ok": false, "value": {}, "error": "JSON root must be an object: %s" % path}
	return {"ok": true, "value": parser.data, "error": ""}


static func _load_png(path: String) -> Dictionary:
	if path.get_extension().to_lower() != "png":
		return {"ok": false, "image": null, "error": "Only PNG atlas files are accepted: %s" % path}
	var header := _read_png_header(path)
	if not header.ok:
		return {"ok": false, "image": null, "error": header.error}
	var declared_width: int = header.width
	var declared_height: int = header.height
	if declared_width > MAX_IMAGE_DIMENSION or declared_height > MAX_IMAGE_DIMENSION or declared_width * declared_height > MAX_IMAGE_PIXELS:
		return {
			"ok": false,
			"image": null,
			"error": "PNG dimensions exceed the %d-pixel side or %d-pixel decoded-area limit: %s" % [MAX_IMAGE_DIMENSION, MAX_IMAGE_PIXELS, path],
		}
	var image := Image.new()
	var load_error := image.load(path)
	if load_error != OK:
		return {"ok": false, "image": null, "error": "Unable to decode PNG %s (error %d)." % [path, load_error]}
	if image.is_empty():
		return {"ok": false, "image": null, "error": "PNG is empty: %s" % path}
	if image.get_width() != declared_width or image.get_height() != declared_height:
		return {"ok": false, "image": null, "error": "Decoded PNG dimensions differ from its IHDR: %s" % path}
	if image.get_format() != Image.FORMAT_RGBA8:
		image.convert(Image.FORMAT_RGBA8)
	return {"ok": true, "image": image, "error": ""}


static func _validate_png_budget(manifest: Dictionary, pack_root: String, errors: Array[String]) -> void:
	var png_paths: Array[String] = []
	for atlas_value: Variant in manifest.get("atlases", []):
		if typeof(atlas_value) == TYPE_DICTIONARY:
			var atlas_path: Variant = atlas_value.get("file")
			if typeof(atlas_path) == TYPE_STRING and not png_paths.has(atlas_path):
				png_paths.append(atlas_path)
	for sprite_value: Variant in manifest.get("sprites", []):
		if typeof(sprite_value) == TYPE_DICTIONARY:
			var sprite_path: Variant = sprite_value.get("atlas")
			if typeof(sprite_path) == TYPE_STRING and not png_paths.has(sprite_path):
				png_paths.append(sprite_path)

	var total_pixels := 0
	for relative_path: String in png_paths:
		var header := _read_png_header(_resolve_pack_path(pack_root, relative_path))
		if not header.ok:
			errors.append(header.error)
			continue
		var width: int = header.width
		var height: int = header.height
		var pixels := width * height
		if width > MAX_IMAGE_DIMENSION or height > MAX_IMAGE_DIMENSION or pixels > MAX_IMAGE_PIXELS:
			errors.append("PNG dimensions exceed the %d-pixel side or %d-pixel decoded-area limit: %s" % [MAX_IMAGE_DIMENSION, MAX_IMAGE_PIXELS, relative_path])
			continue
		total_pixels += pixels
		if total_pixels > MAX_TOTAL_IMAGE_PIXELS:
			errors.append("Referenced PNG atlases exceed the %d-pixel pack budget." % MAX_TOTAL_IMAGE_PIXELS)
			return


static func _read_png_header(path: String) -> Dictionary:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return {"ok": false, "width": 0, "height": 0, "error": "Unable to open PNG header: %s" % path}
	if file.get_length() < 24:
		file.close()
		return {"ok": false, "width": 0, "height": 0, "error": "PNG header is truncated: %s" % path}
	var header := file.get_buffer(24)
	file.close()
	var expected_signature := [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
	for index in expected_signature.size():
		if header[index] != expected_signature[index]:
			return {"ok": false, "width": 0, "height": 0, "error": "File does not have a valid PNG signature: %s" % path}
	if _uint32_be(header, 8) != 13 or header.slice(12, 16).get_string_from_ascii() != "IHDR":
		return {"ok": false, "width": 0, "height": 0, "error": "PNG does not begin with a valid IHDR chunk: %s" % path}
	var width := _uint32_be(header, 16)
	var height := _uint32_be(header, 20)
	if width <= 0 or height <= 0:
		return {"ok": false, "width": 0, "height": 0, "error": "PNG IHDR dimensions must be positive: %s" % path}
	return {"ok": true, "width": width, "height": height, "error": ""}


static func _uint32_be(bytes: PackedByteArray, offset: int) -> int:
	return (int(bytes[offset]) << 24) | (int(bytes[offset + 1]) << 16) | (int(bytes[offset + 2]) << 8) | int(bytes[offset + 3])


static func _texture_from_image(image: Image) -> PortableCompressedTexture2D:
	var texture := PortableCompressedTexture2D.new()
	texture.keep_compressed_buffer = true
	texture.create_from_image(image, PortableCompressedTexture2D.COMPRESSION_MODE_LOSSLESS)
	return texture


static func _sha256_file(path: String) -> String:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return ""
	var context := HashingContext.new()
	if context.start(HashingContext.HASH_SHA256) != OK:
		file.close()
		return ""
	while file.get_position() < file.get_length():
		context.update(file.get_buffer(mini(BUFFER_SIZE, file.get_length() - file.get_position())))
	file.close()
	return context.finish().hex_encode()


static func _resolve_pack_path(pack_root: String, relative_path: String) -> String:
	return pack_root.path_join(relative_path)


static func _normalise_input_path(path: String) -> String:
	var trimmed := path.strip_edges().replace("\\", "/")
	if trimmed.begins_with("res://"):
		return trimmed.simplify_path()
	if trimmed.is_absolute_path():
		return trimmed.simplify_path()
	return ""


static func _normalise_resource_dir(path: String) -> String:
	var normalised := path.strip_edges().replace("\\", "/").trim_suffix("/")
	if not normalised.begins_with("res://") or normalised.contains(".."):
		return ""
	return normalised.simplify_path()


static func _is_supported_runtime() -> bool:
	var version := Engine.get_version_info()
	return version.major > 4 or (version.major == 4 and version.minor >= 3)


static func _dictionary_at(parent: Dictionary, key: String, errors: Array[String]) -> Dictionary:
	var value: Variant = parent.get(key)
	if typeof(value) != TYPE_DICTIONARY:
		errors.append("%s must be an object." % key)
		return {}
	return value


static func _positive_int_pair(value: Variant, label: String, errors: Array[String]) -> Vector2i:
	if typeof(value) != TYPE_ARRAY or value.size() != 2 or not _is_json_integer(value[0]) or not _is_json_integer(value[1]) or value[0] <= 0 or value[1] <= 0:
		errors.append("%s must contain two positive integers." % label)
		return Vector2i.ZERO
	return Vector2i(int(value[0]), int(value[1]))


static func _non_negative_int_pair(value: Variant, label: String, errors: Array[String]) -> Vector2i:
	if typeof(value) != TYPE_ARRAY or value.size() != 2 or not _is_json_integer(value[0]) or not _is_json_integer(value[1]) or value[0] < 0 or value[1] < 0:
		errors.append("%s must contain two non-negative integers." % label)
		return Vector2i.ZERO
	return Vector2i(int(value[0]), int(value[1]))


static func _int_quad(value: Variant, label: String, errors: Array[String]) -> Rect2:
	if typeof(value) != TYPE_ARRAY or value.size() != 4:
		errors.append("%s must contain four integers." % label)
		return Rect2()
	for item: Variant in value:
		if not _is_json_integer(item):
			errors.append("%s must contain four integers." % label)
			return Rect2()
	if value[0] < 0 or value[1] < 0 or value[2] <= 0 or value[3] <= 0:
		errors.append("%s must describe a positive in-bounds rectangle." % label)
		return Rect2()
	return Rect2(int(value[0]), int(value[1]), int(value[2]), int(value[3]))


static func _is_json_integer(value: Variant) -> bool:
	if typeof(value) == TYPE_INT:
		return true
	return typeof(value) == TYPE_FLOAT and is_finite(value) and value == floor(value)


static func _is_safe_relative_path(path: String) -> bool:
	if path.is_empty() or path.begins_with("/") or path.ends_with("/") or path.contains("\\") or path.contains("//") or path.contains(":"):
		return false
	var segment_pattern := RegEx.new()
	if segment_pattern.compile("^[a-z0-9][a-z0-9._-]*$") != OK:
		return false
	for segment: String in path.split("/", true):
		if segment == "." or segment == ".." or segment_pattern.search(segment) == null:
			return false
	return true


static func _is_pack_id(value: String) -> bool:
	if value.length() > 80:
		return false
	var pattern := RegEx.new()
	return pattern.compile("^[a-z0-9]+(?:-[a-z0-9]+)*$") == OK and pattern.search(value) != null


static func _is_asset_id(value: String) -> bool:
	if value.length() > 120:
		return false
	var pattern := RegEx.new()
	return pattern.compile("^[a-z0-9][a-z0-9_-]*$") == OK and pattern.search(value) != null


static func _is_sha256(value: String) -> bool:
	var pattern := RegEx.new()
	return pattern.compile("^[0-9a-f]{64}$") == OK and pattern.search(value) != null


static func _result(ok: bool, errors: Array[String], warnings: Array[String]) -> Dictionary:
	return {
		"ok": ok,
		"errors": errors.duplicate(),
		"warnings": warnings.duplicate(),
		"pack_id": "",
		"output_dir": "",
		"tileset_path": "",
		"scene_path": "",
		"cell_count": 0,
		"prop_count": 0,
	}

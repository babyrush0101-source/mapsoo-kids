@tool
extends EditorPlugin

const MENU_LABEL := "Import Mapsoo Pack..."
const IMPORTER := preload("mapsoo_pack_importer.gd")

var _manifest_dialog: EditorFileDialog
var _message_dialog: AcceptDialog


func _enter_tree() -> void:
	_manifest_dialog = EditorFileDialog.new()
	_manifest_dialog.title = "Select an extracted Mapsoo manifest"
	_manifest_dialog.file_mode = EditorFileDialog.FILE_MODE_OPEN_FILE
	_manifest_dialog.access = EditorFileDialog.ACCESS_FILESYSTEM
	_manifest_dialog.add_filter("mapsoo.manifest.json", "Mapsoo pack manifest")
	_manifest_dialog.file_selected.connect(_on_manifest_selected)
	add_child(_manifest_dialog)

	_message_dialog = AcceptDialog.new()
	_message_dialog.title = "Mapsoo Pack Importer"
	add_child(_message_dialog)
	add_tool_menu_item(MENU_LABEL, _open_manifest_dialog)


func _exit_tree() -> void:
	remove_tool_menu_item(MENU_LABEL)
	if is_instance_valid(_manifest_dialog):
		_manifest_dialog.queue_free()
	if is_instance_valid(_message_dialog):
		_message_dialog.queue_free()


func _open_manifest_dialog() -> void:
	_manifest_dialog.popup_centered_ratio(0.72)


func _on_manifest_selected(path: String) -> void:
	var result := IMPORTER.import_pack(path, IMPORTER.OUTPUT_ROOT)
	if not result.ok:
		var failure_title := "Import conflict" if result.status == "conflict" else "Import failed"
		_show_message(failure_title, "\n".join(result.errors))
		return
	get_editor_interface().get_resource_filesystem().scan()
	var warning_text := ""
	if not result.warnings.is_empty():
		warning_text = "\n\nWarnings:\n%s" % "\n".join(result.warnings)
	var outcome_text := {
		"created": "Created",
		"unchanged": "Unchanged",
		"updated": "Updated",
	}.get(result.status, "Imported")
	_show_message(
		"Import %s" % result.status,
		"%s:\n%s\n%s\n\n%d cells, %d props%s" % [
			outcome_text,
			result.tileset_path,
			result.scene_path,
			result.cell_count,
			result.prop_count,
			warning_text,
		],
	)


func _show_message(title: String, message: String) -> void:
	_message_dialog.title = title
	_message_dialog.dialog_text = message if not message.is_empty() else "Unknown importer error."
	_message_dialog.popup_centered(Vector2i(620, 260))

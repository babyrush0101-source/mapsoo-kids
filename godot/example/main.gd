extends Node2D

const GENERATED_SCENE := "res://mapsoo_imports/smoke-pack/smoke-pack.world.tscn"


func _ready() -> void:
	if not ResourceLoader.exists(GENERATED_SCENE, "PackedScene"):
		return

	var packed := load(GENERATED_SCENE) as PackedScene
	if packed == null:
		push_warning("The generated Mapsoo smoke scene could not be loaded.")
		return

	var world := packed.instantiate()
	world.position = Vector2(24, 120)
	add_child(world)

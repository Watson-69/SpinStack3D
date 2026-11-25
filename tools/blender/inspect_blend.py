import bpy

print("=== SCENE OBJECTS DUMP ===")
for o in bpy.data.objects:
    mats = [m.name for m in o.data.materials if m] if hasattr(o.data, 'materials') and o.data else []
    print(f"{o.name:25} loc: ({o.location.x:6.1f}, {o.location.y:6.1f}, {o.location.z:6.1f}) dims: ({o.dimensions.x:5.1f}, {o.dimensions.y:5.1f}, {o.dimensions.z:5.1f}) hide_render: {o.hide_render} mats: {mats}")

print("\n=== LIGHTS & CAMERA ===")
for l in bpy.data.lights:
    print(f"{l.name}: energy={l.energy}, color={l.color[:]}")
cam = bpy.data.objects.get("Camera")
if cam:
    print(f"Camera loc: {cam.location[:]}, rot: {cam.rotation_euler[:]}")
    print(f"Lens: {cam.data.lens}, clip_end: {cam.data.clip_end}")

print(f"Color Management View: {bpy.context.scene.view_settings.view_transform}, exposure: {bpy.context.scene.view_settings.exposure}")

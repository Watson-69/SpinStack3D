import bpy
import math
import os

# Reset scene to empty
bpy.ops.wm.read_factory_settings(use_empty=True)

# Helper to create PBR material with Blender 5.x / Principled BSDF
def make_mat(name, color, metallic=0.0, roughness=0.5, clearcoat=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        if "Clearcoat Weight" in bsdf.inputs:
            bsdf.inputs["Clearcoat Weight"].default_value = clearcoat
        elif "Coat Weight" in bsdf.inputs:
            bsdf.inputs["Coat Weight"].default_value = clearcoat
    return mat

# Materials (PBR calibrated for enterprise hardware CAD)
mat_cover = make_mat("MatCover", (0.84, 0.86, 0.89, 1.0), metallic=0.92, roughness=0.22, clearcoat=0.3)
mat_screws = make_mat("MatScrews", (0.82, 0.84, 0.87, 1.0), metallic=0.96, roughness=0.18)
mat_chassis = make_mat("MatChassis", (0.45, 0.49, 0.55, 1.0), metallic=0.85, roughness=0.35)
mat_platters = make_mat("MatPlatters", (0.98, 0.98, 0.99, 1.0), metallic=0.98, roughness=0.03, clearcoat=0.8)
mat_copper = make_mat("MatCopper", (0.88, 0.50, 0.08, 1.0), metallic=0.90, roughness=0.25)
mat_magnet = make_mat("MatMagnet", (0.24, 0.28, 0.34, 1.0), metallic=0.95, roughness=0.15)
mat_arm = make_mat("MatArm", (0.80, 0.84, 0.88, 1.0), metallic=0.92, roughness=0.20)
mat_bearing = make_mat("MatBearing", (0.92, 0.94, 0.96, 1.0), metallic=0.96, roughness=0.12)
mat_kapton = make_mat("MatKapton", (0.75, 0.38, 0.06, 1.0), metallic=0.25, roughness=0.30)
mat_pcb = make_mat("MatPCB", (0.02, 0.18, 0.20, 1.0), metallic=0.15, roughness=0.45)
mat_chips = make_mat("MatChips", (0.08, 0.10, 0.13, 1.0), metallic=0.50, roughness=0.35)
mat_gold = make_mat("MatGold", (0.98, 0.78, 0.16, 1.0), metallic=0.96, roughness=0.12)
mat_plastic = make_mat("MatPlastic", (0.06, 0.08, 0.10, 1.0), metallic=0.10, roughness=0.60)

# =========================================================================
# COORDINATE CONVENTION IN BLENDER:
# X = Length (4.2 units)
# Y = Width / Depth (2.9 units)
# Z = Height / Thickness (0.65 units, UP!)
# =========================================================================

# 01. MOUNTING SCREWS (6 Torx perimeter screws, Z = +0.36)
screw_positions = [
    (-1.9, -1.3, 0.36),
    (1.9, -1.3, 0.36),
    (-1.9, 1.3, 0.36),
    (1.9, 1.3, 0.36),
    (-1.9, 0.0, 0.36),
    (1.9, 0.0, 0.36),
]
bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.04, vertices=16, location=screw_positions[0])
screw_root = bpy.context.active_object
screw_root.name = "mounting_screws"
screw_root.data.materials.append(mat_screws)

for x, y, z in screw_positions[1:]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.04, vertices=16, location=(x, y, z))
    s = bpy.context.active_object
    s.data.materials.append(mat_screws)
    s.select_set(True)
screw_root.select_set(True)
bpy.context.view_layer.objects.active = screw_root
bpy.ops.object.join()

# 02. TOP COVER & BREATHER FILTER (Horizontal in XY plane, Z = +0.34)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.34))
top_cover = bpy.context.active_object
top_cover.name = "top_cover"
top_cover.scale = (4.1, 2.85, 0.04)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
top_cover.data.materials.append(mat_cover)

# Circular Breather Filter boss on top of lid
bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=0.02, vertices=24, location=(1.2, 0.5, 0.36))
breather = bpy.context.active_object
breather.data.materials.append(mat_cover)
breather.select_set(True)
top_cover.select_set(True)
bpy.context.view_layer.objects.active = top_cover
bpy.ops.object.join()

# 03. CHASSIS BASE CASTING (Tray in XY plane, Z = -0.32)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, -0.32))
chassis = bpy.context.active_object
chassis.name = "chassis"
chassis.scale = (4.2, 2.9, 0.08)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
chassis.data.materials.append(mat_chassis)

# Left and Right side casting walls (along X at +/- 2.05, height along Z)
for x_pos in [-2.05, 2.05]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x_pos, 0, 0.0))
    wall = bpy.context.active_object
    wall.scale = (0.1, 2.9, 0.65)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    wall.data.materials.append(mat_chassis)
    wall.select_set(True)
    chassis.select_set(True)
    bpy.context.view_layer.objects.active = chassis
    bpy.ops.object.join()

# Front and Rear walls (along Y at +/- 1.4, height along Z)
for y_pos in [-1.4, 1.4]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, y_pos, 0.0))
    fwall = bpy.context.active_object
    fwall.scale = (4.0, 0.1, 0.65)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    fwall.data.materials.append(mat_chassis)
    fwall.select_set(True)
    chassis.select_set(True)
    bpy.context.view_layer.objects.active = chassis
    bpy.ops.object.join()

# 04. MAGNETIC PLATTERS (3 Stacked horizontal discs in XY plane)
bpy.ops.mesh.primitive_cylinder_add(radius=1.28, depth=0.024, vertices=64, location=(0.6, 0, -0.12))
platters = bpy.context.active_object
platters.name = "platters"
platters.data.materials.append(mat_platters)

for z_off in [0.0, 0.12]:
    bpy.ops.mesh.primitive_cylinder_add(radius=1.28, depth=0.024, vertices=64, location=(0.6, 0, z_off))
    p = bpy.context.active_object
    p.data.materials.append(mat_platters)
    p.select_set(True)
    platters.select_set(True)
    bpy.context.view_layer.objects.active = platters
    bpy.ops.object.join()

# Platter top clamp ring
bpy.ops.mesh.primitive_cylinder_add(radius=0.48, depth=0.04, vertices=32, location=(0.6, 0, 0.18))
clamp = bpy.context.active_object
clamp.data.materials.append(mat_cover)
clamp.select_set(True)
platters.select_set(True)
bpy.context.view_layer.objects.active = platters
bpy.ops.object.join()

# 05. SPINDLE MOTOR & HUB
bpy.ops.mesh.primitive_cylinder_add(radius=0.36, depth=0.32, vertices=32, location=(0.6, 0, -0.16))
spindle = bpy.context.active_object
spindle.name = "spindle_motor"
spindle.data.materials.append(mat_bearing)

# 9 Copper stator windings underneath
for i in range(9):
    angle = (i / 9) * math.pi * 2
    px = 0.6 + math.cos(angle) * 0.44
    py = math.sin(angle) * 0.44
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, -0.22))
    pole = bpy.context.active_object
    pole.scale = (0.08, 0.14, 0.12)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    pole.data.materials.append(mat_copper)
    pole.select_set(True)
    spindle.select_set(True)
    bpy.context.view_layer.objects.active = spindle
    bpy.ops.object.join()

# 06. ACTUATOR ARM E-BLOCK (Pivots around Z at (-0.9, -0.45, 0))
bpy.ops.mesh.primitive_cylinder_add(radius=0.22, depth=0.32, vertices=24, location=(-0.9, 0.45, -0.05))
actuator = bpy.context.active_object
actuator.name = "actuator_arm"
actuator.data.materials.append(mat_arm)

# 4 Tines extending toward the platter stack
for z_pos in [-0.14, -0.04, 0.04, 0.14]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.2, 0.22, z_pos))
    tine = bpy.context.active_object
    tine.scale = (1.2, 0.12, 0.022)
    tine.rotation_euler = (0, 0, -0.32)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    tine.data.materials.append(mat_arm)
    tine.select_set(True)
    actuator.select_set(True)
    bpy.context.view_layer.objects.active = actuator
    bpy.ops.object.join()

# Rear counterbalance
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.22, 0.55, -0.05))
rear = bpy.context.active_object
rear.scale = (0.45, 0.15, 0.28)
rear.rotation_euler = (0, 0, -0.32)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
rear.data.materials.append(mat_arm)
rear.select_set(True)
actuator.select_set(True)
bpy.context.view_layer.objects.active = actuator
bpy.ops.object.join()

# 07. RW HEADS & SUSPENSION GIMBALS
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.45, 0.01, -0.05))
rw_heads = bpy.context.active_object
rw_heads.name = "rw_heads"
rw_heads.scale = (0.35, 0.05, 0.28)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
rw_heads.data.materials.append(mat_bearing)

# Ceramic femto sliders
for z_tip in [-0.15, -0.07, 0.01, 0.09, 0.17]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.62, 0.01, z_tip))
    tip = bpy.context.active_object
    tip.scale = (0.055, 0.035, 0.018)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    tip.data.materials.append(mat_plastic)
    tip.select_set(True)
    rw_heads.select_set(True)
    bpy.context.view_layer.objects.active = rw_heads
    bpy.ops.object.join()

# 08. VOICE COIL MOTOR (VCM) & MAGNETS
# Top neodymium magnet
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.38, 0.6, 0.14))
vcm = bpy.context.active_object
vcm.name = "voice_coil_motor"
vcm.scale = (0.85, 0.6, 0.06)
vcm.rotation_euler = (0, 0, 0.35)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
vcm.data.materials.append(mat_magnet)

# Bottom neodymium magnet
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.38, 0.6, -0.16))
b_mag = bpy.context.active_object
b_mag.scale = (0.85, 0.6, 0.06)
b_mag.rotation_euler = (0, 0, 0.35)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
b_mag.data.materials.append(mat_magnet)
b_mag.select_set(True)
vcm.select_set(True)
bpy.context.view_layer.objects.active = vcm
bpy.ops.object.join()

# Flat copper voice coil nested between magnets
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.33, 0.6, -0.01))
coil = bpy.context.active_object
coil.scale = (0.65, 0.45, 0.04)
coil.rotation_euler = (0, 0, 0.35)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
coil.data.materials.append(mat_copper)
coil.select_set(True)
vcm.select_set(True)
bpy.context.view_layer.objects.active = vcm
bpy.ops.object.join()

# 09. PIVOT BEARING CARTRIDGE & KAPTON FLEX CABLE
bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.48, vertices=24, location=(-0.9, 0.45, -0.05))
pivot = bpy.context.active_object
pivot.name = "pivot_bearing"
pivot.data.materials.append(mat_bearing)

# Amber Kapton flex ribbon
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.12, 0.3, -0.05))
flex = bpy.context.active_object
flex.scale = (0.38, 0.015, 0.24)
flex.rotation_euler = (0, 0, 0.45)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
flex.data.materials.append(mat_kapton)
flex.select_set(True)
pivot.select_set(True)
bpy.context.view_layer.objects.active = pivot
bpy.ops.object.join()

# 10. PCB LOGIC BOARD (Mounted underneath chassis in XY plane, Z = -0.38)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.2, 0, -0.38))
pcb = bpy.context.active_object
pcb.name = "pcb_board"
pcb.scale = (3.6, 2.7, 0.04)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
pcb.data.materials.append(mat_pcb)

# Main SoC IC
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.2, -0.3, -0.41))
soc = bpy.context.active_object
soc.scale = (0.7, 0.7, 0.03)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
soc.data.materials.append(mat_chips)
soc.select_set(True)
pcb.select_set(True)
bpy.context.view_layer.objects.active = pcb
bpy.ops.object.join()

# DRAM Buffer IC
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.7, -0.3, -0.41))
dram = bpy.context.active_object
dram.scale = (0.45, 0.3, 0.03)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
dram.data.materials.append(mat_chips)
dram.select_set(True)
pcb.select_set(True)
bpy.context.view_layer.objects.active = pcb
bpy.ops.object.join()

# 11. SATA DATA & POWER CONNECTOR (At the rear edge)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.9, -0.2, -0.22))
sata = bpy.context.active_object
sata.name = "sata_connector"
sata.scale = (0.3, 1.8, 0.28)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
sata.data.materials.append(mat_plastic)

# Gold contact pins
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.98, -0.2, -0.22))
gold_pins = bpy.context.active_object
gold_pins.scale = (0.08, 1.4, 0.04)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
gold_pins.data.materials.append(mat_gold)
gold_pins.select_set(True)
sata.select_set(True)
bpy.context.view_layer.objects.active = sata
bpy.ops.object.join()

# Export glTF Binary (.glb) to public/models/hdd.glb
out_dir = r"C:\Users\MAULIK SHARMA\Desktop\HECKS\public\models"
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "hdd.glb")

bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format='GLB',
    export_materials='EXPORT',
    use_selection=False,
    export_apply=True
)

print(f"SUCCESS: Exported correctly oriented Blender HDD model to {out_path}")

"""
Refined Enterprise 3.5-Inch Hard Disk Drive (HDD) Model Generator
Scripted for Blender 5.x Python API (bpy)

Features:
- Open / Transparent Casing (optical-grade polycarbonate cover with transmission PBR & perimeter Torx screws)
- High-Detail Base Casting with internal stiffening ribs, motor pocket, filter/desiccant bays, 6-32 mounting holes
- Platters with double-sided 45° edge bevels, turned aluminum spacer rings, and concentric micro-groove anisotropic shader
- Spindle Motor with dark base ring, machined metal collar, 6-screw clamp ring, brass FDB bushing, and copper stator
- Actuator Arm with 4-tier E-block comb, triangular truss cutouts, brass counterweight slug, and zero-play pivot housing
- Head Stack with 6 stamped stainless load beams, laser swage weld rings, PZT micro-actuators, and ceramic femto sliders
- Voice Coil Actuator (VCA) with flat enameled copper coil, high-contrast brushed NdFeB magnets, and steel flux yokes
- Flexible Flat Ribbon Cable (FPC) with Kapton polyimide substrate, copper signal traces, Preamp IC, and connector header
- Studio 3-Point Lighting (Key, Fill, Rim) and Beauty Camera for instant high-resolution rendering
- Exports Draco-compressed glTF (with explodeOffset, partId, and label metadata) and renders studio stills
"""

import bpy
import math
import os
import shutil
import sys
import tempfile

print("[HDD-CAD] Resetting scene to empty factory state...")
bpy.ops.wm.read_factory_settings(use_empty=True)

# ---------------------------------------------------------------------------
# 1. PBR MATERIAL FACTORY
# ---------------------------------------------------------------------------
def make_pbr(name, base_color, metallic=0.0, roughness=0.5, clearcoat=0.0, transmission=0.0, ior=1.45):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = base_color
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        
        # Clearcoat / Coat
        if "Clearcoat Weight" in bsdf.inputs:
            bsdf.inputs["Clearcoat Weight"].default_value = clearcoat
        elif "Coat Weight" in bsdf.inputs:
            bsdf.inputs["Coat Weight"].default_value = clearcoat

        # Transmission (for transparent casing)
        if "Transmission Weight" in bsdf.inputs:
            bsdf.inputs["Transmission Weight"].default_value = transmission
        elif "Transmission" in bsdf.inputs:
            bsdf.inputs["Transmission"].default_value = transmission

        if "IOR" in bsdf.inputs:
            bsdf.inputs["IOR"].default_value = ior

    return mat

# Materials
mat_cast_al         = make_pbr("Mat_CastAluminium", (0.52, 0.56, 0.60, 1.0), metallic=0.88, roughness=0.38)
mat_machined_al     = make_pbr("Mat_MachinedAluminium", (0.86, 0.88, 0.91, 1.0), metallic=0.95, roughness=0.16, clearcoat=0.3)
mat_chrome_screw    = make_pbr("Mat_ChromeScrews", (0.94, 0.95, 0.97, 1.0), metallic=0.98, roughness=0.08, clearcoat=0.5)
mat_stainless       = make_pbr("Mat_StainlessSteel", (0.84, 0.86, 0.88, 1.0), metallic=0.95, roughness=0.18)
mat_brass           = make_pbr("Mat_BrassBush", (0.88, 0.72, 0.22, 1.0), metallic=0.92, roughness=0.22)
mat_copper_coil     = make_pbr("Mat_EnameledCopper", (0.92, 0.46, 0.10, 1.0), metallic=0.92, roughness=0.24)
mat_magnet_yoke     = make_pbr("Mat_MagnetYoke", (0.22, 0.25, 0.30, 1.0), metallic=0.96, roughness=0.12)
mat_kapton_fpc      = make_pbr("Mat_KaptonFPC", (0.76, 0.40, 0.06, 1.0), metallic=0.20, roughness=0.28)
mat_dark_pcb        = make_pbr("Mat_DarkPCB", (0.04, 0.14, 0.16, 1.0), metallic=0.15, roughness=0.48)
mat_dark_polymer    = make_pbr("Mat_DarkPolymer", (0.08, 0.09, 0.11, 1.0), metallic=0.08, roughness=0.55)
mat_silicon_chip    = make_pbr("Mat_SiliconChip", (0.06, 0.08, 0.11, 1.0), metallic=0.40, roughness=0.30)
mat_gold_pin        = make_pbr("Mat_GoldPins", (0.98, 0.78, 0.15, 1.0), metallic=0.98, roughness=0.10)
mat_filter_media    = make_pbr("Mat_ePTFEFilter", (0.92, 0.94, 0.96, 1.0), metallic=0.05, roughness=0.80)
mat_rubber_damper   = make_pbr("Mat_RubberDamper", (0.03, 0.04, 0.05, 1.0), metallic=0.02, roughness=0.85)

# Transparent optical casing material (for open/transparent top cover)
mat_trans_casing    = make_pbr("Mat_TransparentCover", (0.95, 0.97, 1.0, 1.0), metallic=0.05, roughness=0.04, transmission=0.92, ior=1.52)
mat_trans_casing.blend_method = 'BLEND' if hasattr(mat_trans_casing, 'blend_method') else None

# Anisotropic Concentric Platter Material
mat_aniso_platter   = make_pbr("Mat_AnisotropicPlatter", (0.97, 0.97, 0.98, 1.0), metallic=0.99, roughness=0.02, clearcoat=0.9)
# Add concentric circular procedural texture to platter roughness/normal if node tree exists
if mat_aniso_platter.node_tree:
    nodes = mat_aniso_platter.node_tree.nodes
    links = mat_aniso_platter.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    
    tex_coord = nodes.new(type="ShaderNodeTexCoord")
    tex_coord.location = (-800, 200)

    # Center rings on spindle motor (X=0, Y=18)
    mapping = nodes.new(type="ShaderNodeMapping")
    mapping.inputs["Location"].default_value = (0.0, -18.0, 0.0)
    mapping.location = (-600, 200)
    
    # Wave Texture (Rings centered at spindle)
    wave_tex = nodes.new(type="ShaderNodeTexWave")
    wave_tex.wave_type = 'RINGS'
    wave_tex.rings_direction = 'Z'
    wave_tex.inputs["Scale"].default_value = 110.0
    wave_tex.inputs["Distortion"].default_value = 0.0
    wave_tex.inputs["Detail"].default_value = 3.0
    wave_tex.inputs["Detail Roughness"].default_value = 0.4
    wave_tex.location = (-400, 200)
    
    # Color Ramp for subtle micro-groove roughness modulation
    ramp = nodes.new(type="ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (0.015, 0.015, 0.015, 1.0)
    ramp.color_ramp.elements[1].position = 1.0
    ramp.color_ramp.elements[1].color = (0.045, 0.045, 0.045, 1.0)
    ramp.location = (-200, 200)
    
    links.new(tex_coord.outputs["Object"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], wave_tex.inputs["Vector"])
    links.new(wave_tex.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Roughness"])

# ---------------------------------------------------------------------------
# GEOMETRY HELPERS
# ---------------------------------------------------------------------------
def set_mat(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.material_index = 0

def join_into(target, sources, fallback_mat=None):
    if not sources:
        if fallback_mat:
            set_mat(target, fallback_mat)
        return target
    valid_sources = [s for s in sources if s and s.name in bpy.data.objects]
    if not valid_sources:
        if fallback_mat:
            set_mat(target, fallback_mat)
        return target
    bpy.ops.object.select_all(action='DESELECT')
    for s in valid_sources:
        s.select_set(True)
    target.select_set(True)
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.join()
    if fallback_mat:
        set_mat(target, fallback_mat)
    return target

def tag_extras(obj, explode_offset, part_id, label, subsystem):
    data = {
        "explodeOffset": [float(x) for x in explode_offset],
        "partId": str(part_id),
        "label": str(label),
        "subsystem": str(subsystem)
    }
    obj["explodeOffset"] = data["explodeOffset"]
    obj["partId"] = data["partId"]
    obj["label"] = data["label"]
    obj["subsystem"] = data["subsystem"]
    if obj.data:
        obj.data["explodeOffset"] = data["explodeOffset"]
        obj.data["partId"] = data["partId"]
        obj.data["label"] = data["label"]
        obj.data["subsystem"] = data["subsystem"]

print("[HDD-CAD] Step 1: Base Casting, Standoffs, Ribbon Cable & Connector...")

# ===========================================================================
# 01. DIE-CAST BASE CHASSIS (101.6 x 147.0 x 22.0 mm)
# ===========================================================================
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
base_tub = bpy.context.active_object
base_tub.name = "Base_Casting"
base_tub.scale = (101.6, 147.0, 22.0)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
set_mat(base_tub, mat_cast_al)

# Deep Internal Cavity Boolean Cut (97.0 x 140.0 x 19.0 mm open tub)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 2.5))
cavity = bpy.context.active_object
cavity.scale = (97.0, 140.0, 19.0)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# Rear Cutout for SATA Connector Header
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(22.0, -71.5, -8.5))
sata_cutout = bpy.context.active_object
sata_cutout.scale = (42.0, 8.0, 7.5)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

mod_cav = base_tub.modifiers.new(name="Cavity", type='BOOLEAN')
mod_cav.object = cavity
mod_cav.operation = 'DIFFERENCE'
bpy.context.view_layer.objects.active = base_tub
bpy.ops.object.modifier_apply(modifier="Cavity")
bpy.data.objects.remove(cavity, do_unlink=True)

mod_sata = base_tub.modifiers.new(name="SataCutout", type='BOOLEAN')
mod_sata.object = sata_cutout
mod_sata.operation = 'DIFFERENCE'
bpy.context.view_layer.objects.active = base_tub
bpy.ops.object.modifier_apply(modifier="SataCutout")
bpy.data.objects.remove(sata_cutout, do_unlink=True)

set_mat(base_tub, mat_cast_al)

base_subparts = []

# Circular Spindle Motor Well in Floor (Dia 35mm, depth 3.5mm at X=0, Y=18)
bpy.ops.mesh.primitive_cylinder_add(radius=17.5, depth=3.5, vertices=32, location=(0.0, 18.0, -7.2))
spindle_well = bpy.context.active_object
set_mat(spindle_well, mat_cast_al)
base_subparts.append(spindle_well)

# Pivot Mounting Boss & Threaded Center Shaft (at X=-22, Y=-22)
bpy.ops.mesh.primitive_cylinder_add(radius=6.8, depth=11.0, vertices=24, location=(-22.0, -22.0, -4.0))
pivot_boss = bpy.context.active_object
set_mat(pivot_boss, mat_cast_al)
base_subparts.append(pivot_boss)

# Precision Standoff Posts for Lower Magnet & PCB
for sx, sy in [(-16.0, -42.0), (-32.0, -26.0), (-32.0, -42.0)]:
    bpy.ops.mesh.primitive_cylinder_add(radius=2.0, depth=6.0, vertices=16, location=(sx, sy, -5.0))
    standoff = bpy.context.active_object
    set_mat(standoff, mat_stainless)
    base_subparts.append(standoff)

# 3 Radial Stator Screw Bosses with Stainless Fasteners
for ang in [30, 150, 270]:
    rad = math.radians(ang)
    bx = 0.0 + 14.0 * math.cos(rad)
    by = 18.0 + 14.0 * math.sin(rad)
    bpy.ops.mesh.primitive_cylinder_add(radius=2.2, depth=2.5, vertices=16, location=(bx, by, -6.5))
    sboss = bpy.context.active_object
    set_mat(sboss, mat_stainless)
    base_subparts.append(sboss)

# Internal Stiffening Floor Ribs
rib_specs = [
    (34.0, -32.0, -6.0, 3.8, 44.0, 5.0),
    (-36.0, 30.0, -6.0, 3.8, 38.0, 5.0),
    (0.0, -50.0, -7.0, 56.0, 3.8, 4.0),
]
for rx, ry, rz, sx, sy, sz in rib_specs:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(rx, ry, rz))
    rib = bpy.context.active_object
    rib.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    set_mat(rib, mat_cast_al)
    base_subparts.append(rib)

# Air Recirculation Filter Pocket & Media (Front Right: X=38, Y=56)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(38.0, 56.0, 0.0))
fmedia = bpy.context.active_object
fmedia.scale = (8.0, 16.0, 10.0)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
set_mat(fmedia, mat_filter_media)
base_subparts.append(fmedia)

# Desiccant Packet Enclosure (Rear Right: X=40, Y=-15)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(40.0, -15.0, -4.5))
desiccant = bpy.context.active_object
desiccant.scale = (6.0, 18.0, 4.0)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
set_mat(desiccant, mat_stainless)
base_subparts.append(desiccant)

# Side 6-32 UNC Threaded Mounting Holes (3 on each outer rail, depth stays inside outer wall)
for x_side in [-50.2, 50.2]:
    for y_hole in [-50.0, 0.0, 50.0]:
        bpy.ops.mesh.primitive_cylinder_add(radius=1.6, depth=1.0, vertices=16, location=(x_side, y_hole, -4.0))
        shole = bpy.context.active_object
        shole.rotation_euler = (0, math.radians(90.0), 0)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        set_mat(shole, mat_cast_al)
        base_subparts.append(shole)

# Bottom 6-32 Mounting Holes
for bx in [-38.0, 38.0]:
    for by in [-48.0, 48.0]:
        bpy.ops.mesh.primitive_cylinder_add(radius=1.8, depth=1.5, vertices=16, location=(bx, by, -10.8))
        bhole = bpy.context.active_object
        set_mat(bhole, mat_cast_al)
        base_subparts.append(bhole)

join_into(base_tub, base_subparts, mat_cast_al)
tag_extras(base_tub, [0.0, 0.0, 0.0], "chassis", "Die-Cast Base Chassis", "Mechanical Enclosure")

print("[HDD-CAD] Step 2: Spindle Motor & Platters with Micro-Grooves...")

# ===========================================================================
# 02. SPINDLE MOTOR WITH DARK BASE RING & MACHINED COLLAR (Centered at X=0, Y=18)
# ===========================================================================
bpy.ops.mesh.primitive_cylinder_add(radius=12.5, depth=14.0, vertices=32, location=(0.0, 18.0, -1.0))
spindle_hub = bpy.context.active_object
spindle_hub.name = "Spindle_Motor"
set_mat(spindle_hub, mat_machined_al)

spindle_subparts = []

# Dark Stator Base Ring (anodized black polymer / steel seal ring in motor well)
bpy.ops.mesh.primitive_cylinder_add(radius=16.5, depth=2.4, vertices=32, location=(0.0, 18.0, -6.8))
dark_ring = bpy.context.active_object
set_mat(dark_ring, mat_dark_polymer)
spindle_subparts.append(dark_ring)

# Machined Metal Collar (stepped precision turned hub shoulder)
bpy.ops.mesh.primitive_cylinder_add(radius=14.2, depth=2.0, vertices=32, location=(0.0, 18.0, 5.5))
collar = bpy.context.active_object
set_mat(collar, mat_machined_al)
spindle_subparts.append(collar)

# Center Brass FDB Bushing Cap
bpy.ops.mesh.primitive_cylinder_add(radius=5.2, depth=1.8, vertices=24, location=(0.0, 18.0, 6.4))
fdb_cap = bpy.context.active_object
set_mat(fdb_cap, mat_brass)
spindle_subparts.append(fdb_cap)

# Shaft Center Grounding Dimple
bpy.ops.mesh.primitive_cylinder_add(radius=1.2, depth=0.6, vertices=16, location=(0.0, 18.0, 7.1))
dimple = bpy.context.active_object
set_mat(dimple, mat_gold_pin)
spindle_subparts.append(dimple)

# 12-Pole Copper Stator Coils in Lower Cavity (Floor Well)
for i in range(12):
    ang = (i / 12.0) * math.pi * 2.0
    wx = 0.0 + 10.5 * math.cos(ang)
    wy = 18.0 + 10.5 * math.sin(ang)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(wx, wy, -6.6))
    coil = bpy.context.active_object
    coil.scale = (2.2, 2.2, 2.6)
    coil.rotation_euler = (0, 0, ang)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    set_mat(coil, mat_copper_coil)
    spindle_subparts.append(coil)

join_into(spindle_hub, spindle_subparts)
tag_extras(spindle_hub, [0.0, 12.0, 0.0], "spindle_motor", "Spindle Motor & FDB Bearing", "Magnetic Media")

# ===========================================================================
# 03. MAGNETIC DISK PLATTERS WITH ANISOTROPIC MICRO-GROOVES & BEVELS
# ===========================================================================
platter_names = ["Platter_01", "Platter_02", "Platter_03"]
platter_z_levels = [4.2, 0.5, -3.2]

for i, (p_name, pz) in enumerate(zip(platter_names, platter_z_levels)):
    # Platter disk (95mm OD, 1.27mm thickness)
    bpy.ops.mesh.primitive_cylinder_add(radius=47.5, depth=1.27, vertices=64, location=(0.0, 18.0, pz))
    disc = bpy.context.active_object
    disc.name = p_name

    # 25mm inner bore cutout
    bpy.ops.mesh.primitive_cylinder_add(radius=12.5, depth=2.0, vertices=32, location=(0.0, 18.0, pz))
    bore = bpy.context.active_object
    mod_b = disc.modifiers.new(name="Bore", type='BOOLEAN')
    mod_b.object = bore
    mod_b.operation = 'DIFFERENCE'
    bpy.context.view_layer.objects.active = disc
    bpy.ops.object.modifier_apply(modifier="Bore")
    bpy.data.objects.remove(bore, do_unlink=True)

    # 45-degree Aerodynamic Circumferential Chamfer Bevels (top and bottom rims)
    for cz in [pz + 0.6, pz - 0.6]:
        bpy.ops.mesh.primitive_cylinder_add(radius=47.4, depth=0.25, vertices=64, location=(0.0, 18.0, cz))
        chamf = bpy.context.active_object
        set_mat(chamf, mat_aniso_platter)
        join_into(disc, [chamf], mat_aniso_platter)

    set_mat(disc, mat_aniso_platter)
    explode_z = 42.0 - (i * 10.0)
    tag_extras(disc, [0.0, explode_z, 0.0], "platters", f"Magnetic Recording Disk #{i+1}", "Magnetic Media")

# Precision Platter Clamp Ring (Dia 36mm) with 6 Countersunk Fasteners
bpy.ops.mesh.primitive_cylinder_add(radius=18.0, depth=1.6, vertices=32, location=(0.0, 18.0, 5.8))
clamp = bpy.context.active_object
clamp.name = "Platter_Clamp"
set_mat(clamp, mat_machined_al)

clamp_subparts = []
# 6 Countersunk Fasteners arranged in a 60-degree circle
for i in range(6):
    ang = (i / 6.0) * math.pi * 2.0
    cx = 0.0 + 14.5 * math.cos(ang)
    cy = 18.0 + 14.5 * math.sin(ang)
    bpy.ops.mesh.primitive_cylinder_add(radius=1.3, depth=0.8, vertices=16, location=(cx, cy, 6.4))
    cscrew = bpy.context.active_object
    set_mat(cscrew, mat_chrome_screw)
    clamp_subparts.append(cscrew)

# Turned Aluminum Spacer Rings between platters
for sz in [2.35, -1.35]:
    bpy.ops.mesh.primitive_cylinder_add(radius=16.0, depth=2.4, vertices=32, location=(0.0, 18.0, sz))
    spacer = bpy.context.active_object
    set_mat(spacer, mat_machined_al)
    clamp_subparts.append(spacer)

join_into(clamp, clamp_subparts, mat_machined_al)
tag_extras(clamp, [0.0, 52.0, 0.0], "platters", "Spindle Platter Clamp & Spacer Rings", "Magnetic Media")

print("[HDD-CAD] Step 3: Actuator Arm, Pivot Bearing Housing, Suspensions & Sliders...")

# ===========================================================================
# 04. ACTUATOR E-BLOCK ARM & PIVOT HOUSING (Pivot centered at X=-22, Y=-22)
# ===========================================================================
# Kinematic Angle: 35 degrees positions the arm gracefully across the active data band
ARM_DEG = 35.0
ARM_RAD = math.radians(ARM_DEG)
COS_A = math.cos(ARM_RAD)
SIN_A = math.sin(ARM_RAD)

# Rear VCA Angle: 180 degrees opposite the arm
REAR_RAD = ARM_RAD + math.pi
COS_R = math.cos(REAR_RAD)
SIN_R = math.sin(REAR_RAD)

PIVOT_X = -22.0
PIVOT_Y = -22.0

bpy.ops.mesh.primitive_cylinder_add(radius=6.0, depth=14.0, vertices=32, location=(PIVOT_X, PIVOT_Y, 0.5))
actuator_hub = bpy.context.active_object
actuator_hub.name = "Actuator_Arm"
set_mat(actuator_hub, mat_machined_al)

arm_subparts = []

# 4 Precision Magnesium Comb Blades:
arm_blade_z = [5.6, 2.35, -1.35, -4.6]

# Blade extends from r=5.0mm (inside hub) to r=27.0mm (blade tip)
blade_r_mid = 16.0
blade_len = 22.0
blade_cx = PIVOT_X + blade_r_mid * COS_A
blade_cy = PIVOT_Y + blade_r_mid * SIN_A

for az in arm_blade_z:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(blade_cx, blade_cy, az))
    blade = bpy.context.active_object
    blade.scale = (blade_len, 4.0, 0.95)
    blade.rotation_euler = (0, 0, ARM_RAD)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    set_mat(blade, mat_machined_al)

    # Weight-Reduction Truss Window cutout
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(blade_cx, blade_cy, az))
    truss = bpy.context.active_object
    truss.scale = (12.0, 2.0, 1.5)
    truss.rotation_euler = (0, 0, ARM_RAD)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

    mod_t = blade.modifiers.new(name="TrussCut", type='BOOLEAN')
    mod_t.object = truss
    mod_t.operation = 'DIFFERENCE'
    bpy.context.view_layer.objects.active = blade
    bpy.ops.object.modifier_apply(modifier="TrussCut")
    bpy.data.objects.remove(truss, do_unlink=True)

    set_mat(blade, mat_machined_al)
    arm_subparts.append(blade)

# Rear Voice Coil Cradle Fork extending towards the rear VCM sector (contained within cavity)
cradle_r_mid = 9.5
cradle_cx = PIVOT_X + cradle_r_mid * COS_R
cradle_cy = PIVOT_Y + cradle_r_mid * SIN_R

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cradle_cx, cradle_cy, 0.5))
coil_cradle = bpy.context.active_object
coil_cradle.scale = (11.0, 10.0, 2.2)
coil_cradle.rotation_euler = (0, 0, ARM_RAD)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
set_mat(coil_cradle, mat_machined_al)
arm_subparts.append(coil_cradle)

# Calibrated Brass Counterweight Balance Slug at rear
cweight_r = 13.0
cweight_cx = PIVOT_X + cweight_r * COS_R
cweight_cy = PIVOT_Y + cweight_r * SIN_R

bpy.ops.mesh.primitive_cylinder_add(radius=2.2, depth=3.0, vertices=16, location=(cweight_cx, cweight_cy, 0.5))
cweight = bpy.context.active_object
set_mat(cweight, mat_brass)
arm_subparts.append(cweight)

join_into(actuator_hub, arm_subparts, mat_machined_al)

# Set pivot origin to exact pivot axis
bpy.context.scene.cursor.location = (PIVOT_X, PIVOT_Y, 0.5)
bpy.ops.object.origin_set(type='ORIGIN_CURSOR')

tag_extras(actuator_hub, [-22.0, 16.0, 8.0], "actuator_arm", "Actuator E-Block Arm", "Electromechanical Actuation")

# ===========================================================================
# 05. READ/WRITE HEAD STACK (Suspension Beams, Swage Mounts, PZT, Femto Sliders)
# ===========================================================================
head_susp_z = [5.4, 2.9, 1.8, -0.7, -1.9, -4.3]
head_slider_z = [5.0, 3.4, 1.3, -0.3, -2.4, -4.0]

beam_r_mid = 38.5
beam_len = 27.0
beam_cx = PIVOT_X + beam_r_mid * COS_A
beam_cy = PIVOT_Y + beam_r_mid * SIN_A

swage_r = 25.5
swage_cx = PIVOT_X + swage_r * COS_A
swage_cy = PIVOT_Y + swage_r * SIN_A

pzt_r = 36.5
pzt_cx = PIVOT_X + pzt_r * COS_A
pzt_cy = PIVOT_Y + pzt_r * SIN_A

slider_r = 50.5
slider_cx = PIVOT_X + slider_r * COS_A
slider_cy = PIVOT_Y + slider_r * SIN_A

wire_r_mid = 38.0
wire_cx = PIVOT_X + wire_r_mid * COS_A
wire_cy = PIVOT_Y + wire_r_mid * SIN_A

lifttab_r = 53.5
lifttab_cx = PIVOT_X + lifttab_r * COS_A
lifttab_cy = PIVOT_Y + lifttab_r * SIN_A

# Root object for Head_Stack: Top stainless suspension load beam
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(beam_cx, beam_cy, head_susp_z[0]))
heads_root = bpy.context.active_object
heads_root.name = "Head_Stack"
heads_root.scale = (beam_len, 2.2, 0.22)
heads_root.rotation_euler = (0, 0, ARM_RAD)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
set_mat(heads_root, mat_stainless)

head_subparts = []

for idx, (sz, hlz) in enumerate(zip(head_susp_z, head_slider_z)):
    if idx > 0:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(beam_cx, beam_cy, sz))
        beam = bpy.context.active_object
        beam.scale = (beam_len, 2.2, 0.22)
        beam.rotation_euler = (0, 0, ARM_RAD)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        set_mat(beam, mat_stainless)
        head_subparts.append(beam)

    bpy.ops.mesh.primitive_cylinder_add(radius=1.8, depth=0.4, vertices=16, location=(swage_cx, swage_cy, sz))
    swage = bpy.context.active_object
    set_mat(swage, mat_stainless)
    head_subparts.append(swage)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(pzt_cx, pzt_cy, sz))
    pzt = bpy.context.active_object
    pzt.scale = (2.2, 1.2, 0.35)
    pzt.rotation_euler = (0, 0, ARM_RAD)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    set_mat(pzt, mat_silicon_chip)
    head_subparts.append(pzt)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(slider_cx, slider_cy, hlz))
    slider = bpy.context.active_object
    slider.scale = (1.1, 0.75, 0.25)
    slider.rotation_euler = (0, 0, ARM_RAD)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    set_mat(slider, mat_dark_polymer)
    head_subparts.append(slider)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(wire_cx, wire_cy, sz + 0.12))
    wire = bpy.context.active_object
    wire.scale = (22.0, 0.3, 0.12)
    wire.rotation_euler = (0, 0, ARM_RAD)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    set_mat(wire, mat_gold_pin)
    head_subparts.append(wire)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(lifttab_cx, lifttab_cy, sz))
    ltab = bpy.context.active_object
    ltab.scale = (3.0, 0.6, 0.2)
    ltab.rotation_euler = (0, 0, ARM_RAD)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    set_mat(ltab, mat_stainless)
    head_subparts.append(ltab)

join_into(heads_root, head_subparts, fallback_mat=mat_stainless)

# Set pivot origin to match actuator pivot
bpy.context.scene.cursor.location = (PIVOT_X, PIVOT_Y, 0.5)
bpy.ops.object.origin_set(type='ORIGIN_CURSOR')

tag_extras(heads_root, [-26.0, 20.0, 10.0], "rw_heads", "Read/Write Slider Heads & Suspension", "Magnetic Media")

# ===========================================================================
# 06. PIVOT BEARING HOUSING & KAPTON FLEX CABLE (FPC)
# ===========================================================================
bpy.ops.mesh.primitive_cylinder_add(radius=4.4, depth=13.5, vertices=24, location=(-22.0, -22.0, 0.5))
pivot_bearing = bpy.context.active_object
pivot_bearing.name = "Pivot_Bearing"
set_mat(pivot_bearing, mat_stainless)

pivot_subparts = []

# Knurled Retention Cap Nut & Washer (Keep below Z=7.5 mm)
bpy.ops.mesh.primitive_cylinder_add(radius=3.0, depth=1.4, vertices=16, location=(-22.0, -22.0, 7.2))
pnut = bpy.context.active_object
set_mat(pnut, mat_chrome_screw)
pivot_subparts.append(pnut)

# Gold Grounding Contact Pin (Keep below Z=8.0 mm to clear top cover)
bpy.ops.mesh.primitive_cylinder_add(radius=0.9, depth=0.8, vertices=12, location=(-22.0, -22.0, 7.8))
gpin = bpy.context.active_object
set_mat(gpin, mat_gold_pin)
pivot_subparts.append(gpin)

# Polyimide (Kapton) Flexible Printed Circuit (FPC) S-Curve Ribbon
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-30.0, -16.0, 0.5))
fpc_ribbon = bpy.context.active_object
fpc_ribbon.scale = (7.0, 18.0, 0.3)
fpc_ribbon.rotation_euler = (0, 0, math.radians(22.0))
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
set_mat(fpc_ribbon, mat_kapton_fpc)
pivot_subparts.append(fpc_ribbon)

# Copper Trace Bands along Ribbon
for tr_x in [-32.0, -30.0, -28.0]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(tr_x, -16.0, 0.65))
    trace = bpy.context.active_object
    trace.scale = (0.45, 16.0, 0.1)
    trace.rotation_euler = (0, 0, math.radians(22.0))
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    set_mat(trace, mat_copper_coil)
    pivot_subparts.append(trace)

# On-Flex Silicon Preamplifier IC
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-31.0, -14.0, 0.8))
preamp = bpy.context.active_object
preamp.scale = (3.5, 5.0, 0.7)
preamp.rotation_euler = (0, 0, math.radians(22.0))
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
set_mat(preamp, mat_silicon_chip)
pivot_subparts.append(preamp)

# Solder Bumps on Preamp Terminals
for spz in [-1.6, 0.0, 1.6]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.35, depth=0.35, vertices=8, location=(-33.0, -14.0 + spz, 0.7))
    ball = bpy.context.active_object
    set_mat(ball, mat_stainless)
    pivot_subparts.append(ball)

# Internal Connector Header Terminal Block
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-37.0, -7.0, 0.5))
fpc_header = bpy.context.active_object
fpc_header.scale = (5.5, 7.5, 3.8)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
set_mat(fpc_header, mat_dark_polymer)
pivot_subparts.append(fpc_header)

join_into(pivot_bearing, pivot_subparts)
tag_extras(pivot_bearing, [-16.0, 24.0, 5.0], "pivot_bearing", "Pivot Bearing & Flex Cable", "Electromechanical Actuation")

print("[HDD-CAD] Step 4: Voice Coil Actuator (VCA) & Parking Ramp...")

# ===========================================================================
# 07. VOICE COIL ACTUATOR (VCA) & MAGNET PLATES (Stay within Cavity Bounds: X > -46)
# ===========================================================================
# Flat Enameled Copper Voice Coil aligned with rear arm vector (REAR_RAD)
vcm_r_mid = 13.5
vcm_cx = PIVOT_X + vcm_r_mid * COS_R
vcm_cy = PIVOT_Y + vcm_r_mid * SIN_R

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(vcm_cx, vcm_cy, 0.5))
vcm_coil = bpy.context.active_object
vcm_coil.name = "VCM_Coil"
vcm_coil.scale = (9.5, 13.5, 2.0)
vcm_coil.rotation_euler = (0, 0, ARM_RAD)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
set_mat(vcm_coil, mat_copper_coil)

# Coil Aperture cutout
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(vcm_cx, vcm_cy, 0.5))
aperture = bpy.context.active_object
aperture.scale = (4.8, 7.5, 2.8)
aperture.rotation_euler = (0, 0, ARM_RAD)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

mod_ap = vcm_coil.modifiers.new(name="ApertureCut", type='BOOLEAN')
mod_ap.object = aperture
mod_ap.operation = 'DIFFERENCE'
bpy.context.view_layer.objects.active = vcm_coil
bpy.ops.object.modifier_apply(modifier="ApertureCut")
bpy.data.objects.remove(aperture, do_unlink=True)
set_mat(vcm_coil, mat_copper_coil)

# Set origin to pivot axis to rotate with arm
bpy.context.scene.cursor.location = (PIVOT_X, PIVOT_Y, 0.5)
bpy.ops.object.origin_set(type='ORIGIN_CURSOR')

tag_extras(vcm_coil, [-24.0, 16.0, 8.0], "voice_coil_motor", "VCM Copper Voice Coil", "Electromechanical Actuation")

# Upper Sintered NdFeB Magnet & Brushed Steel Top Flux Yoke
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(vcm_cx, vcm_cy, 3.6))
vcm_mag_upper = bpy.context.active_object
vcm_mag_upper.name = "VCM_Magnet_Upper"
vcm_mag_upper.scale = (12.0, 16.0, 2.2)
vcm_mag_upper.rotation_euler = (0, 0, ARM_RAD)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
set_mat(vcm_mag_upper, mat_magnet_yoke)

# Steel Top Yoke Backing Plate
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(vcm_cx, vcm_cy, 4.9))
top_yoke = bpy.context.active_object
top_yoke.scale = (13.5, 17.5, 1.1)
top_yoke.rotation_euler = (0, 0, ARM_RAD)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
set_mat(top_yoke, mat_stainless)

# Mechanical Crash Stop Pin with Rubber Damper
bpy.ops.mesh.primitive_cylinder_add(radius=1.5, depth=7.0, vertices=16, location=(-27.0, -31.0, 1.5))
crash_pin = bpy.context.active_object
set_mat(crash_pin, mat_rubber_damper)

join_into(vcm_mag_upper, [top_yoke, crash_pin], mat_magnet_yoke)
tag_extras(vcm_mag_upper, [0.0, 60.0, 0.0], "voice_coil_motor", "Upper VCM Neodymium Magnet & Yoke", "Electromechanical Actuation")

# Lower Sintered NdFeB Magnet & Bottom Steel Flux Yoke
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(vcm_cx, vcm_cy, -2.6))
vcm_mag_lower = bpy.context.active_object
vcm_mag_lower.name = "VCM_Magnet_Lower"
vcm_mag_lower.scale = (12.0, 16.0, 2.2)
vcm_mag_lower.rotation_euler = (0, 0, ARM_RAD)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
set_mat(vcm_mag_lower, mat_magnet_yoke)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(vcm_cx, vcm_cy, -3.9))
bot_yoke = bpy.context.active_object
bot_yoke.scale = (13.5, 17.5, 1.1)
bot_yoke.rotation_euler = (0, 0, ARM_RAD)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
set_mat(bot_yoke, mat_stainless)

join_into(vcm_mag_lower, [bot_yoke], mat_magnet_yoke)
tag_extras(vcm_mag_lower, [-14.0, 4.0, 6.0], "voice_coil_motor", "Lower VCM Neodymium Magnet", "Electromechanical Actuation")

# ===========================================================================
# 08. HEAD PARKING RAMP & INERTIAL SHOCK LATCH (Delrin / POM)
# ===========================================================================
# Positioned at X=38.0, Y=-12.0, outside the R=47.5mm platter perimeter (R_spindle = 48.4mm)
RAMP_X = 38.0
RAMP_Y = -12.0

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(RAMP_X, RAMP_Y, 0.5))
ramp = bpy.context.active_object
ramp.name = "Ramp"
ramp.scale = (8.5, 12.0, 11.0)
ramp.rotation_euler = (0, 0, math.radians(26.0))
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
set_mat(ramp, mat_dark_polymer)

ramp_subparts = []
# 6 Individual Guide Ramp Fingers extending towards the platter edge
for idx, rz in enumerate(head_susp_z):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(RAMP_X - 3.8, RAMP_Y + 1.8, rz))
    finger = bpy.context.active_object
    finger.scale = (6.0, 1.6, 0.5)
    finger.rotation_euler = (0, 0, math.radians(26.0))
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    set_mat(finger, mat_dark_polymer)
    ramp_subparts.append(finger)

# Inertial Shock Latch Counterweight Hook
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(RAMP_X + 2.5, RAMP_Y - 4.5, -2.0))
latch = bpy.context.active_object
latch.scale = (3.5, 7.0, 5.0)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
set_mat(latch, mat_dark_polymer)
ramp_subparts.append(latch)

join_into(ramp, ramp_subparts, mat_dark_polymer)
tag_extras(ramp, [16.0, 14.0, -12.0], "actuator_arm", "Head Parking Ramp & Latch", "Electromechanical Actuation")

# ===========================================================================
# 09. PCB CONTROLLER BOARD & SOLID-STATE SILICON (Underside: Z = -11.5 mm)
# ===========================================================================
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -25.0, -11.5))
pcb = bpy.context.active_object
pcb.name = "PCB"
pcb.scale = (96.0, 86.0, 1.6)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
set_mat(pcb, mat_dark_pcb)

pcb_subparts = []

# Storage Controller SoC (Dual ARM Cortex-R4 + ECC LDPC)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-10.0, -28.0, -12.6))
soc = bpy.context.active_object
soc.scale = (16.0, 16.0, 1.4)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
set_mat(soc, mat_silicon_chip)
pcb_subparts.append(soc)

# Aluminum Heatspreader Cap on SoC
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-10.0, -28.0, -13.4))
hspread = bpy.context.active_object
hspread.scale = (14.0, 14.0, 0.4)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
set_mat(hspread, mat_machined_al)
pcb_subparts.append(hspread)

# DDR3 DRAM Buffer FBGA Chip (512MB)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(14.0, -22.0, -12.6))
dram = bpy.context.active_object
dram.scale = (9.0, 13.0, 1.2)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
set_mat(dram, mat_silicon_chip)
pcb_subparts.append(dram)

# Motor & VCM Power Driver IC
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-22.0, -12.0, -12.5))
driver = bpy.context.active_object
driver.scale = (11.0, 11.0, 1.2)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
set_mat(driver, mat_silicon_chip)
pcb_subparts.append(driver)

# SOIC-8 Serial SPI Flash ROM
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(22.0, -36.0, -12.4))
spi_rom = bpy.context.active_object
spi_rom.scale = (5.0, 6.0, 1.1)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
set_mat(spi_rom, mat_silicon_chip)
pcb_subparts.append(spi_rom)

# 25.000 MHz Quartz Crystal Oscillator
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(4.0, -42.0, -12.5))
crystal = bpy.context.active_object
crystal.scale = (5.0, 3.2, 1.2)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
set_mat(crystal, mat_stainless)
pcb_subparts.append(crystal)

# Ferrite Power Choke Inductors
for idx, ix in enumerate([-30.0, -38.0]):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(ix, -25.0, -12.7))
    choke = bpy.context.active_object
    choke.scale = (6.0, 6.0, 1.8)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    set_mat(choke, mat_dark_polymer)
    pcb_subparts.append(choke)

# 0402 Surface-Mount Passives Array
for px_val in [-18, -14, -6, 2, 8, 16, 26, 32]:
    for py_val in [-46, -34, -14]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px_val, py_val, -12.4))
        passive = bpy.context.active_object
        passive.scale = (1.2, 0.8, 0.6)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        set_mat(passive, mat_stainless)
        pcb_subparts.append(passive)

# 4 Corner PCB Mounting Torx Screws
for mx, my in [(-42.0, -62.0), (42.0, -62.0), (-42.0, 12.0), (42.0, 12.0)]:
    bpy.ops.mesh.primitive_cylinder_add(radius=1.8, depth=1.6, vertices=12, location=(mx, my, -12.3))
    pscrew = bpy.context.active_object
    set_mat(pscrew, mat_chrome_screw)
    pcb_subparts.append(pscrew)

join_into(pcb, pcb_subparts)
tag_extras(pcb, [0.0, -42.0, 0.0], "pcb_board", "PCB Controller Board", "Control Electronics")

# ===========================================================================
# 10. 22-PIN UNIFIED SATA 3.0 DATA & POWER CONNECTOR
# ===========================================================================
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(22.0, -71.5, -8.5))
sata_body = bpy.context.active_object
sata_body.name = "SATA_Connector"
sata_body.scale = (38.0, 6.0, 6.5)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
set_mat(sata_body, mat_dark_polymer)

sata_subparts = []

# Keyed "L" Divider Wall
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(14.0, -73.5, -8.5))
key_wall = bpy.context.active_object
key_wall.scale = (2.2, 4.0, 5.0)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
set_mat(key_wall, mat_dark_polymer)
sata_subparts.append(key_wall)

# 7 Gold Differential Data Pins
for p in range(7):
    pin_x = 5.0 + (p * 1.25)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(pin_x, -73.5, -8.5))
    dpin = bpy.context.active_object
    dpin.scale = (0.6, 3.8, 0.4)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    set_mat(dpin, mat_gold_pin)
    sata_subparts.append(dpin)

# 15 Gold Power Pins with Staggered Pre-Charge Ground Lengths
for p in range(15):
    pin_x = 17.5 + (p * 1.25)
    pin_len = 4.2 if p in [3, 7, 12] else 3.6
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(pin_x, -73.5, -8.5))
    ppin = bpy.context.active_object
    ppin.scale = (0.6, pin_len, 0.4)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    set_mat(ppin, mat_gold_pin)
    sata_subparts.append(ppin)

# Metal Shield Retention Bracket
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(22.0, -68.8, -8.5))
shield = bpy.context.active_object
shield.scale = (40.0, 1.2, 7.0)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
set_mat(shield, mat_stainless)
sata_subparts.append(shield)

join_into(sata_body, sata_subparts)
tag_extras(sata_body, [0.0, -48.0, 42.0], "sata_connector", "SATA 3.0 Data & Power Interface", "Control Electronics")

print("[HDD-CAD] Step 5: Open/Transparent Top Casing, Screws & Studio Rig...")

# ===========================================================================
# 11. OPEN / TRANSPARENT OPTICAL CASING (Clear Acrylic / Polycarbonate Cover)
# ===========================================================================
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 9.6))
top_cover = bpy.context.active_object
top_cover.name = "Top_Cover"
top_cover.scale = (101.6, 147.0, 1.4)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
set_mat(top_cover, mat_trans_casing)

cover_subparts = []

# Stamped Center Depression Frame
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 6.0, 10.0))
label_frame = bpy.context.active_object
label_frame.scale = (88.0, 120.0, 0.7)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
set_mat(label_frame, mat_trans_casing)
cover_subparts.append(label_frame)

# Breather Port Stamped Outer Rim
bpy.ops.mesh.primitive_cylinder_add(radius=6.0, depth=0.8, vertices=24, location=(30.0, 48.0, 10.3))
breather_rim = bpy.context.active_object
set_mat(breather_rim, mat_machined_al)
cover_subparts.append(breather_rim)

# 6 Countersunk Screw Recesses
perimeter_screw_coords = [
    (-46.0, -68.0), (46.0, -68.0),
    (-46.0, 68.0), (46.0, 68.0),
    (-46.0, 0.0), (46.0, 0.0),
]
for sx, sy in perimeter_screw_coords:
    bpy.ops.mesh.primitive_cylinder_add(radius=3.2, depth=0.6, vertices=16, location=(sx, sy, 10.1))
    srecess = bpy.context.active_object
    set_mat(srecess, mat_machined_al)
    cover_subparts.append(srecess)

join_into(top_cover, cover_subparts, mat_trans_casing)
tag_extras(top_cover, [0.0, 94.0, 0.0], "top_cover", "Top Cover & Breather Filter", "Mechanical Enclosure")

# Breather Membrane Filter Disc
bpy.ops.mesh.primitive_cylinder_add(radius=5.2, depth=0.4, vertices=24, location=(30.0, 48.0, 10.6))
breather_disc = bpy.context.active_object
breather_disc.name = "Breather_Filter"
set_mat(breather_disc, mat_filter_media)
tag_extras(breather_disc, [0.0, 96.0, 0.0], "top_cover", "ePTFE Breather Membrane", "Mechanical Enclosure")

# 12. CHROME PERIMETER TORX SCREWS
screws_list = []
for idx, (sx, sy) in enumerate(perimeter_screw_coords):
    bpy.ops.mesh.primitive_cylinder_add(radius=2.6, depth=1.8, vertices=16, location=(sx, sy, 10.6))
    sc = bpy.context.active_object
    set_mat(sc, mat_chrome_screw)

    bpy.ops.mesh.primitive_cylinder_add(radius=1.1, depth=0.5, vertices=6, location=(sx, sy, 11.4))
    star = bpy.context.active_object
    set_mat(star, mat_dark_polymer)
    join_into(sc, [star], mat_chrome_screw)
    screws_list.append(sc)

screws_root = screws_list[0]
screws_root.name = "Torx_Screws"
join_into(screws_root, screws_list[1:], mat_chrome_screw)
tag_extras(screws_root, [0.0, 115.0, 0.0], "mounting_screws", "Torx Fastening Screws", "Mechanical Enclosure")

# ===========================================================================
# 13. STUDIO LIGHTING & CAMERA SETUP
# ===========================================================================
# Configure Cycles for realistic raytraced studio rendering
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 32
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080

# Professional Color Management: AgX with high contrast and calibrated exposure
scene.view_settings.view_transform = 'AgX'
scene.view_settings.exposure = 1.2
scene.view_settings.look = 'AgX - High Contrast'

# Environment Light in World
world = bpy.data.worlds.get('World')
if not world:
    world = bpy.data.worlds.new('World')
    scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
if bg:
    bg.inputs['Color'].default_value = (0.05, 0.07, 0.10, 1.0)
    bg.inputs['Strength'].default_value = 1.0

# Camera Setup: 3/4 Elevated Beauty Angle directly viewing Arm, VCA & Platters
bpy.ops.object.camera_add(location=(-62.0, -112.0, 88.0), rotation=(math.radians(54.0), 0.0, math.radians(-30.0)))
cam = bpy.context.active_object
cam.name = "Studio_Camera"
cam.data.lens = 58.0
scene.camera = cam

# Overhead Softbox (Large diffuse light directly above drive creating smooth reflections)
bpy.ops.object.light_add(type='AREA', location=(0.0, 10.0, 170.0))
top_softbox = bpy.context.active_object
top_softbox.name = "Top_Softbox"
top_softbox.data.energy = 3800.0
top_softbox.data.size = 220.0
top_softbox.data.color = (0.98, 0.99, 1.0)

# Key Light (Warm directional studio light catching arm comb, voice coil & clamp)
bpy.ops.object.light_add(type='AREA', location=(55.0, -45.0, 130.0))
key_light = bpy.context.active_object
key_light.name = "Key_Light"
key_light.data.energy = 3200.0
key_light.data.size = 110.0
key_light.data.color = (1.0, 0.97, 0.94)

# Fill Light (Cool ambient soft light illuminating cavity interior, FPC & filter)
bpy.ops.object.light_add(type='AREA', location=(-85.0, 65.0, 110.0))
fill_light = bpy.context.active_object
fill_light.name = "Fill_Light"
fill_light.data.energy = 1800.0
fill_light.data.size = 140.0
fill_light.data.color = (0.86, 0.93, 1.0)

# Rim / Kicker Light (High-angle specular edge graze on coil, magnet yokes & chamfers)
bpy.ops.object.light_add(type='AREA', location=(-105.0, -70.0, 90.0))
rim_light = bpy.context.active_object
rim_light.name = "Rim_Light"
rim_light.data.energy = 2400.0
rim_light.data.size = 75.0
rim_light.data.color = (0.94, 0.97, 1.0)

# Studio Backdrop Floor Plane
bpy.ops.mesh.primitive_plane_add(size=600.0, location=(0.0, 0.0, -13.5))
floor = bpy.context.active_object
floor.name = "Studio_Floor"
mat_floor = make_pbr("Mat_StudioFloor", (0.02, 0.03, 0.04, 1.0), metallic=0.4, roughness=0.5)
set_mat(floor, mat_floor)

# Save native blend file
blend_path = os.path.abspath("tools/blender/hdd_internals.blend")
os.makedirs(os.path.dirname(blend_path), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"[HDD-CAD] Saved native Blender scene: {blend_path}")

# Render showcase shots only when explicitly requested via `-- --render`
if "--render" in sys.argv:
    render_dir = os.path.join(tempfile.gettempdir(), "hecks_hdd_renders")
    os.makedirs(render_dir, exist_ok=True)

    # 1. Render OPEN CASING (hide cover & screws to show raw internal mechanics)
    top_cover.hide_render = True
    screws_root.hide_render = True
    breather_disc.hide_render = True

    open_render_out = os.path.join(render_dir, "blender_open_casing_render.png")
    scene.render.filepath = open_render_out
    print(f"[HDD-CAD] Rendering open casing shot to {open_render_out}...")
    bpy.ops.render.render(write_still=True)
    print("[HDD-CAD] Open casing render complete!")

    # 2. Render TRANSPARENT CASING (show optical transparent polycarbonate cover)
    top_cover.hide_render = False
    screws_root.hide_render = False
    breather_disc.hide_render = False

    trans_render_out = os.path.join(render_dir, "blender_transparent_casing_render.png")
    scene.render.filepath = trans_render_out
    print(f"[HDD-CAD] Rendering transparent casing shot to {trans_render_out}...")
    bpy.ops.render.render(write_still=True)
    print("[HDD-CAD] Transparent casing render complete!")

# Remove floor, lights, camera before glTF export so only model meshes are in glTF
for obj_to_remove in [floor, top_softbox, key_light, fill_light, rim_light, cam]:
    if obj_to_remove and obj_to_remove.name in bpy.data.objects:
        bpy.data.objects.remove(obj_to_remove, do_unlink=True)

# Export Draco-compressed glTF
glb_path = os.path.abspath("public/models/hdd/hdd_internals.glb")
os.makedirs(os.path.dirname(glb_path), exist_ok=True)

bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format='GLB',
    use_selection=False,
    export_extras=True,
    export_yup=True,
    export_apply=False,
    export_materials='EXPORT',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=7,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12,
    export_draco_generic_quantization=12
)

glb_size = os.path.getsize(glb_path) / 1024
print(f"[HDD-CAD] Exported glTF: {glb_path} ({glb_size:.1f} KB)")

# Synchronize across all project asset locations
sync_paths = [
    os.path.abspath("public/models/hdd.glb"),
    os.path.abspath("dist/models/hdd/hdd_internals.glb"),
    os.path.abspath("dist/models/hdd.glb")
]
for p in sync_paths:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    shutil.copyfile(glb_path, p)
    print(f"[HDD-CAD] Synchronized: {p}")

print("[HDD-CAD] Success! Refined 3.5\" HDD with transparent casing generated and baked.")

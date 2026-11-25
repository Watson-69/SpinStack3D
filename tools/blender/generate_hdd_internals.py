"""
High-Fidelity 3.5-inch Enterprise Hard Disk Drive (HDD) Generator
Script for Blender 5.3+ (bpy)

Models physically plausible, detailed 3.5" enterprise HDD components to real-world
dimensions (1 unit = 1 mm), adds rich internal mechanics (spindle clamp screws,
truss-cutout actuator arm, Kapton FPC ribbon with onboard preamplifier IC, dual-stage
suspensions, FDB cap, VCM crash stop, multi-tier ramp, PCB passives, SATA pins),
assigns calibrated PBR Principled BSDF materials, embeds glTF extras metadata,
saves the .blend source, and exports Draco-compressed .glb models.
"""

import bpy
import math
import os
import shutil

# 1. Reset scene to empty factory state
bpy.ops.wm.read_factory_settings(use_empty=True)

# Helper for assigning material cleanly to slot 0 and all polygons
def assign_mat(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    if hasattr(obj.data, "polygons"):
        for p in obj.data.polygons:
            p.material_index = 0

# Helper for joining child parts into a parent mesh cleanly
def join_into(parent, children, final_mat=None):
    bpy.ops.object.select_all(action='DESELECT')
    for c in children:
        c.select_set(True)
    parent.select_set(True)
    bpy.context.view_layer.objects.active = parent
    bpy.ops.object.join()
    if final_mat:
        assign_mat(parent, final_mat)
    return parent

# 2. Material Creation Helper with Blender 5.x Principled BSDF compatibility
def make_pbr_material(name, color, metallic=0.0, roughness=0.5, clearcoat=0.0, specular=0.5):
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
        if "Specular IOR Level" in bsdf.inputs:
            bsdf.inputs["Specular IOR Level"].default_value = specular
        elif "Specular" in bsdf.inputs:
            bsdf.inputs["Specular"].default_value = specular
    return mat

# Calibrated Materials
mat_cast_al = make_pbr_material("Mat_CastAluminium", (0.58, 0.61, 0.65, 1.0), metallic=0.88, roughness=0.38)
mat_machined_al = make_pbr_material("Mat_MachinedAluminium", (0.84, 0.86, 0.89, 1.0), metallic=0.95, roughness=0.20, clearcoat=0.25)
mat_mirror_platter = make_pbr_material("Mat_MirrorPlatter", (0.95, 0.96, 0.98, 1.0), metallic=0.99, roughness=0.03, clearcoat=0.90)
mat_stainless = make_pbr_material("Mat_StainlessSteel", (0.85, 0.87, 0.90, 1.0), metallic=0.96, roughness=0.18)
mat_brass = make_pbr_material("Mat_BrassBush", (0.88, 0.72, 0.28, 1.0), metallic=0.92, roughness=0.24)
mat_magnet = make_pbr_material("Mat_NeodymiumMagnet", (0.28, 0.32, 0.36, 1.0), metallic=0.94, roughness=0.22)
mat_copper = make_pbr_material("Mat_CopperCoil", (0.88, 0.48, 0.12, 1.0), metallic=0.92, roughness=0.26)
mat_kapton = make_pbr_material("Mat_KaptonFPC", (0.78, 0.42, 0.08, 1.0), metallic=0.20, roughness=0.30)
mat_pcb_green = make_pbr_material("Mat_PCBGreen", (0.04, 0.22, 0.16, 1.0), metallic=0.08, roughness=0.55)
mat_chip = make_pbr_material("Mat_SiliconChip", (0.08, 0.10, 0.12, 1.0), metallic=0.50, roughness=0.32)
mat_gold = make_pbr_material("Mat_GoldContacts", (0.98, 0.78, 0.16, 1.0), metallic=0.96, roughness=0.14)
mat_plastic = make_pbr_material("Mat_DelrinPOM", (0.06, 0.07, 0.08, 1.0), metallic=0.04, roughness=0.65)
mat_filter = make_pbr_material("Mat_ePTFEFilter", (0.88, 0.88, 0.88, 1.0), metallic=0.05, roughness=0.80)
mat_rubber = make_pbr_material("Mat_RubberDamper", (0.12, 0.13, 0.14, 1.0), metallic=0.02, roughness=0.85)

# Helper to tag objects with glTF extras metadata
def tag_extras(obj, explode_offset, part_id, label, subsystem):
    data_dict = {
        "explodeOffset": list(explode_offset),
        "partId": str(part_id),
        "label": str(label),
        "subsystem": str(subsystem)
    }
    for k, v in data_dict.items():
        obj[k] = v
        if obj.data:
            obj.data[k] = v

# Reference Centers & Key Dimensions (Real 3.5" SFF-8301 standard):
# Drive envelope: Width (X) = 101.6 mm, Length (Y) = 147.0 mm, Height (Z) = 25.4 mm
# Spindle Motor & Platters Center: X = 0.0 mm, Y = 20.0 mm
# Actuator Pivot Center: X = -26.0 mm, Y = -24.0 mm
# VCM Magnets Center: X = -32.0 mm, Y = -44.0 mm

# -------------------------------------------------------------------------
# 01. BASE CASTING (Die-Cast A380 Aluminium Frame with CNC details)
# -------------------------------------------------------------------------
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, -2.0))
base_tub = bpy.context.active_object
base_tub.name = "Base_Casting"
base_tub.scale = (101.6, 147.0, 21.0)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# Hollow internal cavity (96.4mm wide x 140.0mm long x 18.0mm deep)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 1.0, 1.5))
cavity = bpy.context.active_object
cavity.scale = (96.4, 140.0, 18.0)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

mod_bool = base_tub.modifiers.new(name="CavityCut", type='BOOLEAN')
mod_bool.object = cavity
mod_bool.operation = 'DIFFERENCE'
bpy.context.view_layer.objects.active = base_tub
bpy.ops.object.modifier_apply(modifier="CavityCut")
bpy.data.objects.remove(cavity, do_unlink=True)

base_children = []

# Spindle motor well recess in floor (centered at X=0, Y=20)
bpy.ops.mesh.primitive_cylinder_add(radius=18.5, depth=4.2, vertices=32, location=(0.0, 20.0, -7.4))
spindle_well = bpy.context.active_object
assign_mat(spindle_well, mat_cast_al)
base_children.append(spindle_well)

# 3 Radial motor stator mounting screw bosses in floor
for ang in [30, 150, 270]:
    rad = math.radians(ang)
    sx = 0.0 + 15.0 * math.cos(rad)
    sy = 20.0 + 15.0 * math.sin(rad)
    bpy.ops.mesh.primitive_cylinder_add(radius=2.0, depth=2.4, vertices=16, location=(sx, sy, -5.5))
    boss = bpy.context.active_object
    assign_mat(boss, mat_stainless)
    base_children.append(boss)

# Actuator pivot mounting boss (at X=-26, Y=-24)
bpy.ops.mesh.primitive_cylinder_add(radius=7.5, depth=10.0, vertices=24, location=(-26.0, -24.0, -4.5))
pivot_boss = bpy.context.active_object
assign_mat(pivot_boss, mat_cast_al)
base_children.append(pivot_boss)

# Internal stiffening rib features (well within the 96mm cavity)
rib_coords = [
    (36.0, -35.0, -5.0, 4.0, 42.0, 6.0),
    (-36.0, 32.0, -5.0, 4.0, 36.0, 6.0),
    (0.0, -52.0, -6.5, 54.0, 4.0, 4.0),
]
for rx, ry, rz, sx, sy, sz in rib_coords:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(rx, ry, rz))
    rib = bpy.context.active_object
    rib.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign_mat(rib, mat_cast_al)
    base_children.append(rib)

# Air Recirculation Filter Pocket & Filter Media in front corner (X=36, Y=56)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(38.0, 56.0, 0.5))
filter_box = bpy.context.active_object
filter_box.scale = (8.0, 16.0, 10.0)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
assign_mat(filter_box, mat_filter)
base_children.append(filter_box)

# Corner Desiccant Pack Clip in rear corner (X=38, Y=-15)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(40.0, -15.0, -4.0))
desiccant = bpy.context.active_object
desiccant.scale = (6.0, 18.0, 4.0)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
assign_mat(desiccant, mat_stainless)
base_children.append(desiccant)

# Side 6-32 UNC mounting hole mockups (3 on each outer rail)
for x_side in [-50.4, 50.4]:
    for y_hole in [-50.0, 0.0, 50.0]:
        bpy.ops.mesh.primitive_cylinder_add(radius=1.8, depth=1.2, vertices=16, location=(x_side, y_hole, -4.0))
        hole = bpy.context.active_object
        hole.rotation_euler = (0, math.radians(90.0), 0)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        assign_mat(hole, mat_cast_al)
        base_children.append(hole)

join_into(base_tub, base_children, mat_cast_al)
tag_extras(base_tub, [0.0, 0.0, 0.0], "chassis", "Die-Cast Base Chassis", "Mechanical Enclosure")

# -------------------------------------------------------------------------
# 02. TOP COVER (Stamped 3003-H14 Aluminium Lid)
# -------------------------------------------------------------------------
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 9.2))
top_cover = bpy.context.active_object
top_cover.name = "Top_Cover"
top_cover.scale = (101.6, 147.0, 1.4)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

cover_children = []

# Stamped center depression (where the spec decal plate sits)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 6.0, 9.6))
lid_stamp = bpy.context.active_object
lid_stamp.scale = (88.0, 120.0, 0.6)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
assign_mat(lid_stamp, mat_machined_al)
cover_children.append(lid_stamp)

# Breather filter port rim
bpy.ops.mesh.primitive_cylinder_add(radius=6.0, depth=0.8, vertices=24, location=(30.0, 48.0, 10.0))
breather_boss = bpy.context.active_object
assign_mat(breather_boss, mat_machined_al)
cover_children.append(breather_boss)

# 6 Countersunk screw recesses in lid perimeter
screw_coords = [
    (-46.0, -68.0), (46.0, -68.0),
    (-46.0, 68.0), (46.0, 68.0),
    (-46.0, 0.0), (46.0, 0.0),
]
for sx, sy in screw_coords:
    bpy.ops.mesh.primitive_cylinder_add(radius=3.2, depth=0.6, vertices=16, location=(sx, sy, 9.7))
    recess = bpy.context.active_object
    assign_mat(recess, mat_machined_al)
    cover_children.append(recess)

join_into(top_cover, cover_children, mat_machined_al)
tag_extras(top_cover, [0.0, 92.0, 0.0], "top_cover", "Top Cover & Breather Filter", "Mechanical Enclosure")

# Breather Filter Membrane Disc
bpy.ops.mesh.primitive_cylinder_add(radius=5.2, depth=0.4, vertices=24, location=(30.0, 48.0, 10.2))
breather_disc = bpy.context.active_object
breather_disc.name = "Breather_Filter"
assign_mat(breather_disc, mat_filter)
tag_extras(breather_disc, [0.0, 94.0, 0.0], "top_cover", "ePTFE Breather Membrane", "Mechanical Enclosure")

# -------------------------------------------------------------------------
# 03. TORX PERIMETER FASTENING SCREWS (With detailed star drive heads)
# -------------------------------------------------------------------------
screws_list = []
for idx, (sx, sy) in enumerate(screw_coords):
    # Screw body
    bpy.ops.mesh.primitive_cylinder_add(radius=2.6, depth=1.8, vertices=16, location=(sx, sy, 10.2))
    sc = bpy.context.active_object
    assign_mat(sc, mat_stainless)
    
    # Torx star drive center indentation
    bpy.ops.mesh.primitive_cylinder_add(radius=1.1, depth=0.4, vertices=6, location=(sx, sy, 11.0))
    star = bpy.context.active_object
    assign_mat(star, mat_plastic)
    sc_part = join_into(sc, [star], mat_stainless)
    screws_list.append(sc_part)

screws_root = screws_list[0]
screws_root.name = "Torx_Screws"
join_into(screws_root, screws_list[1:], mat_stainless)
tag_extras(screws_root, [0.0, 110.0, 0.0], "mounting_screws", "Torx Fastening Screws", "Mechanical Enclosure")

# -------------------------------------------------------------------------
# 04. MAGNETIC PLATTERS & SPACER RINGS (3 Discs, 95mm OD, 25mm ID, 1.27mm thick)
# Centered at X = 0.0 mm, Y = 20.0 mm -> Completely inside 96.4mm cavity
# -------------------------------------------------------------------------
platter_names = ["Platter_01", "Platter_02", "Platter_03"]
platter_z_positions = [4.2, 0.5, -3.2]

for i, (p_name, pz) in enumerate(zip(platter_names, platter_z_positions)):
    bpy.ops.mesh.primitive_cylinder_add(radius=47.5, depth=1.27, vertices=64, location=(0.0, 20.0, pz))
    disc = bpy.context.active_object
    disc.name = p_name

    # 25mm center spindle bore cut
    bpy.ops.mesh.primitive_cylinder_add(radius=12.5, depth=2.0, vertices=32, location=(0.0, 20.0, pz))
    bore = bpy.context.active_object
    
    mod_sub = disc.modifiers.new(name="BoreCut", type='BOOLEAN')
    mod_sub.object = bore
    mod_sub.operation = 'DIFFERENCE'
    bpy.context.view_layer.objects.active = disc
    bpy.ops.object.modifier_apply(modifier="BoreCut")
    bpy.data.objects.remove(bore, do_unlink=True)
    
    # Outer 45-degree aerodynamic chamfer ring
    bpy.ops.mesh.primitive_cylinder_add(radius=47.4, depth=0.3, vertices=64, location=(0.0, 20.0, pz + 0.6))
    chamfer = bpy.context.active_object
    assign_mat(chamfer, mat_mirror_platter)
    join_into(disc, [chamfer], mat_mirror_platter)
    
    assign_mat(disc, mat_mirror_platter)
    explode_z = 40.0 - (i * 8.0)
    tag_extras(disc, [0.0, explode_z, 0.0], "platters", f"Magnetic Recording Disk #{i+1}", "Magnetic Media")

# Top Platter Clamping Ring with 6 Torx Clamp Screws and Turned Spacers
bpy.ops.mesh.primitive_cylinder_add(radius=18.0, depth=1.6, vertices=32, location=(0.0, 20.0, 5.8))
clamp = bpy.context.active_object
clamp.name = "Platter_Clamp"
assign_mat(clamp, mat_machined_al)

clamp_parts = []
# 6 Countersunk Torx screws arranged in a circle on clamp face
for i in range(6):
    ang = (i / 6.0) * math.pi * 2.0
    cx = 0.0 + 14.5 * math.cos(ang)
    cy = 20.0 + 14.5 * math.sin(ang)
    bpy.ops.mesh.primitive_cylinder_add(radius=1.3, depth=0.8, vertices=16, location=(cx, cy, 6.4))
    cscrew = bpy.context.active_object
    assign_mat(cscrew, mat_stainless)
    clamp_parts.append(cscrew)

# Turned aluminum precision spacer rings between platters
for sz in [2.35, -1.35]:
    bpy.ops.mesh.primitive_cylinder_add(radius=16.0, depth=2.4, vertices=32, location=(0.0, 20.0, sz))
    spacer = bpy.context.active_object
    assign_mat(spacer, mat_machined_al)
    clamp_parts.append(spacer)

join_into(clamp, clamp_parts, mat_machined_al)
tag_extras(clamp, [0.0, 50.0, 0.0], "platters", "Spindle Platter Clamp & Spacer Rings", "Magnetic Media")

# -------------------------------------------------------------------------
# 05. SPINDLE MOTOR & FLUID DYNAMIC BEARING (Centered at X=0, Y=20)
# -------------------------------------------------------------------------
bpy.ops.mesh.primitive_cylinder_add(radius=12.5, depth=14.0, vertices=32, location=(0.0, 20.0, -1.0))
spindle_hub = bpy.context.active_object
spindle_hub.name = "Spindle_Motor"
assign_mat(spindle_hub, mat_stainless)

spindle_parts = []
# Center brass FDB bushing cap
bpy.ops.mesh.primitive_cylinder_add(radius=5.5, depth=1.2, vertices=24, location=(0.0, 20.0, 6.2))
fdb_cap = bpy.context.active_object
assign_mat(fdb_cap, mat_brass)
spindle_parts.append(fdb_cap)

# Center shaft grounding dimple
bpy.ops.mesh.primitive_cylinder_add(radius=2.0, depth=0.6, vertices=16, location=(0.0, 20.0, 6.7))
ground_dimple = bpy.context.active_object
assign_mat(ground_dimple, mat_stainless)
spindle_parts.append(ground_dimple)

# Bottom stator motor base
bpy.ops.mesh.primitive_cylinder_add(radius=17.0, depth=3.5, vertices=32, location=(0.0, 20.0, -7.5))
spindle_base = bpy.context.active_object
assign_mat(spindle_base, mat_stainless)
spindle_parts.append(spindle_base)

# Visible Stator 12-Pole Copper Windings
for ang in range(0, 360, 30):
    rad = math.radians(ang)
    wx = 0.0 + 14.5 * math.cos(rad)
    wy = 20.0 + 14.5 * math.sin(rad)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(wx, wy, -5.5))
    coil = bpy.context.active_object
    coil.scale = (2.4, 2.4, 3.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign_mat(coil, mat_copper)
    spindle_parts.append(coil)

join_into(spindle_hub, spindle_parts)
tag_extras(spindle_hub, [0.0, 10.0, 0.0], "spindle_motor", "Spindle Motor & FDB Bearing", "Magnetic Media")

# -------------------------------------------------------------------------
# 06. ACTUATOR E-BLOCK COMB & ARMS (Pivot at X=-26, Y=-24)
# With weight-reduction lightening truss cutouts and balanced coil fork
# -------------------------------------------------------------------------
bpy.ops.mesh.primitive_cylinder_add(radius=6.8, depth=14.0, vertices=32, location=(-26.0, -24.0, 0.5))
actuator_hub = bpy.context.active_object
actuator_hub.name = "Actuator_Arm"
assign_mat(actuator_hub, mat_machined_al)

arm_parts = []
arm_heights = [5.0, 2.3, -1.4, -4.1]
for az in arm_heights:
    # Main tapered blade
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-12.0, -3.0, az))
    arm_blade = bpy.context.active_object
    arm_blade.scale = (34.0, 5.5, 1.1)
    arm_blade.rotation_euler = (0, 0, math.radians(48.0))
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    assign_mat(arm_blade, mat_machined_al)
    
    # Inertia-reduction cutout pockets (distinctive triangular E-block window)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-14.0, -6.0, az))
    cutout = bpy.context.active_object
    cutout.scale = (12.0, 2.2, 1.4)
    cutout.rotation_euler = (0, 0, math.radians(48.0))
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    
    mod_cut = arm_blade.modifiers.new(name="TrussCut", type='BOOLEAN')
    mod_cut.object = cutout
    mod_cut.operation = 'DIFFERENCE'
    bpy.context.view_layer.objects.active = arm_blade
    bpy.ops.object.modifier_apply(modifier="TrussCut")
    bpy.data.objects.remove(cutout, do_unlink=True)
    
    assign_mat(arm_blade, mat_machined_al)
    arm_parts.append(arm_blade)

# Rear voice coil cradle fork
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-34.0, -36.0, 0.5))
coil_fork = bpy.context.active_object
coil_fork.scale = (14.0, 16.0, 3.0)
coil_fork.rotation_euler = (0, 0, math.radians(42.0))
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
assign_mat(coil_fork, mat_machined_al)
arm_parts.append(coil_fork)

# Balancing counterweight slug in rear fork
bpy.ops.mesh.primitive_cylinder_add(radius=3.0, depth=3.2, vertices=16, location=(-37.0, -39.0, 0.5))
cweight = bpy.context.active_object
assign_mat(cweight, mat_brass)
arm_parts.append(cweight)

join_into(actuator_hub, arm_parts, mat_machined_al)
tag_extras(actuator_hub, [-26.0, 14.0, 8.0], "actuator_arm", "Actuator E-Block Arm", "Electromechanical Actuation")

# -------------------------------------------------------------------------
# 07. READ/WRITE HEAD STACK (Dual-stage suspensions, ceramic sliders & gold leads)
# -------------------------------------------------------------------------
head_tip_z = [4.8, 3.6, 2.1, 0.9, -1.6, -2.8]

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 12.0, head_tip_z[0]))
heads_root = bpy.context.active_object
heads_root.name = "Head_Stack"
heads_root.scale = (18.0, 2.2, 0.25)
heads_root.rotation_euler = (0, 0, math.radians(48.0))
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
assign_mat(heads_root, mat_stainless)

head_parts = []
for hz in head_tip_z[1:]:
    # Stamped spring-steel suspension load beam
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 12.0, hz))
    beam = bpy.context.active_object
    beam.scale = (18.0, 2.2, 0.25)
    beam.rotation_euler = (0, 0, math.radians(48.0))
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    assign_mat(beam, mat_stainless)
    head_parts.append(beam)
    
    # Swage mount weld ring attaching suspension to arm tine
    bpy.ops.mesh.primitive_cylinder_add(radius=1.2, depth=0.4, vertices=16, location=(-5.0, 6.5, hz))
    swage = bpy.context.active_object
    assign_mat(swage, mat_stainless)
    head_parts.append(swage)
    
    # PZT micro-actuator piezoelectric ceramic element
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(2.0, 14.5, hz))
    pzt = bpy.context.active_object
    pzt.scale = (3.2, 1.2, 0.3)
    pzt.rotation_euler = (0, 0, math.radians(48.0))
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    assign_mat(pzt, mat_chip)
    head_parts.append(pzt)
    
    # Ceramic femto slider block
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(6.0, 18.5, hz))
    slider = bpy.context.active_object
    slider.scale = (1.2, 0.9, 0.4)
    assign_mat(slider, mat_chip)
    head_parts.append(slider)
    
    # Gold micro-lead bonding wire running down load beam
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.0, 13.0, hz + 0.15))
    wire = bpy.context.active_object
    wire.scale = (14.0, 0.3, 0.1)
    wire.rotation_euler = (0, 0, math.radians(48.0))
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    assign_mat(wire, mat_gold)
    head_parts.append(wire)

join_into(heads_root, head_parts)
tag_extras(heads_root, [-30.0, 18.0, 10.0], "rw_heads", "Read/Write Slider Heads & Suspension", "Magnetic Media")

# -------------------------------------------------------------------------
# 08. PIVOT BEARING CARTRIDGE & KAPTON FPC RIBBON WITH PREAMP IC
# -------------------------------------------------------------------------
bpy.ops.mesh.primitive_cylinder_add(radius=4.8, depth=14.8, vertices=24, location=(-26.0, -24.0, 0.5))
pivot_bearing = bpy.context.active_object
pivot_bearing.name = "Pivot_Bearing"
assign_mat(pivot_bearing, mat_stainless)

pivot_parts = []
# Top retention screw and circlip
bpy.ops.mesh.primitive_cylinder_add(radius=3.2, depth=1.6, vertices=16, location=(-26.0, -24.0, 8.2))
pivot_screw = bpy.context.active_object
assign_mat(pivot_screw, mat_stainless)
pivot_parts.append(pivot_screw)

# Gold grounding contact pin
bpy.ops.mesh.primitive_cylinder_add(radius=1.0, depth=1.2, vertices=12, location=(-26.0, -24.0, 9.2))
gpin = bpy.context.active_object
assign_mat(gpin, mat_gold)
pivot_parts.append(gpin)

# Amber Kapton flexible printed circuit (FPC) curving from arm to casting terminal
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-36.0, -18.0, 0.5))
flex_ribbon = bpy.context.active_object
flex_ribbon.scale = (8.0, 22.0, 0.3)
flex_ribbon.rotation_euler = (0, 0, math.radians(22.0))
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
assign_mat(flex_ribbon, mat_kapton)
pivot_parts.append(flex_ribbon)

# On-Flex Preamplifier Silicon IC (amplifies microvolt read signals near heads)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-37.0, -15.0, 0.8))
preamp_ic = bpy.context.active_object
preamp_ic.scale = (4.0, 6.0, 0.8)
preamp_ic.rotation_euler = (0, 0, math.radians(22.0))
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
assign_mat(preamp_ic, mat_chip)
pivot_parts.append(preamp_ic)

# Silver solder balls on preamp terminals
for pz in [-2.0, 0.0, 2.0]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.4, depth=0.4, vertices=8, location=(-39.0, -15.0 + pz, 0.7))
    ball = bpy.context.active_object
    assign_mat(ball, mat_stainless)
    pivot_parts.append(ball)

join_into(pivot_bearing, pivot_parts)
tag_extras(pivot_bearing, [-18.0, 22.0, 5.0], "pivot_bearing", "Pivot Bearing & Flex Cable", "Electromechanical Actuation")

# -------------------------------------------------------------------------
# 09. VOICE COIL MOTOR (VCM Magnet Assemblies, Copper Voice Coil & Crash Stop)
# -------------------------------------------------------------------------
# Free-standing flat copper voice coil
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-32.0, -42.0, 0.5))
vcm_coil = bpy.context.active_object
vcm_coil.name = "VCM_Coil"
vcm_coil.scale = (12.0, 18.0, 2.4)
vcm_coil.rotation_euler = (0, 0, math.radians(40.0))
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
assign_mat(vcm_coil, mat_copper)

coil_parts = []
# Internal hollow coil aperture
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-32.0, -42.0, 0.5))
coil_hole = bpy.context.active_object
coil_hole.scale = (6.0, 10.0, 3.0)
coil_hole.rotation_euler = (0, 0, math.radians(40.0))
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

mod_aperture = vcm_coil.modifiers.new(name="Aperture", type='BOOLEAN')
mod_aperture.object = coil_hole
mod_aperture.operation = 'DIFFERENCE'
bpy.context.view_layer.objects.active = vcm_coil
bpy.ops.object.modifier_apply(modifier="Aperture")
bpy.data.objects.remove(coil_hole, do_unlink=True)
assign_mat(vcm_coil, mat_copper)

tag_extras(vcm_coil, [-28.0, 15.0, 8.0], "voice_coil_motor", "VCM Copper Voice Coil", "Electromechanical Actuation")

# Upper Neodymium Magnet & Steel Flux Yoke
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-32.0, -42.0, 4.8))
vcm_mag_upper = bpy.context.active_object
vcm_mag_upper.name = "VCM_Magnet_Upper"
vcm_mag_upper.scale = (18.0, 24.0, 3.2)
vcm_mag_upper.rotation_euler = (0, 0, math.radians(40.0))
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
assign_mat(vcm_mag_upper, mat_magnet)

# Steel top yoke backing plate
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-32.0, -42.0, 6.6))
top_yoke = bpy.context.active_object
top_yoke.scale = (20.0, 26.0, 1.2)
top_yoke.rotation_euler = (0, 0, math.radians(40.0))
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
assign_mat(top_yoke, mat_stainless)

# Mechanical crash stop pin with rubber damper sleeve
bpy.ops.mesh.primitive_cylinder_add(radius=1.8, depth=8.0, vertices=16, location=(-20.0, -46.0, 2.0))
crash_pin = bpy.context.active_object
assign_mat(crash_pin, mat_rubber)

join_into(vcm_mag_upper, [top_yoke, crash_pin], mat_magnet)
tag_extras(vcm_mag_upper, [0.0, 58.0, 0.0], "voice_coil_motor", "Upper VCM Neodymium Magnet & Yoke", "Electromechanical Actuation")

# Lower Neodymium Magnet & Steel Flux Yoke
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-32.0, -42.0, -3.8))
vcm_mag_lower = bpy.context.active_object
vcm_mag_lower.name = "VCM_Magnet_Lower"
vcm_mag_lower.scale = (18.0, 24.0, 3.2)
vcm_mag_lower.rotation_euler = (0, 0, math.radians(40.0))
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
assign_mat(vcm_mag_lower, mat_magnet)

# Steel bottom yoke plate
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-32.0, -42.0, -5.6))
bot_yoke = bpy.context.active_object
bot_yoke.scale = (20.0, 26.0, 1.2)
bot_yoke.rotation_euler = (0, 0, math.radians(40.0))
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
assign_mat(bot_yoke, mat_stainless)

join_into(vcm_mag_lower, [bot_yoke], mat_magnet)
tag_extras(vcm_mag_lower, [-14.0, 4.0, 6.0], "voice_coil_motor", "Lower VCM Neodymium Magnet", "Electromechanical Actuation")

# -------------------------------------------------------------------------
# 10. HEAD PARKING RAMP & CRASH STOP
# Multi-level guide fingers for parking suspension tabs off-disk
# -------------------------------------------------------------------------
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-20.0, 48.0, 0.5))
ramp = bpy.context.active_object
ramp.name = "Ramp"
ramp.scale = (7.0, 14.0, 12.0)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
assign_mat(ramp, mat_plastic)

ramp_parts = []
# 6 Individual finger guide tabs extending toward platters
for rz in [4.8, 3.6, 2.1, 0.9, -1.6, -2.8]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-16.0, 46.0, rz))
    finger = bpy.context.active_object
    finger.scale = (3.5, 2.0, 0.4)
    finger.rotation_euler = (0, 0, math.radians(-25.0))
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    assign_mat(finger, mat_plastic)
    ramp_parts.append(finger)

# Inertial shock latch arm
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-24.0, 42.0, 0.5))
latch = bpy.context.active_object
latch.scale = (2.4, 8.0, 4.0)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
assign_mat(latch, mat_plastic)
ramp_parts.append(latch)

join_into(ramp, ramp_parts, mat_plastic)
tag_extras(ramp, [16.0, 12.0, -12.0], "actuator_arm", "Head Parking Ramp & Latch", "Electromechanical Actuation")

# -------------------------------------------------------------------------
# 11. PCB CONTROLLER BOARD & ICs (Underside Mount)
# Detailed FR-4 board with main SoC, DRAM, Driver, ROM, and SMD passives
# -------------------------------------------------------------------------
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -24.0, -13.6))
pcb = bpy.context.active_object
pcb.name = "PCB"
pcb.scale = (96.0, 88.0, 1.6)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
assign_mat(pcb, mat_pcb_green)

pcb_chips = []

# Main Controller SoC: ARM Cortex-R Enterprise Controller (BGA with metallic heatspreader)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-12.0, -24.0, -15.2))
soc = bpy.context.active_object
soc.name = "IC_SoC_Controller"
soc.scale = (16.0, 16.0, 1.6)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
assign_mat(soc, mat_chip)
pcb_chips.append(soc)

# Metallic heatspreader lid on SoC
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-12.0, -24.0, -16.1))
soc_lid = bpy.context.active_object
soc_lid.scale = (13.0, 13.0, 0.4)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
assign_mat(soc_lid, mat_stainless)
pcb_chips.append(soc_lid)

# DRAM Cache IC (512MB DDR3 buffer)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(14.0, -18.0, -15.2))
dram = bpy.context.active_object
dram.name = "IC_DRAM_Cache"
dram.scale = (12.0, 9.0, 1.4)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
assign_mat(dram, mat_chip)
pcb_chips.append(dram)

# Spindle & VCM Motor Driver Power IC
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(16.0, -42.0, -15.2))
motor_driver = bpy.context.active_object
motor_driver.name = "IC_Motor_Driver"
motor_driver.scale = (10.0, 10.0, 1.4)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
assign_mat(motor_driver, mat_chip)
pcb_chips.append(motor_driver)

# SPI Firmware ROM chip (SOIC-8)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-28.0, -42.0, -15.0))
spi_rom = bpy.context.active_object
spi_rom.scale = (5.0, 6.0, 1.2)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
assign_mat(spi_rom, mat_chip)
pcb_chips.append(spi_rom)

# Crystal Oscillator (CANS / Ceramic clock source)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-4.0, -16.0, -15.0))
crystal = bpy.context.active_object
crystal.scale = (4.0, 2.5, 1.2)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
assign_mat(crystal, mat_stainless)
pcb_chips.append(crystal)

# Power inductors (ferrite chokes)
for lx in [-22.0, -22.0]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(lx, -32.0, -15.2))
    choke = bpy.context.active_object
    choke.scale = (4.0, 4.0, 1.8)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign_mat(choke, mat_chip)
    pcb_chips.append(choke)

# Discrete 0402 SMD ceramic capacitors and resistors
passives = [
    (-28.0, -18.0), (-28.0, -26.0), (-28.0, -34.0),
    (-4.0, -38.0), (4.0, -38.0), (4.0, -46.0),
    (28.0, -22.0), (28.0, -30.0), (28.0, -38.0),
    (-18.0, -18.0), (-6.0, -28.0), (6.0, -24.0)
]
for px, py in passives:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, -15.0))
    smd = bpy.context.active_object
    smd.scale = (2.2, 3.4, 1.2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign_mat(smd, mat_chip)
    pcb_chips.append(smd)

# Gold spring contact pins mating to motor stator
for ang in [30, 150, 270]:
    rad = math.radians(ang)
    mx = 0.0 + 8.0 * math.cos(rad)
    my = 20.0 + 8.0 * math.sin(rad)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.8, depth=2.4, vertices=12, location=(mx, my, -12.0))
    pin = bpy.context.active_object
    assign_mat(pin, mat_gold)
    pcb_chips.append(pin)

join_into(pcb, pcb_chips)
tag_extras(pcb, [0.0, -42.0, 0.0], "pcb_board", "PCB Controller Board", "Control Electronics")

# -------------------------------------------------------------------------
# 12. SATA DATA & POWER CONNECTOR (22-pin combo with individual gold pins)
# -------------------------------------------------------------------------
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(16.0, -71.5, -13.5))
sata_body = bpy.context.active_object
sata_body.name = "SATA_Connector"
sata_body.scale = (44.0, 8.0, 6.2)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
assign_mat(sata_body, mat_plastic)

sata_parts = []
# Keyed "L" slot guide dividers for 7-pin Data and 15-pin Power
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.0, -74.8, -13.5))
divider = bpy.context.active_object
divider.scale = (1.8, 2.5, 4.0)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
assign_mat(divider, mat_plastic)
sata_parts.append(divider)

# 7-pin SATA Data Gold Contact Pins
for p in range(7):
    x_pos = -9.0 + p * 1.3
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x_pos, -74.5, -13.5))
    pin = bpy.context.active_object
    pin.scale = (0.6, 2.2, 0.6)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign_mat(pin, mat_gold)
    sata_parts.append(pin)

# 15-pin SATA Power Gold Contact Pins with staggered lengths (pre-charge ground)
for p in range(15):
    x_pos = 5.0 + p * 1.4
    # Staggered lengths: pins 3, 7, 12 extend slightly longer for pre-charge
    pin_len = 2.6 if p in [2, 6, 11] else 2.1
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x_pos, -74.5, -13.5))
    pin = bpy.context.active_object
    pin.scale = (0.7, pin_len, 0.6)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign_mat(pin, mat_gold)
    sata_parts.append(pin)

join_into(sata_body, sata_parts)
tag_extras(sata_body, [0.0, -46.0, 42.0], "sata_connector", "SATA 3.0 Data & Power Interface", "Control Electronics")

# -------------------------------------------------------------------------
# 13. SAVE BLENDER SOURCE (.blend) AND EXPORT GLTF (.glb)
# -------------------------------------------------------------------------
blend_dir = os.path.abspath("tools/blender")
export_dir = os.path.abspath("public/models/hdd")
dist_export_dir = os.path.abspath("dist/models/hdd")
os.makedirs(blend_dir, exist_ok=True)
os.makedirs(export_dir, exist_ok=True)
os.makedirs(dist_export_dir, exist_ok=True)

blend_path = os.path.join(blend_dir, "hdd_internals.blend")
glb_path_hdd = os.path.join(export_dir, "hdd_internals.glb")
glb_path_root = os.path.abspath("public/models/hdd.glb")
dist_glb_path_hdd = os.path.join(dist_export_dir, "hdd_internals.glb")
dist_glb_path_root = os.path.abspath("dist/models/hdd.glb")

# Save source .blend file
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"Successfully saved Blender file: {blend_path}")

# Export Draco-compressed glTF (Y-Up orientation, export extras metadata)
bpy.ops.export_scene.gltf(
    filepath=glb_path_hdd,
    export_format='GLB',
    export_yup=True,
    export_extras=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=7,
    export_apply=True
)

# Also update public/models/hdd.glb and dist/ files so all paths are synchronized
shutil.copyfile(glb_path_hdd, glb_path_root)
if os.path.exists(os.path.dirname(dist_glb_path_hdd)):
    shutil.copyfile(glb_path_hdd, dist_glb_path_hdd)
if os.path.exists(os.path.dirname(dist_glb_path_root)):
    shutil.copyfile(glb_path_hdd, dist_glb_path_root)

file_size_kb = os.path.getsize(glb_path_hdd) / 1024
print(f"Successfully exported glTF: {glb_path_hdd} ({file_size_kb:.1f} KB)")
print(f"Synchronized models to public and dist directories.")

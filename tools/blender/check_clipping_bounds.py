import bpy
import mathutils

print("\n" + "="*80)
print("HDD CAVITY & COMPONENT CLIPPING AUDIT")
print("="*80)

# Outer chassis is 101.6 x 147.0 x 22.0 mm centered at (0,0,0)
# Outer bounds:
# X: [-50.8, +50.8]
# Y: [-73.5, +73.5]
# Z: [-11.0, +11.0]

# Inner cavity cut in build_refined_hdd.py was:
# location=(0, 0, 2.5), scale=(96.4, 140.0, 19.0)
# That gave an inner cavity of:
# X: [-48.2, +48.2]  (wall thickness: 2.6 mm on each side)
# Y: [-70.0, +70.0]  (wall thickness: 3.5 mm on front/back)
# Z: [-7.0, +12.0]   (bottom floor thickness: 4.0 mm, open at top +11.0mm covered by Top_Cover at Z=8.9 to 10.3mm)

CHASSIS_OUTER = {
    'minX': -50.8, 'maxX': 50.8,
    'minY': -73.5, 'maxY': 73.5,
    'minZ': -11.0, 'maxZ': 11.0
}

CAVITY_INNER = {
    'minX': -48.2, 'maxX': 48.2,
    'minY': -70.0, 'maxY': 70.0,
    'minZ': -7.0,  'maxZ': 9.6 # Top cover underside begins at Z ~ 9.0 to 9.6
}

print(f"Outer Chassis Bounds: X[{CHASSIS_OUTER['minX']} .. {CHASSIS_OUTER['maxX']}] Y[{CHASSIS_OUTER['minY']} .. {CHASSIS_OUTER['maxY']}] Z[{CHASSIS_OUTER['minZ']} .. {CHASSIS_OUTER['maxZ']}]")
print(f"Inner Cavity Bounds:  X[{CAVITY_INNER['minX']} .. {CAVITY_INNER['maxX']}] Y[{CAVITY_INNER['minY']} .. {CAVITY_INNER['maxY']}] Z[{CAVITY_INNER['minZ']} .. {CAVITY_INNER['maxZ']}]\n")

clipping_found = []

for obj in bpy.data.objects:
    if obj.type != 'MESH':
        continue
    
    # Calculate world-space bounding box
    bbox_corners = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
    xs = [v.x for v in bbox_corners]
    ys = [v.y for v in bbox_corners]
    zs = [v.z for v in bbox_corners]
    
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    min_z, max_z = min(zs), max(zs)
    
    # Check if object is meant to be internal
    # External objects: Base_Casting (chassis), Top_Cover, Torx_Screws, Breather_Filter, PCB (on bottom outside), SATA_Connector (cutout on rear)
    is_external = obj.name in ["Base_Casting", "Top_Cover", "Torx_Screws", "Breather_Filter", "PCB", "SATA_Connector", "Studio_Floor"]
    
    protrudes_outer = (
        min_x < CHASSIS_OUTER['minX'] - 0.05 or max_x > CHASSIS_OUTER['maxX'] + 0.05 or
        min_y < CHASSIS_OUTER['minY'] - 0.05 or max_y > CHASSIS_OUTER['maxY'] + 0.05 or
        max_z > CHASSIS_OUTER['maxZ'] + 1.5 # screws sit slightly on top
    )
    
    protrudes_cavity = not is_external and (
        min_x < CAVITY_INNER['minX'] or max_x > CAVITY_INNER['maxX'] or
        min_y < CAVITY_INNER['minY'] or max_y > CAVITY_INNER['maxY'] or
        min_z < CAVITY_INNER['minZ'] or max_z > CAVITY_INNER['maxZ']
    )
    
    status = "OK"
    issues = []
    if not is_external and protrudes_cavity:
        status = "CLIPS CAVITY"
        if min_x < CAVITY_INNER['minX']: issues.append(f"Left X={min_x:.2f} < {CAVITY_INNER['minX']}")
        if max_x > CAVITY_INNER['maxX']: issues.append(f"Right X={max_x:.2f} > {CAVITY_INNER['maxX']}")
        if min_y < CAVITY_INNER['minY']: issues.append(f"Back Y={min_y:.2f} < {CAVITY_INNER['minY']}")
        if max_y > CAVITY_INNER['maxY']: issues.append(f"Front Y={max_y:.2f} > {CAVITY_INNER['maxY']}")
        if min_z < CAVITY_INNER['minZ']: issues.append(f"Floor Z={min_z:.2f} < {CAVITY_INNER['minZ']}")
        if max_z > CAVITY_INNER['maxZ']: issues.append(f"Roof Z={max_z:.2f} > {CAVITY_INNER['maxZ']}")
    
    if min_x < CHASSIS_OUTER['minX'] and obj.name != "Studio_Floor":
        issues.append(f"POKES OUTSIDE CHASSIS WALL! X={min_x:.2f} < {CHASSIS_OUTER['minX']}")
        status = "POKES CHASSIS!"
    
    print(f"{obj.name:20} | X:[{min_x:6.2f}, {max_x:6.2f}] Y:[{min_y:6.2f}, {max_y:6.2f}] Z:[{min_z:6.2f}, {max_z:6.2f}] | {status} {', '.join(issues)}")

print("="*80 + "\n")

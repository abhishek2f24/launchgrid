"""
Run this inside Blender's Scripting tab (Editing > Scripting workspace > New > paste > Run Script).
Builds the telescoping-spine + accordion-limb capsule mechanism per Phase 3 spec.
All dimensions in millimetres, converted to Blender units (1 BU = 1 m -> divide by 1000).
"""

import bpy
import math

MM = 1.0 / 1000.0


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def add_tube(name, outer_d, inner_d, length, z_offset, collection):
    """Hollow cylinder built as outer cylinder minus inner cylinder (boolean)."""
    outer_r = (outer_d / 2) * MM
    inner_r = (inner_d / 2) * MM
    L = length * MM

    bpy.ops.mesh.primitive_cylinder_add(
        radius=outer_r, depth=L, location=(0, 0, z_offset * MM + L / 2)
    )
    outer = bpy.context.active_object
    outer.name = f"{name}_outer"

    bpy.ops.mesh.primitive_cylinder_add(
        radius=inner_r, depth=L * 1.2, location=(0, 0, z_offset * MM + L / 2)
    )
    inner = bpy.context.active_object
    inner.name = f"{name}_inner_cut"

    mod = outer.modifiers.new(name="bool_hollow", type='BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.object = inner
    bpy.context.view_layer.objects.active = outer
    bpy.ops.object.modifier_apply(modifier=mod.name)

    bpy.data.objects.remove(inner, do_unlink=True)

    outer.name = name
    for coll in outer.users_collection:
        coll.objects.unlink(outer)
    collection.objects.link(outer)
    return outer


def add_ball_joint(name, diameter, location, collection):
    r = (diameter / 2) * MM
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=location)
    ball = bpy.context.active_object
    ball.name = name
    for coll in ball.users_collection:
        coll.objects.unlink(ball)
    collection.objects.link(ball)
    return ball


def add_limb(name, length, width, location, rotation_euler, collection):
    """Accordion limb approximated as a tapered box segment for now."""
    L = length * MM
    W = width * MM
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    limb = bpy.context.active_object
    limb.scale = (W, W, L)
    limb.rotation_euler = rotation_euler
    limb.name = name
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    for coll in limb.users_collection:
        coll.objects.unlink(limb)
    collection.objects.link(limb)
    return limb


def main():
    clear_scene()

    spine_coll = bpy.data.collections.new("Telescoping_Spine")
    bpy.context.scene.collection.children.link(spine_coll)

    limb_coll = bpy.data.collections.new("Accordion_Limbs")
    bpy.context.scene.collection.children.link(limb_coll)

    joint_coll = bpy.data.collections.new("Ball_Joints")
    bpy.context.scene.collection.children.link(joint_coll)

    # --- Spine stages (telescoping, nested) ---
    # Stage 1: outermost, fixed to capsule base
    stage1 = add_tube("Spine_Stage1", outer_d=18, inner_d=15, length=52, z_offset=0, collection=spine_coll)
    # Stage 2: nests inside Stage 1, extends upward when deployed
    stage2 = add_tube("Spine_Stage2", outer_d=14, inner_d=11, length=38, z_offset=52, collection=spine_coll)
    # Stage 3: nests inside Stage 2, carries the head/torso top
    stage3 = add_tube("Spine_Stage3", outer_d=10, inner_d=7, length=22, z_offset=52 + 38, collection=spine_coll)

    # --- Shoulder ball joints at top of Stage 2 deployment point ---
    shoulder_z = (52 + 38) * MM
    left_shoulder = add_ball_joint("Shoulder_L", diameter=8, location=(-9 * MM, 0, shoulder_z), collection=joint_coll)
    right_shoulder = add_ball_joint("Shoulder_R", diameter=8, location=(9 * MM, 0, shoulder_z), collection=joint_coll)

    # --- Hip ball joints at base of Stage 1 ---
    hip_z = 8 * MM
    left_hip = add_ball_joint("Hip_L", diameter=8, location=(-7 * MM, 0, hip_z), collection=joint_coll)
    right_hip = add_ball_joint("Hip_R", diameter=8, location=(7 * MM, 0, hip_z), collection=joint_coll)

    # --- Accordion limbs (arms + legs), folded flush against spine by default ---
    add_limb("Arm_L", length=60, width=6, location=(-9 * MM, 0, shoulder_z - 30 * MM),
              rotation_euler=(0, 0, 0), collection=limb_coll)
    add_limb("Arm_R", length=60, width=6, location=(9 * MM, 0, shoulder_z - 30 * MM),
              rotation_euler=(0, 0, 0), collection=limb_coll)
    add_limb("Leg_L", length=70, width=7, location=(-7 * MM, 0, hip_z - 35 * MM),
              rotation_euler=(0, 0, 0), collection=limb_coll)
    add_limb("Leg_R", length=70, width=7, location=(7 * MM, 0, hip_z - 35 * MM),
              rotation_euler=(0, 0, 0), collection=limb_coll)

    print("Telescoping spine + accordion limb mechanism built.")
    print(f"Total deployed height: {(52 + 38 + 22)} mm spine + limbs")


if __name__ == "__main__":
    main()

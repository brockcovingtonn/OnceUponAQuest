"""
Exports the scripted explorer as a game-ready, rigged GLB for the app's 3D viewer.

Called from explorer2.py with {"glb": "/path/out.glb"}. Everything the viewer
needs survives the trip to glTF:
  - hair, brows and lashes become ribbon meshes (glTF has no hair curves)
  - eye and hair colors are baked into vertex colors
  - one named mesh per part, grouped by slot prefix (hair_, face_, top_,
    bottom_, shoes_, body_) so wardrobe pieces can be swapped later
  - a skeleton (hips, spine, chest, neck, head, arms, legs) with automatic
    skin weights; the head, face and hair follow the head bone
"""
import bpy, bmesh, math
import numpy as np
from mathutils import Vector


def run(G):
    P = G['P']; HZ = G['HZ']; lin = G['lin']; lmix = G['lmix']
    scene = bpy.context.scene

    def white_mat(name, rough=0.6, coat=0.0):
        m = bpy.data.materials.new(name); m.use_nodes = True
        b = m.node_tree.nodes['Principled BSDF']
        vc = m.node_tree.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'col'
        m.node_tree.links.new(vc.outputs['Color'], b.inputs['Base Color'])
        b.inputs['Roughness'].default_value = rough; b.inputs['Coat Weight'].default_value = coat
        return m

    def color_mat(name, color, rough=0.6):
        m = bpy.data.materials.new(name); m.use_nodes = True
        b = m.node_tree.nodes['Principled BSDF']
        b.inputs['Base Color'].default_value = tuple(color) + (1,); b.inputs['Roughness'].default_value = rough
        return m

    VC = white_mat('vertex_color', 0.55)
    HAIRM = white_mat('hair', 0.62)
    EYEM = white_mat('eye', 0.12, coat=1.0)
    SKIN = color_mat('skin', G['SKIN_C'], 0.55)

    def set_vcol(me, cols):
        ca = me.color_attributes.get('col') or me.color_attributes.new('col', 'FLOAT_COLOR', 'POINT')
        ca.data.foreach_set('color', np.column_stack([cols, np.ones(len(cols))]).ravel().astype(np.float32))
        me.color_attributes.active_color = ca

    # ---- hair-like curves -> ribbons ----
    def ribbons(name, strands, w_root, w_tip, base, every=1, pts_per=14, flat_to=None, dark_root=0.55):
        verts, faces, cols = [], [], []
        rng = np.random.default_rng(7)
        for si, st in enumerate(strands[::every]):
            st = np.asarray(st, dtype=float)
            if len(st) < 2: continue
            idx = np.linspace(0, len(st) - 1, min(pts_per, len(st)))
            st = np.array([st[int(math.floor(i))] * (1 - (i % 1)) + st[min(len(st) - 1, int(math.floor(i)) + 1)] * (i % 1) for i in idx])
            tang = np.gradient(st, axis=0); tang /= np.linalg.norm(tang, axis=1)[:, None] + 1e-9
            c0 = flat_to if flat_to is not None else np.array([0, 0.03, HZ])
            out = st - c0; out[:, 2] *= 0.3
            side = np.cross(tang, out); side /= np.linalg.norm(side, axis=1)[:, None] + 1e-9
            tint = 0.85 + 0.3 * rng.random()
            n0 = len(verts)
            for j, (p_, sd) in enumerate(zip(st, side)):
                t = j / (len(st) - 1)
                w = (w_root + (w_tip - w_root) * t) / 2
                verts += [tuple(p_ - sd * w), tuple(p_ + sd * w)]
                c = np.array(base) * tint * (dark_root + (1 - dark_root) * min(1, t * 2.5))
                cols += [c, c]
            for j in range(len(st) - 1):
                a = n0 + 2 * j
                faces.append((a, a + 1, a + 3, a + 2))
        me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
        for poly in me.polygons: poly.use_smooth = True
        set_vcol(me, np.array(cols))
        o = bpy.data.objects.new(name, me); scene.collection.objects.link(o); me.materials.append(HAIRM)
        return o

    hair_c = np.array(G['HAIR_C'])
    hair_c = np.maximum(hair_c, 0.012)  # keep very dark hair from going pure black
    made = {}
    for name, (strands, r_root, r_tip) in G['HAIR_DATA'].items():
        if name == 'hair':
            kind = P['hairKind']
            every = {'long': 7, 'short': 5, 'curly': 5}[kind]
            wr, wt = {'long': (0.045, 0.018), 'short': (0.036, 0.014), 'curly': (0.022, 0.016)}[kind]
            made['hair_' + kind] = ribbons('hair_' + kind, strands, wr, wt, hair_c * np.array([2.2, 1.9, 1.7]), every=every, pts_per=18 if kind == 'curly' else 10)
        elif name == 'brows':
            made['face_brows'] = ribbons('face_brows', strands, 0.011, 0.003, hair_c * 1.1, every=4, pts_per=4, dark_root=0.9)
        elif name == 'lashes':
            made['face_lashes'] = ribbons('face_lashes', strands, 0.005, 0.0015, np.array(lin('#120A08')), every=1, pts_per=6, dark_root=1.0)
    for o in list(scene.objects):
        if o.type == 'CURVES':
            bpy.data.objects.remove(o, do_unlink=True)

    # ---- eyes: bake the iris into vertex colors ----
    iris = np.array(lin(P['iris']))
    for i, o in enumerate([o for o in scene.objects if o.name.startswith('eyeball')]):
        me = o.data
        co = np.empty(len(me.vertices) * 3); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
        d = co / np.linalg.norm(co, axis=1)[:, None]
        c = -d[:, 1]
        col = np.tile(np.array(lin('#EFE7E3')), (len(c), 1))
        ring = (c > 0.83) & (c < 0.85); col[ring] = (0.04, 0.025, 0.02)
        ir = (c >= 0.85) & (c < 0.962)
        t = np.clip((c[ir] - 0.85) / 0.11, 0, 1)[:, None]
        lower = np.clip(-d[ir, 2] * 3, 0, 1)[:, None]
        col[ir] = iris * (0.55 + 0.55 * t) + np.array(lin('#C08040')) * 0.25 * lower
        col[c >= 0.962] = (0.006, 0.004, 0.004)
        set_vcol(me, col)
        me.materials.clear(); me.materials.append(EYEM)
        o.rotation_euler = (0, 0, 0)
        o.name = 'face_eye_' + ('R' if i == 0 else 'L')

    # ---- curves (lash lines) -> meshes; tidy names and materials ----
    bpy.ops.object.select_all(action='DESELECT')
    for o in list(scene.objects):
        if o.type == 'CURVE':
            bpy.context.view_layer.objects.active = o; o.select_set(True)
            bpy.ops.object.convert(target='MESH'); o.select_set(False)
    names = {'head': 'body_head', 'neck': 'body_neck', 'body': 'body_skin', 'shirt': 'top_tee', 'shorts': 'bottom_shorts', 'shoes': 'shoes_sneakers', 'soles': 'shoes_soles'}
    li = ll = ei = 0
    for o in list(scene.objects):
        base_name = o.name.split('.')[0]
        if base_name in names: o.name = names[base_name]
        elif base_name == 'lid': o.name = 'face_lid_' + ('R' if li == 0 else 'L'); li += 1
        elif base_name == 'lashline': o.name = 'face_lashline_' + ('R' if ll == 0 else 'L'); ll += 1
        elif base_name == 'ear': o.name = 'body_ear_' + ('R' if ei == 0 else 'L'); ei += 1
    for o in scene.objects:
        if o.type != 'MESH': continue
        if o.name in ('body_head',):
            o.data.materials.clear(); o.data.materials.append(VC)
            o.data.color_attributes.active_color = o.data.color_attributes['col']
        elif o.name.startswith(('body_', 'face_lid')):
            o.data.materials.clear(); o.data.materials.append(SKIN)

    # Apply modifiers so the meshes are final before skinning.
    for o in list(scene.objects):
        if o.type == 'MESH' and len(o.modifiers):
            bpy.context.view_layer.objects.active = o
            for m in list(o.modifiers):
                bpy.ops.object.modifier_apply(modifier=m.name)
    # ---- lighten the heavy meshes for phones ----
    for o in scene.objects:
        if o.type != 'MESH': continue
        n = len(o.data.vertices)
        target = {'body_head': 9000, 'body_skin': 9000, 'top_tee': 6000}.get(o.name, 1200 if o.name.startswith(('face_lid', 'face_eye', 'body_ear', 'face_lashline')) else 3000)
        if n > target and not o.name.startswith(('hair_', 'face_brows', 'face_lashes')):
            dm = o.modifiers.new('lite', 'DECIMATE'); dm.ratio = target / n
            bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier='lite')

    # ---- skeleton ----
    arm = bpy.data.armatures.new('rig'); rig = bpy.data.objects.new('rig', arm); scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    for o in scene.objects: o.select_set(o == rig)
    bpy.ops.object.mode_set(mode='EDIT')
    def bone(name, head, tail, parent=None):
        b = arm.edit_bones.new(name); b.head = head; b.tail = tail
        if parent: b.parent = arm.edit_bones[parent]; b.use_connect = False
    bone('root', (0, 0.05, 0), (0, 0.05, 0.4))
    bone('hips', (0, 0.06, 2.05), (0, 0.06, 2.42), 'root')
    bone('spine', (0, 0.06, 2.42), (0, 0.06, 2.8), 'hips')
    bone('chest', (0, 0.06, 2.8), (0, 0.06, 3.16), 'spine')
    bone('neck', (0, 0.08, 3.16), (0, 0.08, HZ - 0.45), 'chest')
    bone('head', (0, 0.06, HZ - 0.45), (0, 0.06, HZ + 0.65), 'neck')
    for s, side in ((1, 'L'), (-1, 'R')):
        bone(f'shoulder_{side}', (0.12 * s, 0.07, 3.12), (0.46 * s, 0.07, 3.14), 'chest')
        bone(f'upper_arm_{side}', (0.5 * s, 0.06, 3.14), (0.6 * s, 0.1, 2.45), f'shoulder_{side}')
        bone(f'forearm_{side}', (0.6 * s, 0.1, 2.45), (0.63 * s, 0.04, 1.95), f'upper_arm_{side}')
        bone(f'hand_{side}', (0.63 * s, 0.04, 1.95), (0.645 * s, 0.0, 1.66), f'forearm_{side}')
        bone(f'thigh_{side}', (0.21 * s, 0.06, 2.1), (0.21 * s, 0.03, 1.08), 'hips')
        bone(f'shin_{side}', (0.21 * s, 0.03, 1.08), (0.21 * s, 0.08, 0.26), f'thigh_{side}')
        bone(f'foot_{side}', (0.21 * s, 0.08, 0.26), (0.22 * s, -0.25, 0.06), f'shin_{side}')
    bpy.ops.object.mode_set(mode='OBJECT')

    # Unparent everything from the old turn-table root, keeping transforms.
    for o in scene.objects:
        if o.parent and o.parent.type == 'EMPTY':
            mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw

    # Rigid parts follow the head bone; the body and clothes get automatic weights.
    head_parts = [o for o in scene.objects if o.type == 'MESH' and (o.name.startswith(('hair_', 'face_')) or o.name in ('body_head', 'body_ear_L', 'body_ear_R'))]
    for o in head_parts:
        mw = o.matrix_world.copy(); o.parent = rig; o.parent_type = 'BONE'; o.parent_bone = 'head'; o.matrix_world = mw
    skinned = [o for o in scene.objects if o.type == 'MESH' and o not in head_parts]
    for o in skinned:
        bpy.ops.object.select_all(action='DESELECT')
        o.select_set(True); rig.select_set(True); bpy.context.view_layer.objects.active = rig
        try:
            bpy.ops.object.parent_set(type='ARMATURE_AUTO')
        except Exception as e:
            print('auto weights failed for', o.name, e); bpy.ops.object.parent_set(type='ARMATURE_ENVELOPE')

    keep = ('body_', 'face_', 'hair_', 'top_', 'bottom_', 'shoes_')
    for o in list(scene.objects):
        if o.type in ('EMPTY', 'LIGHT', 'CAMERA') or (o.type == 'MESH' and not o.name.startswith(keep)):
            bpy.data.objects.remove(o, do_unlink=True)
    total = sum(len(o.data.vertices) for o in scene.objects if o.type == 'MESH')
    print('EXPORT meshes', len([o for o in scene.objects if o.type == 'MESH']), 'verts', total)
    for o in sorted(scene.objects, key=lambda o: o.name):
        if o.type == 'MESH': print('  ', o.name, len(o.data.vertices))
    bpy.ops.export_scene.gltf(filepath=P['glb'], export_format='GLB', export_yup=True, export_apply=True,
                              export_vertex_color='ACTIVE', export_skins=True, export_animations=False, use_selection=False)
    print('exported', P['glb'])

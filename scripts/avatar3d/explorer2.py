"""
An original explorer, modeled and rendered in Blender (second pass).

  blender -b -P explorer2.py -- '{"out": "/path/a.png", "frame": "bust", ...}'

Style targets (animated-feature look, no character likeness):
  - a big cranium, wide cheekbones, a soft jaw and a small defined chin
  - large almond eyes: lids that wrap the eyeball, a heavy lash line with a
    wing, individual lashes, detailed irises and one strong catchlight
  - thick sculpted brows made of short hairs
  - a broad rounded nose, full lips with a cupid's bow, smiling corners
  - warm subsurface skin with blush on the cheeks and nose
  - thousands of hair strands with a proper hair shader, clumped and wavy
Units: the head is 1.2 tall (z -0.6..0.6 around its center HZ); feet at z 0.
"""
import bpy, bmesh, json, math, sys, random
import numpy as np
from mathutils import Vector, kdtree

args = json.loads(sys.argv[sys.argv.index('--') + 1]) if '--' in sys.argv else {}
P = {
    'out': '/tmp/explorer.png', 'frame': 'bust', 'size': 900, 'samples': 128,
    'skin': '#BC7A50', 'hair': '#24170F', 'iris': '#5A3218', 'shirt': '#D9677A', 'pants': '#2E3A63', 'shoe': '#E2B04A',
    'hairKind': 'long', 'seed': 3, 'yaw': -16,
}
P.update(args)
random.seed(P['seed']); rng = np.random.default_rng(P['seed'])

def lin(h, k=1.0):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v / 12.92) if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) * k for v in c)

def lmix(a, b, t):
    return tuple(x + (y - x) * t for x, y in zip(a, b))

# ------------------------------------------------------------------ scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'; prefs.get_devices()
    for d in prefs.devices: d.use = True
    scene.cycles.device = 'GPU'
except Exception as e:
    print('GPU setup skipped:', e)
scene.cycles.samples = P['samples']; scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = P['size']
scene.render.resolution_y = int(P['size'] * (1.0 if P['frame'] == 'bust' else 1.6))
scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'
try:
    scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'AgX - Medium High Contrast'
except Exception:
    pass
world = bpy.data.worlds.new('w'); scene.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = lin('#F3E6D2') + (1,)
world.node_tree.nodes['Background'].inputs[1].default_value = 0.45

def link(o):
    scene.collection.objects.link(o); return o

def principled(name, color=None, rough=0.5, sss=0.0, sss_radius=(1.0, 0.4, 0.22), sss_scale=0.05, coat=0.0, coat_rough=0.03, sheen=0.0, spec=0.5, use_vcol=False, bump=0.0, bump_scale=60.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    def setin(k, v):
        if b.inputs.get(k) is not None: b.inputs[k].default_value = v
    if color is not None: setin('Base Color', tuple(color) + (1,))
    setin('Roughness', rough); setin('Subsurface Weight', sss); setin('Subsurface Radius', sss_radius); setin('Subsurface Scale', sss_scale)
    setin('Coat Weight', coat); setin('Coat Roughness', coat_rough); setin('Sheen Weight', sheen); setin('Specular IOR Level', spec)
    if use_vcol:
        ca = nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'col'
        nt.links.new(ca.outputs['Color'], b.inputs['Base Color'])
    if bump:
        tx = nt.nodes.new('ShaderNodeTexNoise'); tx.inputs['Scale'].default_value = bump_scale; tx.inputs['Detail'].default_value = 6
        bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump
        nt.links.new(tx.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m

def hair_mat(name, color, rough=0.32, radial=0.35, coat=0.15):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    out = nt.nodes['Material Output']; nt.nodes.remove(nt.nodes['Principled BSDF'])
    h = nt.nodes.new('ShaderNodeBsdfHairPrincipled')
    lum = 0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2]
    sat = (max(color) - min(color)) / (max(color) + 1e-6)
    natural = color[0] >= color[1] >= color[2] and sat > 0.2
    if natural:
        h.parametrization = 'MELANIN'
        h.inputs['Melanin'].default_value = float(min(0.97, max(0.12, 1.0 - lum * 3.2)))
        h.inputs['Melanin Redness'].default_value = float(min(1.0, 0.45 * (color[0] - color[2]) / (color[0] + 1e-6)))
    else:
        h.parametrization = 'COLOR'
        h.inputs['Color'].default_value = tuple(color) + (1,)
    h.inputs['Roughness'].default_value = rough
    if h.inputs.get('Radial Roughness') is not None: h.inputs['Radial Roughness'].default_value = radial
    if h.inputs.get('Coat') is not None: h.inputs['Coat'].default_value = coat
    if h.inputs.get('Random Roughness') is not None: h.inputs['Random Roughness'].default_value = 0.4
    if h.inputs.get('Random Color') is not None: h.inputs['Random Color'].default_value = 0.15
    nt.links.new(h.outputs[0], out.inputs['Surface'])
    return m

SKIN_C = lin(P['skin']); HAIR_C = lin(P['hair'])
SKIN_V = principled('skinv', rough=0.52, sss=0.22, sss_radius=(0.7, 0.32, 0.2), sss_scale=0.035, spec=0.4, use_vcol=True)
SKIN_F = principled('skinf', SKIN_C, rough=0.52, sss=0.22, sss_radius=(0.7, 0.32, 0.2), sss_scale=0.035, spec=0.4)
HAIR = hair_mat('hair', HAIR_C)
BROW = hair_mat('brow', tuple(c * 0.7 for c in HAIR_C), rough=0.45)
LASH = hair_mat('lash', lin('#120A08'), rough=0.5)
LASHLINE = principled('lashline', lin('#140C0A'), rough=0.55)
SHIRT = principled('shirt', lin(P['shirt']), rough=0.8, sheen=0.5, bump=0.25, bump_scale=140)
PANTS = principled('pants', lin(P['pants']), rough=0.85, sheen=0.4, bump=0.25, bump_scale=140)
SHOE = principled('shoe', lin(P['shoe']), rough=0.38, coat=0.4)
SOLE = principled('sole', lin('#F4EEE4'), rough=0.6)

# ------------------------------------------------------------------ eye material
def eye_mat():
    iris = lin(P['iris'])
    m = bpy.data.materials.new('eye'); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nrm = nt.nodes.new('ShaderNodeVectorMath'); nrm.operation = 'NORMALIZE'; nt.links.new(tc.outputs['Object'], nrm.inputs[0])
    dot = nt.nodes.new('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'; dot.inputs[1].default_value = (0, -1, 0)
    nt.links.new(nrm.outputs[0], dot.inputs[0])
    ramp = nt.nodes.new('ShaderNodeValToRGB'); cr = ramp.color_ramp
    stops = [(0.0, lin('#D8C2BC')), (0.55, lin('#F1EAE6')), (0.83, lin('#EDE4E0')), (0.842, lin('#1A0E0A')),
             (0.858, tuple(c * 0.55 for c in iris)), (0.905, iris), (0.94, lmix(iris, lin('#C08040'), 0.3)), (0.958, lmix(iris, lin('#D09050'), 0.2)),
             (0.963, (0.006, 0.004, 0.004)), (1.0, (0.004, 0.003, 0.003))]
    cr.elements[0].position, cr.elements[0].color = stops[0][0], stops[0][1] + (1,)
    cr.elements[1].position, cr.elements[1].color = stops[-1][0], stops[-1][1] + (1,)
    for pos, col in stops[1:-1]:
        e = cr.elements.new(pos); e.color = col + (1,)
    nt.links.new(dot.outputs['Value'], ramp.inputs['Fac'])
    # Iris fibers: streaky noise around the pupil.
    noise = nt.nodes.new('ShaderNodeTexWave'); noise.wave_type = 'RINGS'; noise.rings_direction = 'Y'
    noise.inputs['Scale'].default_value = 0.0; noise.inputs['Distortion'].default_value = 12; noise.inputs['Detail'].default_value = 6
    vor = nt.nodes.new('ShaderNodeTexNoise'); vor.inputs['Scale'].default_value = 26; vor.inputs['Detail'].default_value = 8
    nt.links.new(nrm.outputs[0], vor.inputs['Vector'])
    mul = nt.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs['Factor'].default_value = 0.35
    nt.links.new(ramp.outputs['Color'], mul.inputs['A']); nt.links.new(vor.outputs['Color'], mul.inputs['B'])
    nt.links.new(mul.outputs['Result'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.35
    b.inputs['Coat Weight'].default_value = 1.0; b.inputs['Coat Roughness'].default_value = 0.02
    b.inputs['Subsurface Weight'].default_value = 0.08
    return m
EYE = eye_mat()

# ------------------------------------------------------------------ the head
HZ = 3.86
EX, EZ = 0.19, 0.03          # eye centers (local)
ER = 0.104                   # eyeball radius

def g(x, z, cx, cz, sx, sz):
    return np.exp(-(((x - cx) / sx) ** 2 + ((z - cz) / sz) ** 2))

def g2(x, z, cx, cz, sx, sz):
    return g(x, z, cx, cz, sx, sz) + g(x, z, -cx, cz, sx, sz)

def sig(t):
    return 1 / (1 + np.exp(-np.clip(t, -40, 40)))

def mouth_geom(x):
    mz = -0.318 + 0.03 * (x / 0.15) ** 2                     # the mouth line, corners up (a smile)
    ut = mz + 0.05 + 0.009 * np.exp(-((np.abs(x) - 0.034) / 0.022) ** 2) - 0.008 * np.exp(-(x / 0.014) ** 2) - 0.012 * (x / 0.14) ** 2
    lb = mz - 0.07 * np.clip(1 - (x / 0.13) ** 2, 0, 1) ** 0.7 - 0.004
    return mz, ut, lb

bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=7, radius=1.0)
head_me = bpy.data.meshes.new('head'); bm.to_mesh(head_me); bm.free()
N = len(head_me.vertices)
d = np.empty(N * 3); head_me.vertices.foreach_get('co', d); d = d.reshape(-1, 3); d /= np.linalg.norm(d, axis=1)[:, None]
x = d[:, 0] * 0.50; y = d[:, 1] * 0.53; z = d[:, 2] * 0.60
z = np.where(z < 0, z * 0.84, z * 0.95)
kk = np.clip(-d[:, 2] / 0.9, 0, 1)
x = np.sign(d[:, 0]) * np.abs(d[:, 0]) ** (1 - 0.2 * kk) * 0.52
k = np.clip((0.04 - z) / 0.64, 0, 1)
x = x * (1 - 0.2 * k ** 1.8)                                   # jaw tapers to the chin
y = np.where(y < 0, y * 0.92 * (1 - 0.14 * k ** 2), y * 1.07)   # flatter face, fuller skull
y = np.where((y > 0) & (z < -0.1), y * (1 - 0.4 * np.clip((-0.1 - z) / 0.5, 0, 1)), y)  # nape
front = np.clip((-d[:, 1] - 0.05) / 0.45, 0, 1) ** 0.8

bump = np.zeros(N)
bump -= 0.035 * g2(x, z, EX, EZ, 0.11, 0.08)                    # soft sockets
bump += 0.032 * g(x, z, 0, 0.17, 0.34, 0.05)                    # brow ridge
bump += 0.018 * g2(x, z, 0.2, 0.155, 0.11, 0.04)
nb = np.clip((0.05 - z) / 0.22, 0, 1)                           # nose: bridge grows toward the tip
bump += (0.012 + 0.07 * nb ** 1.4) * np.exp(-(x / (0.034 + 0.024 * nb)) ** 2) * sig((z + 0.2) / 0.012) * sig((0.08 - z) / 0.03)
bump += 0.05 * g(x, z, 0, -0.168, 0.072, 0.05)                  # rounded tip
bump += 0.036 * g2(x, z, 0.08, -0.19, 0.04, 0.036)           # wings
bump -= 0.022 * g2(x, z, 0.036, -0.218, 0.018, 0.011)          # nostrils
bump += 0.007 * g2(x, z, 0.019, -0.255, 0.008, 0.018)          # philtrum ridges
mz, ut, lb = mouth_geom(x)
wm = np.exp(-(x / 0.148) ** 6)
up = sig((ut - z) / 0.005) * sig((z - mz) / 0.004)
lo = sig((mz - z) / 0.004) * sig((z - lb) / 0.007)
bump += wm * up * (0.03 + 0.014 * np.clip((z - mz) / 0.04, 0, 1))
bump += wm * lo * (0.036 + 0.02 * np.exp(-((z - (mz - 0.03)) / 0.022) ** 2))
bump -= 0.022 * np.exp(-((z - mz) / 0.0045) ** 2) * np.exp(-(x / 0.16) ** 4)   # the lips' seam
bump -= 0.016 * g2(x, z, 0.162, -0.29, 0.014, 0.02)           # smile corners
bump -= 0.016 * g(x, z, 0, -0.4, 0.08, 0.02)                  # under the lower lip
bump += 0.03 * g(x, z, 0, -0.46, 0.1, 0.045)                  # chin
bump += 0.05 * g2(x, z, 0.26, -0.12, 0.13, 0.1)                 # cheeks
bump += 0.024 * g2(x, z, 0.2, -0.135, 0.06, 0.05)               # smiling cheek apples
y = y - bump * front

# Eyes: find the face surface in front of each eye, set the eyeball there.
def surface_y(px, pz):
    m = (np.abs(x - px) < 0.012) & (np.abs(z - pz) < 0.012) & (y < 0)
    return y[m].min()
EY = surface_y(EX, EZ) + ER * 0.80
RL = ER * 1.045            # lid sphere

def opening(u, v):
    """Is the direction (u outward, v up) inside the almond eye opening?"""
    w = 0.86
    t = np.clip(1 - (u / w) ** 2, 0, 1)
    zu = 0.40 * t ** 0.75 + 0.07 * u
    zl = -0.40 * t ** 0.9 + 0.06 * u - 0.03
    return (np.abs(u) < w) & (v < zu) & (v > zl), zu, zl

# Conform the skin around each eye onto the lid sphere; open the almond.
for s in (-1, 1):
    vx, vy, vz = x - s * EX, y - EY, z - EZ
    r = np.sqrt(vx ** 2 + vy ** 2 + vz ** 2) + 1e-9
    d2 = np.sqrt(vx ** 2 + vz ** 2)
    w = np.clip((1.45 * RL - d2) / (0.55 * RL), 0, 1) ** 1.5 * (vy < 0.02)
    inside, _, _ = opening(vx * s / r, vz / r)
    tr = np.where(inside & (vy < 0), ER * 0.85, RL + 0.003)
    x = x * (1 - w) + (s * EX + vx / r * tr) * w
    y = y * (1 - w) + (EY + vy / r * tr) * w
    z = z * (1 - w) + (EZ + vz / r * tr) * w

# ---- vertex colors: skin, blush, lips, brows, scalp ----
def hairline_mask(x, y, z, kind):
    if kind == 'curly':
        hl = np.where(y < -0.05, 0.34 - 0.3 * (x / 0.5) ** 2, np.where(y < 0.2, 0.12, -0.32))
    else:
        hl = np.where(y < -0.05, 0.31 - 0.33 * (x / 0.5) ** 2, np.where(y < 0.2, 0.1, -0.34))
    return z > hl

base = np.array(SKIN_C)
col = np.tile(base, (N, 1))
blush = np.array(lmix(SKIN_C, lin('#C83A30'), 0.4))
bm_ = np.clip(0.55 * g2(x, z, 0.25, -0.11, 0.1, 0.075) + 0.45 * g(x, z, 0, -0.17, 0.05, 0.045) + 0.2 * g(x, z, 0, -0.49, 0.07, 0.04), 0, 1)
col = col * (1 - bm_[:, None]) + blush * bm_[:, None]
lipc = np.array(lmix(SKIN_C, lin('#8A2A30'), 0.58))
mz, ut, lb = mouth_geom(x)
lm = np.clip(wm * (sig((ut - z) / 0.004) * sig((z - lb) / 0.005)), 0, 1)
upper_dark = np.where(z > mz, 0.85, 1.0)
col = col * (1 - lm[:, None]) + (lipc * upper_dark[:, None]) * lm[:, None]
seam = np.exp(-((z - mz) / 0.005) ** 2) * np.exp(-(x / 0.15) ** 4)
col *= (1 - 0.6 * seam)[:, None]
lidc = np.array(lmix(SKIN_C, lin('#B05048'), 0.18))
em = np.clip(g2(x, z, EX, EZ + 0.03, 0.12, 0.09), 0, 1) * 0.6
col = col * (1 - em[:, None]) + lidc * em[:, None]
scalp = hairline_mask(x, y, z, P['hairKind']) & ((d[:, 1] > -0.75) | (z > 0.3))
col[scalp] = np.array(HAIR_C) * 0.8
head_me.vertices.foreach_set('co', np.column_stack([x, y, z + HZ]).ravel())
ca = head_me.color_attributes.new('col', 'FLOAT_COLOR', 'POINT')
ca.data.foreach_set('color', np.column_stack([col, np.ones(N)]).ravel())
for poly in head_me.polygons: poly.use_smooth = True
head = link(bpy.data.objects.new('head', head_me)); head_me.materials.append(SKIN_V)
head_me.update()
nrm = np.empty(N * 3); head_me.vertices.foreach_get('normal', nrm); nrm = nrm.reshape(-1, 3)
HP = np.column_stack([x, y, z])  # local head positions

def sphere(name, co, r, material, scale=(1, 1, 1), seg=64):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=r)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    o = link(bpy.data.objects.new(name, me)); o.location = co; o.scale = scale; me.materials.append(material)
    return o

# Ears.
for s in (-1, 1):
    e = sphere('ear', (s * 0.485, 0.05, HZ - 0.03), 0.1, SKIN_F, (0.32, 0.62, 1.2))
    e.rotation_euler = (0, 0, s * 0.35)

# ---- eyes: eyeball, lid shell, lash line, lashes ----
def curve_tube(name, pts, radii, material, bevel):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = bevel; cu.bevel_resolution = 4; cu.use_fill_caps = True
    sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(pts) - 1)
    for bp, co, r in zip(sp.bezier_points, pts, radii):
        bp.co = co; bp.handle_left_type = bp.handle_right_type = 'AUTO'; bp.radius = r
    o = link(bpy.data.objects.new(name, cu)); o.data.materials.append(material)
    return o

HAIR_DATA = {}

def make_hair(name, strands, r_root, r_tip, material):
    HAIR_DATA[name] = (strands, r_root, r_tip)
    hc = bpy.data.hair_curves.new(name)
    hc.add_curves([len(s) for s in strands])
    pos = np.concatenate(strands).astype(np.float32)
    hc.position_data.foreach_set('vector', pos.ravel())
    rad = np.concatenate([np.linspace(r_root, r_tip, len(s)) for s in strands]).astype(np.float32)
    ra = hc.attributes.get('radius') or hc.attributes.new('radius', 'FLOAT', 'POINT')
    ra.data.foreach_set('value', rad)
    hc.materials.append(material)
    return link(bpy.data.objects.new(name, hc))

eye_objs = []
lash_strands = []
for s in (-1, 1):
    c = Vector((s * EX, EY, EZ + HZ))
    eb = sphere('eyeball', c, ER, EYE, seg=96); eye_objs.append(eb)
    # Lid shell with the almond opening.
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=6, radius=RL)
    kill = []
    for v in bm.verts:
        dv = v.co.normalized()
        ins, _, _ = opening(np.array([dv.x * s]), np.array([dv.z]))
        if (ins[0] and dv.y < 0) or dv.y > 0.25: kill.append(v)
    bmesh.ops.delete(bm, geom=kill, context='VERTS')
    lme = bpy.data.meshes.new('lid'); bm.to_mesh(lme); bm.free()
    for p in lme.polygons: p.use_smooth = True
    lid = link(bpy.data.objects.new('lid', lme)); lid.location = c; lme.materials.append(SKIN_F)
    so = lid.modifiers.new('thick', 'SOLIDIFY'); so.thickness = 0.011; so.offset = 1
    lid.modifiers.new('smooth', 'SUBSURF').levels = 2
    lid.modifiers['smooth'].render_levels = 2
    # Lash line along the upper lid margin, thickening outward into a small wing.
    us = np.linspace(-0.86, 0.86, 13)
    _, zu, _ = opening(us, np.zeros_like(us))
    pts = []
    for u, v in zip(us, zu):
        yy = -math.sqrt(max(0.0, 1 - u * u - v * v))
        pts.append(c + Vector((s * u, yy, v)) * (RL + 0.012))
    wing = c + Vector((s * 1.02, -0.2, zu[-1] + 0.22)) * (RL + 0.012)
    pts.append(wing)
    radii = list(np.linspace(0.5, 1.25, 13)) + [0.25]
    curve_tube('lashline', pts, radii, LASHLINE, 0.0055)
    # Individual upper lashes, longer toward the outer corner.
    for i in range(34):
        u = -0.65 + 1.5 * i / 33
        _, zu1, _ = opening(np.array([u]), np.array([0]))
        v = zu1[0]; yy = -math.sqrt(max(0.0, 1 - u * u - v * v))
        root = c + Vector((s * u, yy, v)) * (RL + 0.012)
        out = Vector((s * u, yy, v)).normalized()
        L = 0.035 + 0.03 * ((u + 0.65) / 1.5) ** 1.5
        upv = Vector((s * 0.25 * max(u, 0), 0, 1)).normalized()
        strand = [root + out * L * t * 0.6 + upv * L * (t ** 1.6) * 0.9 for t in np.linspace(0, 1, 6)]
        lash_strands.append(np.array([list(p) for p in strand]))
make_hair('lashes', lash_strands, 0.0024, 0.0005, LASH)

# Eyes look toward the camera.
for e in eye_objs:
    e.rotation_euler = (math.radians(-2), 0, math.radians(P['yaw'] * 0.85))

# ---- brows: short hairs on the skin ----
kd = kdtree.KDTree(N)
for i in np.nonzero(y < 0)[0]:
    kd.insert((x[i], z[i], 0), int(i))
kd.balance()
brow_strands = []
for s in (-1, 1):
    for i in range(950):
        t = rng.random()
        cx_ = s * (0.07 + 0.25 * t); cz_ = 0.112 + 0.07 * math.sin(min(t * 1.15, 1) * math.pi * 0.95) - 0.035 * t
        thick = 0.05 * (1 - t) ** 0.7 + 0.01
        px_, pz_ = cx_ + (rng.random() - 0.5) * 0.012, cz_ + (rng.random() - 0.5) * thick
        _, idx, _ = kd.find((px_, pz_, 0))
        root = Vector(HP[idx]) + Vector((0, 0, HZ)) + Vector(nrm[idx]) * 0.002
        n = Vector(nrm[idx])
        # Inner hairs grow up; the rest lie along the brow toward the tail.
        along = Vector((s * 1.0, 0, 0.35 - 0.9 * t)).normalized()
        dirv = (Vector((s * 0.25, 0, 1)) * max(0, 0.25 - t) * 4 + along * min(1, t * 4)).normalized()
        dirv = (dirv - n * dirv.dot(n)).normalized()
        L = 0.03 + rng.random() * 0.012
        brow_strands.append(np.array([list(root + dirv * L * u + n * 0.006 * math.sin(math.pi * u)) for u in np.linspace(0, 1, 5)]))
make_hair('brows', brow_strands, 0.0026, 0.0007, BROW)

# ------------------------------------------------------------------ body (metaballs)
def metaball(name, elems, material, res=0.016, threshold=0.6):
    mb = bpy.data.metaballs.new(name); mb.resolution = res * 2; mb.render_resolution = res; mb.threshold = threshold
    for e in elems:
        el = mb.elements.new(); el.type = e.get('type', 'ELLIPSOID'); el.co = e['co']; el.radius = e['r']; el.stiffness = e.get('stiff', 2.0)
        if 'size' in e: el.size_x, el.size_y, el.size_z = e['size']
        if 'rot' in e: el.rotation = e['rot']
    o = link(bpy.data.objects.new(name, mb))
    bpy.context.view_layer.objects.active = o
    for ob in bpy.context.view_layer.objects: ob.select_set(ob == o)
    bpy.ops.object.convert(target='MESH')
    o = bpy.context.view_layer.objects.active
    o.data.materials.clear(); o.data.materials.append(material)
    for p in o.data.polygons: p.use_smooth = True
    return o

def cap(a, b, r, stiff=2.0):
    a, b = Vector(a), Vector(b); dd = b - a
    return {'type': 'CAPSULE', 'co': tuple((a + b) / 2), 'r': r, 'size': (dd.length / 2, 1, 1), 'rot': Vector((1, 0, 0)).rotation_difference(dd.normalized()), 'stiff': stiff}

def ell(co, r, size=(1, 1, 1), stiff=2.0):
    return {'co': co, 'r': r, 'size': size, 'stiff': stiff}

SY = 3.24
ARMS = {
    'down': lambda s: ((s * 0.50, 0.06, SY - 0.1), (s * 0.60, 0.10, 2.45), (s * 0.63, 0.04, 1.95), (s * 0.645, 0.0, 1.83)),
}
skin_e = [ell((0, 0.12, SY + 0.02), 0.3, (1.45, 0.75, 0.5)),
          ell((0, 0.05, 2.88), 0.4, (1.08, 0.62, 0.95)), ell((0, 0.05, 2.52), 0.36, (1.02, 0.62, 1.0)), ell((0, 0.06, 2.2), 0.4, (1.08, 0.66, 0.72)),
          cap((-0.4, 0.07, SY - 0.1), (0.4, 0.07, SY - 0.1), 0.17, 1.4)]
for s in (-1, 1):
    sh, el, wr, hd = ARMS['down'](s)
    skin_e += [cap(sh, el, 0.165, 1.6), cap(el, wr, 0.14, 1.6), ell(hd, 0.15, (0.66, 0.52, 1.2), 1.6)]
    hip, kn, an = (s * 0.21, 0.06, 2.1), (s * 0.21, 0.03, 1.08), (s * 0.21, 0.08, 0.26)
    skin_e += [cap(hip, kn, 0.25, 1.8), cap(kn, an, 0.185, 1.8), ell((s * 0.21, 0.11, 0.82), 0.17, (1, 1, 1.7), 1.2)]
body = metaball('body', skin_e, SKIN_F)
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=False, segments=48, radius1=0.26, radius2=0.22, depth=(HZ - 0.3) - (SY - 0.12))
nk = bpy.data.meshes.new('neck'); bm.to_mesh(nk); bm.free()
for p_ in nk.polygons: p_.use_smooth = True
neck = link(bpy.data.objects.new('neck', nk)); neck.location = (0, 0.1, ((HZ - 0.3) + (SY - 0.12)) / 2); neck.scale = (1, 0.9, 1); nk.materials.append(SKIN_F)
shirt_e = [ell((0, 0.12, SY + 0.02), 0.33, (1.45, 0.78, 0.52)), ell((0, 0.05, 2.88), 0.44, (1.08, 0.64, 0.95)), ell((0, 0.05, 2.52), 0.4, (1.03, 0.64, 1.0)), cap((-0.41, 0.07, SY - 0.1), (0.41, 0.07, SY - 0.1), 0.215, 1.4)]
for s in (-1, 1):
    sh, el, _, _ = ARMS['down'](s)
    mid = tuple(a + (b - a) * 0.45 for a, b in zip(sh, el))
    shirt_e.append(cap(sh, mid, 0.205, 1.4))
shirt = metaball('shirt', shirt_e, SHIRT)
bm = bmesh.new(); bm.from_mesh(shirt.data)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.calc_center_median().z > SY - 0.1 and (f.calc_center_median().x / 0.255) ** 2 + ((f.calc_center_median().y - 0.1) / 0.235) ** 2 < 1], context='FACES')
bm.to_mesh(shirt.data); bm.free()
shirt.modifiers.new('sm', 'SUBSURF').render_levels = 1
metaball('shorts', [ell((0, 0.06, 2.22), 0.44, (1.1, 0.7, 0.72))] + [cap((s * 0.21, 0.06, 2.1), (s * 0.22, 0.05, 1.62), 0.27, 1.9) for s in (-1, 1)], PANTS)
metaball('shoes', [e for s in (-1, 1) for e in (ell((s * 0.23, -0.12, 0.13), 0.29, (0.82, 1.45, 0.62)), ell((s * 0.22, 0.05, 0.22), 0.23))], SHOE)
metaball('soles', [ell((s * 0.23, -0.09, 0.045), 0.3, (0.86, 1.5, 0.3)) for s in (-1, 1)], SOLE)

# ------------------------------------------------------------------ hair
HC = Vector((0, 0.03, HZ + 0.02))
HA = (0.545, 0.6, 0.64)

def push_out(p, margin, guard=True):
    """Keep hair outside the head and torso."""
    q = p - HC
    f = math.sqrt((q.x / HA[0]) ** 2 + (q.y / HA[1]) ** 2 + (q.z / HA[2]) ** 2)
    if f < 1 + margin:
        p = HC + q * ((1 + margin) / f)
    # shoulders and upper back
    T = Vector((0, 0.06, 2.95)); TA = (0.66, 0.42, 0.42)
    q = p - T
    f = math.sqrt((q.x / TA[0]) ** 2 + (q.y / TA[1]) ** 2 + (q.z / TA[2]) ** 2)
    if f < 1 + margin * 0.5:
        p = T + q * ((1 + margin * 0.5) / f)
    # Keep the face clear: in front of the ears, hair hangs beside the face.
    if guard and p.y < 0.12 and p.z < HZ + 0.4:
        need = (0.5 + margin) * min(1.0, (HZ + 0.4 - p.z) / 0.2)
        if abs(p.x) < need:
            p = Vector((math.copysign(abs(p.x) + (need - abs(p.x)) * 0.4, p.x if abs(p.x) > 1e-4 else 1), p.y, p.z))
    return p

def scalp_roots(count, kind):
    m = hairline_mask(x, y, z, kind) & ~((np.abs(x) > 0.4) & (z < 0.14) & (z > -0.24) & (y > -0.12) & (y < 0.2))
    idx = np.nonzero(m)[0]
    pick = rng.choice(idx, size=count, replace=False)
    return [(Vector(HP[i]) + Vector((0, 0, HZ)), Vector(nrm[i])) for i in pick]

def frame(dv):
    a = dv.cross(Vector((0, 0, 1)))
    if a.length < 1e-4: a = dv.cross(Vector((1, 0, 0)))
    a.normalize(); return a, dv.cross(a).normalized()

def children(guide, n, spread, clump, frizz, rs):
    out = []
    G = np.array([list(p) for p in guide]); L = len(G)
    tang = np.gradient(G, axis=0); tang /= np.linalg.norm(tang, axis=1)[:, None] + 1e-9
    frames = [frame(Vector(t)) for t in tang]
    for _ in range(n):
        a, b = (rs.random() * 2 - 1, rs.random() * 2 - 1)
        while a * a + b * b > 1: a, b = (rs.random() * 2 - 1, rs.random() * 2 - 1)
        ph = rs.random() * 6.28
        pts = []
        for j in range(L):
            t = j / (L - 1)
            r = spread * (1 - clump * t ** 0.8)
            e1, e2 = frames[j]
            fz = frizz * t * math.sin(j * 1.7 + ph)
            pts.append(G[j] + np.array(e1) * (a * r + fz) + np.array(e2) * (b * r))
        out.append(np.array(pts))
    return out

strands = []
kind = P['hairKind']
rs = random.Random(P['seed'])
if kind == 'long':
    roots = scalp_roots(700, kind)
    for gi, (r, n) in enumerate(roots):
        layer = rs.random()
        side = 1 if r.x >= 0 else -1
        dv = Vector((side * (0.35 + 0.5 * min(1, abs(r.x) / 0.3)), 1.0 if r.y < 0 else 0.3, 0.15 if r.y < 0 else -0.2)); dv = (dv - n * dv.dot(n)).normalized() + n * 0.3
        p = r + n * 0.004; pts = [p.copy()]
        length = 1.55 + rs.random() * 0.35; step = 0.045; sarc = 0; left = None
        ph = rs.random() * 6.28; amp = 0.035 + 0.02 * rs.random()
        for j in range(int(length / step)):
            dv = (dv.normalized() + Vector((0, 0.05, -0.3))).normalized()
            q = push_out(p + dv * step, 0.02 + 0.05 * layer)
            dv = (q - p).normalized(); p = q; sarc += step
            pts.append(p.copy())
        # Waves: sideways S-curves that grow toward the ends.
        P2 = []
        for j, q in enumerate(pts):
            t = j / (len(pts) - 1)
            rad = Vector((q.x, q.y - 0.05, 0)); rad = rad.normalized() if rad.length > 1e-4 else Vector((1, 0, 0))
            tan = Vector((-rad.y, rad.x, 0))
            w = amp * min(1, max(0, (t - 0.18) / 0.3)) * math.sin(t * 13 + ph)
            P2.append(q + tan * w + rad * abs(w) * 0.6)
        strands += children(P2, 15, 0.03, 0.6, 0.004, rs)
    make_hair('hair', strands, 0.0032, 0.0012, HAIR)
elif kind == 'short':
    roots = scalp_roots(900, kind)
    W = Vector((0.08, 0.28, HZ + 0.52))
    for r, n in roots:
        layer = rs.random()
        dv = r - W; dv = Vector((dv.x, dv.y - 0.2, dv.z * 0.2))
        dv = (dv - n * dv.dot(n)).normalized() + n * 0.35
        p = r + n * 0.004; pts = [p.copy()]
        length = (0.12 if r.y < -0.25 else 0.2) + rs.random() * 0.08; step = 0.02
        for j in range(int(length / step)):
            q0 = p - HC; nl = Vector((q0.x / HA[0] ** 2, q0.y / HA[1] ** 2, q0.z / HA[2] ** 2)).normalized()
            dv = dv.normalized(); dv = (dv - nl * dv.dot(nl) * 0.7 + Vector((0, 0, -0.03))).normalized()
            q = push_out(p + dv * step, 0.012 + 0.035 * layer, guard=False)
            if q.y < 0.1 and q.z < HZ + 0.24 - 0.5 * max(0, abs(q.x) - 0.3): break
            dv = (q - p).normalized(); p = q; pts.append(p.copy())
        if len(pts) < 3: continue
        strands += children(pts, 8, 0.014, 0.75, 0.0, rs)
    make_hair('hair', strands, 0.003, 0.0012, HAIR)
else:  # curly
    roots = scalp_roots(1500, kind)
    for r, n in roots:
        length = 0.2 + rs.random() * 0.12
        R = 0.016 + rs.random() * 0.008; turns = length / 0.045; ph = rs.random() * 6.28
        e1, e2 = frame(n)
        dv = (n + Vector((0, 0, -0.25))).normalized()
        pts = []
        for j in range(40):
            t = j / 39
            ctr = r + n * 0.004 + dv * length * t + Vector((0, 0, -0.06)) * t * t
            a = t * turns * 6.283 + ph
            rr = R * min(1, t * 6)
            pts.append(ctr + e1 * math.cos(a) * rr + e2 * math.sin(a) * rr)
        strands += children(pts, 6, 0.0045, 0.2, 0.0015, rs)
    make_hair('hair', strands, 0.0034, 0.002, HAIR)

if P.get('glb'):
    import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import export_glb
    export_glb.run(globals())
    raise SystemExit(0)

# ------------------------------------------------------------------ turn the explorer, light, camera
root = link(bpy.data.objects.new('root', None))
for o in list(scene.collection.objects):
    if o is not root and o.parent is None and o.type in {'MESH', 'CURVE', 'CURVES'}:
        o.parent = root
root.rotation_euler = (0, 0, math.radians(P['yaw']))

def area(name, loc, target, power, size, color='#FFFFFF'):
    l = bpy.data.lights.new(name, 'AREA'); l.energy = power; l.size = size; l.color = lin(color)
    o = link(bpy.data.objects.new(name, l)); o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()

tgt = (0, 0, HZ - 0.1) if P['frame'] == 'bust' else (0, 0, 2.4)
area('key', (-4.0, -2.6, HZ + 2.0), tgt, 1300, 1.6, '#FFF1DE')
area('fill', (3.6, -2.8, HZ - 0.3), tgt, 260, 3.2, '#DDE6FF')
area('rim', (2.6, 3.0, HZ + 1.4), tgt, 1100, 1.6, '#FFE0B4')
area('rim2', (-2.6, 2.8, HZ + 0.4), tgt, 500, 1.6, '#FFE8CC')

cam = bpy.data.cameras.new('cam')
co = link(bpy.data.objects.new('cam', cam)); scene.camera = co
if P['frame'] == 'bust':
    cam.lens = 85; co.location = (0, -5.4, HZ - 0.12); look = (0, 0, HZ - 0.22)
else:
    cam.lens = 50; co.location = (0, -8.6, 2.6); look = (0, 0, 2.35)
co.rotation_euler = (Vector(look) - co.location).to_track_quat('-Z', 'Y').to_euler()

scene.render.filepath = P['out']
bpy.ops.render.render(write_still=True)
print('rendered', P['out'])

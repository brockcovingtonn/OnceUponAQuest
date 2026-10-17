# 3D explorer avatar: asset spec

Instructions for whoever (person or AI tool) creates the 3D explorer files for the Once Upon a Quest app. Follow every "must". "Should" items are strongly preferred.

## 1. What we need

An original, stylized 3D character for a mobile app, plus swappable hairstyles and outfits. The app shows it in an interactive 3D viewer on iPhone and Android (three.js on OpenGL ES): users turn it 360°, zoom in on the face, and later change hair, clothes and accessories.

**Quality bar:** a modern animated-feature look: soft, appealing, sculpted forms, warm subsurface-looking skin, expressive eyes, sculpted hair with clumps and sheen, cloth with folds. This is a *quality* target only (see section 2).

**Character:**
- A friendly young explorer, about 4 heads tall (stylized proportions: big head, slim but not stick-thin limbs, slightly large hands and feet).
- Face: an oval face; large almond-shaped eyes with detailed irises, a visible upper lid and a lash line; full, defined eyebrows; a small rounded nose; full lips in a gentle closed smile.
- Neutral, relaxed A-pose (arms about 45° down from horizontal), facing forward, standing on the ground.

## 2. Legal rules (must)

The app is an unofficial fan app. Everything must be original.

- Must not resemble any existing character from any studio (no Moana, no Pixar or Disney characters, no recognizable likeness).
- No Disney IP anywhere: no Mickey or Minnie ears, no three-circle head-and-ears shapes, no logos, characters or lettering on clothes or accessories. Clothing graphics, if any, are plain or original simple patterns.
- No real brands or logos (no sneaker swooshes, etc.).

## 3. File format (must)

- **glTF 2.0 binary (.glb)**, one file per piece (see section 6).
- **Y-up, 1 unit = 1 meter.** The character is about 1.4 m tall, centered on x = 0, z = 0, feet resting on y = 0, **facing +Z**.
- **Do not use compression extensions:** no Draco (`KHR_draco_mesh_compression`), no Meshopt, no KTX2/Basis textures. Plain glTF buffers only.
- Textures embedded in the .glb as **PNG or JPEG**, power-of-two sizes, **1024 × 1024 max** per texture (2048 only for the face/body if really needed).
- Materials: standard glTF **PBR metallic-roughness** (base color, normal, and an occlusion-roughness-metallic texture where useful). Metallic 0 for skin, hair and cloth.
- No transparent-blend materials except the eye's outer cornea if used. Hair cards and lashes use **alpha mask** (`alphaMode: MASK`), not `BLEND`.
- Validate every file with the Khronos glTF Validator (https://github.khronos.org/glTF-Validator/): **zero errors**.

## 4. Performance budget (must)

The base character wearing one hairstyle and one outfit, all together:

- **≤ 60,000 triangles** total (target 40–50k). Face and hands get the most detail.
- **≤ 25 meshes / draw calls** total, **≤ 10 materials**.
- Base file **≤ 4 MB**; each hair or outfit file **≤ 1.5 MB**.
- Hair: sculpted clump meshes and/or alpha-masked **hair cards**, never thousands of individual strand tubes. Keep overlapping layers to a minimum (overdraw is expensive on phones).

## 5. Skeleton (must)

One humanoid skeleton, shared by the base and every hair, outfit and accessory file: **same bone names, same hierarchy, same rest pose** in every file, so pieces can be swapped on the same body.

Bone names (exactly these):

```
root
└─ hips
   ├─ spine ─ chest ─ neck ─ head
   │                  ├─ shoulder_L ─ upper_arm_L ─ forearm_L ─ hand_L
   │                  └─ shoulder_R ─ upper_arm_R ─ forearm_R ─ hand_R
   ├─ thigh_L ─ shin_L ─ foot_L
   └─ thigh_R ─ shin_R ─ foot_R
```

- Finger bones are optional (`index_1_L` etc.). If you add them, use the same names in every file.
- `chest` and `head` must exist; the app animates them for a gentle idle.
- (If your tool can only produce a Mixamo skeleton, `mixamorig:*` names are acceptable. Say so when you hand over the files, and use them consistently.)
- Skin weights: at most 4 influences per vertex, normalized; clean deformation at the shoulders, elbows, hips and knees.
- Hair and head accessories are skinned (or parented) to `head`.

Optional, welcome:
- Animation clips named `idle`, `wave`, `cheer` (2–4 s loops, 30 fps).
- Face blend shapes (morph targets) named `smile`, `blink_L`, `blink_R`, `brows_up`, `mouth_open`.

## 6. Files and naming (must)

### Files

| File | Contains |
|---|---|
| `explorer_base.glb` | Body, head, eyes, brows, lashes, teeth/tongue (if any), the skeleton. Wearing simple neutral underlayer only (fitted tank top and shorts), no hair. |
| `hair_<style>.glb` | One hairstyle each (see list below). |
| `outfit_<id>.glb` | One outfit each: top and bottom (and shoes, if they belong to the outfit). |
| `shoes_<id>.glb` | Shoes sold separately (optional). |
| `accessory_<id>.glb` | Hats, bags, held items (optional). |

**Hairstyles** (8; match the app's existing options): `crop` (short crop), `swoop` (swept fringe), `bob`, `long`, `curls` (full, voluminous natural curls), `ponytail`, `braids` (two braids), `shaved`.

**First outfits** (3 starters): `explorer-tee` (gold tee, navy shorts, brown sneakers), `picnic-overalls` (cream tee, green overalls), `cozy-sweater` (rose sweater, navy skirt, dark tights).

Brand colors for clothes: Midnight `#1B2340`, Storybook Gold `#E2B04A`, Parchment `#FAF5EA`, Ink `#2A2A33`, Rose `#D9677A`, Fern `#4F9D7A`.

### Mesh names

Every mesh's name starts with its slot, so the app can find and swap it:

- `body_` (skin, ears, teeth): e.g. `body_skin`, `body_teeth`
- `face_` (eyes, iris, brows, lashes): e.g. `face_eye_L`, `face_eye_R`, `face_brows`, `face_lashes`
- `hair_` e.g. `hair_long`
- `top_`, `bottom_`, `shoes_`, `accessory_` e.g. `top_explorer-tee`, `bottom_explorer-tee`, `shoes_sneakers`
- Clothes must not let the body poke through in the rest pose or in the idle/wave/cheer poses. Hide or delete body faces fully covered by clothing only if they are on separate `body_` meshes the app can toggle; otherwise keep the body whole and fit clothes slightly outside it.

### Material names (so the app can recolor)

The app lets users pick a skin tone (6), hair color (7) and eye color (5), so these materials must be **named exactly** and textured so a color multiply works:

- `skin`: base color texture in light, low-saturation tones (the app multiplies it by the chosen skin tone). Keep blush, lips and shading detail in the texture.
- `hair`: base color texture in light grey with darker roots and lighter tips (multiplied by the chosen hair color).
- `iris`: light grey iris texture with fibers and a darker limbal ring (multiplied by the chosen eye color).
- All other materials: any name, final colors baked in.

Also export one preview with the default colors applied (for example warm medium skin, dark brown hair, brown eyes) so the look can be judged.

## 7. Hand-over checklist

Before handing over, confirm each item:

- [ ] Every file opens in https://gltf-viewer.donmccurdy.com and passes the Khronos validator with zero errors.
- [ ] Y-up, meters, facing +Z, feet on y = 0, about 1.4 m tall.
- [ ] Triangles, meshes, materials and file sizes are within section 4. List the numbers for each file.
- [ ] Bone names and hierarchy are identical in every file. List them once.
- [ ] Mesh names use the slot prefixes; materials `skin`, `hair`, `iris` exist and are named exactly.
- [ ] No Draco, Meshopt or KTX2. Textures are embedded PNG/JPEG, ≤ 1024 px (2048 face/body max).
- [ ] Original design: no resemblance to existing characters, no logos, no mouse-ear shapes.
- [ ] Turntable renders (front, ¾, side, back) and a face close-up of the base with the `long` hair and `explorer-tee` outfit.

Deliver the .glb files plus the renders. They go in `assets/models/` in the app repo.

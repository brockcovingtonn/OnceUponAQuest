import Ionicons from '@expo/vector-icons/Ionicons';
import { type ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ACESFilmicToneMapping,
  CircleGeometry,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';

import { Button } from '@/components/Button';
import { copy } from '@/copy';
import { type AvatarModel, type AvatarModelId, freezePose, loadAvatarModel } from '@/lib/avatar3d';
import { colors, minTouchTarget, radius, spacing, type } from '@/theme';

/** A soft neutral studio backdrop. */
const BACKDROP = '#ECE8E2';
const FOV = 30;
const PITCH_LIMIT = 0.6;
const ZOOM_MIN = 0.35;
const ZOOM_MAX = 1.35;

type View3D = { yaw: number; pitch: number; zoom: number };
const HOME: View3D = { yaw: 0.35, pitch: 0.08, zoom: 1 };

type Status = 'loading' | 'ready' | 'error';

/** Camera state for the orbit view, changed by gestures and read every frame. */
class Orbit {
  view: View3D = { ...HOME };
  private home: View3D | null = null; // set while easing back home
  private spin = 0; // leftover drag velocity, radians per frame
  private start: View3D = { ...HOME };
  private frame: number | null = null;
  private dispose: (() => void) | null = null;
  /** Something changed since the last frame was drawn. */
  dirty = true;
  /** Frames are slow (seconds each): skip easing and coasting, jump straight there. */
  slow = false;

  reset() {
    this.spin = 0;
    if (this.slow) this.view = { ...HOME };
    else this.home = { ...HOME };
    this.dirty = true;
  }
  begin() {
    this.home = null;
    this.spin = 0;
    this.start = { ...this.view };
  }
  drag(dx: number, dy: number) {
    this.view.yaw = this.start.yaw + dx * 0.012;
    this.view.pitch = clamp(this.start.pitch + dy * 0.006, -PITCH_LIMIT, PITCH_LIMIT);
    this.dirty = true;
  }
  release(velocityX: number) {
    this.spin = this.slow ? 0 : clamp(velocityX * 0.0002, -0.25, 0.25);
    this.dirty = true;
  }
  pinch(scale: number) {
    this.view.zoom = clamp(this.start.zoom / scale, ZOOM_MIN, ZOOM_MAX);
    this.dirty = true;
  }
  /** Advances easing and coasting by one frame; returns the view to draw. */
  step(): View3D {
    const v = this.view;
    if (this.home || this.spin !== 0) this.dirty = true;
    if (this.home) {
      const t = this.home;
      const turn = Math.round((v.yaw - t.yaw) / (2 * Math.PI)) * 2 * Math.PI; // shortest way round
      v.yaw += (t.yaw + turn - v.yaw) * 0.16;
      v.pitch += (t.pitch - v.pitch) * 0.16;
      v.zoom += (t.zoom - v.zoom) * 0.16;
      if (Math.abs(t.yaw + turn - v.yaw) < 0.002 && Math.abs(t.zoom - v.zoom) < 0.002) {
        this.view = { ...t };
        this.home = null;
      }
    } else if (this.spin !== 0) {
      v.yaw += this.spin;
      this.spin *= 0.93;
      if (Math.abs(this.spin) < 0.0005) this.spin = 0;
    }
    return this.view;
  }
  /** Calls `draw` on every display frame until stopped; `draw` decides whether to render. */
  loop(draw: () => void) {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    const tick = () => {
      draw();
      this.frame = requestAnimationFrame(tick);
    };
    tick();
  }
  onStop(dispose: () => void) {
    this.dispose = dispose;
  }
  stop() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.dispose?.();
    this.dispose = null;
  }
}

/**
 * Interactive 3D explorer: drag to turn all the way around, pinch to zoom,
 * double-tap or the reset button to return to the starting view.
 */
export function Avatar3DViewer({ model: modelId = 'sculpted' }: { model?: AvatarModelId }) {
  const [status, setStatus] = useState<Status>('loading');
  const [attempt, setAttempt] = useState(0);
  const [orbit] = useState(() => new Orbit());

  useEffect(() => () => orbit.stop(), [orbit]);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .maxPointers(1)
    .onStart(() => orbit.begin())
    .onUpdate((e) => orbit.drag(e.translationX, e.translationY))
    .onEnd((e) => orbit.release(e.velocityX));
  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onStart(() => orbit.begin())
    .onUpdate((e) => orbit.pinch(e.scale));
  const doubleTap = Gesture.Tap()
    .runOnJS(true)
    .numberOfTaps(2)
    .onEnd(() => orbit.reset());

  const gestures = Gesture.Simultaneous(pan, pinch, doubleTap);

  const onContextCreate = useCallback(
    async (gl: ExpoWebGLRenderingContext) => {
      try {
        const model = await loadAvatarModel(modelId);
        startScene(gl, model, orbit);
        setStatus('ready');
      } catch (e) {
        if (__DEV__) console.warn('3D viewer failed', e);
        setStatus('error');
      }
    },
    [orbit, modelId],
  );

  if (status === 'error') {
    return (
      <View style={[styles.stage, styles.center]}>
        <Text style={styles.message} accessibilityLiveRegion="polite">
          {copy.avatar3d.loadError}
        </Text>
        <Button
          label={copy.common.retry}
          onPress={() => {
            setStatus('loading');
            setAttempt((a) => a + 1);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.stage}>
      <GestureDetector gesture={gestures}>
        <View
          style={StyleSheet.absoluteFill}
          accessible
          accessibilityRole="image"
          accessibilityLabel={copy.avatar3d.viewerLabel}
          accessibilityHint={copy.avatar3d.viewerHint}>
          <GLView key={`${modelId}-${attempt}`} style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
        </View>
      </GestureDetector>
      {status === 'loading' ? (
        <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.midnight} accessibilityLabel={copy.avatar3d.loading} />
        </View>
      ) : null}
      <Pressable
        onPress={() => orbit.reset()}
        accessibilityRole="button"
        accessibilityLabel={copy.avatar3d.reset}
        accessibilityHint={copy.avatar3d.resetHint}
        style={({ pressed }) => [styles.reset, pressed && styles.pressed]}>
        <Ionicons name="refresh" size={20} color={colors.midnight} />
        <Text style={styles.resetText}>{copy.avatar3d.reset}</Text>
      </Pressable>
    </View>
  );
}

/** Builds the lit scene around the model and starts drawing (only when something changes). */
function startScene(gl: ExpoWebGLRenderingContext, model: AvatarModel, orbit: Orbit) {
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  const canvas = {
    width,
    height,
    style: {},
    clientHeight: height,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as HTMLCanvasElement;
  markWebGL2(gl);
  const renderer = new WebGLRenderer({ canvas, context: gl as unknown as WebGL2RenderingContext, antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  scene.background = new Color(BACKDROP);
  // Soft studio light: a big hemisphere wash, a warm key, a cool fill and a rim.
  scene.add(new HemisphereLight(0xffffff, 0xd9cfbf, 1.5));
  const key = new DirectionalLight(0xfff1de, 2.2);
  key.position.set(-2.5, 3.5, 3.5);
  const fill = new DirectionalLight(0xdfe7ff, 0.8);
  fill.position.set(3, 1.5, 2.5);
  const rim = new DirectionalLight(0xffe6c4, 1.4);
  rim.position.set(1.5, 3, -3.5);
  scene.add(key, fill, rim);
  // A soft contact shadow: stacked, fading discs under the feet.
  for (let i = 0; i < 6; i++) {
    const r = model.width * (0.35 + i * 0.09);
    const disc = new Mesh(
      new CircleGeometry(r, 48),
      new MeshBasicMaterial({ color: 0x1b2340, transparent: true, opacity: 0.05, depthWrite: false }),
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.002 + i * 0.0005;
    scene.add(disc);
  }
  scene.add(model.root);

  const camera = new PerspectiveCamera(FOV, width / height, 0.05, 100);
  const fitDistance = (model.height * 0.62) / Math.tan(((FOV / 2) * Math.PI) / 180);
  const look = new Vector3();

  // A gentle idle: breathing in the chest and a slow look around (rigged models only).
  const chest = model.bones.get('chest');
  const head = model.bones.get('head');
  const rest = { chest: chest?.rotation.x ?? 0, head: head?.rotation.y ?? 0 };
  const started = Date.now();
  // The idle only runs while frames are cheap (a real phone); on a slow GPU
  // (like the simulator) we draw only when the view changes.
  let idle = chest !== undefined || head !== undefined;
  let drawn = 0;
  const render = () => {
    const v = orbit.step();
    if (!orbit.dirty && !idle) return;
    orbit.dirty = false;
    if (idle) {
      const t = (Date.now() - started) / 1000;
      if (chest) chest.rotation.x = rest.chest + Math.sin(t * 1.6) * 0.015;
      if (head) head.rotation.y = rest.head + Math.sin(t * 0.5) * 0.08;
    }
    // Zooming in drifts the aim up toward the face.
    const closeness = clamp((1 - v.zoom) / (1 - ZOOM_MIN), 0, 1);
    look.set(0, model.height * (0.5 + 0.38 * closeness), 0);
    const d = fitDistance * v.zoom;
    camera.position.set(
      look.x + Math.sin(v.yaw) * Math.cos(v.pitch) * d,
      look.y + Math.sin(v.pitch) * d,
      look.z + Math.cos(v.yaw) * Math.cos(v.pitch) * d,
    );
    camera.lookAt(look);
    renderer.render(scene, camera);
    gl.endFrameEXP();
    // Wait for the GL thread to finish this frame before queuing the next one.
    // Without this, a slow GPU (or the simulator) falls further behind every
    // frame and never gets to present anything.
    const t0 = Date.now();
    gl.flushEXP();
    const gpuMs = Date.now() - t0;
    // The first frames include shader compiles and uploads, so judge speed after them.
    drawn++;
    if (drawn < 3) {
      orbit.dirty = true; // keep drawing until speed can be judged
      return;
    }
    if (gpuMs > 60 && idle) {
      // Too slow to animate: stop the idle and draw the rest pose without skinning.
      idle = false;
      if (freezePose(model) > 0) orbit.dirty = true;
    }
    orbit.slow = gpuMs > 250;
  };
  orbit.loop(render);

  orbit.onStop(() => {
    scene.traverse((o) => {
      if (o instanceof Mesh) {
        o.geometry.dispose();
        const m = o.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
    });
    renderer.dispose();
  });
}

/**
 * three.js (r162) decides WebGL 2 by the context's constructor name, which
 * expo-gl's context doesn't carry. Without this it takes the WebGL 1 path on
 * a WebGL 2 context and draws nothing.
 */
function markWebGL2(gl: ExpoWebGLRenderingContext) {
  if (!(gl as unknown as { supportsWebGL2?: boolean }).supportsWebGL2) return;
  const ctor = function () {};
  Object.defineProperty(ctor, 'name', { value: 'WebGL2RenderingContext' });
  Object.defineProperty(gl, 'constructor', { value: ctor, configurable: true });
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: BACKDROP,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  message: {
    ...type.body,
    color: colors.ink,
    textAlign: 'center',
  },
  reset: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: minTouchTarget / 2,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  resetText: {
    ...type.label,
    color: colors.midnight,
  },
});

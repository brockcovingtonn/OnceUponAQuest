import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated';

/** A rectangle in content pixels. */
export type FocusRect = { x: number; y: number; w: number; h: number };

type Props = {
  /** Size of the content in its own pixels (it's drawn once at this size, then scaled). */
  contentWidth: number;
  contentHeight: number;
  /** The part of the content to show; the view glides there whenever `focusKey` changes. */
  focus: FocusRect;
  focusKey: string;
  /** Largest zoom, relative to the content's own size (keep it near 1 for crisp art). */
  maxScale?: number;
  reduceMotion?: boolean;
  children: ReactNode;
};

const ZoomContext = createContext<SharedValue<number> | null>(null);

function clamp(v: number, lo: number, hi: number) {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
}

/** Keeps the content covering the viewport: no gaps at the edges. */
function clampOffset(offset: number, scale: number, viewport: number, content: number) {
  'worklet';
  const scaled = content * scale;
  if (scaled <= viewport) return (viewport - scaled) / 2;
  return clamp(offset, viewport - scaled, 0);
}

/**
 * A full-bleed, pinch-to-zoom and drag-to-pan view over a large drawing.
 * Double-tap zooms in around the tap (or back out at the closest zoom).
 */
export function ZoomableCanvas({ contentWidth, contentHeight, focus, focusKey, maxScale = 1.2, reduceMotion, children }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const vw = useSharedValue(0);
  const vh = useSharedValue(0);
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const start = useSharedValue({ s: 1, x: 0, y: 0 });
  const minScale = useSharedValue(0.1);

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  }

  // Glide to the focus area whenever it (or the viewport) changes.
  const { x: fx, y: fy, w: fw, h: fh } = focus;
  useEffect(() => {
    if (!size.w || !size.h) return;
    vw.set(size.w);
    vh.set(size.h);
    // Zoom out as far as showing the whole drawing.
    const contain = Math.min(size.w / contentWidth, size.h / contentHeight);
    minScale.set(contain);
    const fit = Math.min(size.w / fw, size.h / fh) * 0.94;
    const s = clamp(fit, contain, maxScale);
    const x = clampOffset(size.w / 2 - (fx + fw / 2) * s, s, size.w, contentWidth);
    const y = clampOffset(size.h / 2 - (fy + fh / 2) * s, s, size.h, contentHeight);
    const timing = { duration: reduceMotion ? 0 : 450 };
    scale.set(withTiming(s, timing));
    tx.set(withTiming(x, timing));
    ty.set(withTiming(y, timing));
    // focusKey (not the rect) decides when to move, so pans aren't undone on re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, size.w, size.h]);

  const pinch = Gesture.Pinch()
    .onStart(() => {
      start.set({ s: scale.get(), x: tx.get(), y: ty.get() });
    })
    .onUpdate((e) => {
      const s = clamp(start.get().s * e.scale, minScale.get(), maxScale);
      const k = s / start.get().s;
      scale.set(s);
      tx.set(clampOffset(e.focalX - (e.focalX - start.get().x) * k, s, vw.get(), contentWidth));
      ty.set(clampOffset(e.focalY - (e.focalY - start.get().y) * k, s, vh.get(), contentHeight));
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onStart(() => {
      start.set({ s: scale.get(), x: tx.get(), y: ty.get() });
    })
    .onUpdate((e) => {
      tx.set(clampOffset(start.get().x + e.translationX, scale.get(), vw.get(), contentWidth));
      ty.set(clampOffset(start.get().y + e.translationY, scale.get(), vh.get(), contentHeight));
    })
    .onEnd((e) => {
      const sx = contentWidth * scale.get();
      const sy = contentHeight * scale.get();
      if (sx > vw.get()) tx.set(withDecay({ velocity: e.velocityX, clamp: [vw.get() - sx, 0] }));
      if (sy > vh.get()) ty.set(withDecay({ velocity: e.velocityY, clamp: [vh.get() - sy, 0] }));
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(350)
    .maxDistance(30)
    .onEnd((e) => {
      const zoomedIn = scale.get() >= maxScale * 0.95;
      const s = zoomedIn ? minScale.get() : clamp(scale.get() * 2, minScale.get(), maxScale);
      const k = s / scale.get();
      scale.set(withTiming(s, { duration: 300 }));
      tx.set(withTiming(clampOffset(e.x - (e.x - tx.get()) * k, s, vw.get(), contentWidth), { duration: 300 }));
      ty.set(withTiming(clampOffset(e.y - (e.y - ty.get()) * k, s, vh.get(), contentHeight), { duration: 300 }));
    });

  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.get() }, { translateY: ty.get() }, { scale: scale.get() }],
  }));

  return (
    <View style={styles.viewport} onLayout={onLayout}>
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[{ width: contentWidth, height: contentHeight, transformOrigin: 'top left' }, contentStyle]}>
            <ZoomContext.Provider value={scale}>{children}</ZoomContext.Provider>
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

/**
 * Places a marker of size w × h (screen points) centered on (x, y) in content
 * pixels, and keeps it the same size on screen at any zoom.
 */
export function CounterScaled({ x, y, w, h, children }: { x: number; y: number; w: number; h: number; children: ReactNode }) {
  const zoom = useContext(ZoomContext);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: zoom ? 1 / zoom.get() : 1 }] }));
  return (
    <Animated.View pointerEvents="box-none" style={[styles.anchor, { left: x - w / 2, top: y - h / 2, width: w, height: h }, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    overflow: 'hidden',
  },
  anchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

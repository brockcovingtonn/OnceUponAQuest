import { useId } from 'react';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';

import { type Color, type Palette, type Shape, stampFrame } from '@/art/shapes';

type Props = {
  shapes: Shape[];
  palette: Palette;
  size: number;
  /** Draw the round passport-stamp frame behind the glyph. */
  frame?: 'solid' | 'dashed';
  /** Canvas size; stamps use 100 × 100. Height follows the aspect ratio unless given. */
  canvas?: { width: number; height: number };
  /** Fixed height; with `crop` the drawing fills the box and is trimmed (like cover). */
  height?: number;
  crop?: boolean;
  /** Draw only this part of the canvas (a zoomed-in view). */
  view?: { x: number; y: number; w: number; h: number };
};

/** Draws artwork shapes at the given size. Decorative: label the parent. */
export function Artwork({
  shapes,
  palette,
  size,
  frame,
  canvas = { width: 100, height: 100 },
  height,
  crop = false,
  view,
}: Props) {
  const idPrefix = useId().replace(/[^a-zA-Z0-9]/g, '');
  const color = (c: Color | undefined) =>
    !c || c === 'none' ? 'none' : c.startsWith('#') ? c : palette[c as Exclude<typeof c, `#${string}`>];
  const all = frame ? [...stampFrame(frame === 'dashed'), ...shapes] : shapes;
  const gradients = all.flatMap((s, i) => (s.kind === 'gradient' ? [{ id: `${idPrefix}g${i}`, s }] : []));

  return (
    <Svg
      width={size}
      height={height ?? (view ? (size * view.h) / view.w : (size * canvas.height) / canvas.width)}
      viewBox={view ? `${view.x} ${view.y} ${view.w} ${view.h}` : `0 0 ${canvas.width} ${canvas.height}`}
      preserveAspectRatio={crop ? 'xMidYMid slice' : 'xMidYMid meet'}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {gradients.length > 0 ? (
        <Defs>
          {gradients.map(({ id, s }) =>
            s.kind === 'gradient' ? (
              <LinearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={s.from} />
                <Stop offset="1" stopColor={s.to} />
              </LinearGradient>
            ) : null,
          )}
        </Defs>
      ) : null}
      {all.map((s, i) => {
        if (s.kind === 'gradient') {
          return <Rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} fill={`url(#${idPrefix}g${i})`} />;
        }
        const paint = {
          fill: color(s.fill),
          stroke: color(s.stroke),
          strokeWidth: s.strokeWidth ?? 0,
          strokeLinecap: 'round' as const,
          strokeLinejoin: 'round' as const,
          strokeDasharray: s.dash,
          opacity: s.opacity,
        };
        switch (s.kind) {
          case 'circle':
            return <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} {...paint} />;
          case 'rect':
            return <Rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx ?? 0} {...paint} />;
          case 'path':
            return <Path key={i} d={s.d} {...paint} />;
          case 'polygon':
            return <Polygon key={i} points={s.points} {...paint} />;
          case 'line':
            return <Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} {...paint} />;
        }
      })}
    </Svg>
  );
}

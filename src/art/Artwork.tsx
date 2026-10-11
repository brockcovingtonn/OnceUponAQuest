import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';

import { type Palette, type Shape, stampFrame, type Tone } from '@/art/shapes';

type Props = {
  shapes: Shape[];
  palette: Palette;
  size: number;
  /** Draw the round passport-stamp frame behind the glyph. */
  frame?: 'solid' | 'dashed';
};

/** Draws artwork shapes (100 × 100 canvas) at the given size. Decorative: label the parent. */
export function Artwork({ shapes, palette, size, frame }: Props) {
  const color = (tone: Tone | undefined) => (!tone || tone === 'none' ? 'none' : palette[tone]);
  const all = frame ? [...stampFrame(frame === 'dashed'), ...shapes] : shapes;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {all.map((s, i) => {
        const paint = {
          fill: color(s.fill),
          stroke: color(s.stroke),
          strokeWidth: s.strokeWidth ?? 0,
          strokeLinecap: 'round' as const,
          strokeLinejoin: 'round' as const,
          strokeDasharray: s.dash,
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

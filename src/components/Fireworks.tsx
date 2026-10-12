import { StyleSheet, View } from 'react-native';

import { SparkleBurst } from '@/components/SparkleBurst';

type Burst = { top: `${number}%`; left: `${number}%`; radius: number; delay: number };

const DEFAULT_BURSTS: Burst[] = [
  { top: '18%', left: '22%', radius: 70, delay: 0 },
  { top: '10%', left: '72%', radius: 90, delay: 450 },
  { top: '34%', left: '50%', radius: 60, delay: 900 },
];

/** A few staggered sparkle bursts across the parent, like a small fireworks show. Decorative. */
export function Fireworks({ bursts = DEFAULT_BURSTS }: { bursts?: Burst[] }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {bursts.map((b, i) => (
        <View key={i} style={{ position: 'absolute', top: b.top, left: b.left, width: 2, height: 2, overflow: 'visible' }}>
          <SparkleBurst radius={b.radius} delay={b.delay} />
        </View>
      ))}
    </View>
  );
}

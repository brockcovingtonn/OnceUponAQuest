import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  type AvatarLook,
  EYE_STYLES,
  HAIR_COLORS,
  HAIR_STYLES,
  SKIN_TONES,
} from '@/art/avatar';
import { AvatarBust, AvatarFigure } from '@/components/Avatar';
import { Checkbox } from '@/components/Checkbox';
import { copy } from '@/copy';
import { colors, minTouchTarget, radius, spacing, type } from '@/theme';

const STARTER_OUTFITS = ['explorer-tee', 'picnic-overalls', 'cozy-sweater'] as const;

type Props = {
  look: AvatarLook;
  onChange: (look: AvatarLook) => void;
  /** Show the starter outfits (onboarding); later, clothes come from the wardrobe. */
  withStarterOutfit?: boolean;
};

function randomFrom<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/** Builds the explorer's look: skin, hair, eyes and freckles (and a starter outfit). */
export function AvatarMaker({ look, onChange, withStarterOutfit }: Props) {
  const set = (changes: Partial<AvatarLook>) => onChange({ ...look, ...changes });

  function surprise() {
    set({
      skin: randomFrom(Object.keys(SKIN_TONES) as AvatarLook['skin'][]),
      hair: randomFrom(HAIR_STYLES),
      hairColor: randomFrom(Object.keys(HAIR_COLORS) as AvatarLook['hairColor'][]),
      eyes: randomFrom(EYE_STYLES),
      freckles: Math.random() < 0.35,
      ...(withStarterOutfit ? { outfit: randomFrom(STARTER_OUTFITS) } : null),
    });
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.stage}>
        <AvatarFigure look={look} size={150} pose="wave" accessibilityLabel={copy.avatar.previewLabel} />
        <Pressable
          onPress={surprise}
          accessibilityRole="button"
          accessibilityLabel={copy.avatar.surprise}
          style={({ pressed }) => [styles.surprise, pressed && styles.pressed]}>
          <Ionicons name="sparkles" size={18} color={colors.midnight} />
          <Text style={styles.surpriseText}>{copy.avatar.surprise}</Text>
        </Pressable>
      </View>

      <Group title={copy.avatar.skin}>
        {(Object.keys(SKIN_TONES) as AvatarLook['skin'][]).map((key, i) => (
          <Swatch
            key={key}
            color={SKIN_TONES[key]}
            label={copy.avatar.skinOption(i + 1)}
            selected={look.skin === key}
            onPress={() => set({ skin: key })}
          />
        ))}
      </Group>

      <Group title={copy.avatar.hair}>
        {HAIR_STYLES.map((hair) => (
          <Thumb key={hair} label={copy.avatar.hairStyles[hair]} selected={look.hair === hair} onPress={() => set({ hair })}>
            <AvatarBust look={{ ...look, hair, hat: null }} size={56} />
          </Thumb>
        ))}
      </Group>

      <Group title={copy.avatar.hairColor}>
        {(Object.keys(HAIR_COLORS) as AvatarLook['hairColor'][]).map((key) => (
          <Swatch
            key={key}
            color={HAIR_COLORS[key]}
            label={copy.avatar.hairColors[key]}
            selected={look.hairColor === key}
            onPress={() => set({ hairColor: key })}
          />
        ))}
      </Group>

      <Group title={copy.avatar.eyes}>
        {EYE_STYLES.map((eyes) => (
          <Thumb key={eyes} label={copy.avatar.eyeStyles[eyes]} selected={look.eyes === eyes} onPress={() => set({ eyes })}>
            <AvatarBust look={{ ...look, eyes }} size={56} />
          </Thumb>
        ))}
      </Group>

      <Checkbox checked={look.freckles} onChange={(freckles) => set({ freckles })} accessibilityLabel={copy.avatar.freckles}>
        {copy.avatar.freckles}
      </Checkbox>

      {withStarterOutfit ? (
        <Group title={copy.avatar.outfit}>
          {STARTER_OUTFITS.map((outfit) => (
            <Thumb
              key={outfit}
              label={copy.avatar.starterOutfits[outfit]}
              selected={look.outfit === outfit}
              onPress={() => set({ outfit })}>
              <AvatarFigure look={{ ...look, outfit }} size={64} shadow={false} />
            </Thumb>
          ))}
        </Group>
      ) : null}
    </View>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={title}>
        {children}
      </View>
    </View>
  );
}

function Swatch({ color, label, selected, onPress }: { color: string; label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      hitSlop={4}
      style={[styles.swatchRing, selected && styles.selected]}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
    </Pressable>
  );
}

function Thumb({ label, selected, onPress, children }: { label: string; selected: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={[styles.thumb, selected && styles.selected]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
  },
  stage: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: '#F3E9D2',
    borderRadius: radius.lg,
  },
  surprise: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.round,
    backgroundColor: colors.storybookGold,
    marginTop: spacing.xs,
  },
  surpriseText: {
    ...type.label,
    color: colors.midnight,
  },
  pressed: {
    opacity: 0.8,
  },
  group: {
    gap: spacing.sm,
  },
  groupTitle: {
    ...type.bodyStrong,
    color: colors.midnight,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatchRing: {
    width: minTouchTarget + 4,
    height: minTouchTarget + 4,
    borderRadius: radius.round,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: minTouchTarget - 6,
    height: minTouchTarget - 6,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: {
    padding: 2,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: 'transparent',
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    borderColor: colors.storybookGold,
  },
});

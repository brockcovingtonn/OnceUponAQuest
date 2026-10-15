import { StyleSheet, Text, View } from 'react-native';

import type { AvatarLook } from '@/art/avatar';
import { sceneForQuest } from '@/art/scenes';
import { AvatarFigure } from '@/components/Avatar';
import { Flourish } from '@/components/Flourish';
import { Logo } from '@/components/Logo';
import { Scene } from '@/components/Scene';
import { copy } from '@/copy';
import { formatDate } from '@/lib/format';
import { colors, fonts, radius, spacing, type } from '@/theme';

export const SHARE_CARD_WIDTH = 320;

type Props = {
  title: string;
  questTitle: string;
  questSlug: string;
  landName: string | null;
  foundAt: string;
  /** Your explorer, posing in the scene like a postcard. */
  look?: AvatarLook | null;
};

/** A storybook card for a found spot, shared as an image. */
export function SpotShareCard({ title, questTitle, questSlug, landName, foundAt, look }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.scene}>
        <Scene shapes={sceneForQuest(questSlug)} height={150} />
        {look ? <AvatarFigure look={look} size={72} pose="wave" style={styles.me} /> : null}
        <View style={styles.stamp}>
          <Text style={styles.stampStar}>★</Text>
          <Text style={styles.stampText}>{copy.share.found}</Text>
        </View>
      </View>
      <View style={styles.body}>
        {landName ? <Text style={styles.land}>{landName.toUpperCase()}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.quest}>{copy.share.inQuest(questTitle)}</Text>
        <Flourish width={150} />
        <Text style={styles.date}>{copy.share.foundOn(formatDate(foundAt))}</Text>
      </View>
      <View style={styles.footer}>
        <Logo accessibilityLabel={copy.signIn.logoLabel} size={30} />
        <View>
          <Text style={styles.brand}>{copy.appName}</Text>
          <Text style={styles.small}>{copy.share.footer}</Text>
        </View>
        <Text style={styles.sparkles}>✦ ✦</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    borderRadius: radius.lg,
    backgroundColor: colors.midnight,
    borderWidth: 3,
    borderColor: colors.storybookGold,
    overflow: 'hidden',
  },
  scene: {
    margin: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  me: {
    position: 'absolute',
    left: 14,
    bottom: -2,
  },
  stamp: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: colors.storybookGold,
    backgroundColor: 'rgba(27, 35, 64, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-12deg' }],
  },
  stampStar: {
    color: colors.storybookGold,
    fontSize: 18,
    lineHeight: 20,
  },
  stampText: {
    fontFamily: fonts.heading,
    fontSize: 15,
    letterSpacing: 2,
    color: colors.storybookGold,
  },
  body: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  land: {
    ...type.caption,
    color: colors.storybookGold,
    letterSpacing: 2,
  },
  title: {
    ...type.title,
    color: colors.parchment,
    textAlign: 'center',
  },
  quest: {
    ...type.label,
    color: colors.parchment,
    opacity: 0.85,
    textAlign: 'center',
  },
  date: {
    ...type.label,
    color: colors.storybookGold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(250, 245, 234, 0.08)',
  },
  brand: {
    fontFamily: fonts.headingSemiBold,
    fontSize: 14,
    color: colors.parchment,
  },
  small: {
    fontSize: 10,
    color: colors.parchment,
    opacity: 0.7,
  },
  sparkles: {
    marginLeft: 'auto',
    color: colors.storybookGold,
    letterSpacing: 4,
  },
});

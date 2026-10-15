import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { AvatarLook } from '@/art/avatar';
import { AvatarFigure } from '@/components/Avatar';
import { BadgeStamp } from '@/components/BadgeStamp';
import { Flourish } from '@/components/Flourish';
import { Logo } from '@/components/Logo';
import { SHARE_CARD_WIDTH } from '@/components/share/SpotShareCard';
import { copy } from '@/copy';
import type { Milestone } from '@/lib/milestones';
import { colors, fonts, radius, spacing, type } from '@/theme';

const MAX_BADGES = 8;

type Props = {
  name: string;
  spots: number;
  snacks: number;
  lensPages: number;
  badges: { id: string; artKey: string }[];
  milestones: Milestone[];
  lands: { id: string; name: string; found: number; total: number }[];
  /** Your explorer, on the Passport page. */
  look?: AvatarLook | null;
};

/** A storybook Passport page, shared as an image. */
export function PassportShareCard({ name, spots, snacks, lensPages, badges, milestones, lands, look }: Props) {
  const shown = badges.slice(0, MAX_BADGES);
  const stats = [
    { value: spots, label: copy.share.stats.spots },
    { value: badges.length, label: copy.share.stats.badges },
    { value: snacks, label: copy.share.stats.snacks },
    { value: lensPages, label: copy.share.stats.lens },
  ];
  return (
    <View style={styles.card}>
      <View style={styles.inner}>
        <View style={styles.header}>
          {look ? <AvatarFigure look={look} size={48} pose="wave" shadow={false} /> : <Logo accessibilityLabel={copy.signIn.logoLabel} size={40} />}
          <View style={styles.headerText}>
            <Text style={styles.kicker}>{copy.appName.toUpperCase()}</Text>
            <Text style={styles.title} numberOfLines={2}>
              {copy.share.passportTitle(name)}
            </Text>
          </View>
        </View>
        <Flourish width={170} />

        <View style={styles.stats}>
          {stats.map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>{copy.share.badgesEarned}</Text>
        {shown.length ? (
          <View style={styles.badges}>
            {shown.map((b) => (
              <BadgeStamp key={b.id} artKey={b.artKey} earned size={56} />
            ))}
            {badges.length > MAX_BADGES ? <Text style={styles.more}>{copy.share.moreBadges(badges.length - MAX_BADGES)}</Text> : null}
          </View>
        ) : (
          <Text style={styles.empty}>{copy.share.noBadgesYet}</Text>
        )}

        <Text style={styles.section}>{copy.passport.milestones}</Text>
        <View style={styles.milestones}>
          {milestones.map((m) => (
            <View key={m.key} style={[styles.milestone, !m.earned && styles.milestoneLocked]}>
              <Ionicons
                name={m.icon}
                size={16}
                color={m.earned ? colors.midnight : colors.inkMuted}
              />
            </View>
          ))}
        </View>

        <View style={styles.lands}>
          {lands.map((l) => (
            <View key={l.id} style={styles.landRow}>
              <Text style={styles.landName} numberOfLines={1}>
                {l.name}
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${l.total ? (l.found / l.total) * 100 : 0}%` }]} />
              </View>
              <Text style={styles.landCount}>
                {l.found}/{l.total}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>✦ {copy.share.footer} ✦</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    padding: 6,
    borderRadius: radius.lg,
    backgroundColor: colors.midnight,
  },
  inner: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.storybookGold,
    backgroundColor: colors.parchment,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  headerText: {
    flex: 1,
  },
  kicker: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.inkMuted,
  },
  title: {
    ...type.heading,
    color: colors.midnight,
  },
  stats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: fonts.heading,
    fontSize: 24,
    lineHeight: 28,
    color: colors.midnight,
  },
  statLabel: {
    fontSize: 10,
    color: colors.inkMuted,
  },
  section: {
    alignSelf: 'flex-start',
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  more: {
    fontFamily: fonts.headingSemiBold,
    fontSize: 16,
    color: colors.midnight,
  },
  empty: {
    ...type.caption,
    color: colors.inkMuted,
  },
  milestones: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignSelf: 'flex-start',
  },
  milestone: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.storybookGold,
  },
  milestoneLocked: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  lands: {
    alignSelf: 'stretch',
    gap: 3,
    marginTop: spacing.xs,
  },
  landRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  landName: {
    width: 108,
    fontSize: 11,
    color: colors.ink,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.storybookGold,
  },
  landCount: {
    width: 34,
    fontSize: 10,
    color: colors.inkMuted,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  footer: {
    fontSize: 10,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
});

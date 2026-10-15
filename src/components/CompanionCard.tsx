import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import type { AvatarLook } from '@/art/avatar';
import type { Companion } from '@/art/companions';
import { AvatarFigure } from '@/components/Avatar';
import { colors, radius, spacing, type } from '@/theme';

type Props = {
  companion: Companion;
  /** What they say. */
  text: string;
  /** True when the text is a quote from the book (shown with the book's name). */
  quote?: boolean;
  /** A small lead-in, like "Psst!" for hints. */
  lead?: string;
  /** Your explorer, listening on the right. */
  look?: AvatarLook | null;
};

/** A story companion talking to your explorer in a speech bubble. */
export function CompanionCard({ companion, text, quote, lead, look }: Props) {
  const label = `${companion.name}: ${lead ? `${lead} ` : ''}${quote ? `"${text}"` : text}${quote ? `, ${companion.book}` : ''}`;
  const portrait = useMemo(() => companion.svg, [companion]);
  return (
    <View style={styles.card} accessible accessibilityLabel={label}>
      <View style={styles.portrait}>
        <SvgXml xml={portrait} width={56} height={56} />
      </View>
      <View style={styles.bubbleWrap}>
        <View style={styles.tail} />
        <View style={styles.bubble}>
          <Text style={styles.name}>{companion.name}</Text>
          <Text style={[styles.text, quote && styles.quote]}>
            {lead ? <Text style={styles.lead}>{lead} </Text> : null}
            {quote ? `“${text}”` : text}
          </Text>
          {quote ? <Text style={styles.book}>{companion.book}</Text> : null}
        </View>
      </View>
      {look ? <AvatarFigure look={look} size={44} pose="stand" shadow={false} style={styles.me} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  portrait: {
    width: 56,
    height: 56,
  },
  bubbleWrap: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  tail: {
    position: 'absolute',
    left: -5,
    bottom: 18,
    width: 12,
    height: 12,
    backgroundColor: colors.white,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors.storybookGold,
    transform: [{ rotate: '45deg' }],
  },
  bubble: {
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.storybookGold,
    backgroundColor: colors.white,
    gap: 2,
  },
  name: {
    ...type.label,
    color: colors.midnight,
  },
  text: {
    ...type.body,
    color: colors.ink,
  },
  quote: {
    fontStyle: 'italic',
  },
  lead: {
    ...type.bodyStrong,
    color: colors.fernText,
  },
  book: {
    ...type.caption,
    color: colors.inkMuted,
  },
  me: {
    marginBottom: -2,
  },
});

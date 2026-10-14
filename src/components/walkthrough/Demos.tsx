/**
 * Animated examples for the "How quests work" walkthrough. Each loops a tiny
 * story built from the app's own pieces. They're decorative — the page text
 * explains everything — and hold a still final frame when Reduce Motion is on.
 * Sample content is made up so no real answers are revealed.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Switch, Text, View } from 'react-native';

import { mainStreetNight } from '@/art/scenes';
import { BadgeStamp } from '@/components/BadgeStamp';
import { LensStamp } from '@/components/LensStamp';
import { ProgressRing } from '@/components/ProgressRing';
import { Scene } from '@/components/Scene';
import { SparkleBurst } from '@/components/SparkleBurst';
import { Stamp } from '@/components/Stamp';
import { PopIn } from '@/components/walkthrough/PopIn';
import { copy } from '@/copy';
import { useLoopStep } from '@/lib/useLoopStep';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, fonts, radius, spacing, type } from '@/theme';

const d = copy.walkthrough.demo;
export const STAGE_HEIGHT = 270;

/** Framed, decorative area that holds one example. */
function Stage({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <View
      style={[styles.stage, dark && styles.stageDark]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {children}
    </View>
  );
}

/** A looping value 0 → 1 → 0, for sweeps and pulses. */
function useOscillator(durationMs: number) {
  const reduced = useReducedMotion();
  const [v] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: durationMs, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: durationMs, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, durationMs, v]);
  return v;
}

/** Shakes its children whenever `trigger` changes to a truthy value. */
function Shake({ trigger, children }: { trigger: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  const [x] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced || !trigger) return;
    Animated.sequence(
      [10, -10, 7, -7, 3, 0].map((toValue) => Animated.timing(x, { toValue, duration: 50, useNativeDriver: true })),
    ).start();
  }, [trigger, reduced, x]);
  return <Animated.View style={{ transform: [{ translateX: x }] }}>{children}</Animated.View>;
}

// ---------------------------------------------------------------------------
// 1. Welcome — a quest card whose progress ring fills spot by spot
// ---------------------------------------------------------------------------
export function QuestDemo() {
  const step = useLoopStep(8, 650);
  const total = 5;
  const found = Math.min(step, total);
  return (
    <Stage>
      <View style={styles.questCard}>
        <Scene shapes={mainStreetNight} height={96} />
        <View style={styles.questBody}>
          <Text style={styles.eyebrow}>{d.chapter}</Text>
          <Text style={styles.questTitle}>{d.questTitle}</Text>
          <Text style={styles.meta}>{`${d.spots(total)} · ~15 min`}</Text>
          <View style={styles.row}>
            <ProgressRing found={found} total={total} size={34} strokeWidth={5} accessibilityLabel="" />
            <Text style={styles.label}>{d.foundOf(found, total)}</Text>
            <View style={styles.flex} />
            {found === total ? (
              <PopIn key="badge" stamp>
                <BadgeStamp artKey="badge_window" earned size={40} />
              </PopIn>
            ) : null}
          </View>
        </View>
      </View>
    </Stage>
  );
}

// ---------------------------------------------------------------------------
// 2. Find the spot — magnifier sweep, a pin on the sidewalk, then the clue
// ---------------------------------------------------------------------------
export function FindDemo() {
  const sweep = useOscillator(1400);
  const step = useLoopStep(4, 1500);
  return (
    <Stage dark>
      <View style={styles.flex}>
        <Scene shapes={mainStreetNight} height={150} />
        <Animated.View
          style={[
            styles.magnifier,
            { transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-110, 110] }) }] },
          ]}>
          <View style={styles.lens} />
          <View style={styles.handle} />
        </Animated.View>
        {step >= 1 ? (
          <PopIn key={`pin-${step >= 1}`} rise={-30} style={styles.pin}>
            <Ionicons name="location" size={30} color={colors.rose} />
          </PopIn>
        ) : null}
      </View>
      <View style={styles.clueCard}>
        <Text style={styles.cardTitle}>{d.teaser}</Text>
        {step >= 1 ? (
          <PopIn key="where">
            <Text style={styles.small}>📍 {d.whereToStand}</Text>
          </PopIn>
        ) : null}
        {step >= 2 ? (
          <PopIn key="clue">
            <Text style={styles.small}>✦ {d.clue}</Text>
          </PopIn>
        ) : null}
      </View>
    </Stage>
  );
}

// ---------------------------------------------------------------------------
// 3. Four ways to check in — cycles answer / photo / listen / snack
// ---------------------------------------------------------------------------
const METHODS = ['answer', 'photo', 'listen', 'snack'] as const;

function AnswerMini() {
  const word = d.answerExample;
  const step = useLoopStep(word.length + 4, 280);
  const typed = word.slice(0, Math.min(step, word.length));
  return (
    <View style={styles.methodBox}>
      <View style={styles.input}>
        <Text style={styles.inputText}>{typed}</Text>
        <View style={styles.caret} />
      </View>
      <View style={[styles.fakeButton, step > word.length && styles.fakeButtonPressed]}>
        <Text style={styles.fakeButtonText}>{d.checkIn}</Text>
      </View>
      {step > word.length + 1 ? (
        <PopIn stamp style={styles.cornerStamp}>
          <Stamp icon="checkmark" inked size={44} />
        </PopIn>
      ) : null}
    </View>
  );
}

function PhotoMini() {
  const step = useLoopStep(4, 750);
  return (
    <View style={styles.methodBox}>
      <View style={styles.viewfinder}>
        <Scene shapes={mainStreetNight} height={110} />
        {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
          <View key={c} style={[styles.corner, styles[c]]} />
        ))}
        {step === 1 ? <PopIn style={styles.flash}><View /></PopIn> : null}
      </View>
      <Text style={styles.small}>{d.photoCaption}</Text>
      {step >= 2 ? (
        <PopIn stamp style={styles.cornerStamp}>
          <Stamp icon="camera" inked size={44} />
        </PopIn>
      ) : null}
    </View>
  );
}

function ListenMini() {
  const pulse = useOscillator(700);
  return (
    <View style={styles.methodBox}>
      <View style={styles.listen}>
        {[0, 1].map((i) => (
          <Animated.View
            key={i}
            style={[
              styles.wave,
              {
                width: 70 + i * 34,
                height: 70 + i * 34,
                borderRadius: (70 + i * 34) / 2,
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.15 + i * 0.1, 0.7 - i * 0.2] }),
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] }) }],
              },
            ]}
          />
        ))}
        <Ionicons name="call" size={34} color={colors.midnight} />
      </View>
      <Text style={styles.small}>{d.listenCaption}</Text>
    </View>
  );
}

function SnackMini() {
  const step = useLoopStep(3, 900);
  return (
    <View style={styles.methodBox}>
      <Ionicons name="ice-cream-outline" size={64} color={colors.rose} />
      <Text style={styles.small}>{d.snackCaption}</Text>
      {step >= 1 ? (
        <PopIn stamp style={styles.cornerStamp}>
          <Stamp icon="restaurant" inked size={44} />
        </PopIn>
      ) : null}
    </View>
  );
}

export function MethodsDemo() {
  const index = useLoopStep(METHODS.length, 2800);
  const method = METHODS[index];
  return (
    <Stage>
      <View style={styles.chips}>
        {METHODS.map((m) => (
          <View key={m} style={[styles.chip, m === method && styles.chipActive]}>
            <Text style={[styles.chipText, m === method && styles.chipTextActive]}>{d.methods[m]}</Text>
          </View>
        ))}
      </View>
      <PopIn key={method} style={styles.flex}>
        {method === 'answer' ? <AnswerMini /> : null}
        {method === 'photo' ? <PhotoMini /> : null}
        {method === 'listen' ? <ListenMini /> : null}
        {method === 'snack' ? <SnackMini /> : null}
      </PopIn>
    </Stage>
  );
}

// ---------------------------------------------------------------------------
// 4. Stamps and badges — the passport fills, then a badge pops with sparkles
// ---------------------------------------------------------------------------
export function StampsDemo() {
  const step = useLoopStep(10, 550);
  const cells = 6;
  const stamped = Math.min(step, cells);
  const showBadge = step >= cells + 1;
  return (
    <Stage>
      <View style={styles.passportGrid}>
        {Array.from({ length: cells }, (_, i) => (
          <View key={i} style={styles.passportCell}>
            {i < stamped ? (
              <PopIn stamp key={`s${i}`}>
                <Stamp icon="star" inked size={46} />
              </PopIn>
            ) : (
              <Stamp icon="ellipse-outline" inked={false} size={46} />
            )}
          </View>
        ))}
      </View>
      <View style={styles.badgeArea}>
        {showBadge ? (
          <PopIn stamp key="badge">
            <View style={styles.center}>
              <BadgeStamp artKey="badge_magnifier" earned size={78} />
              <SparkleBurst radius={90} />
            </View>
            <Text style={styles.badgeText}>{d.badge}</Text>
          </PopIn>
        ) : null}
      </View>
    </Stage>
  );
}

// ---------------------------------------------------------------------------
// 5. Hints and Parade mode — two misses unlock a hint; Parade mode pauses a spot
// ---------------------------------------------------------------------------
export function HintParadeDemo() {
  const step = useLoopStep(6, 1000);
  const attempts = ['', 'Rosy', 'Rosee'];
  const typed = attempts[Math.min(step, 2)];
  const parade = step >= 4;
  return (
    <Stage>
      <Shake trigger={step === 1 || step === 2 ? step : 0}>
        <View style={styles.input}>
          <Text style={styles.inputText}>{typed}</Text>
        </View>
      </Shake>
      {step === 1 || step === 2 ? <Text style={styles.wrong}>{d.notQuite}</Text> : null}
      {step >= 3 ? (
        <PopIn key="hint">
          <View style={styles.hintPill}>
            <Text style={styles.hintPillText}>{d.needHint}</Text>
          </View>
          <Text style={styles.small}>{d.hint}</Text>
        </PopIn>
      ) : null}
      <View style={styles.divider} />
      <View style={styles.paradeRow}>
        <Ionicons name="sparkles-outline" size={20} color={colors.storybookGold} />
        <Text style={styles.paradeLabel}>{d.paradeMode}</Text>
        <Switch
          value={parade}
          disabled
          trackColor={{ false: colors.border, true: colors.storybookGold }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.border}
        />
      </View>
      {parade ? (
        <PopIn key="parade" rise={-8}>
          <View style={styles.pausedRow}>
            <Stamp icon="pause" inked={false} size={30} />
            <Text style={styles.small}>{d.teaser}</Text>
            <Text style={styles.pausedTag}>{d.paused}</Text>
          </View>
        </PopIn>
      ) : null}
    </Stage>
  );
}

// ---------------------------------------------------------------------------
// 6. Offline — saved with an hourglass, then stamped when signal returns
// ---------------------------------------------------------------------------
export function OfflineDemo() {
  const step = useLoopStep(5, 1150);
  const online = step >= 2;
  const synced = step >= 3;
  return (
    <Stage dark>
      <View style={styles.center}>
        <PopIn key={online ? 'on' : 'off'}>
          <View style={[styles.statusPill, online && styles.statusPillOnline]}>
            <Ionicons name={online ? 'wifi' : 'cloud-offline-outline'} size={18} color={online ? colors.midnight : colors.parchment} />
            <Text style={[styles.statusText, online && styles.statusTextOnline]}>{online ? d.backOnline : d.offline}</Text>
          </View>
        </PopIn>
        <View style={styles.offlineStamp}>
          {synced ? (
            <PopIn stamp key="star">
              <View style={styles.center}>
                <Stamp icon="star" inked size={96} />
                <SparkleBurst radius={80} />
              </View>
            </PopIn>
          ) : (
            <PopIn stamp key="hourglass">
              <Stamp icon="hourglass-outline" inked size={96} />
            </PopIn>
          )}
        </View>
        <Text style={styles.lightText}>{synced ? d.synced : d.saved}</Text>
      </View>
    </Stage>
  );
}

// ---------------------------------------------------------------------------
// 7. Friends — a friend climbs the leaderboard; the … menu offers options
// ---------------------------------------------------------------------------
const ROW_H = 48;

function LeaderRow({ index, name, spots, me }: { index: number; name: string; spots: number; me?: boolean }) {
  const reduced = useReducedMotion();
  const [y] = useState(() => new Animated.Value(index * ROW_H));
  useEffect(() => {
    if (reduced) {
      y.setValue(index * ROW_H);
      return;
    }
    Animated.spring(y, { toValue: index * ROW_H, friction: 7, useNativeDriver: true }).start();
  }, [index, reduced, y]);
  return (
    <Animated.View style={[styles.leaderRow, me && styles.leaderMe, { transform: [{ translateY: y }] }]}>
      <Text style={styles.rank}>{index + 1}</Text>
      <Text style={[styles.leaderName, me && styles.leaderNameMe]}>{name}</Text>
      <Text style={styles.label}>{`${spots} ✦`}</Text>
      {!me ? <Ionicons name="ellipsis-horizontal" size={18} color={colors.inkMuted} /> : <View style={styles.dotsSpacer} />}
    </Animated.View>
  );
}

export function FriendsDemo() {
  const step = useLoopStep(7, 900);
  const people = [
    { id: 'me', name: d.you, spots: 9, me: true },
    { id: 'a', name: `@${d.friendA}`, spots: 7 + step, me: false },
    { id: 'b', name: `@${d.friendB}`, spots: 5, me: false },
  ];
  const order = [...people].sort((a, b) => b.spots - a.spots);
  return (
    <Stage>
      <View style={{ height: ROW_H * 3 }}>
        {people.map((p) => (
          <LeaderRow key={p.id} index={order.findIndex((o) => o.id === p.id)} name={p.name} spots={p.spots} me={p.me} />
        ))}
      </View>
      {step >= 5 ? (
        <PopIn key="menu" rise={10}>
          <View style={styles.menu}>
            {[copy.friends.removeFriend, copy.friends.report, copy.friends.block].map((label) => (
              <Text key={label} style={[styles.menuItem, label === copy.friends.block && styles.menuDanger]}>
                {label}
              </Text>
            ))}
          </View>
        </PopIn>
      ) : null}
    </Stage>
  );
}

// ---------------------------------------------------------------------------
// 8. Safety — the three rules appear one by one
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 8. Storybook Lens — turn toward a landmark, its story floats in, then stamp it
// ---------------------------------------------------------------------------
export function LensDemo() {
  const step = useLoopStep(5, 1100);
  const sweep = useOscillator(1600);
  return (
    <Stage dark>
      <Scene shapes={mainStreetNight} height={STAGE_HEIGHT} />
      <View style={[StyleSheet.absoluteFill, styles.lensDim]} />
      <Animated.View
        style={[
          styles.lensRing,
          { transform: [{ rotate: sweep.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '25deg'] }) }] },
        ]}>
        <View style={styles.lensTick} />
      </Animated.View>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        {step >= 1 && step < 4 ? (
          <PopIn key="card" rise={12}>
            <View style={styles.lensCard}>
              <Text style={styles.lensFacing}>{d.lensFacing}</Text>
              <Text style={styles.lensTitle}>{d.lensTitle}</Text>
              <Text style={styles.lensTeaser}>{d.lensTeaser}</Text>
            </View>
          </PopIn>
        ) : null}
        {step >= 4 ? (
          <PopIn stamp key="stamp">
            <View style={styles.center}>
              <LensStamp stamped size={96} />
              <SparkleBurst radius={80} />
              <Text style={styles.lightText}>{d.lensStamped}</Text>
            </View>
          </PopIn>
        ) : null}
      </View>
    </Stage>
  );
}

export function SafetyDemo() {
  const step = useLoopStep(5, 900);
  return (
    <Stage>
      {copy.onboarding.rules.map((rule, i) =>
        i < step ? (
          <PopIn key={rule.text} rise={10}>
            <View style={styles.ruleRow}>
              <View style={styles.ruleIcon}>
                <Ionicons name={rule.icon} size={24} color={colors.midnight} />
              </View>
              <Text style={styles.ruleText}>{rule.text}</Text>
              <Ionicons name="checkmark-circle" size={22} color={colors.fern} />
            </View>
          </PopIn>
        ) : null,
      )}
    </Stage>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: STAGE_HEIGHT,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.storybookGold,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  stageDark: {
    backgroundColor: colors.midnight,
    padding: 0,
  },
  flex: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eyebrow: {
    ...type.caption,
    fontFamily: fonts.bodySemiBold,
    color: colors.inkMuted,
    letterSpacing: 1.5,
  },
  questCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  questBody: {
    padding: spacing.md,
    gap: 2,
  },
  questTitle: {
    ...type.heading,
    color: colors.midnight,
  },
  meta: {
    ...type.label,
    color: colors.inkMuted,
  },
  label: {
    ...type.label,
    color: colors.ink,
  },
  small: {
    ...type.label,
    color: colors.ink,
  },
  magnifier: {
    position: 'absolute',
    top: 30,
    left: '50%',
    marginLeft: -36,
    width: 72,
    height: 92,
  },
  lens: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 6,
    borderColor: colors.storybookGold,
    backgroundColor: 'rgba(250, 245, 234, 0.18)',
  },
  handle: {
    position: 'absolute',
    left: 50,
    top: 54,
    width: 10,
    height: 34,
    borderRadius: 5,
    backgroundColor: colors.storybookGold,
    transform: [{ rotate: '-45deg' }],
  },
  pin: {
    position: 'absolute',
    bottom: 6,
    left: '46%',
  },
  clueCard: {
    backgroundColor: colors.parchment,
    padding: spacing.md,
    gap: spacing.xs,
    minHeight: 104,
  },
  cardTitle: {
    ...type.bodyStrong,
    color: colors.midnight,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.round,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.midnight,
    borderColor: colors.midnight,
  },
  chipText: {
    ...type.caption,
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
  },
  chipTextActive: {
    color: colors.parchment,
  },
  methodBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: 44,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.parchment,
  },
  inputText: {
    ...type.body,
    color: colors.ink,
  },
  caret: {
    width: 2,
    height: 20,
    marginLeft: 1,
    backgroundColor: colors.midnight,
  },
  fakeButton: {
    alignSelf: 'stretch',
    minHeight: 40,
    borderRadius: radius.md,
    backgroundColor: colors.storybookGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fakeButtonPressed: {
    opacity: 0.7,
  },
  fakeButtonText: {
    ...type.bodyStrong,
    color: colors.midnight,
  },
  cornerStamp: {
    position: 'absolute',
    right: 4,
    top: 4,
  },
  viewfinder: {
    alignSelf: 'stretch',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.parchment,
  },
  tl: { top: 8, left: 8, borderTopWidth: 3, borderLeftWidth: 3 },
  tr: { top: 8, right: 8, borderTopWidth: 3, borderRightWidth: 3 },
  bl: { bottom: 8, left: 8, borderBottomWidth: 3, borderLeftWidth: 3 },
  br: { bottom: 8, right: 8, borderBottomWidth: 3, borderRightWidth: 3 },
  flash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.white,
  },
  listen: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.storybookGold,
  },
  passportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  passportCell: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...type.bodyStrong,
    color: colors.midnight,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  wrong: {
    ...type.label,
    color: colors.roseText,
  },
  hintPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.midnight,
    marginBottom: 2,
  },
  hintPillText: {
    ...type.label,
    fontFamily: fonts.bodySemiBold,
    color: colors.midnight,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  paradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.midnight,
  },
  paradeLabel: {
    ...type.bodyStrong,
    color: colors.parchment,
    flex: 1,
  },
  pausedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pausedTag: {
    ...type.caption,
    fontFamily: fonts.bodySemiBold,
    color: colors.midnight,
    backgroundColor: colors.storybookGold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.round,
    borderWidth: 1.5,
    borderColor: colors.parchment,
    marginTop: spacing.md,
  },
  statusPillOnline: {
    backgroundColor: colors.storybookGold,
    borderColor: colors.storybookGold,
  },
  statusText: {
    ...type.label,
    color: colors.parchment,
  },
  statusTextOnline: {
    color: colors.midnight,
  },
  offlineStamp: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightText: {
    ...type.bodyStrong,
    color: colors.parchment,
  },
  lensDim: {
    backgroundColor: 'rgba(27, 35, 64, 0.35)',
  },
  lensRing: {
    position: 'absolute',
    alignSelf: 'center',
    top: (STAGE_HEIGHT - 210) / 2,
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 3,
    borderColor: colors.storybookGold,
    alignItems: 'center',
  },
  lensTick: {
    width: 4,
    height: 16,
    marginTop: 4,
    borderRadius: 2,
    backgroundColor: colors.storybookGold,
  },
  lensCard: {
    width: 220,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.storybookGold,
    backgroundColor: colors.parchment,
  },
  lensFacing: {
    ...type.caption,
    color: colors.inkMuted,
    letterSpacing: 1,
  },
  lensTitle: {
    ...type.bodyStrong,
    color: colors.midnight,
  },
  lensTeaser: {
    ...type.caption,
    color: colors.ink,
  },
  leaderRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ROW_H - 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  leaderMe: {
    borderWidth: 2,
    borderColor: colors.storybookGold,
    backgroundColor: colors.parchment,
  },
  rank: {
    ...type.bodyStrong,
    color: colors.inkMuted,
    width: 18,
  },
  leaderName: {
    ...type.body,
    color: colors.ink,
    flex: 1,
  },
  leaderNameMe: {
    fontFamily: fonts.bodySemiBold,
    color: colors.midnight,
  },
  dotsSpacer: {
    width: 18,
  },
  menu: {
    alignSelf: 'flex-end',
    borderRadius: radius.md,
    backgroundColor: colors.parchment,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  menuItem: {
    ...type.label,
    color: colors.midnight,
    paddingVertical: 3,
  },
  menuDanger: {
    color: colors.roseText,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  ruleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleText: {
    ...type.body,
    color: colors.ink,
    flex: 1,
  },
});

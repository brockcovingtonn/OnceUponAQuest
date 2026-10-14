/**
 * "Your next adventure": picks the quest to suggest after a badge. Pure, so it
 * can be tested on its own.
 */

type QuestLike = {
  id: string;
  spotCount: number;
  badge: { id: string } | null;
  land: { id: string; sortOrder: number };
};

export type NextAdventureReason = 'in_progress' | 'same_land' | 'next_land';

/**
 * Suggests the next unfinished quest after finishing `currentQuestId`:
 * one you're partway through, else the next one in the same land, else the
 * first one in the next land along the walking route (wrapping around).
 * Quests come in walking order.
 */
export function suggestNextQuest<Q extends QuestLike>(
  quests: Q[],
  currentQuestId: string | undefined,
  foundByQuest: Map<string, number>,
  badgeIds: Set<string>,
): { quest: Q; reason: NextAdventureReason } | null {
  const found = (q: Q) => foundByQuest.get(q.id) ?? 0;
  const unfinished = quests.filter(
    (q) => q.id !== currentQuestId && q.spotCount > 0 && !(q.badge && badgeIds.has(q.badge.id)) && found(q) < q.spotCount,
  );
  if (unfinished.length === 0) return null;

  const started = unfinished.find((q) => found(q) > 0);
  if (started) return { quest: started, reason: 'in_progress' };

  const current = quests.find((q) => q.id === currentQuestId);
  if (current) {
    const sameLand = unfinished.find((q) => q.land.id === current.land.id);
    if (sameLand) return { quest: sameLand, reason: 'same_land' };
    const later = unfinished.find((q) => q.land.sortOrder > current.land.sortOrder);
    return { quest: later ?? unfinished[0], reason: 'next_land' };
  }
  return { quest: unfinished[0], reason: 'next_land' };
}

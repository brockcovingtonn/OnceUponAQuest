/**
 * Quest Pass and outfit packs, sold through the App Store and Google Play via
 * RevenueCat. The app only starts purchases and shows prices; our server is
 * the source of truth for what you own (RevenueCat's webhook updates the
 * `entitlements` and `pack_owned` tables). Wishing Stars are never sold.
 *
 * Until RevenueCat keys are set (EXPO_PUBLIC_REVENUECAT_IOS_KEY /
 * EXPO_PUBLIC_REVENUECAT_ANDROID_KEY in EAS), the store shows "coming soon".
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases, { PACKAGE_TYPE, type PurchasesPackage, type PurchasesStoreProduct } from 'react-native-purchases';

import { supabase } from '@/lib/supabase';

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

/** True when this build can sell things (keys are set). */
export const storeEnabled = Boolean(API_KEY);

/** Where people manage or cancel subscriptions (the stores handle it). */
export const MANAGE_SUBSCRIPTION_URL =
  Platform.OS === 'ios' ? 'https://apps.apple.com/account/subscriptions' : 'https://play.google.com/store/account/subscriptions';

let configured = false;
let currentUser: string | null = null;

/** Keeps RevenueCat signed in as the same explorer as Supabase. */
export function usePurchasesUser(userId: string | undefined) {
  useEffect(() => {
    if (!storeEnabled || !API_KEY) return;
    (async () => {
      try {
        if (!configured) {
          if (!userId) return;
          Purchases.configure({ apiKey: API_KEY, appUserID: userId });
          configured = true;
          currentUser = userId;
        } else if (userId && userId !== currentUser) {
          await Purchases.logIn(userId);
          currentUser = userId;
        } else if (!userId && currentUser) {
          await Purchases.logOut();
          currentUser = null;
        }
      } catch {
        // The store is a nicety; never let it break sign-in.
      }
    })();
  }, [userId]);
}

// ---------------------------------------------------------------------------
// What you own (from our server)
// ---------------------------------------------------------------------------

export type PassStatus = { active: boolean; expiresAt: string | null; willRenew: boolean; productId: string | null };

export const purchaseKeys = {
  pass: (userId: string | undefined) => ['quest-pass', userId] as const,
  passPlans: ['pass-plans'] as const,
  packPrices: (ids: string) => ['pack-prices', ids] as const,
};

export function usePassStatus(userId: string | undefined) {
  return useQuery({
    queryKey: purchaseKeys.pass(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<PassStatus> => {
      const { data, error } = await supabase
        .from('entitlements')
        .select('product_id, expires_at, will_renew')
        .eq('kind', 'quest_pass')
        .maybeSingle();
      if (error) throw error;
      if (!data) return { active: false, expiresAt: null, willRenew: false, productId: null };
      return {
        active: new Date(data.expires_at).getTime() > Date.now(),
        expiresAt: data.expires_at,
        willRenew: data.will_renew,
        productId: data.product_id,
      };
    },
  });
}

// ---------------------------------------------------------------------------
// Prices (from the store)
// ---------------------------------------------------------------------------

export type PassPlan = {
  kind: 'monthly' | 'yearly' | 'trip';
  priceString: string;
  pkg: PurchasesPackage;
};

/** The Quest Pass plans in RevenueCat's current offering: monthly, annual and a custom "trip" package. */
export function usePassPlans() {
  return useQuery({
    queryKey: purchaseKeys.passPlans,
    enabled: storeEnabled,
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<PassPlan[]> => {
      const offerings = await Purchases.getOfferings();
      const plans: PassPlan[] = [];
      for (const pkg of offerings.current?.availablePackages ?? []) {
        const kind =
          pkg.packageType === PACKAGE_TYPE.MONTHLY
            ? 'monthly'
            : pkg.packageType === PACKAGE_TYPE.ANNUAL
              ? 'yearly'
              : pkg.identifier === 'trip'
                ? 'trip'
                : null;
        if (kind) plans.push({ kind, priceString: pkg.product.priceString, pkg });
      }
      const order = { yearly: 0, monthly: 1, trip: 2 };
      return plans.sort((a, b) => order[a.kind] - order[b.kind]);
    },
  });
}

/** Store prices for outfit packs, by product id. */
export function usePackPrices(productIds: string[]) {
  const ids = [...productIds].sort().join(',');
  return useQuery({
    queryKey: purchaseKeys.packPrices(ids),
    enabled: storeEnabled && productIds.length > 0,
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<Map<string, PurchasesStoreProduct>> => {
      const products = await Purchases.getProducts(ids.split(','), Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION);
      return new Map(products.map((p) => [p.identifier, p]));
    },
  });
}

// ---------------------------------------------------------------------------
// Buying
// ---------------------------------------------------------------------------

export type PurchaseOutcome = 'done' | 'pending' | 'cancelled' | 'failed';

function cancelled(e: unknown): boolean {
  return typeof e === 'object' && e !== null && 'userCancelled' in e && (e as { userCancelled: unknown }).userCancelled === true;
}

/**
 * Waits for our server to hear about a purchase from the store (usually a few
 * seconds), refreshing the given queries. 'pending' if it takes longer; it
 * will still arrive.
 */
async function waitForServer(check: () => Promise<boolean>): Promise<'done' | 'pending'> {
  for (let i = 0; i < 12; i++) {
    if (await check()) return 'done';
    await new Promise((r) => setTimeout(r, 1500));
  }
  return 'pending';
}

export function useBuyPass(userId: string | undefined) {
  const queryClient = useQueryClient();
  return async (plan: PassPlan): Promise<PurchaseOutcome> => {
    try {
      await Purchases.purchasePackage(plan.pkg);
    } catch (e) {
      return cancelled(e) ? 'cancelled' : 'failed';
    }
    const result = await waitForServer(async () => {
      await queryClient.invalidateQueries({ queryKey: purchaseKeys.pass(userId) });
      return queryClient.getQueryData<PassStatus>(purchaseKeys.pass(userId))?.active === true;
    });
    // Premium quests and spots appear once the Pass is on the server.
    queryClient.invalidateQueries({ queryKey: ['quests'] });
    queryClient.invalidateQueries({ queryKey: ['quest'] });
    queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
    return result;
  };
}

export function useBuyPack(userId: string | undefined) {
  const queryClient = useQueryClient();
  return async (product: PurchasesStoreProduct, packId: string): Promise<PurchaseOutcome> => {
    try {
      await Purchases.purchaseStoreProduct(product);
    } catch (e) {
      return cancelled(e) ? 'cancelled' : 'failed';
    }
    return waitForServer(async () => {
      const { data } = await supabase.from('pack_owned').select('pack_id').eq('pack_id', packId).maybeSingle();
      if (data) await queryClient.invalidateQueries({ queryKey: ['wardrobe', userId] });
      return Boolean(data);
    });
  };
}

/** Restores purchases from the store (required by Apple), then refreshes. */
export function useRestorePurchases(userId: string | undefined) {
  const queryClient = useQueryClient();
  return async (): Promise<boolean> => {
    try {
      await Purchases.restorePurchases();
    } catch {
      return false;
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: purchaseKeys.pass(userId) }),
      queryClient.invalidateQueries({ queryKey: ['wardrobe', userId] }),
    ]);
    return true;
  };
}

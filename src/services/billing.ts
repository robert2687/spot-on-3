import { EntitlementState, PlanId } from '../types';

export interface BillingProduct {
  id: Exclude<PlanId, 'free'>;
  name: string;
  description: string;
  priceLabel: string;
  mode: 'subscription' | 'payment';
  stripePriceEnv: string;
}

export const BILLING_PRODUCTS: BillingProduct[] = [
  {
    id: 'premium',
    name: 'Premium',
    description: 'AI insights, advanced statistics, PDF exports, and cloud sync.',
    priceLabel: '€2.99 / month',
    mode: 'subscription',
    stripePriceEnv: 'STRIPE_PRICE_PREMIUM',
  },
  {
    id: 'lifetime',
    name: 'Lifetime Premium',
    description: 'Everything in Premium, paid once and kept forever.',
    priceLabel: '€29.99 once',
    mode: 'payment',
    stripePriceEnv: 'STRIPE_PRICE_LIFETIME',
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Shared visibility and lightweight team-ready reporting.',
    priceLabel: '€4.99 / month',
    mode: 'subscription',
    stripePriceEnv: 'STRIPE_PRICE_BUSINESS',
  },
];

export const DEFAULT_ENTITLEMENTS: EntitlementState = {
  plan: 'free',
  referralCode: '',
  successfulReferrals: 0,
  checkoutStatus: 'idle',
  billingAvailable: false,
};

export function isPremium(entitlements: EntitlementState): boolean {
  if (entitlements.plan === 'lifetime' || entitlements.plan === 'business') return true;
  return entitlements.plan === 'premium' && Boolean(!entitlements.premiumUntil || new Date(entitlements.premiumUntil) > new Date());
}

export function getReferralReward(referrals: number): PlanId | null {
  if (referrals >= 10) return 'lifetime';
  if (referrals >= 3) return 'premium';
  return null;
}

export async function startCheckout(productId: BillingProduct['id'], userId?: string): Promise<{ url?: string }> {
  const endpoint = import.meta.env.VITE_CHECKOUT_ENDPOINT as string | undefined;
  if (!endpoint) throw new Error('Billing is not connected yet. Add a server checkout endpoint to enable Stripe.');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, userId }),
  });
  if (!response.ok) throw new Error('Unable to start checkout. Please try again.');
  return response.json();
}

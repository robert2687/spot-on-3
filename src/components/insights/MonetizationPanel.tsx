import React, { useState } from 'react';
import { Check, Copy, Crown, Gift, LoaderCircle, Sparkles, Users } from 'lucide-react';
import { useSpotOn } from '../../context/SpotOnContext';
import { BILLING_PRODUCTS } from '../../services/billing';
import { PremiumModal } from './PremiumModal';
import { ReferralDashboard } from './ReferralDashboard';

export const MonetizationPanel: React.FC = () => {
  const { entitlements, hasPremium, startPremiumCheckout, copyReferralLink } = useSpotOn();
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  const checkout = async (id: 'premium' | 'lifetime' | 'business') => {
    await startPremiumCheckout(id);
  };

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
            <Sparkles className="h-4 w-4" /> Make progress easier
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your plan, without pressure</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Core tracking stays free. Premium simply adds more context when you want it.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-100 px-3 py-2 text-right dark:bg-slate-800">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Current plan</p>
          <p className="text-sm font-bold capitalize text-slate-900 dark:text-white">{entitlements.plan}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {BILLING_PRODUCTS.map((product) => (
          <article key={product.id} className="flex flex-col rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Crown className="h-4 w-4 text-amber-500" /> {product.name}
            </div>
            <p className="mt-2 min-h-12 text-xs leading-5 text-slate-500 dark:text-slate-400">{product.description}</p>
            <p className="mt-3 text-base font-bold text-slate-900 dark:text-white">{product.priceLabel}</p>
            <button
              type="button"
              disabled={entitlements.checkoutStatus === 'loading' || (hasPremium && product.id === 'premium')}
              onClick={() => product.id === 'premium' ? setIsPremiumModalOpen(true) : checkout(product.id)}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {entitlements.checkoutStatus === 'loading' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {hasPremium && product.id === 'premium' ? 'Active' : 'Continue to checkout'}
            </button>
          </article>
        ))}
      </div>

      <ReferralDashboard />
      <PremiumModal isOpen={isPremiumModalOpen} onClose={() => setIsPremiumModalOpen(false)} />

      <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/30 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Gift className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Invite friends, earn Premium</p>
            <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">{entitlements.successfulReferrals}/3 verified referrals for one month Premium · {Math.max(0, 10 - entitlements.successfulReferrals)} to Lifetime.</p>
          </div>
        </div>
        <button type="button" onClick={copyReferralLink} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300">
          <Copy className="h-4 w-4" /> Copy invite
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><Check className="h-4 w-4 text-emerald-500" /> Free forever</div>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Unlimited logs, core overview, CSV export, offline mode, and three goals.</p>
        </div>
        <div className="rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><Users className="h-4 w-4 text-violet-500" /> Business preview</div>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Shared reporting and team-ready insights are coming in the €4.99/month plan.</p>
        </div>
      </div>
    </section>
  );
};

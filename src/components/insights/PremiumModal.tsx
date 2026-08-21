import React from 'react';
import { Check, Crown, X } from 'lucide-react';
import { useSpotOn } from '../../context/SpotOnContext';

interface PremiumModalProps { isOpen: boolean; onClose: () => void; feature?: string; }

export const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, feature = 'Premium insights' }) => {
  const { startPremiumCheckout, entitlements } = useSpotOn();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="premium-title">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300"><Crown className="size-5" /></div><div><h2 id="premium-title" className="font-bold text-slate-900 dark:text-white">Unlock {feature}</h2><p className="text-xs text-slate-500 dark:text-slate-400">Keep the core tracker free, add more clarity when you need it.</p></div></div><button type="button" onClick={onClose} aria-label="Close" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="size-4" /></button></div>
        <ul className="mt-5 flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-300">{['AI-style local spending summaries', 'PDF reports and advanced trends', 'Cloud sync and unlimited goals'].map((item) => <li key={item} className="flex items-center gap-2"><Check className="size-4 text-emerald-500" />{item}</li>)}</ul>
        <div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={() => void startPremiumCheckout('premium')} disabled={entitlements.checkoutStatus === 'loading'} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">€2.99 / month</button><button type="button" onClick={() => void startPremiumCheckout('lifetime')} disabled={entitlements.checkoutStatus === 'loading'} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">€29.99 lifetime</button></div>
        <p className="mt-3 text-center text-[11px] text-slate-400">Cancel anytime. Referral rewards can unlock Premium too.</p>
      </div>
    </div>
  );
};

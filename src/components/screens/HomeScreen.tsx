import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Wine, Flame, TrendingUp, Calendar, ChevronRight, PlusCircle, ArrowUpRight, Sparkles } from 'lucide-react';
import { useSpotOn } from '../../context/SpotOnContext';
import { formatCurrency, formatTime, formatDateLabel } from '../../utils/formatters';

export const HomeScreen: React.FC = () => {
  const { purchases, settings, openAddModal, setActiveTab, t, language } = useSpotOn();
  const [hoveredDay, setHoveredDay] = useState<{ date: string; label: string; amount: number; count: number } | null>(null);

  // Current Month Calculations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const { thisMonthTotal, thisMonthAlcohol, thisMonthTobacco, todayAlcohol, todayTobacco, todayTotal } = useMemo(() => {
    let mTotal = 0;
    let mAlc = 0;
    let mTob = 0;
    let tAlc = 0;
    let tTob = 0;

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 86400000;

    purchases.forEach((p) => {
      const pDate = new Date(p.date);
      const pTime = pDate.getTime();

      // Month calculation
      if (pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth) {
        mTotal += p.totalPrice;
        if (p.category === 'alcohol') mAlc += p.totalPrice;
        if (p.category === 'tobacco') mTob += p.totalPrice;
      }

      // Today calculation
      if (pTime >= todayStart && pTime < todayEnd) {
        if (p.category === 'alcohol') tAlc += p.totalPrice;
        if (p.category === 'tobacco') tTob += p.totalPrice;
      }
    });

    return {
      thisMonthTotal: mTotal,
      thisMonthAlcohol: mAlc,
      thisMonthTobacco: mTob,
      todayAlcohol: tAlc,
      todayTobacco: tTob,
      todayTotal: tAlc + tTob,
    };
  }, [purchases, currentYear, currentMonth, now]);

  // Budget calculations
  const budget = settings.monthlyBudget || 100;
  const budgetPercent = Math.min(100, Math.round((thisMonthTotal / budget) * 100));
  const remainingBudget = Math.max(0, budget - thisMonthTotal);

  // Days in month calculation for pacing
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = daysInMonth - currentDay;

  // Last 30 days sparkline data
  const sparklineData = useMemo(() => {
    const data: { date: string; label: string; amount: number; count: number }[] = [];
    const maxDays = 30;

    for (let i = maxDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString(language, { month: 'short', day: 'numeric' });

      let daySpend = 0;
      let count = 0;

      purchases.forEach((p) => {
        if (p.date.startsWith(dateStr)) {
          daySpend += p.totalPrice;
          count++;
        }
      });

      data.push({
        date: dateStr,
        label,
        amount: Number(daySpend.toFixed(2)),
        count,
      });
    }
    return data;
  }, [purchases, language]);

  const maxDailySpend = useMemo(() => {
    const max = Math.max(...sparklineData.map((d) => d.amount), 10);
    return max;
  }, [sparklineData]);

  // Recent 4 purchases
  const recentPurchases = useMemo(() => {
    return purchases.slice(0, 4);
  }, [purchases]);

  const getPlaceLabel = (place: string) => {
    switch (place) {
      case 'home': return t('placeHome');
      case 'bar': return t('placeBar');
      case 'store': return t('placeStore');
      case 'social': return t('placeSocial');
      case 'restaurant': return t('placeRestaurant');
      case 'party': return t('placeParty');
      default: return place;
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {/* 1. Monthly Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            {t('thisMonth')}
          </p>
          <span className="text-[10px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
            {daysRemaining > 0 ? t('daysLeft', { count: daysRemaining }) : t('lastDay')}
          </span>
        </div>

        {/* Big Text */}
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight text-white">
          {formatCurrency(thisMonthTotal, settings.currencySymbol)}
        </h2>

        {/* Progress bar vs monthly budget */}
        {settings.showBudgetOnHome && (
          <div className="pt-1">
            <div className="w-full bg-slate-700/80 h-2 rounded-full mb-2 overflow-hidden flex">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  thisMonthTotal >= budget
                    ? 'bg-rose-400'
                    : budgetPercent >= (settings.budgetAlertThreshold || 80)
                    ? 'bg-amber-400'
                    : 'bg-blue-400'
                }`}
                style={{ width: `${Math.min(100, (thisMonthTotal / budget) * 100)}%` }}
              />
            </div>

            {/* Small text under bar */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('insights')}
                className="hover:text-blue-300 transition flex items-center gap-1"
              >
                <span>{t('goal')}: {formatCurrency(budget, settings.currencySymbol)}</span>
                <span className="text-[9px] underline">{t('manage')}</span>
              </button>
              <span
                className={
                  thisMonthTotal >= budget
                    ? 'text-rose-300 font-bold'
                    : budgetPercent >= (settings.budgetAlertThreshold || 80)
                    ? 'text-amber-300 font-bold'
                    : ''
                }
              >
                {t('usedPercent', { percent: budgetPercent })}
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* 2. Today Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-2"
      >
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{t('today')}</p>
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('alcohol')}</p>
            <p className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(todayAlcohol, settings.currencySymbol)}
            </p>
          </div>
          <div className="w-px bg-slate-200 dark:bg-slate-800 h-8 self-center" />
          <div className="flex-1 text-right">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('tobacco')}</p>
            <p className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(todayTobacco, settings.currencySymbol)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 3. 30-Day Trend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('thirtyDayTrend')}</p>
          {hoveredDay && (
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {hoveredDay.label}: {formatCurrency(hoveredDay.amount, settings.currencySymbol)}
            </span>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-3">
          {/* Interactive Bars */}
          <div className="h-16 w-full flex items-end justify-between gap-1 pt-2">
            {sparklineData.map((d) => {
              const heightPercent = d.amount > 0 ? Math.max(15, Math.round((d.amount / maxDailySpend) * 100)) : 6;
              const isSelected = hoveredDay?.date === d.date;

              return (
                <div
                  key={d.date}
                  className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                  onMouseEnter={() => setHoveredDay(d)}
                  onTouchStart={() => setHoveredDay(d)}
                  onClick={() => setHoveredDay(d)}
                >
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[6px] rounded-t-sm transition-all duration-150 ${
                      d.amount > 0
                        ? isSelected
                          ? 'bg-blue-600 dark:bg-blue-400 scale-y-110'
                          : 'bg-blue-500/60 hover:bg-blue-600 dark:bg-blue-500/50 dark:hover:bg-blue-400'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 dark:text-slate-500 px-1 pt-1 border-t border-slate-200/50 dark:border-slate-800">
            <span>{t('daysAgo', { count: 30 })}</span>
            <span>{t('daysAgo', { count: 15 })}</span>
            <span>{t('today')}</span>
          </div>
        </div>
      </motion.div>

      {/* 4. Recent Activity Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('recentLogs')}</p>
          <button
            onClick={() => setActiveTab('timeline')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
          >
            {t('viewAll')} ({purchases.length})
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5">
          {recentPurchases.length === 0 ? (
            <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">
              <p>{t('noPurchasesLogged')}</p>
              <button
                onClick={() => openAddModal(null)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {t('logFirstPurchase')}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
              {recentPurchases.map((p) => {
                const isAlc = p.category === 'alcohol';
                return (
                  <div
                    key={p.id}
                    onClick={() => openAddModal(p)}
                    className="py-2.5 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800/60 rounded-xl px-2 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                          isAlc
                            ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-200'
                            : 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                        }`}
                      >
                        {isAlc ? <Wine className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {p.subcategory}
                          </span>
                          {p.quantity > 1 && (
                            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                              ×{p.quantity}
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md font-medium">
                            {getPlaceLabel(p.place)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {formatDateLabel(p.date, language)} · {formatTime(p.date, language)}
                          {p.note ? ` · "${p.note}"` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {formatCurrency(p.totalPrice, settings.currencySymbol)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};


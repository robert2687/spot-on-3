import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wine,
  Flame,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  Info,
  Target,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Bell,
  BellRing,
  ArrowRight,
  TrendingDown,
  X,
  Check,
  Zap,
} from 'lucide-react';
import { useSpotOn } from '../../context/SpotOnContext';
import { formatCurrency, getTimeBucket, getDayOfWeek } from '../../utils/formatters';
import { Category, Purchase } from '../../types';
import { MilestonesSection } from '../insights/MilestonesSection';

export const InsightsScreen: React.FC = () => {
  const { purchases, settings, updateSettings, showToast, t, language } = useSpotOn();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [hoveredHeatmapCell, setHoveredHeatmapCell] = useState<{
    day: string;
    bucket: string;
    amount: number;
    count: number;
  } | null>(null);

  // Goal Editor Modal state
  const [isGoalEditorOpen, setIsGoalEditorOpen] = useState<boolean>(false);
  const [editMonthlyBudget, setEditMonthlyBudget] = useState<string>(
    String(settings.monthlyBudget || 120)
  );
  const [editAlcoholBudget, setEditAlcoholBudget] = useState<string>(
    String(settings.alcoholBudget || 80)
  );
  const [editTobaccoBudget, setEditTobaccoBudget] = useState<string>(
    String(settings.tobaccoBudget || 40)
  );
  const [editThreshold, setEditThreshold] = useState<number>(
    settings.budgetAlertThreshold || 80
  );
  const [editAlertsEnabled, setEditAlertsEnabled] = useState<boolean>(
    settings.budgetAlertEnabled !== false
  );

  const openGoalEditor = () => {
    setEditMonthlyBudget(String(settings.monthlyBudget || 120));
    setEditAlcoholBudget(String(settings.alcoholBudget || 80));
    setEditTobaccoBudget(String(settings.tobaccoBudget || 40));
    setEditThreshold(settings.budgetAlertThreshold || 80);
    setEditAlertsEnabled(settings.budgetAlertEnabled !== false);
    setIsGoalEditorOpen(true);
  };

  const handleSaveGoals = () => {
    const mBudget = Math.max(0, parseFloat(editMonthlyBudget) || 0);
    const aBudget = Math.max(0, parseFloat(editAlcoholBudget) || 0);
    const tBudget = Math.max(0, parseFloat(editTobaccoBudget) || 0);

    updateSettings({
      monthlyBudget: mBudget,
      alcoholBudget: aBudget,
      tobaccoBudget: tBudget,
      budgetAlertThreshold: editThreshold,
      budgetAlertEnabled: editAlertsEnabled,
    });
    setIsGoalEditorOpen(false);
    showToast(t('spendingLimitsUpdated'));
  };

  // Current Month Goal Computations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(0, daysInMonth - currentDay);

  const { currentMonthTotal, currentMonthAlcohol, currentMonthTobacco } = useMemo(() => {
    let tot = 0;
    let alc = 0;
    let tob = 0;
    purchases.forEach((p) => {
      const d = new Date(p.date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        tot += p.totalPrice;
        if (p.category === 'alcohol') alc += p.totalPrice;
        if (p.category === 'tobacco') tob += p.totalPrice;
      }
    });
    return {
      currentMonthTotal: tot,
      currentMonthAlcohol: alc,
      currentMonthTobacco: tob,
    };
  }, [purchases, currentYear, currentMonth]);

  // Goal metrics
  const monthlyGoal = settings.monthlyBudget || 120;
  const alcoholGoal = settings.alcoholBudget || 80;
  const tobaccoGoal = settings.tobaccoBudget || 40;
  const alertThreshold = settings.budgetAlertThreshold || 80;

  const totalUsedPct = Math.round((currentMonthTotal / (monthlyGoal || 1)) * 100);
  const alcoholUsedPct = Math.round((currentMonthAlcohol / (alcoholGoal || 1)) * 100);
  const tobaccoUsedPct = Math.round((currentMonthTobacco / (tobaccoGoal || 1)) * 100);

  const remainingMonthly = Math.max(0, monthlyGoal - currentMonthTotal);
  const isOverBudget = currentMonthTotal >= monthlyGoal;
  const isNearingBudget = !isOverBudget && totalUsedPct >= alertThreshold;

  // Pacing calculations
  const dailySpendRate = currentMonthTotal / Math.max(1, currentDay);
  const projectedMonthEnd = dailySpendRate * daysInMonth;
  const projectedDifference = projectedMonthEnd - monthlyGoal;
  const safeDailyRemaining = daysRemaining > 0 ? remainingMonthly / daysRemaining : 0;

  // Filter purchases by period for charts
  const filteredData = useMemo(() => {
    let startTime = 0;

    if (period === 'week') {
      startTime = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    } else if (period === 'month') {
      startTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    } else if (period === 'year') {
      startTime = new Date(now.getFullYear(), 0, 1).getTime();
    }

    return purchases.filter((p) => new Date(p.date).getTime() >= startTime);
  }, [purchases, period, now]);

  // Overall sums for selected period
  const { totalSpend, alcoholSpend, tobaccoSpend, alcPercent, tobPercent } = useMemo(() => {
    let tot = 0;
    let alc = 0;
    let tob = 0;
    filteredData.forEach((p) => {
      tot += p.totalPrice;
      if (p.category === 'alcohol') alc += p.totalPrice;
      if (p.category === 'tobacco') tob += p.totalPrice;
    });

    const alcP = tot > 0 ? Math.round((alc / tot) * 100) : 50;
    const tobP = tot > 0 ? 100 - alcP : 50;

    return {
      totalSpend: tot,
      alcoholSpend: alc,
      tobaccoSpend: tob,
      alcPercent: alcP,
      tobPercent: tobP,
    };
  }, [filteredData]);

  // Chart 1: Daily totals line chart data
  const lineChartData = useMemo(() => {
    const daysCount = period === 'week' ? 7 : period === 'month' ? 30 : 12;
    const points: { label: string; dateStr: string; amount: number }[] = [];

    if (period === 'year') {
      const cYear = new Date().getFullYear();
      for (let m = 0; m < 12; m++) {
        let sum = 0;
        filteredData.forEach((p) => {
          const d = new Date(p.date);
          if (d.getFullYear() === cYear && d.getMonth() === m) {
            sum += p.totalPrice;
          }
        });
        const monthDate = new Date(cYear, m, 1);
        const monthLabel = monthDate.toLocaleDateString(language, { month: 'short' });
        points.push({
          label: monthLabel,
          dateStr: `${cYear}-${m + 1}`,
          amount: Number(sum.toFixed(2)),
        });
      }
    } else {
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const label =
          period === 'week'
            ? d.toLocaleDateString(language, { weekday: 'short' })
            : d.getDate().toString();

        let daySum = 0;
        filteredData.forEach((p) => {
          if (p.date.startsWith(dateStr)) {
            daySum += p.totalPrice;
          }
        });

        points.push({
          label,
          dateStr,
          amount: Number(daySum.toFixed(2)),
        });
      }
    }

    return points;
  }, [filteredData, period, language]);

  const maxLineAmount = useMemo(() => {
    return Math.max(...lineChartData.map((p) => p.amount), 10);
  }, [lineChartData]);

  // Heatmap Data (Days: Mon-Sun x Buckets: Morning, Afternoon, Evening, Night)
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
  const BUCKETS = ['Morning', 'Afternoon', 'Evening', 'Night'] as const;

  const dayLabelsMap: Record<string, string> = {
    Mon: t('dayMon'),
    Tue: t('dayTue'),
    Wed: t('dayWed'),
    Thu: t('dayThu'),
    Fri: t('dayFri'),
    Sat: t('daySat'),
    Sun: t('daySun'),
  };

  const bucketLabelsMap: Record<string, string> = {
    Morning: t('timeMorning'),
    Afternoon: t('timeAfternoon'),
    Evening: t('timeEvening'),
    Night: t('timeNight'),
  };

  const heatmapMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, { amount: number; count: number }>> = {};

    BUCKETS.forEach((b) => {
      matrix[b] = {};
      DAYS.forEach((d) => {
        matrix[b][d] = { amount: 0, count: 0 };
      });
    });

    purchases.forEach((p) => {
      const bucket = getTimeBucket(p.date);
      const day = getDayOfWeek(p.date);
      if (matrix[bucket] && matrix[bucket][day]) {
        matrix[bucket][day].amount += p.totalPrice;
        matrix[bucket][day].count += 1;
      }
    });

    let maxCell = 0;
    BUCKETS.forEach((b) => {
      DAYS.forEach((d) => {
        if (matrix[b][d].amount > maxCell) {
          maxCell = matrix[b][d].amount;
        }
      });
    });

    return { matrix, maxCell: maxCell || 1 };
  }, [purchases]);

  // Generated Intelligent Insights
  const dynamicInsights = useMemo(() => {
    const insights: string[] = [];

    if (purchases.length === 0) {
      return [t('logFewPurchases')];
    }

    // 1. Goal Pacing insight
    if (projectedDifference > 0) {
      insights.push(
        `${t('currentDailyPace')}: ${formatCurrency(dailySpendRate, settings.currencySymbol)}${t('perDay')}. ${t('monthEndForecast')}: +${formatCurrency(projectedDifference, settings.currencySymbol)} ${t('overBudget')}.`
      );
    } else {
      insights.push(
        `${t('onTrackPacing')} (${formatCurrency(Math.abs(projectedDifference), settings.currencySymbol)} ${t('remaining')}).`
      );
    }

    // 2. Day of highest spend
    const daySpendMap: Record<string, number> = {};
    const placeMap: Record<string, number> = {};
    let totalAll = 0;

    purchases.forEach((p) => {
      const day = getDayOfWeek(p.date);
      daySpendMap[day] = (daySpendMap[day] || 0) + p.totalPrice;
      placeMap[p.place] = (placeMap[p.place] || 0) + p.totalPrice;
      totalAll += p.totalPrice;
    });

    const dayEntries = Object.entries(daySpendMap).sort((a, b) => b[1] - a[1]);
    if (dayEntries.length > 0) {
      const topDayKey = dayEntries[0][0];
      const topDayLocalized = dayLabelsMap[topDayKey] || topDayKey;
      insights.push(
        `${t('dailySpendingTrend')}: ${topDayLocalized} (${formatCurrency(dayEntries[0][1], settings.currencySymbol)}).`
      );
    }

    // 3. Top place
    const placeEntries = Object.entries(placeMap).sort((a, b) => b[1] - a[1]);
    if (placeEntries.length > 0 && totalAll > 0) {
      const topPlace = placeEntries[0][0];
      const placePercent = Math.round((placeEntries[0][1] / totalAll) * 100);
      insights.push(`${t('placesTriggersTitle')}: ${topPlace} (${placePercent}%).`);
    }

    return insights;
  }, [
    purchases,
    settings.currencySymbol,
    projectedDifference,
    dailySpendRate,
    t,
    dayLabelsMap,
  ]);

  const currentMonthName = now.toLocaleDateString(language, { month: 'long' });

  return (
    <div className="space-y-5 pb-28">
      {/* Top Bar / Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('insightsTitle')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('insightsSubtitle')}</p>
        </div>

        {/* Period Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-semibold">
          {[
            { id: 'week', label: t('week') },
            { id: 'month', label: t('month') },
            { id: 'year', label: t('year') },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as 'week' | 'month' | 'year')}
              className={`px-3 py-1 rounded-xl capitalize transition ${
                period === p.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. GOALS & SPENDING LIMIT SECTION */}
      {/* ========================================================= */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('monthlyGoalsAndLimits')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {daysRemaining > 0
                  ? t('daysRemainingInMonth', { days: daysRemaining, month: currentMonthName })
                  : t('finalDayOfMonth')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openGoalEditor}
            className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{t('adjustGoals')}</span>
          </button>
        </div>

        {/* Dynamic Alert Banner if Nearing or Over Limit */}
        {isOverBudget ? (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-900/60 rounded-2xl p-3.5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  {t('monthlyLimitExceeded', { pct: totalUsedPct })}
                </span>
                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                  {t('overBy', { amount: formatCurrency(currentMonthTotal - monthlyGoal, settings.currencySymbol) })}
                </span>
              </div>
              <p className="text-xs text-rose-800 dark:text-rose-300/90 leading-relaxed">
                {t('limitExceededAdvice', {
                  spent: formatCurrency(currentMonthTotal, settings.currencySymbol),
                  target: formatCurrency(monthlyGoal, settings.currencySymbol),
                })}
              </p>
            </div>
          </div>
        ) : isNearingBudget ? (
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  {t('nearingSpendingLimit', { pct: totalUsedPct })}
                </span>
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  {t('leftBudget', { amount: formatCurrency(remainingMonthly, settings.currencySymbol) })}
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                {t('nearingLimitAdvice', {
                  safeDaily: formatCurrency(safeDailyRemaining, settings.currencySymbol),
                  days: daysRemaining,
                })}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{t('spendingIsOnTrack', { pct: totalUsedPct })}</span>
            </div>
            <span className="font-bold text-emerald-800 dark:text-emerald-300">
              {t('safePace', { amount: formatCurrency(safeDailyRemaining, settings.currencySymbol) })}
            </span>
          </div>
        )}

        {/* Master Monthly Limit Card */}
        <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                {t('totalMonthlyGoal')}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(currentMonthTotal, settings.currencySymbol)}
                </span>
                <span className="text-xs text-slate-400">
                  {t('ofLimit', { limit: formatCurrency(monthlyGoal, settings.currencySymbol) })}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  isOverBudget
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                    : isNearingBudget
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                }`}
              >
                {t('usedPctBadge', { pct: totalUsedPct })}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {t('alertTriggerAt', { threshold: alertThreshold })}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isOverBudget
                  ? 'bg-rose-500'
                  : isNearingBudget
                  ? 'bg-amber-500'
                  : 'bg-blue-600 dark:bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, totalUsedPct)}%` }}
            />
          </div>

          {/* Pacing Details Pill Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                {t('dailyRunRate')}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {formatCurrency(dailySpendRate, settings.currencySymbol)} {t('perDay')}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                {t('monthEndForecast')}
              </span>
              <span
                className={`text-xs font-bold mt-0.5 block ${
                  projectedDifference > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatCurrency(projectedMonthEnd, settings.currencySymbol)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                {t('targetDailyCap')}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {formatCurrency(safeDailyRemaining, settings.currencySymbol)} {t('perDay')}
              </span>
            </div>
          </div>
        </div>

        {/* Category-Specific Spending Limits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Alcohol Limit Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-slate-900 text-white dark:bg-blue-600 flex items-center justify-center">
                  <Wine className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{t('alcoholLimit')}</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentMonthAlcohol >= alcoholGoal
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : alcoholUsedPct >= alertThreshold
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {t('usedPctBadge', { pct: alcoholUsedPct })}
              </span>
            </div>

            <div className="flex items-baseline justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(currentMonthAlcohol, settings.currencySymbol)}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {t('targetLabel', { target: formatCurrency(alcoholGoal, settings.currencySymbol) })}
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  currentMonthAlcohol >= alcoholGoal
                    ? 'bg-rose-500'
                    : alcoholUsedPct >= alertThreshold
                    ? 'bg-amber-500'
                    : 'bg-slate-900 dark:bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, alcoholUsedPct)}%` }}
              />
            </div>
          </div>

          {/* Tobacco Limit Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{t('tobaccoLimit')}</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentMonthTobacco >= tobaccoGoal
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : tobaccoUsedPct >= alertThreshold
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {t('usedPctBadge', { pct: tobaccoUsedPct })}
              </span>
            </div>

            <div className="flex items-baseline justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(currentMonthTobacco, settings.currencySymbol)}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {t('targetLabel', { target: formatCurrency(tobaccoGoal, settings.currencySymbol) })}
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  currentMonthTobacco >= tobaccoGoal
                    ? 'bg-rose-500'
                    : tobaccoUsedPct >= alertThreshold
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, tobaccoUsedPct)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. MILESTONES & CELEBRATIONS SECTION */}
      {/* ========================================================= */}
      <MilestonesSection
        purchases={purchases}
        settings={settings}
        showToast={showToast}
      />

      {/* ========================================================= */}
      {/* 3. KEY PATTERNS & HIGHLIGHTS */}
      {/* ========================================================= */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{t('keyPatternsAndProjections')}</span>
        </div>
        <div className="space-y-1.5">
          {dynamicInsights.map((insight, idx) => (
            <p key={idx} className="text-xs text-blue-950 dark:text-blue-200 font-medium leading-relaxed flex items-start gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
              {insight}
            </p>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. CHART 1: DAILY SPENDING TREND */}
      {/* ========================================================= */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-sm text-slate-900 dark:text-white">{t('dailySpendingTrend')}</span>
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {t('totalLabel', { amount: formatCurrency(totalSpend, settings.currencySymbol) })}
          </span>
        </div>

        {/* SVG Curve Chart */}
        <div className="w-full h-44 pt-2">
          {lineChartData.length > 0 ? (
            <div className="relative w-full h-full flex flex-col justify-between">
              {/* Y-axis helper guides */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-dashed border-slate-400 w-full" />
                <div className="border-b border-dashed border-slate-400 w-full" />
                <div className="border-b border-slate-400 w-full" />
              </div>

              {/* Dynamic SVG with smooth line and gradient */}
              <svg className="w-full h-32 overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Area Fill */}
                <path
                  d={`
                    M 0 100
                    ${lineChartData
                      .map((d, i) => {
                        const x = (i / (lineChartData.length - 1 || 1)) * 300;
                        const y = 100 - (d.amount / maxLineAmount) * 85;
                        return `L ${x} ${y}`;
                      })
                      .join(' ')}
                    L 300 100 Z
                  `}
                  fill="url(#chartGradient)"
                />

                {/* Line stroke */}
                <path
                  d={`
                    M 0 ${100 - (lineChartData[0]?.amount / maxLineAmount) * 85 || 100}
                    ${lineChartData
                      .map((d, i) => {
                        const x = (i / (lineChartData.length - 1 || 1)) * 300;
                        const y = 100 - (d.amount / maxLineAmount) * 85;
                        return `L ${x} ${y}`;
                      })
                      .join(' ')}
                  `}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {lineChartData.map((d, i) => {
                  const x = (i / (lineChartData.length - 1 || 1)) * 300;
                  const y = 100 - (d.amount / maxLineAmount) * 85;
                  if (d.amount === 0 && lineChartData.length > 15) return null;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={d.amount > 0 ? '3.5' : '2'}
                      className="fill-blue-600 stroke-white dark:stroke-slate-900 stroke-2"
                    />
                  );
                })}
              </svg>

              {/* X-axis labels */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1 font-medium">
                <span>{lineChartData[0]?.label || ''}</span>
                {lineChartData.length > 2 && (
                  <span>{lineChartData[Math.floor(lineChartData.length / 2)]?.label || ''}</span>
                )}
                <span>{lineChartData[lineChartData.length - 1]?.label || ''}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              {t('noDataTimeFrame')}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. CHART 2: CATEGORY SPLIT */}
      {/* ========================================================= */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm text-slate-900 dark:text-white">{t('categorySplit')}</span>
          <span className="text-xs text-slate-400">{t('alcoholVsTobacco')}</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 justify-around pt-2">
          {/* Visual Donut Ring */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              {/* Background circle */}
              <path
                className="text-slate-200 dark:text-slate-800 stroke-current"
                strokeWidth="4"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Alcohol arc */}
              <path
                className="text-slate-900 dark:text-blue-500 stroke-current transition-all duration-500"
                strokeDasharray={`${alcPercent}, 100`}
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t('totalShare')}</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {formatCurrency(totalSpend, settings.currencySymbol)}
              </span>
            </div>
          </div>

          {/* Legend Details */}
          <div className="space-y-2.5 w-full sm:w-auto">
            {/* Alcohol */}
            <div className="flex items-center justify-between gap-6 p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-900 dark:bg-blue-500" />
                <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">{t('alcohol')}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                  {formatCurrency(alcoholSpend, settings.currencySymbol)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">{t('ofTotal', { pct: alcPercent })}</span>
              </div>
            </div>

            {/* Tobacco */}
            <div className="flex items-center justify-between gap-6 p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">{t('tobacco')}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                  {formatCurrency(tobaccoSpend, settings.currencySymbol)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">{t('ofTotal', { pct: tobPercent })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. HEATMAP: DAY & TIME PATTERNS */}
      {/* ========================================================= */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-sm text-slate-900 dark:text-white block">{t('spendingHeatmap')}</span>
            <span className="text-xs text-slate-400">{t('dayAndTimePatterns')}</span>
          </div>
          {hoveredHeatmapCell ? (
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              {dayLabelsMap[hoveredHeatmapCell.day] || hoveredHeatmapCell.day} {bucketLabelsMap[hoveredHeatmapCell.bucket] || hoveredHeatmapCell.bucket}: {formatCurrency(hoveredHeatmapCell.amount, settings.currencySymbol)} ({hoveredHeatmapCell.count})
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">{t('tapCellForDetails')}</span>
          )}
        </div>

        {/* Matrix Grid */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="py-1 px-1 text-left text-[10px] font-semibold text-slate-400 w-16">{t('time')}</th>
                {DAYS.map((d) => (
                  <th key={d} className="py-1 px-1 text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {dayLabelsMap[d] || d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/80">
              {BUCKETS.map((bucket) => (
                <tr key={bucket}>
                  <td className="py-1.5 px-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {bucketLabelsMap[bucket] || bucket}
                  </td>
                  {DAYS.map((day) => {
                    const cell = heatmapMatrix.matrix[bucket][day];
                    const intensity = cell.amount > 0 ? Math.min(1, cell.amount / (heatmapMatrix.maxCell * 0.8)) : 0;

                    let bgClass = 'bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300';
                    if (intensity > 0.75) bgClass = 'bg-blue-600 text-white shadow-xs';
                    else if (intensity > 0.5) bgClass = 'bg-blue-500 text-white';
                    else if (intensity > 0.25) bgClass = 'bg-blue-200 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200';
                    else if (intensity > 0) bgClass = 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300';

                    return (
                      <td key={day} className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setHoveredHeatmapCell({
                              day,
                              bucket,
                              amount: cell.amount,
                              count: cell.count,
                            })
                          }
                          onMouseEnter={() =>
                            setHoveredHeatmapCell({
                              day,
                              bucket,
                              amount: cell.amount,
                              count: cell.count,
                            })
                          }
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-[10px] transition-all duration-150 active:scale-95 ${bgClass}`}
                        >
                          {cell.amount > 0 ? `${Math.round(cell.amount)}` : ''}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800">
          <span>{t('heatmapSubtitle')}</span>
          <div className="flex items-center gap-1">
            <span>{t('low')}</span>
            <div className="w-2.5 h-2.5 rounded bg-blue-100 dark:bg-blue-950" />
            <div className="w-2.5 h-2.5 rounded bg-blue-300 dark:bg-blue-800" />
            <div className="w-2.5 h-2.5 rounded bg-blue-600" />
            <span>{t('high')}</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. GOAL EDITOR MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isGoalEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGoalEditorOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 z-10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('adjustSpendingGoals')}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('setMonthlyTargetsDesc')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGoalEditorOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 pt-1">
                {/* Overall Monthly Budget */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('overallMonthlyTarget', { symbol: settings.currencySymbol })}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                      {settings.currencySymbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={editMonthlyBudget}
                      onChange={(e) => setEditMonthlyBudget(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Alcohol & Tobacco Limits */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      🍷 {t('alcoholLimitLabel', { symbol: settings.currencySymbol })}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                        {settings.currencySymbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={editAlcoholBudget}
                        onChange={(e) => setEditAlcoholBudget(e.target.value)}
                        className="w-full pl-7 pr-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      🚬 {t('tobaccoLimitLabel', { symbol: settings.currencySymbol })}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                        {settings.currencySymbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={editTobaccoBudget}
                        onChange={(e) => setEditTobaccoBudget(e.target.value)}
                        className="w-full pl-7 pr-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Alert Threshold Selector */}
                <div className="border-t border-slate-200/60 dark:border-slate-800 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t('alertTriggerThreshold')}
                    </label>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {t('ofBudgetValue', { threshold: editThreshold })}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[70, 80, 85, 90].map((tVal) => (
                      <button
                        key={tVal}
                        type="button"
                        onClick={() => setEditThreshold(tVal)}
                        className={`py-1.5 rounded-xl text-xs font-bold transition ${
                          editThreshold === tVal
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {tVal}%
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {t('triggersWarningDesc')}
                  </p>
                </div>

                {/* Enable / Disable Alert Toggle */}
                <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800 pt-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                      {t('spendingLimitWarnings')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {t('alertNearingOrExceedingDesc')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditAlertsEnabled(!editAlertsEnabled)}
                    className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                      editAlertsEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                        editAlertsEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGoalEditorOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSaveGoals}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('saveLimits')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

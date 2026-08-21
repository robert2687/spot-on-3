import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wine, Flame, Filter, Calendar, Search, Trash2, Edit3, ChevronRight, X, Sparkles } from 'lucide-react';
import { useSpotOn } from '../../context/SpotOnContext';
import { Purchase, Category, Place } from '../../types';
import { formatCurrency, formatTime, formatDateLabel } from '../../utils/formatters';

export const TimelineScreen: React.FC = () => {
  const { purchases, settings, openAddModal, deletePurchase, t, language } = useSpotOn();

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'month' | 'week' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getPlaceLabel = (p: string) => {
    switch (p) {
      case 'home': return t('placeHome');
      case 'bar': return t('placeBar');
      case 'store': return t('placeStore');
      case 'social': return t('placeSocial');
      case 'restaurant': return t('placeRestaurant');
      case 'party': return t('placeParty');
      default: return p;
    }
  };

  // Filter logic
  const filteredPurchases = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();

    return purchases.filter((p) => {
      // Category filter
      if (categoryFilter !== 'all' && p.category !== categoryFilter) {
        return false;
      }

      // Period filter
      const pTime = new Date(p.date).getTime();
      if (periodFilter === 'month' && pTime < currentMonthStart) {
        return false;
      }
      if (periodFilter === 'week' && pTime < oneWeekAgo) {
        return false;
      }
      if (periodFilter === 'custom') {
        if (startDate && p.date.slice(0, 10) < startDate) return false;
        if (endDate && p.date.slice(0, 10) > endDate) return false;
      }

      // Search query (name, place, note)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSub = p.subcategory.toLowerCase().includes(query);
        const matchesPlace = p.place.toLowerCase().includes(query);
        const matchesNote = (p.note || '').toLowerCase().includes(query);
        if (!matchesSub && !matchesPlace && !matchesNote) return false;
      }

      return true;
    });
  }, [purchases, categoryFilter, periodFilter, startDate, endDate, searchQuery]);

  // Group by Date
  const groupedPurchases = useMemo(() => {
    const groups: { dateKey: string; label: string; dayTotal: number; items: Purchase[] }[] = [];
    const map = new Map<string, { dateKey: string; label: string; dayTotal: number; items: Purchase[] }>();

    filteredPurchases.forEach((p) => {
      const dateKey = p.date.slice(0, 10);
      if (!map.has(dateKey)) {
        const group = {
          dateKey,
          label: formatDateLabel(p.date, language),
          dayTotal: 0,
          items: [],
        };
        map.set(dateKey, group);
        groups.push(group);
      }
      const existing = map.get(dateKey)!;
      existing.items.push(p);
      existing.dayTotal += p.totalPrice;
    });

    return groups;
  }, [filteredPurchases, language]);

  const totalFilteredSpent = useMemo(() => {
    return filteredPurchases.reduce((acc, p) => acc + p.totalPrice, 0);
  }, [filteredPurchases]);

  return (
    <div className="space-y-4 pb-28">
      {/* Title & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('timeline')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('loggedPurchasesCount', { count: filteredPurchases.length })}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">{t('total')}</span>
          <span className="text-base font-extrabold text-slate-900 dark:text-white">
            {formatCurrency(totalFilteredSpent, settings.currencySymbol)}
          </span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              categoryFilter === 'all'
                ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            {t('all')}
          </button>
          <button
            onClick={() => setCategoryFilter('alcohol')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
              categoryFilter === 'alcohol'
                ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Wine className="w-3.5 h-3.5" />
            {t('categoryAlcohol')}
          </button>
          <button
            onClick={() => setCategoryFilter('tobacco')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
              categoryFilter === 'tobacco'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            {t('categoryTobacco')}
          </button>
        </div>

        {/* Period Selector & Search */}
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-4 gap-1 flex-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setPeriodFilter('all')}
              className={`py-1 rounded-lg font-medium transition ${
                periodFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500'
              }`}
            >
              {t('allTime')}
            </button>
            <button
              onClick={() => setPeriodFilter('month')}
              className={`py-1 rounded-lg font-medium transition ${
                periodFilter === 'month' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500'
              }`}
            >
              {t('thisMonth')}
            </button>
            <button
              onClick={() => setPeriodFilter('week')}
              className={`py-1 rounded-lg font-medium transition ${
                periodFilter === 'week' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500'
              }`}
            >
              {t('sevenDays')}
            </button>
            <button
              onClick={() => setPeriodFilter('custom')}
              className={`py-1 rounded-lg font-medium transition ${
                periodFilter === 'custom' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500'
              }`}
            >
              {t('custom')}
            </button>
          </div>
        </div>

        {/* Custom date range inputs */}
        {periodFilter === 'custom' && (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">{t('startDate')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">{t('endDate')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>
          </div>
        )}

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-8 pr-7 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List of Events Grouped by Date */}
      {groupedPurchases.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 text-center">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t('noPurchasesFound')}</p>
          <p className="text-xs text-slate-400 mt-1">{t('tryAdjustingFilters')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedPurchases.map((group) => (
            <div key={group.dateKey} className="space-y-1.5">
              {/* Day Header */}
              <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>{group.label}</span>
                <span>{t('dayTotal')}: {formatCurrency(group.dayTotal, settings.currencySymbol)}</span>
              </div>

              {/* Day items */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-200/60 dark:divide-slate-800">
                {group.items.map((p) => {
                  const isAlc = p.category === 'alcohol';
                  return (
                    <div
                      key={p.id}
                      className="p-3.5 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800/60 transition group"
                    >
                      <div
                        onClick={() => openAddModal(p)}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      >
                        {/* Icon */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                            isAlc
                              ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-200'
                              : 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                          }`}
                        >
                          {isAlc ? <Wine className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {p.subcategory}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                              {formatCurrency(p.price, settings.currencySymbol)} × {p.quantity}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                              {getPlaceLabel(p.place)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                            <span>{formatTime(p.date, language)}</span>
                            {p.note && (
                              <span className="truncate italic">· {p.note}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Price & Quick Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="font-bold text-sm text-slate-900 dark:text-white block">
                            {formatCurrency(p.totalPrice, settings.currencySymbol)}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => openAddModal(p)}
                            title={t('editPurchase')}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deletePurchase(p.id)}
                            title={t('deleteEntry')}
                            className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


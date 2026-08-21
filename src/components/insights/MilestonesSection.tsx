import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Flame,
  Wine,
  Target,
  ShieldCheck,
  Crown,
  Wallet,
  Award,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Trophy,
  Star,
  Lock,
  Check,
  X,
  Share2,
  ChevronRight,
  FlameKindling,
  GlassWater,
  Coins,
} from 'lucide-react';
import { AppSettings, Milestone, MilestoneCategory, Purchase } from '../../types';
import { calculateMilestones } from '../../utils/milestones';
import { formatCurrency } from '../../utils/formatters';
import { useSpotOn } from '../../context/SpotOnContext';

interface MilestonesSectionProps {
  purchases: Purchase[];
  settings: AppSettings;
  showToast: (msg: string) => void;
}

export const MilestonesSection: React.FC<MilestonesSectionProps> = ({
  purchases,
  settings,
  showToast,
}) => {
  const { t, language } = useSpotOn();
  const [activeCategory, setActiveCategory] = useState<MilestoneCategory>('all');
  const [filterUnlockedOnly, setFilterUnlockedOnly] = useState<boolean>(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  // Compute live milestones and streaks
  const {
    milestones,
    unlockedCount,
    totalCount,
    totalPoints,
    maxPoints,
    streakSummary,
  } = calculateMilestones(purchases, settings, language);

  // Filtered list
  const filteredMilestones = milestones.filter((m) => {
    if (filterUnlockedOnly && !m.isUnlocked) return false;
    if (activeCategory === 'all') return true;
    return m.category === activeCategory;
  });

  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'],
      });
    } catch (e) {
      // safe fallback
    }
  };

  const handleOpenMilestone = (m: Milestone) => {
    setSelectedMilestone(m);
    if (m.isUnlocked) {
      fireConfetti();
    }
  };

  const handleShareAchievement = async (m: Milestone) => {
    const text = `🏆 SpotOn Achievement Unlocked: ${m.title}!\n${m.description}\nTrack your habits mindfully with SpotOn.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SpotOn: ${m.title}`,
          text: text,
        });
        showToast('Achievement shared!');
      } catch (err) {
        // User cancelled or share not supported
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        showToast('Achievement summary copied to clipboard!');
      } catch (err) {
        showToast(text);
      }
    }
  };

  // Helper to render milestone icon
  const renderMilestoneIcon = (iconName: string, isUnlocked: boolean, tier: string) => {
    const iconClass = `w-5 h-5 ${isUnlocked ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`;
    switch (iconName) {
      case 'Flame':
        return <Flame className={iconClass} />;
      case 'Wine':
        return <Wine className={iconClass} />;
      case 'Target':
        return <Target className={iconClass} />;
      case 'ShieldCheck':
        return <ShieldCheck className={iconClass} />;
      case 'Crown':
        return <Crown className={iconClass} />;
      case 'Wallet':
        return <Wallet className={iconClass} />;
      case 'Award':
        return <Award className={iconClass} />;
      case 'TrendingUp':
        return <TrendingUp className={iconClass} />;
      case 'Sparkles':
        return <Sparkles className={iconClass} />;
      default:
        return <Trophy className={iconClass} />;
    }
  };

  const getTierColor = (tier: string, isUnlocked: boolean) => {
    if (!isUnlocked) return 'bg-slate-200 dark:bg-slate-800 text-slate-400';
    switch (tier) {
      case 'diamond':
        return 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm';
      case 'gold':
        return 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm';
      case 'silver':
        return 'bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-sm';
      case 'bronze':
      default:
        return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-sm';
    }
  };

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case 'streaks':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300';
      case 'budget':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300';
      case 'tracking':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'streaks': return t('filterStreaks');
      case 'budget': return t('filterBudget');
      case 'tracking': return t('filterTracking');
      default: return t('filterAllBadges');
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('milestonesAchievements')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('milestonesSectionTitle')}
            </p>
          </div>
        </div>

        {/* Unlocked Counter Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 text-xs font-bold">
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>
            {t('unlockedBadgesCount', { unlocked: unlockedCount, total: totalCount })}
          </span>
        </div>
      </div>

      {/* Active Streaks Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Tobacco Free Streak */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              {t('tobaccoStreakLabel')}
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {streakSummary.tobaccoDays}{' '}
              {streakSummary.tobaccoDays === 1 ? t('day') : t('days')}
            </span>
          </div>
        </div>

        {/* Alcohol Free Streak */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <GlassWater className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              {t('alcoholStreakLabel')}
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {streakSummary.alcoholDays}{' '}
              {streakSummary.alcoholDays === 1 ? t('day') : t('days')}
            </span>
          </div>
        </div>

        {/* Budget Streak */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Coins className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              {t('budgetStreakLabel')}
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {streakSummary.underBudgetStreakMonths}{' '}
              {streakSummary.underBudgetStreakMonths === 1 ? 'month' : 'months'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-semibold">
          {[
            { id: 'all', label: t('filterAllBadges') },
            { id: 'streaks', label: t('filterStreaks') },
            { id: 'budget', label: t('filterBudget') },
            { id: 'tracking', label: t('filterTracking') },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as MilestoneCategory)}
              className={`px-3 py-1 rounded-xl capitalize transition text-xs ${
                activeCategory === tab.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setFilterUnlockedOnly(!filterUnlockedOnly)}
          className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            filterUnlockedOnly
              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{t('unlockedOnly')}</span>
        </button>
      </div>

      {/* Milestones Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {filteredMilestones.map((milestone) => {
          const progressPct = Math.min(
            100,
            Math.round((milestone.current / milestone.target) * 100)
          );

          return (
            <div
              key={milestone.id}
              onClick={() => handleOpenMilestone(milestone)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                milestone.isUnlocked
                  ? 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700/80 hover:border-amber-400/80 dark:hover:border-amber-500/60 shadow-xs hover:shadow-md'
                  : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-800/60 opacity-80 hover:opacity-100'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Badge Tier Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getTierColor(
                        milestone.tier,
                        milestone.isUnlocked
                      )}`}
                    >
                      {renderMilestoneIcon(
                        milestone.iconName,
                        milestone.isUnlocked,
                        milestone.tier
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {milestone.title}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md uppercase tracking-wider ${getCategoryBadgeColor(
                            milestone.category
                          )}`}
                        >
                          {getCategoryLabel(milestone.category)}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 capitalize">
                          {milestone.tier}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  {milestone.isUnlocked ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
                  {milestone.description}
                </p>
              </div>

              {/* Progress & Target Bar */}
              <div className="mt-3.5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">
                    {milestone.isUnlocked ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {t('unlockedBadgeNotice')}
                      </span>
                    ) : (
                      <span>
                        {t('progress')}: {milestone.current} / {milestone.target} {milestone.unit}
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {progressPct}%
                  </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      milestone.isUnlocked
                        ? 'bg-amber-500'
                        : 'bg-blue-600 dark:bg-blue-500'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMilestones.length === 0 && (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <Trophy className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {t('noMilestonesFound')}
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('all');
              setFilterUnlockedOnly(false);
            }}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            {t('resetFilters')}
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* CELEBRATION MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMilestone(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 text-center space-y-4"
            >
              <button
                type="button"
                onClick={() => setSelectedMilestone(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Milestone Big Badge Icon */}
              <div className="pt-2">
                <div
                  className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ring-4 ring-amber-100 dark:ring-amber-950/60 shadow-lg ${getTierColor(
                    selectedMilestone.tier,
                    selectedMilestone.isUnlocked
                  )}`}
                >
                  <div className="scale-125">
                    {renderMilestoneIcon(
                      selectedMilestone.iconName,
                      selectedMilestone.isUnlocked,
                      selectedMilestone.tier
                    )}
                  </div>
                </div>
              </div>

              <div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getCategoryBadgeColor(
                    selectedMilestone.category
                  )}`}
                >
                  {getCategoryLabel(selectedMilestone.category)} · {selectedMilestone.tier}
                </span>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">
                  {selectedMilestone.isUnlocked
                    ? selectedMilestone.celebrationTitle
                    : selectedMilestone.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {selectedMilestone.isUnlocked
                    ? selectedMilestone.celebrationMessage
                    : selectedMilestone.description}
                </p>
              </div>

              {/* Progress Detail */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 text-left space-y-2 border border-slate-100 dark:border-slate-750">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{t('status')}</span>
                  <span
                    className={`font-bold ${
                      selectedMilestone.isUnlocked
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {selectedMilestone.isUnlocked
                      ? t('completedCelebrated')
                      : `${t('inProgress')} (${selectedMilestone.current}/${selectedMilestone.target} ${selectedMilestone.unit})`}
                  </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedMilestone.isUnlocked ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (selectedMilestone.current / selectedMilestone.target) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {selectedMilestone.isUnlocked && (
                  <button
                    type="button"
                    onClick={() => handleShareAchievement(selectedMilestone)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{t('shareWin')}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedMilestone(null)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-white font-bold text-xs transition shadow-sm ${
                    selectedMilestone.isUnlocked
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {selectedMilestone.isUnlocked ? `${t('celebrate')} 🎊` : t('gotIt')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

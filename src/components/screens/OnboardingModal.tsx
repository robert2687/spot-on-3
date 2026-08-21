import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ArrowRight, Check, Sparkles, Wallet, Globe, Lock, Cloud, UserCheck } from 'lucide-react';
import { useSpotOn } from '../../context/SpotOnContext';
import { CURRENCY_OPTIONS } from '../../data/defaultPresets';
import { GoogleSignInButton } from '../GoogleSignInButton';

export const OnboardingModal: React.FC = () => {
  const {
    isOnboardingOpen,
    completeOnboarding,
    isGoogleConnected,
    googleUser,
    loginWithGoogle,
    isAuthLoading,
    t,
  } = useSpotOn();

  const [step, setStep] = useState<number>(1);
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [selectedSymbol, setSelectedSymbol] = useState('€');
  const [localOnly, setLocalOnly] = useState(true);
  const [budgetInput, setBudgetInput] = useState('120');

  if (!isOnboardingOpen) return null;

  const handleCurrencySelect = (code: string, symbol: string) => {
    setSelectedCurrency(code);
    setSelectedSymbol(symbol);
  };

  const handleFinish = (skipBudget = false) => {
    const budgetVal = skipBudget ? 0 : parseFloat(budgetInput) || 120;
    completeOnboarding(selectedCurrency, selectedSymbol, localOnly, budgetVal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-6"
      >
        {/* Progress indicator */}
        <div className="flex items-center justify-between gap-1.5 px-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-5 text-center py-2"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl font-extrabold mx-auto shadow-md shadow-blue-600/20">
              S
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t('welcomeToSpotOn')}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto">
                {t('welcomeSubtitle')}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1.5 text-left">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                <Check className="w-4 h-4 text-blue-600" />
                <span>{t('nonJudgmentalFeature')}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                <Check className="w-4 h-4 text-blue-600" />
                <span>{t('localFirstFeature')}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                <Check className="w-4 h-4 text-blue-600" />
                <span>{t('fastLoggingFeature')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition"
            >
              {t('getStarted')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Step 2: Currency Selection */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                <Globe className="w-4 h-4" />
                <span>{t('stepXofY', { step: 2, total: 4 })}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('chooseCurrencyTitle')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('chooseCurrencyDesc')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
              {CURRENCY_OPTIONS.map((c) => {
                const isSelected = selectedCurrency === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCurrencySelect(c.code, c.symbol)}
                    className={`p-3 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-300 font-bold'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold block">{c.code} ({c.symbol})</span>
                    <span className="text-[11px] text-slate-400 block">{c.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold"
              >
                {t('back')}
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm"
              >
                {t('continue')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Privacy Choice */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>{t('stepXofY', { step: 3, total: 4 })}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('privacyStorageTitle')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('privacyStorageDesc')}
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setLocalOnly(true)}
                className={`w-full p-4 rounded-2xl border text-left transition ${
                  localOnly
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {t('localOnlyModeRec')}
                  </span>
                  {localOnly && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('localOnlyModeDesc')}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLocalOnly(false)}
                className={`w-full p-4 rounded-2xl border text-left transition ${
                  !localOnly
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {t('cloudSyncOption')}
                  </span>
                  {!localOnly && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('cloudSyncOptionDesc')}
                </p>
              </button>

              {!localOnly && (
                <div className="pt-1">
                  {!isGoogleConnected ? (
                    <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/60 space-y-2">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t('onboardingGoogleSignUpDesc')}
                      </p>
                      <GoogleSignInButton
                        onClick={() => loginWithGoogle()}
                        isLoading={isAuthLoading}
                        text={t('googleSignUp')}
                        className="w-full !py-2.5 !text-xs !font-bold"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>{t('accountSignedAs', { name: googleUser?.displayName || googleUser?.email || 'User' })}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold"
              >
                {t('back')}
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm"
              >
                {t('continue')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Optional Monthly Budget */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                <Wallet className="w-4 h-4" />
                <span>{t('stepXofY', { step: 4, total: 4 })}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('monthlyTargetOptional')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('monthlyTargetDesc')}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t('monthlyTargetAmount', { symbol: selectedSymbol })}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-base">
                  {selectedSymbol}
                </span>
                <input
                  type="number"
                  step="5"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleFinish(false)}
                className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition"
              >
                {t('finishSetup')}
                <Check className="w-4 h-4 stroke-[3]" />
              </button>

              <button
                type="button"
                onClick={() => handleFinish(true)}
                className="w-full py-2.5 text-center text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {t('skipForNow')}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

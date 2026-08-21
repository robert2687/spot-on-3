import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldCheck,
  Cloud,
  HardDrive,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useSpotOn } from '../context/SpotOnContext';
import { GoogleSignInButton } from './GoogleSignInButton';

export const GoogleAuthModal: React.FC = () => {
  const {
    isGoogleAuthModalOpen,
    authModalMode,
    openGoogleAuthModal,
    closeGoogleAuthModal,
    loginWithGoogle,
    isAuthLoading,
    authError,
    clearAuthError,
    t,
  } = useSpotOn();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(authModalMode || 'signin');

  // Sync tab with context modal mode whenever opened
  React.useEffect(() => {
    if (authModalMode) {
      setActiveTab(authModalMode);
    }
  }, [authModalMode, isGoogleAuthModalOpen]);

  if (!isGoogleAuthModalOpen) return null;

  const isSignUp = activeTab === 'signup';

  const handleAuth = async () => {
    await loginWithGoogle();
  };

  return (
    <div
      id="google-auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeGoogleAuthModal();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Header with gradient badge and close */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <button
            id="close-google-auth-modal-button"
            type="button"
            onClick={closeGoogleAuthModal}
            className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
              S
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                SpotOn Account
              </span>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                {isSignUp ? t('googleAuthTitleSignUp') : t('googleAuthTitleSignIn')}
              </h2>
            </div>
          </div>

          {/* Tab Selector: Sign In vs Sign Up */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              id="google-signin-tab-button"
              type="button"
              onClick={() => setActiveTab('signin')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                !isSignUp
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t('googleSignInShort')}
            </button>
            <button
              id="google-signup-tab-button"
              type="button"
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                isSignUp
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t('googleSignUpShort')}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Subtitle */}
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {isSignUp ? t('googleAuthSubtitleSignUp') : t('googleAuthSubtitleSignIn')}
          </p>

          {/* Value proposition items */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-2.5">
              <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                {t('googleAuthBenefit1')}
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                {t('googleAuthBenefit2')}
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                {t('googleAuthBenefit3')}
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                {t('googleAuthBenefit4')}
              </span>
            </div>
          </div>

          {authError && (
            <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1 leading-relaxed">
                <p>{authError}</p>
                <p className="mt-1 text-[11px] opacity-80">If this is a new Vercel domain, add it to Firebase Authentication&apos;s Authorized domains.</p>
              </div>
              <button type="button" onClick={clearAuthError} className="font-bold hover:underline" aria-label="Dismiss error">Dismiss</button>
            </div>
          )}

          {/* Google Auth Primary Button */}
          <div className="space-y-3">
            <GoogleSignInButton
              onClick={handleAuth}
              isLoading={isAuthLoading}
              text={isSignUp ? t('googleSignUp') : t('googleSignIn')}
              className="w-full !py-3 !text-sm !font-bold shadow-md hover:shadow-lg border-slate-300 dark:border-slate-700"
            />

            {/* Toggle helper footer */}
            <div className="text-center">
              {isSignUp ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('alreadyHaveAccountPrompt')}{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('signin')}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {t('googleSignInShort')}
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('dontHaveAccountPrompt')}{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('signup')}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {t('googleSignUpShort')}
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* Privacy Note */}
          <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <Lock className="w-3 h-3" />
            <span>SpotOn never shares or sells your personal data.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

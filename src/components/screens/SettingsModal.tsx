import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Shield,
  Wallet,
  Sliders,
  Moon,
  Sun,
  Laptop,
  Palette,
  Lock,
  RefreshCw,
  Trash2,
  Plus,
  Sparkles,
  Check,
  Database,
  Cloud,
  HardDrive,
  LogOut,
  FolderSync,
  Bell,
  BellRing,
  Clock,
  Send,
  Globe,
} from 'lucide-react';
import { useSpotOn } from '../../context/SpotOnContext';
import { CURRENCY_OPTIONS, PLACES_LIST } from '../../data/defaultPresets';
import { Category, Place, Language } from '../../types';
import { GoogleSignInButton } from '../GoogleSignInButton';

const LANGUAGE_OPTIONS: { code: Language; name: string; nativeName: string; flag: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
];

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    closeSettings,
    settings,
    updateSettings,
    language,
    setLanguage,
    t,
    presets,
    addPreset,
    deletePreset,
    loadSampleData,
    clearAllData,
    showToast,
    googleUser,
    isGoogleConnected,
    isAuthLoading,
    driveQuota,
    lastDriveSync,
    isSyncingDrive,
    firestoreSyncStatus,
    syncWithFirestore,
    openGoogleAuthModal,
    loginWithGoogle,
    logoutFromGoogle,
    backupToDrive,
    notificationPermission,
    toggleDailyReminder,
    sendTestNotification,
  } = useSpotOn();

  // Local state for budget input
  const [budgetInput, setBudgetInput] = useState<string>(settings.monthlyBudget.toString());
  const [alcoholBudgetInput, setAlcoholBudgetInput] = useState<string>((settings.alcoholBudget || 80).toString());
  const [tobaccoBudgetInput, setTobaccoBudgetInput] = useState<string>((settings.tobaccoBudget || 40).toString());
  const [pinInput, setPinInput] = useState<string>(settings.pinCode || '1234');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // New Preset state
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [newPresetCat, setNewPresetCat] = useState<Category>('alcohol');
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetPrice, setNewPresetPrice] = useState('4.00');
  const [newPresetPlace, setNewPresetPlace] = useState<Place>('Bar');

  if (!isSettingsOpen) return null;

  const handleSaveBudget = () => {
    const val = parseFloat(budgetInput);
    const alcVal = parseFloat(alcoholBudgetInput);
    const tobVal = parseFloat(tobaccoBudgetInput);

    updateSettings({
      monthlyBudget: !isNaN(val) && val >= 0 ? val : 120,
      alcoholBudget: !isNaN(alcVal) && alcVal >= 0 ? alcVal : 80,
      tobaccoBudget: !isNaN(tobVal) && tobVal >= 0 ? tobVal : 40,
    });
    showToast(t('spendingGoalsSaved'));
  };

  const handleCurrencyChange = (code: string) => {
    const selected = CURRENCY_OPTIONS.find((c) => c.code === code);
    if (selected) {
      updateSettings({
        currency: selected.code,
        currencySymbol: selected.symbol,
      });
      showToast(`${t('currency')}: ${selected.name}`);
    }
  };

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    const selectedLang = LANGUAGE_OPTIONS.find((l) => l.code === langCode);
    showToast(`${selectedLang?.flag} ${selectedLang?.nativeName || langCode}`);
  };

  const handleAddNewPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    const price = parseFloat(newPresetPrice) || 2.50;
    addPreset({
      category: newPresetCat,
      name: newPresetName.trim(),
      defaultPrice: price,
      place: newPresetPlace,
    });
    setNewPresetName('');
    setIsAddingPreset(false);
    showToast(t('presetAdded'));
  };

  const getPlaceLabel = (place: Place): string => {
    switch (place) {
      case 'Home': return t('placeHome');
      case 'Bar': return t('placeBar');
      case 'Restaurant': return t('placeRestaurant');
      case 'Shop': return t('placeShop');
      case 'Club': return t('placeClub');
      case 'Gas Station': return t('placeGasStation');
      default: return t('placeOther');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('settings')}</h2>
            <button
              onClick={closeSettings}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label={t('close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto p-5 space-y-6 flex-1">
            {/* Language Selector Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{t('language')}</span>
                </div>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                  {LANGUAGE_OPTIONS.find((l) => l.code === language)?.flag}{' '}
                  {LANGUAGE_OPTIONS.find((l) => l.code === language)?.nativeName}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('selectLanguage')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGE_OPTIONS.map((langOpt) => {
                    const isSelected = language === langOpt.code;
                    return (
                      <button
                        key={langOpt.code}
                        type="button"
                        onClick={() => handleLanguageChange(langOpt.code)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition text-left ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-bold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg leading-none">{langOpt.flag}</span>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate">{langOpt.nativeName}</span>
                            <span className={`text-[10px] block truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                              {langOpt.name}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 1: Privacy & Google Drive */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{t('privacyAndDrive')}</span>
              </div>

              {/* Google Drive Account Card */}
              <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Google Drive
                    </span>
                  </div>
                  {isGoogleConnected ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {t('connected')}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">{t('notConnected')}</span>
                  )}
                </div>

                {!isGoogleConnected ? (
                  <div className="space-y-2.5 pt-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {t('connectDriveDescription')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <GoogleSignInButton
                        onClick={() => loginWithGoogle()}
                        isLoading={isAuthLoading}
                        text={t('googleSignIn')}
                        className="w-full"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          openGoogleAuthModal('signup');
                        }}
                        className="w-full py-2.5 px-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100/60 dark:hover:bg-blue-900/60 transition flex items-center justify-center gap-1.5"
                      >
                        <span>{t('googleSignUp')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {googleUser?.photoURL ? (
                          <img
                            src={googleUser.photoURL}
                            alt={googleUser.displayName || 'Google Account'}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {googleUser?.displayName?.charAt(0) || 'G'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                            {googleUser?.displayName || 'Google Account'}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {googleUser?.email}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => logoutFromGoogle()}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition shrink-0"
                        title={t('disconnectDrive')}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => backupToDrive()}
                          disabled={isSyncingDrive}
                          className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-60"
                        >
                          {isSyncingDrive ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FolderSync className="w-3.5 h-3.5" />
                          )}
                          <span>{t('backupDrive')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => syncWithFirestore()}
                          disabled={firestoreSyncStatus === 'syncing'}
                          className="py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5 transition"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${firestoreSyncStatus === 'syncing' ? 'animate-spin text-blue-500' : 'text-slate-500 dark:text-slate-400'}`} />
                          <span>{t('syncFirestore')}</span>
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <span className={`w-1.5 h-1.5 rounded-full ${firestoreSyncStatus === 'synced' ? 'bg-emerald-500' : firestoreSyncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                            Firestore {firestoreSyncStatus}
                          </span>
                        </div>
                        {lastDriveSync && (
                          <span className="text-[9px] text-slate-400 block">
                            Drive: {lastDriveSync}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-4">
                {/* Local-only mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                      {t('localOnlyMode')}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('localOnlyModeDesc')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSettings({ localOnly: !settings.localOnly })}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      settings.localOnly ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        settings.localOnly ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Cloud backup */}
                <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800 pt-3">
                  <div>
                    <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                      {t('cloudBackup')}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('cloudBackupDesc')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSettings({ cloudBackup: !settings.cloudBackup })}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      settings.cloudBackup ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        settings.cloudBackup ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Require PIN */}
                <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800 pt-3">
                  <div>
                    <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                      {t('requirePin')}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('requirePinDesc')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSettings({ requirePin: !settings.requirePin })}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      settings.requirePin ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        settings.requirePin ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* PIN Code Setup */}
                {settings.requirePin && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      {t('setPasscode')}
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value);
                        if (e.target.value.length === 4) {
                          updateSettings({ pinCode: e.target.value });
                          showToast(t('passcodeUpdated'));
                        }
                      }}
                      placeholder="1234"
                      className="w-32 px-3 py-1.5 text-center tracking-widest font-mono text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Daily Reminder */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{t('dailyReminders')}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-4">
                {/* Reminder Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                      {t('dailyReminderToggle')}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('dailyReminderToggleDesc')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleDailyReminder(!settings.dailyReminderEnabled)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      settings.dailyReminderEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    aria-label={t('dailyReminderToggle')}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        settings.dailyReminderEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Expanded Reminder Controls */}
                {settings.dailyReminderEnabled && (
                  <div className="border-t border-slate-200/60 dark:border-slate-800 pt-3.5 space-y-3.5">
                    {/* Permission Status Pill */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">{t('browserPermission')}</span>
                      {notificationPermission === 'granted' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          {t('permissionGranted')}
                        </span>
                      ) : notificationPermission === 'denied' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">
                          {t('blockedInBrowser')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                          {t('promptOnFirstAlert')}
                        </span>
                      )}
                    </div>

                    {/* Time Picker */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {t('reminderTime')}
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="time"
                            value={settings.dailyReminderTime || '20:00'}
                            onChange={(e) => {
                              const newTime = e.target.value;
                              updateSettings({ dailyReminderTime: newTime });
                            }}
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Quick Time Preset Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-slate-400 font-medium mr-1">Presets:</span>
                        {[
                          { label: '6:00 PM', value: '18:00' },
                          { label: '8:00 PM', value: '20:00' },
                          { label: '9:30 PM', value: '21:30' },
                          { label: '10:00 PM', value: '22:00' },
                        ].map((preset) => {
                          const isSelected = (settings.dailyReminderTime || '20:00') === preset.value;
                          return (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => {
                                updateSettings({ dailyReminderTime: preset.value });
                                showToast(`${t('reminderTime')}: ${preset.label}`);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                                isSelected
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Test Button & Explanation */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                        {t('usesWebNotifications')}
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          setIsSendingTest(true);
                          await sendTestNotification();
                          setIsSendingTest(false);
                        }}
                        disabled={isSendingTest}
                        className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 font-semibold text-xs flex items-center gap-1.5 shrink-0 transition active:scale-95 disabled:opacity-50"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        <span>{isSendingTest ? t('sending') : t('testAlert')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Budget */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{t('budgetAndLimits')}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('monthlySpendingTarget')} ({settings.currencySymbol})
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                        {settings.currencySymbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={budgetInput}
                        onChange={(e) => setBudgetInput(e.target.value)}
                        onBlur={handleSaveBudget}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={handleSaveBudget}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
                    >
                      {t('save')}
                    </button>
                  </div>
                </div>

                {/* Category Targets */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      🍷 {t('alcoholLimit')} ({settings.currencySymbol})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                        {settings.currencySymbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={alcoholBudgetInput}
                        onChange={(e) => setAlcoholBudgetInput(e.target.value)}
                        onBlur={handleSaveBudget}
                        className="w-full pl-7 pr-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      🚬 {t('tobaccoLimit')} ({settings.currencySymbol})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                        {settings.currencySymbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={tobaccoBudgetInput}
                        onChange={(e) => setTobaccoBudgetInput(e.target.value)}
                        onBlur={handleSaveBudget}
                        className="w-full pl-7 pr-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Budget Alert Threshold & Toggle */}
                <div className="border-t border-slate-200/60 dark:border-slate-800 pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                        {t('spendingAlerts')}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {t('spendingAlertsDesc')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateSettings({
                          budgetAlertEnabled:
                            settings.budgetAlertEnabled === undefined ? false : !settings.budgetAlertEnabled,
                        })
                      }
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        settings.budgetAlertEnabled !== false ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          settings.budgetAlertEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {settings.budgetAlertEnabled !== false && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          {t('alertThreshold')}
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {settings.budgetAlertThreshold || 80}%
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[70, 80, 85, 90].map((threshold) => (
                          <button
                            key={threshold}
                            type="button"
                            onClick={() => updateSettings({ budgetAlertThreshold: threshold })}
                            className={`py-1.5 rounded-xl text-xs font-bold transition ${
                              (settings.budgetAlertThreshold || 80) === threshold
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            {threshold}%
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800 pt-3">
                  <div>
                    <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                      {t('showBudgetHome')}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('showBudgetHomeDesc')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSettings({ showBudgetOnHome: !settings.showBudgetOnHome })}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      settings.showBudgetOnHome ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        settings.showBudgetOnHome ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Section: Appearance & Theme */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{t('appearanceAndTheme')}</span>
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {settings.theme === 'system'
                    ? t('themeSystem')
                    : settings.theme === 'dark'
                    ? t('themeDark')
                    : t('themeLight')}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-4">
                {/* Manual Dark Mode Direct Toggle Switch */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                      {t('themeDark')}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {settings.theme === 'system'
                        ? t('themePreferenceDesc')
                        : settings.theme === 'dark'
                        ? t('themeDark')
                        : t('themeLight')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
                      updateSettings({ theme: nextTheme });
                      showToast(nextTheme === 'dark' ? t('darkModeEnabled') : t('lightModeEnabled'));
                    }}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      settings.theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    aria-label="Toggle dark mode override"
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        settings.theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Theme Mode Selector Cards */}
                <div className="border-t border-slate-200/60 dark:border-slate-800 pt-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {t('themePreference')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Light Option */}
                    <button
                      type="button"
                      onClick={() => {
                        updateSettings({ theme: 'light' });
                        showToast(t('lightModeActive'));
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center ${
                        settings.theme === 'light'
                          ? 'bg-white dark:bg-slate-800 border-blue-500 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20 font-bold shadow-xs'
                          : 'bg-white/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <Sun className="w-5 h-5 text-amber-500" />
                      <span className="text-xs font-semibold">{t('themeLight')}</span>
                    </button>

                    {/* Dark Option */}
                    <button
                      type="button"
                      onClick={() => {
                        updateSettings({ theme: 'dark' });
                        showToast(t('darkModeActive'));
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center ${
                        settings.theme === 'dark'
                          ? 'bg-white dark:bg-slate-800 border-blue-500 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20 font-bold shadow-xs'
                          : 'bg-white/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <Moon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                      <span className="text-xs font-semibold">{t('themeDark')}</span>
                    </button>

                    {/* System Option */}
                    <button
                      type="button"
                      onClick={() => {
                        updateSettings({ theme: 'system' });
                        showToast(t('themeSetSystem'));
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center ${
                        settings.theme === 'system'
                          ? 'bg-white dark:bg-slate-800 border-blue-500 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20 font-bold shadow-xs'
                          : 'bg-white/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <Laptop className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      <span className="text-xs font-semibold">{t('themeSystem')}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                    {t('themePreferenceDesc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: General Preferences */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{t('generalPreferences')}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-4">
                {/* Currency selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('currency')}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {CURRENCY_OPTIONS.map((c) => {
                      const isSelected = settings.currency === c.code;
                      return (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => handleCurrencyChange(c.code)}
                          className={`p-2 rounded-xl text-left border transition ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-300 font-bold'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="text-xs font-bold">{c.code} ({c.symbol})</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Presets Manager */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('quickPresetsCount', { count: presets.length })}
                </span>
                <button
                  onClick={() => setIsAddingPreset(!isAddingPreset)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('addPreset')}
                </button>
              </div>

              {isAddingPreset && (
                <form onSubmit={handleAddNewPreset} className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newPresetCat}
                      onChange={(e) => setNewPresetCat(e.target.value as Category)}
                      className="px-2 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="alcohol">{t('categoryAlcohol')}</option>
                      <option value="tobacco">{t('categoryTobacco')}</option>
                    </select>
                    <select
                      value={newPresetPlace}
                      onChange={(e) => setNewPresetPlace(e.target.value as Place)}
                      className="px-2 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      {PLACES_LIST.map((p) => (
                        <option key={p} value={p}>{getPlaceLabel(p)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder={t('presetNamePlaceholder')}
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      required
                      className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder={t('defaultPricePlaceholder')}
                      value={newPresetPrice}
                      onChange={(e) => setNewPresetPrice(e.target.value)}
                      required
                      className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingPreset(false)}
                      className="px-2.5 py-1 text-xs text-slate-500"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                    >
                      {t('savePreset')}
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {presets.map((p) => (
                  <div
                    key={p.id}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {settings.currencySymbol}{p.defaultPrice.toFixed(2)} · {getPlaceLabel(p.place)}
                      </span>
                    </div>
                    {presets.length > 2 && (
                      <button
                        onClick={() => deletePreset(p.id)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        title={t('removePreset')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Data Management Actions */}
            <div className="space-y-3 pt-2 border-t border-slate-200/70 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t('dataManagement')}
              </span>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    loadSampleData();
                    closeSettings();
                  }}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                    {t('loadSampleData')}
                  </span>
                  <span className="text-[10px] text-slate-400">{t('populateDemo')}</span>
                </button>

                {showClearConfirm ? (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2 text-xs">
                    <p className="font-semibold text-rose-800 dark:text-rose-300">
                      {t('confirmClearData')}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          clearAllData();
                          setShowClearConfirm(false);
                          closeSettings();
                        }}
                        className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold"
                      >
                        {t('yesDeleteAll')}
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center justify-between transition"
                  >
                    <span className="flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5" />
                      {t('clearAllData')}
                    </span>
                    <span className="text-[10px] opacity-75">{t('permanent')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

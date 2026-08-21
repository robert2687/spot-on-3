import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Lock,
  Moon,
  Sun,
  Cloud,
  LogOut,
  RefreshCw,
  User as UserIcon,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';
import { useSpotOn } from '../context/SpotOnContext';

export const Header: React.FC = () => {
  const {
    settings,
    openSettings,
    updateSettings,
    setIsLocked,
    isGoogleConnected,
    googleUser,
    openGoogleAuthModal,
    logoutFromGoogle,
    syncWithFirestore,
    firestoreSyncStatus,
    setActiveTab,
    showToast,
    t,
  } = useSpotOn();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const isCurrentlyDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    const nextTheme = isCurrentlyDark ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
    showToast(nextTheme === 'dark' ? t('darkModeEnabled') : t('lightModeEnabled'));
  };

  const handleManualSync = async () => {
    setIsSyncingNow(true);
    await syncWithFirestore();
    setIsSyncingNow(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 transition-colors">
      <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
        {/* App Branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center font-extrabold text-base shadow-sm">
            S
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                SpotOn
              </span>
              <button
                id="header-cloud-status-badge"
                onClick={() => (isGoogleConnected ? setIsUserMenuOpen((prev) => !prev) : openGoogleAuthModal('signin'))}
                title={isGoogleConnected ? `Google Account (${googleUser?.email})` : t('localStatus')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                {isGoogleConnected ? (
                  <>
                    <Cloud className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                    <span>{t('driveStatus')}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        firestoreSyncStatus === 'syncing'
                          ? 'bg-amber-500 animate-pulse'
                          : firestoreSyncStatus === 'offline'
                          ? 'bg-red-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{t('localStatus')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Google Sign In / Sign Up Button or User Avatar */}
          {!isGoogleConnected ? (
            <button
              id="header-google-signin-button"
              type="button"
              onClick={() => openGoogleAuthModal('signin')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition active:scale-95 mr-1"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{t('googleSignInShort')}</span>
            </button>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                id="header-user-profile-button"
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                title={`Account: ${googleUser?.displayName || googleUser?.email}`}
                className="flex items-center gap-1.5 p-1 pr-2 rounded-full border border-blue-200 dark:border-blue-800/80 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 transition mr-1"
              >
                {googleUser?.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt="Google user avatar"
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-blue-500/40"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {(googleUser?.displayName || googleUser?.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[80px] truncate hidden sm:inline-block">
                  {googleUser?.displayName?.split(' ')[0] || 'User'}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  id="header-user-dropdown-menu"
                  className="absolute right-0 top-full mt-2 w-64 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 space-y-3"
                >
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                    {googleUser?.photoURL ? (
                      <img
                        src={googleUser.photoURL}
                        alt="Avatar"
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-blue-500"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                        {(googleUser?.displayName || googleUser?.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {googleUser?.displayName || 'Google User'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {googleUser?.email}
                      </p>
                    </div>
                  </div>

                  {/* Sync Status info */}
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Cloud Sync:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {firestoreSyncStatus === 'syncing' ? t('syncingStatus') : t('syncedStatus')}
                    </span>
                  </div>

                  {/* Quick actions */}
                  <div className="space-y-1">
                    <button
                      id="user-menu-sync-now-button"
                      type="button"
                      onClick={handleManualSync}
                      disabled={isSyncingNow}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-spin text-blue-600' : ''}`} />
                      <span>{t('syncNowButton')}</span>
                    </button>

                    <button
                      id="user-menu-drive-export-button"
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setActiveTab('export');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                    >
                      <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t('googleDriveSyncTitle')}</span>
                    </button>

                    <button
                      id="user-menu-sign-out-button"
                      type="button"
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        await logoutFromGoogle();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('signOutAccount')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {settings.requirePin && (
            <button
              onClick={() => setIsLocked(true)}
              title={t('lockApp')}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label={t('lockApp')}
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={toggleTheme}
            title={isCurrentlyDark ? t('switchToLight') : t('switchToDark')}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle theme"
          >
            {isCurrentlyDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
          </button>

          <button
            onClick={openSettings}
            title={t('settings')}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label={t('settings')}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};


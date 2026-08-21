import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Purchase, AppSettings, NavigationTab, ToastMessage, PresetItem, Category, DailyCheckIn, Language, EntitlementState } from '../types';
import { DEFAULT_ENTITLEMENTS, getReferralReward, isPremium, startCheckout } from '../services/billing';
import { getTranslation, TranslationKey } from '../i18n/translations';
import { DEFAULT_PRESETS } from '../data/defaultPresets';
import { generateSamplePurchases, generateSampleCheckIns } from '../data/sampleData';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getCurrentUser,
} from '../services/firebaseAuth';
import {
  testFirestoreConnection,
  saveUserSettingsToFirestore,
  subscribeToUserSettings,
  savePurchaseToFirestore,
  deletePurchaseFromFirestore,
  subscribeToPurchases,
  savePresetToFirestore,
  deletePresetFromFirestore,
  subscribeToPresets,
  saveCheckInToFirestore,
  deleteCheckInFromFirestore,
  subscribeToCheckIns,
} from '../services/firestore';
import {
  listSpotOnDriveFiles,
  uploadBackupToDrive,
  uploadCsvToDrive,
  downloadDriveFileContent,
  deleteDriveFile,
  fetchDriveQuota,
  DriveFileItem,
  DriveQuotaInfo,
  SpotOnBackupPayload,
} from '../services/googleDrive';
import { User } from 'firebase/auth';

interface HistoryAction {
  type: 'delete' | 'add' | 'edit';
  previousData?: Purchase;
  currentData?: Purchase;
}

interface SpotOnContextType {
  purchases: Purchase[];
  checkIns: DailyCheckIn[];
  settings: AppSettings;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  presets: PresetItem[];
  activeTab: NavigationTab;
  isAddModalOpen: boolean;
  editingPurchase: Purchase | null;
  isSettingsOpen: boolean;
  isOnboardingOpen: boolean;
  isLocked: boolean;
  toast: ToastMessage | null;

  // Google Drive & Auth & Firestore
  googleUser: User | null;
  isGoogleConnected: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  isGoogleAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  openGoogleAuthModal: (mode?: 'signin' | 'signup') => void;
  closeGoogleAuthModal: () => void;
  driveFiles: DriveFileItem[];
  isLoadingDriveFiles: boolean;
  isSyncingDrive: boolean;
  driveQuota: DriveQuotaInfo | null;
  lastDriveSync: string | null;
  firestoreSyncStatus: 'synced' | 'syncing' | 'offline' | 'idle';
  syncWithFirestore: () => Promise<boolean>;

  // Billing and referrals
  entitlements: EntitlementState;
  hasPremium: boolean;
  startPremiumCheckout: (productId: 'premium' | 'lifetime' | 'business') => Promise<boolean>;
  copyReferralLink: () => Promise<boolean>;

  // Actions
  setActiveTab: (tab: NavigationTab) => void;
  openAddModal: (purchaseToEdit?: Purchase | null) => void;
  closeAddModal: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  setIsLocked: (locked: boolean) => void;
  unlockWithPin: (enteredPin: string) => boolean;

  addPurchase: (purchaseData: Omit<Purchase, 'id' | 'createdAt'>) => void;
  updatePurchase: (id: string, updatedData: Partial<Omit<Purchase, 'id' | 'createdAt'>>) => void;
  deletePurchase: (id: string) => void;
  undoLastAction: () => void;

  // Daily Check-In Actions
  logDailyCheckIn: (checkInData: {
    date: string;
    alcoholFree: boolean;
    tobaccoFree: boolean;
    note?: string;
    mood?: 'great' | 'good' | 'neutral' | 'struggled';
  }) => void;
  deleteDailyCheckIn: (checkInId: string) => void;
  getCheckInForDate: (dateStr: string) => DailyCheckIn | undefined;

  updateSettings: (newSettings: Partial<AppSettings>) => void;
  addPreset: (preset: Omit<PresetItem, 'id'>) => void;
  deletePreset: (id: string) => void;

  loadSampleData: () => void;
  clearAllData: () => void;
  showToast: (message: string, action?: { label: string; onClick: () => void }, duration?: number) => void;
  hideToast: () => void;
  completeOnboarding: (currency: string, currencySymbol: string, localOnly: boolean, budget: number) => void;

  // Daily Notifications
  notificationPermission: NotificationPermission | 'unsupported';
  toggleDailyReminder: (enable: boolean, time?: string) => Promise<boolean>;
  sendTestNotification: () => Promise<boolean>;

  // Google Drive Actions
  loginWithGoogle: () => Promise<boolean>;
  logoutFromGoogle: () => Promise<void>;
  refreshDriveFiles: () => Promise<void>;
  backupToDrive: (note?: string) => Promise<boolean>;
  saveCsvToDrive: (csvContent: string, filename: string) => Promise<boolean>;
  restoreBackupFromDrive: (fileId: string) => Promise<boolean>;
  deleteFileFromDrive: (fileId: string) => Promise<boolean>;
}

const STORAGE_KEY_PURCHASES = 'spoton_purchases_v1';
const STORAGE_KEY_SETTINGS = 'spoton_settings_v1';
const STORAGE_KEY_PRESETS = 'spoton_presets_v1';
const STORAGE_KEY_CHECKINS = 'spoton_checkins_v1';
const STORAGE_KEY_LAST_SYNC = 'spoton_last_drive_sync_v1';

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  currency: 'EUR',
  currencySymbol: '€',
  monthlyBudget: 120,
  alcoholBudget: 80,
  tobaccoBudget: 40,
  budgetAlertEnabled: true,
  budgetAlertThreshold: 80,
  showBudgetOnHome: true,
  localOnly: true,
  cloudBackup: false,
  requirePin: false,
  pinCode: '1234',
  theme: 'light',
  onboardingCompleted: true,
  dailyReminderEnabled: false,
  dailyReminderTime: '20:00',
};

const SpotOnContext = createContext<SpotOnContextType | undefined>(undefined);

export const SpotOnProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. App Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load settings from storage', e);
    }
    return DEFAULT_SETTINGS;
  });

  // 2. Purchases list
  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PURCHASES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load purchases from storage', e);
    }
    // Default initial sample data for rich experience
    return generateSamplePurchases();
  });

  // 3. Presets
  const [presets, setPresets] = useState<PresetItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRESETS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load presets', e);
    }
    return DEFAULT_PRESETS;
  });

  // 4. Daily Habit Check-Ins
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHECKINS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load check-ins', e);
    }
    return generateSampleCheckIns();
  });

  // Navigation & UI Modals
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(!settings.onboardingCompleted);
  const [isLocked, setIsLocked] = useState<boolean>(settings.requirePin);

  // Google Drive & Auth State
  const [googleUser, setGoogleUser] = useState<User | null>(() => getCurrentUser());
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isGoogleAuthModalOpen, setIsGoogleAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState<boolean>(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState<boolean>(false);
  const [driveQuota, setDriveQuota] = useState<DriveQuotaInfo | null>(null);
  const [lastDriveSync, setLastDriveSync] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_LAST_SYNC);
  });
  const [firestoreSyncStatus, setFirestoreSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'idle'>('idle');
  const [entitlements, setEntitlements] = useState<EntitlementState>(() => {
    try {
      const saved = localStorage.getItem('spoton_entitlements_v1');
      return saved ? { ...DEFAULT_ENTITLEMENTS, ...JSON.parse(saved) } : { ...DEFAULT_ENTITLEMENTS, referralCode: `SPOT-${Math.random().toString(36).slice(2, 8).toUpperCase()}` };
    } catch {
      return { ...DEFAULT_ENTITLEMENTS, referralCode: `SPOT-${Math.random().toString(36).slice(2, 8).toUpperCase()}` };
    }
  });

  const isGoogleConnected = Boolean(googleUser);
  const hasPremium = isPremium(entitlements);

  useEffect(() => {
    localStorage.setItem('spoton_entitlements_v1', JSON.stringify(entitlements));
  }, [entitlements]);

  const startPremiumCheckout = useCallback(async (productId: 'premium' | 'lifetime' | 'business') => {
    setEntitlements((prev) => ({ ...prev, checkoutStatus: 'loading' }));
    try {
      const result = await startCheckout(productId, googleUser?.uid);
      if (result.url) window.location.assign(result.url);
      setEntitlements((prev) => ({ ...prev, checkoutStatus: 'success', billingAvailable: true }));
      return true;
    } catch (error) {
      setEntitlements((prev) => ({ ...prev, checkoutStatus: 'error' }));
      console.warn('[v0] Checkout failed:', error);
      return false;
    }
  }, [googleUser?.uid]);

  const copyReferralLink = useCallback(async () => {
    try {
      const link = `${window.location.origin}/?ref=${entitlements.referralCode}`;
      await navigator.clipboard.writeText(link);
      return true;
    } catch {
      console.warn('[v0] Could not copy referral link');
      return false;
    }
  }, [entitlements.referralCode]);

  // Undo & Toast
  const [lastAction, setLastAction] = useState<HistoryAction | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Test Firestore Connection on Boot
  useEffect(() => {
    testFirestoreConnection().catch((err) => {
      console.warn('Firestore connection check:', err);
    });
  }, []);

  // Browser Notification Permission State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  // Sync notification permission state
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, _token) => {
        setGoogleUser(user);
        setIsAuthLoading(false);
      },
      () => {
        setGoogleUser(null);
        setIsAuthLoading(false);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Real-time Firestore Sync Listeners when User is Authenticated
  useEffect(() => {
    if (!googleUser) {
      setFirestoreSyncStatus('idle');
      return;
    }

    setFirestoreSyncStatus('syncing');

    // 1. Subscribe to User Settings
    const unsubSettings = subscribeToUserSettings(
      googleUser.uid,
      (remoteSettings) => {
        if (remoteSettings) {
          setSettings((prev) => ({
            ...prev,
            ...remoteSettings,
          }));
        } else {
          // If remote settings document doesn't exist yet, save current local settings
          saveUserSettingsToFirestore(googleUser.uid, settings).catch(console.error);
        }
      },
      (err) => console.warn('Firestore settings subscription error:', err)
    );

    // 2. Subscribe to Purchases Subcollection
    const unsubPurchases = subscribeToPurchases(
      googleUser.uid,
      (remotePurchases) => {
        if (remotePurchases && remotePurchases.length > 0) {
          setPurchases(remotePurchases);
        } else {
          // If remote has no purchases but local has purchases, back them up
          const currentLocal = JSON.parse(localStorage.getItem(STORAGE_KEY_PURCHASES) || '[]');
          if (Array.isArray(currentLocal) && currentLocal.length > 0) {
            currentLocal.forEach((p: Purchase) => {
              savePurchaseToFirestore(googleUser.uid, p).catch(console.error);
            });
          }
        }
        setFirestoreSyncStatus('synced');
      },
      (err) => {
        console.warn('Firestore purchases subscription error:', err);
        setFirestoreSyncStatus('offline');
      }
    );

    // 3. Subscribe to Presets Subcollection
    const unsubPresets = subscribeToPresets(
      googleUser.uid,
      (remotePresets) => {
        if (remotePresets && remotePresets.length > 0) {
          setPresets(remotePresets);
        }
      },
      (err) => console.warn('Firestore presets subscription error:', err)
    );

    // 4. Subscribe to Daily Check-Ins Subcollection
    const unsubCheckIns = subscribeToCheckIns(
      googleUser.uid,
      (remoteCheckIns) => {
        if (remoteCheckIns && remoteCheckIns.length > 0) {
          setCheckIns(remoteCheckIns);
        } else {
          // If remote has no check-ins but local does, sync them up
          const currentLocal = JSON.parse(localStorage.getItem(STORAGE_KEY_CHECKINS) || '[]');
          if (Array.isArray(currentLocal) && currentLocal.length > 0) {
            currentLocal.forEach((c: DailyCheckIn) => {
              saveCheckInToFirestore(googleUser.uid, c).catch(console.error);
            });
          }
        }
      },
      (err) => console.warn('Firestore check-ins subscription error:', err)
    );

    return () => {
      unsubSettings();
      unsubPurchases();
      unsubPresets();
      unsubCheckIns();
    };
  }, [googleUser]);

  // Sync to LocalStorage for offline fallback
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PURCHASES, JSON.stringify(purchases));
    } catch (e) {
      console.error('Error saving purchases', e);
    }
  }, [purchases]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(presets));
    } catch (e) {
      console.error('Error saving presets', e);
    }
  }, [presets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHECKINS, JSON.stringify(checkIns));
    } catch (e) {
      console.error('Error saving check-ins', e);
    }
  }, [checkIns]);

  useEffect(() => {
    if (lastDriveSync) {
      localStorage.setItem(STORAGE_KEY_LAST_SYNC, lastDriveSync);
    }
  }, [lastDriveSync]);

  // Apply dark mode class to html/document and listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      const isDark =
        settings.theme === 'dark' ||
        (settings.theme === 'system' && mediaQuery.matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme();

    const handleSystemChange = () => {
      if (settings.theme === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, [settings.theme]);

  // Toast Helper
  const showToast = useCallback(
    (message: string, action?: { label: string; onClick: () => void }, duration = 4000) => {
      const id = Date.now().toString();
      setToast({ id, message, action, duration });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Modal handlers
  const openAddModal = useCallback((purchaseToEdit?: Purchase | null) => {
    setEditingPurchase(purchaseToEdit || null);
    setIsAddModalOpen(true);
  }, []);

  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setEditingPurchase(null);
  }, []);

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  // Helper to evaluate and trigger budget alerts
  const evaluateBudgetAlert = useCallback(
    (allPurchases: Purchase[]) => {
      if (settings.budgetAlertEnabled === false) return;

      const monthlyLimit = Number(settings.monthlyBudget) || 0;
      if (monthlyLimit <= 0) return;

      const thresholdPct = Number(settings.budgetAlertThreshold) || 80;
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      let monthTotal = 0;
      let alcTotal = 0;
      let tobTotal = 0;

      allPurchases.forEach((p) => {
        const d = new Date(p.date);
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          monthTotal += p.totalPrice;
          if (p.category === 'alcohol') alcTotal += p.totalPrice;
          if (p.category === 'tobacco') tobTotal += p.totalPrice;
        }
      });

      const usedPct = Math.round((monthTotal / monthlyLimit) * 100);

      // Check if over monthly limit
      if (monthTotal >= monthlyLimit) {
        const overAmount = (monthTotal - monthlyLimit).toFixed(2);
        setTimeout(() => {
          showToast(
            `🚨 Monthly Budget Exceeded! ${usedPct}% used (${settings.currencySymbol}${overAmount} over goal)`,
            {
              label: 'View Goals',
              onClick: () => setActiveTab('insights'),
              duration: 6000,
            }
          );
        }, 650);

        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          try {
            new Notification('🚨 Monthly Spending Limit Exceeded', {
              body: `You have spent ${settings.currencySymbol}${monthTotal.toFixed(2)} of your ${settings.currencySymbol}${monthlyLimit.toFixed(2)} monthly budget (${usedPct}%).`,
              icon: '/favicon.ico',
            });
          } catch (e) {}
        }
      } else if (usedPct >= thresholdPct) {
        // Nearing monthly limit
        const remaining = Math.max(0, monthlyLimit - monthTotal).toFixed(2);
        setTimeout(() => {
          showToast(
            `⚠️ Budget Alert: You've reached ${usedPct}% of your monthly limit (${settings.currencySymbol}${remaining} left)`,
            {
              label: 'View Goals',
              onClick: () => setActiveTab('insights'),
              duration: 5500,
            }
          );
        }, 650);

        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          try {
            new Notification('⚠️ Nearing Monthly Budget Limit', {
              body: `You have reached ${usedPct}% of your monthly budget (${settings.currencySymbol}${remaining} remaining).`,
              icon: '/favicon.ico',
            });
          } catch (e) {}
        }
      } else if (settings.alcoholBudget && alcTotal >= settings.alcoholBudget) {
        // Alcohol specific threshold exceeded
        setTimeout(() => {
          showToast(
            `🍷 Alcohol limit reached (${settings.currencySymbol}${alcTotal.toFixed(2)} / ${settings.currencySymbol}${settings.alcoholBudget})`,
            {
              label: 'View Goals',
              onClick: () => setActiveTab('insights'),
              duration: 5000,
            }
          );
        }, 650);
      } else if (settings.tobaccoBudget && tobTotal >= settings.tobaccoBudget) {
        // Tobacco specific threshold exceeded
        setTimeout(() => {
          showToast(
            `🚬 Tobacco limit reached (${settings.currencySymbol}${tobTotal.toFixed(2)} / ${settings.currencySymbol}${settings.tobaccoBudget})`,
            {
              label: 'View Goals',
              onClick: () => setActiveTab('insights'),
              duration: 5000,
            }
          );
        }, 650);
      }
    },
    [settings, showToast, setActiveTab]
  );

  // CRUD for Purchases
  const addPurchase = useCallback(
    (purchaseData: Omit<Purchase, 'id' | 'createdAt'>) => {
      const newPurchase: Purchase = {
        ...purchaseData,
        id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        createdAt: Date.now(),
      };

      const updatedList = [newPurchase, ...purchases];
      setPurchases(updatedList);
      setLastAction({ type: 'add', currentData: newPurchase });

      if (googleUser) {
        savePurchaseToFirestore(googleUser.uid, newPurchase).catch(console.error);
      }

      showToast('Saved purchase', {
        label: 'Undo',
        onClick: () => {
          setPurchases((prev) => prev.filter((p) => p.id !== newPurchase.id));
          if (googleUser) {
            deletePurchaseFromFirestore(googleUser.uid, newPurchase.id).catch(console.error);
          }
          showToast('Addition undone');
        },
      });

      // Trigger budget alert check
      evaluateBudgetAlert(updatedList);
    },
    [googleUser, purchases, showToast, evaluateBudgetAlert]
  );

  const updatePurchase = useCallback(
    (id: string, updatedData: Partial<Omit<Purchase, 'id' | 'createdAt'>>) => {
      let previous: Purchase | undefined;
      let updatedRecord: Purchase | undefined;
      let nextList: Purchase[] = [];

      setPurchases((prev) => {
        nextList = prev.map((p) => {
          if (p.id === id) {
            previous = p;
            const merged = { ...p, ...updatedData };
            merged.totalPrice = Number((merged.price * merged.quantity).toFixed(2));
            updatedRecord = merged;
            return merged;
          }
          return p;
        });
        return nextList;
      });

      if (googleUser && updatedRecord) {
        savePurchaseToFirestore(googleUser.uid, updatedRecord).catch(console.error);
      }

      if (previous) {
        const oldData = previous;
        setLastAction({ type: 'edit', previousData: oldData });
        showToast('Updated purchase', {
          label: 'Undo',
          onClick: () => {
            setPurchases((prev) => prev.map((p) => (p.id === id ? oldData : p)));
            if (googleUser) {
              savePurchaseToFirestore(googleUser.uid, oldData).catch(console.error);
            }
            showToast('Changes reverted');
          },
        });
      }

      if (nextList.length > 0) {
        evaluateBudgetAlert(nextList);
      }
    },
    [googleUser, showToast, evaluateBudgetAlert]
  );

  const deletePurchase = useCallback(
    (id: string) => {
      const toDelete = purchases.find((p) => p.id === id);
      if (!toDelete) return;

      setPurchases((prev) => prev.filter((p) => p.id !== id));
      setLastAction({ type: 'delete', previousData: toDelete });

      if (googleUser) {
        deletePurchaseFromFirestore(googleUser.uid, id).catch(console.error);
      }

      showToast('Deleted entry', {
        label: 'Undo',
        onClick: () => {
          setPurchases((prev) => [toDelete, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          if (googleUser) {
            savePurchaseToFirestore(googleUser.uid, toDelete).catch(console.error);
          }
          showToast('Entry restored');
        },
      });
    },
    [googleUser, purchases, showToast]
  );

  const undoLastAction = useCallback(() => {
    if (!lastAction) return;

    if (lastAction.type === 'delete' && lastAction.previousData) {
      const restored = lastAction.previousData;
      setPurchases((prev) => [restored, ...prev]);
      if (googleUser) {
        savePurchaseToFirestore(googleUser.uid, restored).catch(console.error);
      }
      showToast('Restored deleted item');
    } else if (lastAction.type === 'add' && lastAction.currentData) {
      const targetId = lastAction.currentData.id;
      setPurchases((prev) => prev.filter((p) => p.id !== targetId));
      if (googleUser) {
        deletePurchaseFromFirestore(googleUser.uid, targetId).catch(console.error);
      }
      showToast('Added purchase removed');
    } else if (lastAction.type === 'edit' && lastAction.previousData) {
      const old = lastAction.previousData;
      setPurchases((prev) => prev.map((p) => (p.id === old.id ? old : p)));
      if (googleUser) {
        savePurchaseToFirestore(googleUser.uid, old).catch(console.error);
      }
      showToast('Reverted edit');
    }
    setLastAction(null);
  }, [googleUser, lastAction, showToast]);

  // Settings update
  const updateSettings = useCallback(
    (newSettings: Partial<AppSettings>) => {
      setSettings((prev) => {
        const merged = { ...prev, ...newSettings };
        if (googleUser) {
          saveUserSettingsToFirestore(googleUser.uid, merged).catch(console.error);
        }
        return merged;
      });
    },
    [googleUser]
  );

  // Language & Translation helper
  const language = settings.language || 'en';
  const setLanguage = useCallback(
    (newLang: Language) => {
      updateSettings({ language: newLang });
    },
    [updateSettings]
  );

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      return getTranslation(language, key, params);
    },
    [language]
  );

  const addPreset = useCallback(
    (preset: Omit<PresetItem, 'id'>) => {
      const newPreset: PresetItem = {
        ...preset,
        id: `custom-pre-${Date.now()}`,
      };
      setPresets((prev) => [...prev, newPreset]);
      if (googleUser) {
        savePresetToFirestore(googleUser.uid, newPreset).catch(console.error);
      }
    },
    [googleUser]
  );

  const deletePreset = useCallback(
    (id: string) => {
      setPresets((prev) => prev.filter((p) => p.id !== id));
      if (googleUser) {
        deletePresetFromFirestore(googleUser.uid, id).catch(console.error);
      }
    },
    [googleUser]
  );

  // Daily Habit Check-In handlers
  const logDailyCheckIn = useCallback(
    (checkInData: {
      date: string;
      alcoholFree: boolean;
      tobaccoFree: boolean;
      note?: string;
      mood?: 'great' | 'good' | 'neutral' | 'struggled';
    }) => {
      const checkInId = `checkin-${checkInData.date}`;
      const newEntry: DailyCheckIn = {
        id: checkInId,
        userId: googleUser?.uid,
        date: checkInData.date,
        alcoholFree: checkInData.alcoholFree,
        tobaccoFree: checkInData.tobaccoFree,
        note: checkInData.note || '',
        mood: checkInData.mood,
        createdAt: Date.now(),
      };

      setCheckIns((prev) => {
        const filtered = prev.filter((c) => c.date !== checkInData.date && c.id !== checkInId);
        return [newEntry, ...filtered].sort((a, b) => b.date.localeCompare(a.date));
      });

      if (googleUser) {
        saveCheckInToFirestore(googleUser.uid, newEntry).catch(console.error);
      }

      const bothClean = checkInData.alcoholFree && checkInData.tobaccoFree;
      const singleClean = checkInData.alcoholFree || checkInData.tobaccoFree;

      showToast(
        bothClean
          ? '🎉 Logged 100% substance-free day!'
          : singleClean
          ? '✨ Logged today’s habit check-in'
          : '📝 Daily check-in recorded',
        {
          label: 'Undo',
          onClick: () => {
            setCheckIns((prev) => prev.filter((c) => c.id !== checkInId));
            if (googleUser) {
              deleteCheckInFromFirestore(googleUser.uid, checkInId).catch(console.error);
            }
            showToast('Check-in undone');
          },
        }
      );
    },
    [googleUser, showToast]
  );

  const deleteDailyCheckIn = useCallback(
    (checkInId: string) => {
      setCheckIns((prev) => prev.filter((c) => c.id !== checkInId));
      if (googleUser) {
        deleteCheckInFromFirestore(googleUser.uid, checkInId).catch(console.error);
      }
      showToast('Daily check-in removed');
    },
    [googleUser, showToast]
  );

  const getCheckInForDate = useCallback(
    (dateStr: string): DailyCheckIn | undefined => {
      return checkIns.find((c) => c.date === dateStr);
    },
    [checkIns]
  );

  // Explicit sync function with Firestore
  const syncWithFirestore = useCallback(async (): Promise<boolean> => {
    if (!googleUser) {
      showToast('Sign in with Google to sync with Cloud Firestore');
      return false;
    }

    setFirestoreSyncStatus('syncing');
    try {
      await saveUserSettingsToFirestore(googleUser.uid, settings);
      for (const p of purchases) {
        await savePurchaseToFirestore(googleUser.uid, p);
      }
      for (const pre of presets) {
        await savePresetToFirestore(googleUser.uid, pre);
      }
      for (const c of checkIns) {
        await saveCheckInToFirestore(googleUser.uid, c);
      }
      setFirestoreSyncStatus('synced');
      showToast('Cloud Firestore sync complete');
      return true;
    } catch (e: any) {
      console.error('Firestore sync error:', e);
      setFirestoreSyncStatus('offline');
      showToast('Failed to sync to Cloud Firestore');
      return false;
    }
  }, [googleUser, presets, purchases, checkIns, settings, showToast]);

  const loadSampleData = useCallback(() => {
    const samples = generateSamplePurchases();
    const sampleChecks = generateSampleCheckIns();
    setPurchases(samples);
    setCheckIns(sampleChecks);
    if (googleUser) {
      samples.forEach((s) => savePurchaseToFirestore(googleUser.uid, s).catch(console.error));
      sampleChecks.forEach((c) => saveCheckInToFirestore(googleUser.uid, c).catch(console.error));
    }
    showToast('Loaded sample purchases and 14 days of habit check-ins');
  }, [googleUser, showToast]);

  const clearAllData = useCallback(() => {
    if (googleUser) {
      purchases.forEach((p) => deletePurchaseFromFirestore(googleUser.uid, p.id).catch(console.error));
      checkIns.forEach((c) => deleteCheckInFromFirestore(googleUser.uid, c.id).catch(console.error));
    }
    setPurchases([]);
    setCheckIns([]);
    showToast('All tracking and check-in data cleared');
  }, [googleUser, purchases, checkIns, showToast]);

  // Unlock with PIN
  const unlockWithPin = useCallback(
    (enteredPin: string) => {
      if (!settings.requirePin || enteredPin === (settings.pinCode || '1234')) {
        setIsLocked(false);
        return true;
      }
      return false;
    },
    [settings.pinCode, settings.requirePin]
  );

  const completeOnboarding = useCallback(
    (currency: string, currencySymbol: string, localOnly: boolean, budget: number) => {
      setSettings((prev) => ({
        ...prev,
        currency,
        currencySymbol,
        localOnly,
        monthlyBudget: budget > 0 ? budget : prev.monthlyBudget,
        onboardingCompleted: true,
      }));
      setIsOnboardingOpen(false);
      showToast('Welcome to SpotOn! Start tracking anytime.');
    },
    [showToast]
  );

  // Google Drive Handlers
  const refreshDriveFiles = useCallback(async () => {
    if (!googleUser) return;
    setIsLoadingDriveFiles(true);
    try {
      const [files, quota] = await Promise.all([
        listSpotOnDriveFiles(),
        fetchDriveQuota().catch(() => null),
      ]);
      setDriveFiles(files);
      if (quota) setDriveQuota(quota);
    } catch (e: any) {
      console.error('Failed to load Drive files', e);
      showToast(e.message || 'Failed to refresh Google Drive files');
    } finally {
      setIsLoadingDriveFiles(false);
    }
  }, [googleUser, showToast]);

  const openGoogleAuthModal = useCallback((mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsGoogleAuthModalOpen(true);
  }, []);

  const closeGoogleAuthModal = useCallback(() => {
    setIsGoogleAuthModalOpen(false);
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setSettings((prev) => ({ ...prev, localOnly: false, cloudBackup: true }));
        setIsGoogleAuthModalOpen(false);
        showToast(`Connected as ${result.user.displayName || result.user.email || 'Google User'}`);
        try {
          const files = await listSpotOnDriveFiles();
          setDriveFiles(files);
          const quota = await fetchDriveQuota();
          setDriveQuota(quota);
        } catch (err) {
          console.warn('Initial drive fetch warning:', err);
        }
        return true;
      }
      // User closed the popup or cancelled authentication
      return false;
    } catch (e: any) {
      const msg = e?.message || '';
      const code = e?.code || '';
      if (
        code !== 'auth/popup-closed-by-user' &&
        code !== 'auth/cancelled-popup-request' &&
        code !== 'auth/user-cancelled' &&
        !msg.includes('popup-closed-by-user') &&
        !msg.includes('cancelled-popup-request')
      ) {
        setAuthError(msg || 'Google Sign-In failed');
      }
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  }, [showToast]);

  const logoutFromGoogle = useCallback(async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setDriveFiles([]);
      setDriveQuota(null);
      showToast('Signed out from Google Drive');
    } catch (e: any) {
      showToast(e.message || 'Failed to sign out');
    }
  }, [showToast]);

  const backupToDrive = useCallback(
    async (note?: string): Promise<boolean> => {
      if (!isGoogleConnected) {
        const ok = await loginWithGoogle();
        if (!ok) return false;
      }
      setIsSyncingDrive(true);
      try {
        const uploaded = await uploadBackupToDrive(purchases, settings, presets, note, checkIns);
        setDriveFiles((prev) => [uploaded, ...prev.filter((f) => f.id !== uploaded.id)]);
        const syncTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastDriveSync(syncTime);
        showToast('Backup saved to Google Drive');
        return true;
      } catch (e: any) {
        showToast(e.message || 'Failed to backup to Google Drive');
        return false;
      } finally {
        setIsSyncingDrive(false);
      }
    },
    [isGoogleConnected, loginWithGoogle, purchases, settings, presets, checkIns, showToast]
  );

  const saveCsvToDrive = useCallback(
    async (csvContent: string, filename: string): Promise<boolean> => {
      if (!isGoogleConnected) {
        const ok = await loginWithGoogle();
        if (!ok) return false;
      }
      setIsSyncingDrive(true);
      try {
        const uploaded = await uploadCsvToDrive(csvContent, filename);
        setDriveFiles((prev) => [uploaded, ...prev]);
        showToast(`Saved "${filename}" directly to Google Drive`);
        return true;
      } catch (e: any) {
        showToast(e.message || 'Failed to save CSV to Google Drive');
        return false;
      } finally {
        setIsSyncingDrive(false);
      }
    },
    [isGoogleConnected, loginWithGoogle, showToast]
  );

  const restoreBackupFromDrive = useCallback(
    async (fileId: string): Promise<boolean> => {
      setIsSyncingDrive(true);
      try {
        const content = await downloadDriveFileContent(fileId);
        const parsed = JSON.parse(content) as SpotOnBackupPayload;
        if (parsed && Array.isArray(parsed.purchases)) {
          setPurchases(parsed.purchases);
          if (parsed.presets && Array.isArray(parsed.presets)) {
            setPresets(parsed.presets);
          }
          if (parsed.checkIns && Array.isArray(parsed.checkIns)) {
            setCheckIns(parsed.checkIns);
          }
          if (parsed.settings) {
            setSettings((prev) => ({ ...prev, ...parsed.settings }));
          }
          showToast(`Restored ${parsed.purchases.length} purchases and data from Google Drive`);
          return true;
        } else {
          throw new Error('Invalid SpotOn backup format');
        }
      } catch (e: any) {
        showToast(e.message || 'Failed to restore backup from Google Drive');
        return false;
      } finally {
        setIsSyncingDrive(false);
      }
    },
    [showToast]
  );

  // Daily Notification Reminder Scheduler
  useEffect(() => {
    if (!settings.dailyReminderEnabled || typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    const checkReminder = () => {
      const now = new Date();
      const currentHour = String(now.getHours()).padStart(2, '0');
      const currentMin = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHour}:${currentMin}`;
      const targetTime = settings.dailyReminderTime || '20:00';
      const todayDateStr = now.toISOString().split('T')[0];

      const lastSentDate = localStorage.getItem('spoton_last_reminder_date');

      if (currentTimeStr === targetTime && lastSentDate !== todayDateStr) {
        localStorage.setItem('spoton_last_reminder_date', todayDateStr);

        try {
          const notification = new Notification('SpotOn Daily Reminder 📝', {
            body: "Don't forget to track your drinks & tobacco purchases for today!",
            icon: '/favicon.ico',
            tag: 'spoton-daily-reminder',
          });

          notification.onclick = () => {
            window.focus();
            openAddModal();
            notification.close();
          };
        } catch (err) {
          console.warn('Could not show browser notification', err);
        }
      }
    };

    // Check right away and every 25 seconds
    checkReminder();
    const interval = setInterval(checkReminder, 25000);
    return () => clearInterval(interval);
  }, [settings.dailyReminderEnabled, settings.dailyReminderTime, openAddModal]);

  const toggleDailyReminder = useCallback(
    async (enable: boolean, time?: string): Promise<boolean> => {
      if (!enable) {
        updateSettings({ dailyReminderEnabled: false });
        showToast('Daily reminder disabled');
        return true;
      }

      if (typeof window === 'undefined' || !('Notification' in window)) {
        showToast('Notifications are not supported in this browser environment');
        return false;
      }

      const reminderTime = time || settings.dailyReminderTime || '20:00';

      if (Notification.permission === 'granted') {
        setNotificationPermission('granted');
        updateSettings({ dailyReminderEnabled: true, dailyReminderTime: reminderTime });
        showToast(`Daily reminder scheduled for ${reminderTime}`);
        return true;
      }

      if (Notification.permission === 'denied') {
        setNotificationPermission('denied');
        showToast('Notifications are blocked by your browser settings. Please enable permissions in your browser URL bar.');
        updateSettings({ dailyReminderEnabled: false });
        return false;
      }

      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          updateSettings({ dailyReminderEnabled: true, dailyReminderTime: reminderTime });
          showToast(`Daily reminder enabled for ${reminderTime}`);
          return true;
        } else {
          updateSettings({ dailyReminderEnabled: false });
          showToast('Notification permission was not granted.');
          return false;
        }
      } catch (err) {
        console.error('Error requesting notification permission', err);
        showToast('Could not request notification permissions.');
        return false;
      }
    },
    [settings.dailyReminderTime, updateSettings, showToast]
  );

  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('Notifications are not supported in this browser environment');
      return false;
    }

    let perm = Notification.permission;
    if (perm === 'default') {
      try {
        perm = await Notification.requestPermission();
        setNotificationPermission(perm);
      } catch (e) {
        console.error(e);
      }
    }

    if (perm !== 'granted') {
      showToast('Please allow notification permissions to receive daily reminders.');
      return false;
    }

    try {
      const notification = new Notification('SpotOn Daily Reminder 🍷', {
        body: 'This is a preview reminder to log your daily purchases!',
        icon: '/favicon.ico',
        tag: 'spoton-test-reminder',
      });

      notification.onclick = () => {
        window.focus();
        openAddModal();
        notification.close();
      };

      showToast('Test notification sent!');
      return true;
    } catch (e: any) {
      showToast(e?.message || 'Failed to send test notification');
      return false;
    }
  }, [openAddModal, showToast]);

  const deleteFileFromDrive = useCallback(
    async (fileId: string): Promise<boolean> => {
      try {
        await deleteDriveFile(fileId);
        setDriveFiles((prev) => prev.filter((f) => f.id !== fileId));
        showToast('Backup file deleted from Google Drive');
        return true;
      } catch (e: any) {
        showToast(e.message || 'Failed to delete file from Google Drive');
        return false;
      }
    },
    [showToast]
  );

  return (
    <SpotOnContext.Provider
      value={{
        purchases,
        checkIns,
        settings,
        language,
        setLanguage,
        t,
        presets,
        activeTab,
        isAddModalOpen,
        editingPurchase,
        isSettingsOpen,
        isOnboardingOpen,
        isLocked,
        toast,
        googleUser,
        isGoogleConnected,
        isAuthLoading,
        authError,
        clearAuthError,
        isGoogleAuthModalOpen,
        authModalMode,
        openGoogleAuthModal,
        closeGoogleAuthModal,
        driveFiles,
        isLoadingDriveFiles,
        isSyncingDrive,
        driveQuota,
        lastDriveSync,
        firestoreSyncStatus,
        syncWithFirestore,
        entitlements,
        hasPremium,
        startPremiumCheckout,
        copyReferralLink,
        setActiveTab,
        openAddModal,
        closeAddModal,
        openSettings,
        closeSettings,
        setIsLocked,
        unlockWithPin,
        addPurchase,
        updatePurchase,
        deletePurchase,
        undoLastAction,
        logDailyCheckIn,
        deleteDailyCheckIn,
        getCheckInForDate,
        updateSettings,
        addPreset,
        deletePreset,
        loadSampleData,
        clearAllData,
        showToast,
        hideToast,
        completeOnboarding,
        notificationPermission,
        toggleDailyReminder,
        sendTestNotification,
        loginWithGoogle,
        logoutFromGoogle,
        refreshDriveFiles,
        backupToDrive,
        saveCsvToDrive,
        restoreBackupFromDrive,
        deleteFileFromDrive,
      }}
    >
      {children}
    </SpotOnContext.Provider>
  );
};

export const useSpotOn = () => {
  const context = useContext(SpotOnContext);
  if (!context) {
    throw new Error('useSpotOn must be used within a SpotOnProvider');
  }
  return context;
};

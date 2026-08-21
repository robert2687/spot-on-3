export type Category = 'alcohol' | 'tobacco';

export type Place = 'Bar' | 'Shop' | 'Home' | 'Restaurant' | 'Club' | 'Gas Station' | 'Other';

export type Language = 'en' | 'sk' | 'de' | 'es';

export interface Purchase {
  id: string;
  category: Category;
  subcategory: string;
  price: number; // Unit price or total
  quantity: number;
  totalPrice: number;
  place: Place;
  date: string; // ISO date-time string e.g. 2026-08-20T14:30
  note?: string;
  createdAt: number;
}

export interface PresetItem {
  id: string;
  category: Category;
  name: string;
  defaultPrice: number;
  place: Place;
  icon?: string;
}

export interface AppSettings {
  language: Language; // 'en' | 'sk' | 'de' | 'es'
  currency: string; // 'EUR', 'USD', 'GBP', etc.
  currencySymbol: string; // '€', '$', '£', etc.
  monthlyBudget: number;
  alcoholBudget?: number;
  tobaccoBudget?: number;
  budgetAlertEnabled?: boolean;
  budgetAlertThreshold?: number; // e.g. 80 for 80%
  showBudgetOnHome: boolean;
  localOnly: boolean;
  cloudBackup: boolean;
  requirePin: boolean;
  pinCode?: string;
  theme: 'light' | 'dark' | 'system';
  onboardingCompleted: boolean;
  dailyReminderEnabled?: boolean;
  dailyReminderTime?: string; // e.g. '20:00'
}

export interface DailyCheckIn {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  alcoholFree: boolean;
  tobaccoFree: boolean;
  note?: string;
  mood?: 'great' | 'good' | 'neutral' | 'struggled';
  createdAt: number;
}

export type NavigationTab = 'home' | 'timeline' | 'insights' | 'export';

export type PlanId = 'free' | 'premium' | 'lifetime' | 'business';

export interface EntitlementState {
  plan: PlanId;
  premiumUntil?: string;
  referralCode: string;
  successfulReferrals: number;
  checkoutStatus: 'idle' | 'loading' | 'success' | 'cancelled' | 'error';
  billingAvailable: boolean;
}

export type MilestoneCategory = 'all' | 'streaks' | 'budget' | 'tracking';
export type MilestoneTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  category: 'streaks' | 'budget' | 'tracking';
  subType?: 'tobacco' | 'alcohol' | 'budget' | 'general';
  tier: MilestoneTier;
  target: number;
  current: number;
  unit: string;
  isUnlocked: boolean;
  unlockedAtText?: string;
  iconName: string;
  celebrationTitle: string;
  celebrationMessage: string;
  rewardPoints: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

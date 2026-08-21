import { PresetItem } from '../types';

export const DEFAULT_PRESETS: PresetItem[] = [
  // Alcohol
  { id: 'alc-1', category: 'alcohol', name: 'Beer', defaultPrice: 2.50, place: 'Bar' },
  { id: 'alc-2', category: 'alcohol', name: 'Pint', defaultPrice: 5.00, place: 'Bar' },
  { id: 'alc-3', category: 'alcohol', name: 'Wine Glass', defaultPrice: 5.00, place: 'Restaurant' },
  { id: 'alc-4', category: 'alcohol', name: 'Bottle', defaultPrice: 12.00, place: 'Shop' },
  { id: 'alc-5', category: 'alcohol', name: 'Cocktail', defaultPrice: 9.00, place: 'Bar' },
  { id: 'alc-6', category: 'alcohol', name: 'Shot / Spirit', defaultPrice: 4.00, place: 'Club' },
  { id: 'alc-7', category: 'alcohol', name: '6-Pack Beer', defaultPrice: 8.50, place: 'Shop' },

  // Tobacco
  { id: 'tob-1', category: 'tobacco', name: 'Pack', defaultPrice: 4.50, place: 'Shop' },
  { id: 'tob-2', category: 'tobacco', name: 'Cigarettes Pack', defaultPrice: 8.00, place: 'Shop' },
  { id: 'tob-3', category: 'tobacco', name: 'Rolling Tobacco', defaultPrice: 14.00, place: 'Shop' },
  { id: 'tob-4', category: 'tobacco', name: 'Vape Pod', defaultPrice: 6.50, place: 'Shop' },
  { id: 'tob-5', category: 'tobacco', name: 'Cigar', defaultPrice: 11.00, place: 'Shop' },
  { id: 'tob-6', category: 'tobacco', name: 'Filters / Papers', defaultPrice: 2.50, place: 'Shop' },
];

export const CURRENCY_OPTIONS = [
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar ($)' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar ($)' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc (CHF)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona (kr)' },
];

export const PLACES_LIST = ['Bar', 'Shop', 'Home', 'Restaurant', 'Club', 'Gas Station', 'Other'] as const;

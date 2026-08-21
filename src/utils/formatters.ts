import { Purchase, Language } from '../types';
import { getTranslation } from '../i18n/translations';

export function formatCurrency(amount: number, symbol = '€'): string {
  if (isNaN(amount)) return `${symbol}0.00`;
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatDateLabel(dateStr: string, lang: Language = 'en'): string {
  try {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday = d.toDateString() === today.toDateString();
    const isYesterday = d.toDateString() === yesterday.toDateString();

    if (isToday) return getTranslation(lang, 'today');
    if (isYesterday) return getTranslation(lang, 'yesterday');

    const localeMap: Record<Language, string> = {
      en: 'en-US',
      sk: 'sk-SK',
      de: 'de-DE',
      es: 'es-ES',
    };

    return d.toLocaleDateString(localeMap[lang] || 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatTime(dateStr: string, lang: Language = 'en'): string {
  try {
    const d = new Date(dateStr);
    const localeMap: Record<Language, string> = {
      en: 'en-US',
      sk: 'sk-SK',
      de: 'de-DE',
      es: 'es-ES',
    };
    return d.toLocaleTimeString(localeMap[lang] || 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function getTimeBucket(dateStr: string): 'Morning' | 'Afternoon' | 'Evening' | 'Night' {
  try {
    const d = new Date(dateStr);
    const hour = d.getHours();
    if (hour >= 6 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 18) return 'Afternoon';
    if (hour >= 18 && hour < 24) return 'Evening';
    return 'Night'; // 0 to 5
  } catch {
    return 'Evening';
  }
}

export function getDayOfWeek(dateStr: string): 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun' {
  try {
    const d = new Date(dateStr);
    const day = d.getDay(); // 0 is Sun, 1 is Mon...
    const map: Record<number, 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'> = {
      1: 'Mon',
      2: 'Tue',
      3: 'Wed',
      4: 'Thu',
      5: 'Fri',
      6: 'Sat',
      0: 'Sun',
    };
    return map[day] || 'Mon';
  } catch {
    return 'Mon';
  }
}

export function exportToCSV(purchases: Purchase[], currencySymbol = '€'): string {
  const headers = ['ID', 'Date', 'Time', 'Category', 'Subcategory', 'Unit Price', 'Quantity', `Total Price (${currencySymbol})`, 'Place', 'Note'];
  
  const rows = purchases.map((p) => {
    const d = new Date(p.date);
    const dateFormatted = d.toISOString().split('T')[0];
    const timeFormatted = d.toTimeString().split(' ')[0].substring(0, 5);
    
    return [
      `"${p.id}"`,
      `"${dateFormatted}"`,
      `"${timeFormatted}"`,
      `"${p.category}"`,
      `"${p.subcategory.replace(/"/g, '""')}"`,
      p.price.toFixed(2),
      p.quantity,
      p.totalPrice.toFixed(2),
      `"${p.place}"`,
      `"${(p.note || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function downloadCSV(csvContent: string, filename = 'spoton_spending.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


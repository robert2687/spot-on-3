import { Purchase, DailyCheckIn } from '../types';

export function generateSamplePurchases(): Purchase[] {
  const now = new Date();
  const purchases: Purchase[] = [];

  // Helper to format date string
  const getDateStr = (daysAgo: number, hours: number, minutes: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const sampleEvents = [
    // Today
    { daysAgo: 0, hours: 14, mins: 15, cat: 'alcohol' as const, sub: 'Beer', price: 3.50, qty: 1, place: 'Bar' as const, note: 'Afternoon break' },
    { daysAgo: 0, hours: 11, mins: 30, cat: 'tobacco' as const, sub: 'Pack', price: 4.50, qty: 1, place: 'Shop' as const, note: '' },

    // Yesterday
    { daysAgo: 1, hours: 20, mins: 45, cat: 'alcohol' as const, sub: 'Pint', price: 5.00, qty: 2, place: 'Bar' as const, note: 'With coworkers' },
    { daysAgo: 1, hours: 22, mins: 10, cat: 'alcohol' as const, sub: 'Cocktail', price: 9.00, qty: 1, place: 'Bar' as const, note: 'Old fashioned' },

    // 2 days ago
    { daysAgo: 2, hours: 17, mins: 20, cat: 'tobacco' as const, sub: 'Pack', price: 4.50, qty: 1, place: 'Shop' as const, note: '' },

    // 3 days ago (Friday evening)
    { daysAgo: 3, hours: 19, mins: 30, cat: 'alcohol' as const, sub: 'Wine Glass', price: 5.00, qty: 2, place: 'Restaurant' as const, note: 'Dinner' },
    { daysAgo: 3, hours: 22, mins: 0, cat: 'alcohol' as const, sub: 'Beer', price: 3.00, qty: 3, place: 'Bar' as const, note: 'Friday social' },
    { daysAgo: 3, hours: 23, mins: 45, cat: 'alcohol' as const, sub: 'Shot / Spirit', price: 4.00, qty: 1, place: 'Club' as const, note: '' },

    // 4 days ago
    { daysAgo: 4, hours: 13, mins: 0, cat: 'tobacco' as const, sub: 'Vape Pod', price: 6.50, qty: 1, place: 'Shop' as const, note: 'Refill' },

    // 5 days ago
    { daysAgo: 5, hours: 18, mins: 15, cat: 'alcohol' as const, sub: 'Bottle', price: 12.00, qty: 1, place: 'Shop' as const, note: 'For weekend dinner' },

    // 7 days ago
    { daysAgo: 7, hours: 20, mins: 0, cat: 'alcohol' as const, sub: 'Beer', price: 3.50, qty: 2, place: 'Bar' as const, note: 'Pub trivia' },
    { daysAgo: 7, hours: 12, mins: 10, cat: 'tobacco' as const, sub: 'Pack', price: 4.50, qty: 1, place: 'Shop' as const, note: '' },

    // 9 days ago
    { daysAgo: 9, hours: 19, mins: 15, cat: 'alcohol' as const, sub: 'Cocktail', price: 9.00, qty: 2, place: 'Bar' as const, note: '' },

    // 11 days ago
    { daysAgo: 11, hours: 16, mins: 40, cat: 'tobacco' as const, sub: 'Rolling Tobacco', price: 14.00, qty: 1, place: 'Shop' as const, note: 'Pouch' },

    // 13 days ago
    { daysAgo: 13, hours: 21, mins: 30, cat: 'alcohol' as const, sub: 'Wine Glass', price: 5.50, qty: 2, place: 'Restaurant' as const, note: '' },

    // 15 days ago
    { daysAgo: 15, hours: 18, mins: 0, cat: 'alcohol' as const, sub: '6-Pack Beer', price: 8.50, qty: 1, place: 'Shop' as const, note: 'Home gathering' },

    // 18 days ago
    { daysAgo: 18, hours: 14, mins: 20, cat: 'tobacco' as const, sub: 'Pack', price: 4.50, qty: 1, place: 'Shop' as const, note: '' },
    { daysAgo: 18, hours: 20, mins: 45, cat: 'alcohol' as const, sub: 'Pint', price: 5.00, qty: 2, place: 'Bar' as const, note: '' },

    // 22 days ago
    { daysAgo: 22, hours: 21, mins: 10, cat: 'alcohol' as const, sub: 'Cocktail', price: 9.00, qty: 1, place: 'Bar' as const, note: '' },

    // 25 days ago
    { daysAgo: 25, hours: 15, mins: 30, cat: 'tobacco' as const, sub: 'Pack', price: 4.50, qty: 1, place: 'Gas Station' as const, note: '' },
    { daysAgo: 25, hours: 19, mins: 50, cat: 'alcohol' as const, sub: 'Wine Glass', price: 6.00, qty: 1, place: 'Home' as const, note: 'Relaxing' },

    // 28 days ago
    { daysAgo: 28, hours: 20, mins: 15, cat: 'alcohol' as const, sub: 'Beer', price: 2.50, qty: 3, place: 'Bar' as const, note: '' },
  ];

  sampleEvents.forEach((ev, idx) => {
    const total = Number((ev.price * ev.qty).toFixed(2));
    purchases.push({
      id: `sample-${idx + 1}`,
      category: ev.cat,
      subcategory: ev.sub,
      price: ev.price,
      quantity: ev.qty,
      totalPrice: total,
      place: ev.place,
      date: getDateStr(ev.daysAgo, ev.hours, ev.mins),
      note: ev.note,
      createdAt: Date.now() - ev.daysAgo * 86400000,
    });
  });

  return purchases;
}

export function generateSampleCheckIns(): DailyCheckIn[] {
  const now = new Date();
  const checkIns: DailyCheckIn[] = [];

  // Generate for past 14 days
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Day 1 (yesterday), Day 6, Day 8, Day 10, Day 12, Day 14 were substance-free
    // Other days had specific statuses
    const isCleanDay = [6, 8, 10, 12, 14].includes(i);
    const isAlcFreeOnly = [2, 4].includes(i);
    const isTobFreeOnly = [1, 3, 5, 7, 9].includes(i);

    let alcFree = false;
    let tobFree = false;
    let mood: 'great' | 'good' | 'neutral' | 'struggled' = 'good';
    let note = '';

    if (isCleanDay) {
      alcFree = true;
      tobFree = true;
      mood = i % 2 === 0 ? 'great' : 'good';
      note = 'Felt energetic and stayed completely clean.';
    } else if (isAlcFreeOnly) {
      alcFree = true;
      tobFree = false;
      mood = 'good';
      note = 'Drank water and herbal tea all evening.';
    } else if (isTobFreeOnly) {
      alcFree = false;
      tobFree = true;
      mood = 'neutral';
      note = 'No tobacco or vaping all day.';
    } else {
      alcFree = false;
      tobFree = false;
      mood = 'struggled';
    }

    checkIns.push({
      id: `checkin-${dateStr}`,
      date: dateStr,
      alcoholFree: alcFree,
      tobaccoFree: tobFree,
      mood,
      note,
      createdAt: d.getTime(),
    });
  }

  return checkIns;
}

import { AppSettings, Milestone, Purchase, Language } from '../types';

export interface MilestonesCalculationResult {
  milestones: Milestone[];
  unlockedCount: number;
  totalCount: number;
  totalPoints: number;
  maxPoints: number;
  streakSummary: {
    tobaccoDays: number;
    alcoholDays: number;
    underBudgetStreakMonths: number;
    totalSavings: number;
  };
}

const MILESTONES_I18N: Record<
  string,
  Record<Language, { title: string; desc: string; unit: string; celebTitle: string; celebMsg: (sym: string, budget: number) => string }>
> = {
  tobacco_3_days: {
    en: {
      title: '3 Days Tobacco-Free',
      desc: 'Maintained 3 consecutive days without buying tobacco products.',
      unit: 'days',
      celebTitle: 'First Step to Clean Air!',
      celebMsg: () => 'You broke the 72-hour barrier without tobacco. Keep the momentum going!',
    },
    sk: {
      title: '3 dni bez tabaku',
      desc: 'Udržali ste 3 po sebe idúce dni bez nákupu tabakových výrobkov.',
      unit: 'dní',
      celebTitle: 'Prvý krok k čistému vzduchu!',
      celebMsg: () => 'Prekonali ste 72-hodinovú hranicu bez tabaku. Pokračujte v skvelom tempe!',
    },
    de: {
      title: '3 Tage tabakfrei',
      desc: '3 aufeinanderfolgende Tage ohne Tabakkauf durchgehalten.',
      unit: 'Tage',
      celebTitle: 'Erster Schritt zu frischer Luft!',
      celebMsg: () => 'Du hast die 72-Stunden-Marke ohne Tabak gemeistert. Weiter so!',
    },
    es: {
      title: '3 días sin tabaco',
      desc: 'Mantuviste 3 días consecutivos sin comprar productos de tabaco.',
      unit: 'días',
      celebTitle: '¡Primer paso hacia el aire limpio!',
      celebMsg: () => 'Superaste la barrera de las 72 horas sin tabaco. ¡Sigue con este impulso!',
    },
  },
  tobacco_7_days: {
    en: {
      title: '1 Week Without Tobacco',
      desc: 'A full 7-day streak completely free of tobacco purchases.',
      unit: 'days',
      celebTitle: 'One Full Week Smoke-Free! 🎉',
      celebMsg: () => 'Seven solid days tobacco-free. Your lungs and wallet are thanking you!',
    },
    sk: {
      title: '1 týždeň bez tabaku',
      desc: 'Celých 7 dní bez jediného nákupu cigariet či tabaku.',
      unit: 'dní',
      celebTitle: 'Celý týždeň bez dymu! 🎉',
      celebMsg: () => 'Sedem celých dní bez tabaku. Vaše pľúca aj peňaženka vám ďakujú!',
    },
    de: {
      title: '1 Woche ohne Tabak',
      desc: 'Eine volle 7-Tage-Serie ohne Tabakkäufe geschafft.',
      unit: 'Tage',
      celebTitle: 'Eine ganze Woche rauchfrei! 🎉',
      celebMsg: () => 'Sieben solide Tage ohne Tabak. Deine Lunge und dein Geldbeutel danken dir!',
    },
    es: {
      title: '1 semana sin tabaco',
      desc: 'Una racha completa de 7 días sin comprar tabaco.',
      unit: 'días',
      celebTitle: '¡Una semana entera libre de humo! 🎉',
      celebMsg: () => 'Siete días seguidos sin tabaco. ¡Tus pulmones y tu bolsillo te lo agradecen!',
    },
  },
  tobacco_14_days: {
    en: {
      title: '2 Weeks Clean & Clear',
      desc: 'Two full weeks (14 days) without logging tobacco.',
      unit: 'days',
      celebTitle: 'Fortnight Champion! 🌟',
      celebMsg: () => '14 consecutive days tobacco-free. You have established a resilient habit.',
    },
    sk: {
      title: '2 týždne s čistou hlavou',
      desc: 'Dva celé týždne (14 dní) bez záznamu tabaku.',
      unit: 'dní',
      celebTitle: 'Dvojtýždňový šampión! 🌟',
      celebMsg: () => '14 po sebe idúcich dní bez tabaku. Budujete si pevný a zdravý návyk.',
    },
    de: {
      title: '2 Wochen klar & sauber',
      desc: 'Zwei volle Wochen (14 Tage) ohne Tabakeintrag.',
      unit: 'Tage',
      celebTitle: 'Zwei-Wochen-Champion! 🌟',
      celebMsg: () => '14 aufeinanderfolgende Tage tabakfrei. Eine beachtliche Gewohnheit aufgebaut!',
    },
    es: {
      title: '2 semanas limpio y despejado',
      desc: 'Dos semanas completas (14 días) sin registrar tabaco.',
      unit: 'días',
      celebTitle: '¡Campeón de la quincena! 🌟',
      celebMsg: () => '14 días consecutivos sin tabaco. Has consolidado un hábito muy saludable.',
    },
  },
  tobacco_30_days: {
    en: {
      title: '1 Month Tobacco-Free',
      desc: '30 consecutive days of tobacco-free living.',
      unit: 'days',
      celebTitle: 'Legendary 1-Month Milestone! 🏆',
      celebMsg: () => 'A phenomenal 30-day milestone. You have made life-changing health progress!',
    },
    sk: {
      title: '1 mesiac bez tabaku',
      desc: '30 po sebe idúcich dní života bez tabaku.',
      unit: 'dní',
      celebTitle: 'Legendárny 1-mesačný míľnik! 🏆',
      celebMsg: () => 'Neuveriteľných 30 dní bez tabaku. Urobili ste obrovský pokrok pre svoje zdravie!',
    },
    de: {
      title: '1 Monat tabakfrei',
      desc: '30 aufeinanderfolgende Tage ohne Tabak gelebt.',
      unit: 'Tage',
      celebTitle: 'Legendärer 1-Monats-Meilenstein! 🏆',
      celebMsg: () => 'Ein phänomenaler 30-Tage-Erfolg. Du hast lebensverändernde Fortschritte erzielt!',
    },
    es: {
      title: '1 mes sin tabaco',
      desc: '30 días consecutivos viviendo libre de tabaco.',
      unit: 'días',
      celebTitle: '¡Hito legendario de 1 mes! 🏆',
      celebMsg: () => 'Un logro fenomenal de 30 días. ¡Has transformado tu salud y bienestar!',
    },
  },
  alcohol_3_days: {
    en: {
      title: '3 Days Mindful Drinking',
      desc: '3 consecutive days without alcohol expenses.',
      unit: 'days',
      celebTitle: 'Clarity Kickstart! 💧',
      celebMsg: () => '3 consecutive days alcohol-free. Great focus and hydration!',
    },
    sk: {
      title: '3 dni s čistou mysľou',
      desc: '3 po sebe idúce dni bez výdavkov na alkohol.',
      unit: 'dní',
      celebTitle: 'Čistý štart! 💧',
      celebMsg: () => '3 dni po sebe bez alkoholu. Skvelé sústredenie a energia!',
    },
    de: {
      title: '3 Tage achtsames Trinken',
      desc: '3 aufeinanderfolgende Tage ohne Alkoholausgaben.',
      unit: 'Tage',
      celebTitle: 'Klarer Start! 💧',
      celebMsg: () => '3 aufeinanderfolgende Tage alkoholfrei. Großartiger Fokus!',
    },
    es: {
      title: '3 días de consumo consciente',
      desc: '3 días consecutivos sin gastos en alcohol.',
      unit: 'días',
      celebTitle: '¡Inicio con claridad! 💧',
      celebMsg: () => '3 días seguidos sin alcohol. ¡Excelente enfoque e hidratación!',
    },
  },
  alcohol_7_days: {
    en: {
      title: '1 Week Alcohol-Free',
      desc: '7 consecutive days alcohol-free with zero drink purchases.',
      unit: 'days',
      celebTitle: 'One Week Dry Streak! 🥂',
      celebMsg: () => '7 days of intentional sobriety and mindful spending.',
    },
    sk: {
      title: '1 týždeň bez alkoholu',
      desc: '7 po sebe idúcich dní bez nákupu alkoholu.',
      unit: 'dní',
      celebTitle: 'Celý týždeň triezvo! 🥂',
      celebMsg: () => '7 dní vedomej triezvosti a zodpovedného hospodárenia.',
    },
    de: {
      title: '1 Woche alkoholfrei',
      desc: '7 aufeinanderfolgende Tage ohne alkoholische Getränke.',
      unit: 'Tage',
      celebTitle: 'Eine Woche trocken! 🥂',
      celebMsg: () => '7 Tage bewusste Nüchternheit und Ersparnis.',
    },
    es: {
      title: '1 semana sin alcohol',
      desc: '7 días consecutivos sin gastos en bebidas alcohólicas.',
      unit: 'días',
      celebTitle: '¡Una semana sobria! 🥂',
      celebMsg: () => '7 días de sobriedad intencional y gasto inteligente.',
    },
  },
  alcohol_30_days: {
    en: {
      title: 'Dry Month Conqueror',
      desc: '30 consecutive days without alcohol purchases.',
      unit: 'days',
      celebTitle: '30-Day Dry Conqueror! 👑',
      celebMsg: () => 'A full month of absolute clarity and substantial personal savings!',
    },
    sk: {
      title: 'Dobyvateľ suchého mesiaca',
      desc: '30 po sebe idúcich dní bez nákupov alkoholu.',
      unit: 'dní',
      celebTitle: 'Suchý mesiac úspešne zvládnutý! 👑',
      celebMsg: () => 'Celý mesiac absolútnej čistoty a výrazných osobných úspor!',
    },
    de: {
      title: 'Trockener Monat Bezwinger',
      desc: '30 aufeinanderfolgende Tage ohne Alkoholkäufe.',
      unit: 'Tage',
      celebTitle: '30 Tage trocken gemeistert! 👑',
      celebMsg: () => 'Ein voller Monat absolute Klarheit und spürbare Ersparnisse!',
    },
    es: {
      title: 'Conquistador del mes sobrio',
      desc: '30 días consecutivos sin compras de alcohol.',
      unit: 'días',
      celebTitle: '¡30 días sobrios conquistados! 👑',
      celebMsg: () => '¡Un mes completo de absoluta claridad y gran ahorro personal!',
    },
  },
  budget_1_month: {
    en: {
      title: 'Budget Keeper (1 Month)',
      desc: 'Stayed safely under your monthly spending limit for a full month.',
      unit: 'month',
      celebTitle: 'Monthly Budget Mastered! 🛡️',
      celebMsg: (sym, b) => `You hit your spending goal and stayed under your ${sym}${b} limit!`,
    },
    sk: {
      title: 'Strážca rozpočtu (1 mesiac)',
      desc: 'Udržali ste výdavky bezpečne pod mesačným limitom počas celého mesiaca.',
      unit: 'mesiac',
      celebTitle: 'Mesačný rozpočet zvládnutý! 🛡️',
      celebMsg: (sym, b) => `Splnili ste svoj cieľ a neprekročili limit ${sym}${b}!`,
    },
    de: {
      title: 'Budget-Hüter (1 Monat)',
      desc: 'Einen vollen Monat sicher unter dem Ausgabenlimit geblieben.',
      unit: 'Monat',
      celebTitle: 'Monatsbudget gemeistert! 🛡️',
      celebMsg: (sym, b) => `Du hast dein Sparziel erreicht und bist unter dem Limit von ${sym}${b} geblieben!`,
    },
    es: {
      title: 'Guardián del presupuesto (1 mes)',
      desc: 'Te mantuviste bajo tu límite de gasto mensual durante un mes entero.',
      unit: 'mes',
      celebTitle: '¡Presupuesto mensual dominado! 🛡️',
      celebMsg: (sym, b) => `¡Cumpliste tu objetivo y te mantuviste bajo tu límite de ${sym}${b}!`,
    },
  },
  budget_3_months: {
    en: {
      title: 'Stayed Under Budget for 3 Months',
      desc: 'Maintained monthly spending under budget for 3 consecutive months.',
      unit: 'months',
      celebTitle: '3 Months Under Budget! 🎯',
      celebMsg: () => 'Quarter-year financial mastery! You proved that consistent budgeting is second nature.',
    },
    sk: {
      title: '3 mesiace pod rozpočtom',
      desc: 'Udržali ste mesačné výdavky pod limitom 3 po sebe idúce mesiace.',
      unit: 'mesiace',
      celebTitle: '3 mesiace v rozpočte! 🎯',
      celebMsg: () => 'Štvrťročná finančná disciplína! Dokázali ste, že rozpočet máte plne pod kontrolou.',
    },
    de: {
      title: '3 Monate im Budget geblieben',
      desc: 'Monatliche Ausgaben 3 Monate in Folge unter dem Budget gehalten.',
      unit: 'Monate',
      celebTitle: '3 Monate im Budget! 🎯',
      celebMsg: () => 'Ein Vierteljahr Finanzdisziplin! Regelmäßiges Budgetieren ist dir zur zweiten Natur geworden.',
    },
    es: {
      title: 'Bajo presupuesto durante 3 meses',
      desc: 'Mantuviste los gastos bajo el límite durante 3 meses consecutivos.',
      unit: 'meses',
      celebTitle: '¡3 meses bajo presupuesto! 🎯',
      celebMsg: () => '¡Dominio financiero trimestral! Demostraste gran constancia y disciplina.',
    },
  },
  budget_6_months: {
    en: {
      title: 'Half-Year Fiscal Guru',
      desc: 'Kept spending within target limits across 6 consecutive months.',
      unit: 'months',
      celebTitle: '6-Month Fiscal Royalty! 👑',
      celebMsg: () => 'Half a year of outstanding financial restraint and disciplined tracking.',
    },
    sk: {
      title: 'Polročný majster rozpočtu',
      desc: 'Udržali ste výdavky v rámci stanovených limitov 6 mesiacov po sebe.',
      unit: 'mesiacov',
      celebTitle: 'Polročný finančný kráľ! 👑',
      celebMsg: () => 'Pol roka mimoriadnej sebadisciplíny a zodpovedného sledovania financií.',
    },
    de: {
      title: 'Halbjahres-Finanz-Guru',
      desc: 'Ausgaben 6 Monate in Folge innerhalb des Ziels gehalten.',
      unit: 'Monate',
      celebTitle: '6 Monate Budget-König! 👑',
      celebMsg: () => 'Ein halbes Jahr herausragende Ausgabendisziplin und Kontrolle.',
    },
    es: {
      title: 'Gurú financiero semestral',
      desc: 'Mantuviste tus gastos dentro del límite durante 6 meses seguidos.',
      unit: 'meses',
      celebTitle: '¡Realeza financiera semestral! 👑',
      celebMsg: () => 'Medio año de excelente autocontrol y seguimiento disciplinado.',
    },
  },
  savings_100: {
    en: {
      title: 'Savings Centurion (100+ Saved)',
      desc: 'Accumulated 100+ in saved funds compared to monthly limits.',
      unit: 'saved',
      celebTitle: '100+ Saved In The Bank! 💰',
      celebMsg: (sym) => `You have conserved over ${sym}100 through deliberate daily choices.`,
    },
    sk: {
      title: 'Sporiaci šampión (100+ ušetrených)',
      desc: 'Ušetrili ste viac ako 100 v porovnaní s mesačnými limitmi.',
      unit: 'ušetrené',
      celebTitle: 'Viac ako 100 ušetrených v peňaženke! 💰',
      celebMsg: (sym) => `Vďaka uvážlivým každodenným rozhodnutiam ste ušetrili vyše ${sym}100.`,
    },
    de: {
      title: 'Spar-Champion (100+ gespart)',
      desc: 'Über 100 im Vergleich zu den Monatslimits eingespart.',
      unit: 'gespart',
      celebTitle: '100+ auf dem Konto gespart! 💰',
      celebMsg: (sym) => `Du hast durch bewusste Entscheidungen über ${sym}100 gespart.`,
    },
    es: {
      title: 'Centurión del ahorro (100+ ahorrado)',
      desc: 'Acumulaste 100+ en fondos ahorrados respecto al presupuesto.',
      unit: 'ahorrado',
      celebTitle: '¡100+ ahorrados en el banco! 💰',
      celebMsg: (sym) => `Has ahorrado más de ${sym}100 gracias a tus decisiones conscientes.`,
    },
  },
  first_log: {
    en: {
      title: 'First Step Forward',
      desc: 'Logged your first transaction with place, category, and timestamp.',
      unit: 'entry',
      celebTitle: 'Awareness Journey Begun! 🚀',
      celebMsg: () => 'Tracking is the foundation of habit transformation. Welcome to SpotOn!',
    },
    sk: {
      title: 'Prvý krok vpred',
      desc: 'Zaznamenali ste svoj prvý výdavok s miestom, kategóriou a časom.',
      unit: 'záznam',
      celebTitle: 'Cesta k vedomému míňaniu začala! 🚀',
      celebMsg: () => 'Pravidelné sledovanie je základom zmeny návykov. Vitajte v SpotOn!',
    },
    de: {
      title: 'Erster Schritt vorwärts',
      desc: 'Erste Ausgabe mit Ort, Kategorie und Zeitstempel erfasst.',
      unit: 'Eintrag',
      celebTitle: 'Deine Reise hat begonnen! 🚀',
      celebMsg: () => 'Tracking ist das Fundament für Gewohnheitsänderungen. Willkommen bei SpotOn!',
    },
    es: {
      title: 'Primer paso adelante',
      desc: 'Registraste tu primera transacción con lugar, categoría y hora.',
      unit: 'registro',
      celebTitle: '¡El camino de la consciencia ha comenzado! 🚀',
      celebMsg: () => 'El registro es la clave del cambio de hábitos. ¡Bienvenido a SpotOn!',
    },
  },
  log_10_entries: {
    en: {
      title: 'Consistency Scout (10 Logs)',
      desc: 'Logged 10 entries to uncover spending patterns and habit triggers.',
      unit: 'entries',
      celebTitle: '10 Entries Logged! 📈',
      celebMsg: () => 'Your insights heatmap and trends are now powered by real data.',
    },
    sk: {
      title: 'Zodpovedný prieskumník (10 záznamov)',
      desc: 'Zaznamenali ste 10 nákupov na odhalenie vzorcov a spúšťačov míňania.',
      unit: 'záznamov',
      celebTitle: '10 nákupov zaznamenaných! 📈',
      celebMsg: () => 'Vaše štatistiky a grafy sú teraz poháňané reálnymi údajmi.',
    },
    de: {
      title: 'Beständigkeits-Scout (10 Einträge)',
      desc: '10 Ausgaben erfasst, um Ausgabenmuster und Auslöser zu erkennen.',
      unit: 'Einträge',
      celebTitle: '10 Einträge erfasst! 📈',
      celebMsg: () => 'Deine Auswertungen und Trends basieren nun auf echten Daten.',
    },
    es: {
      title: 'Explorador constante (10 registros)',
      desc: 'Registraste 10 gastos para descubrir patrones y desencadenantes.',
      unit: 'registros',
      celebTitle: '¡10 gastos registrados! 📈',
      celebMsg: () => 'Tus estadísticas y mapas de calor ahora cuentan con datos reales.',
    },
  },
  log_30_entries: {
    en: {
      title: 'SpotOn Habit Veteran (30 Logs)',
      desc: 'Recorded 30+ transactions for comprehensive habit analytics.',
      unit: 'entries',
      celebTitle: 'True Tracking Veteran! 🏅',
      celebMsg: () => '30 detailed transactions recorded. Your self-discipline is unmatched.',
    },
    sk: {
      title: 'Skúsený veterán (30 záznamov)',
      desc: 'Zaznamenali ste 30+ výdavkov pre komplexnú analýzu zvykov.',
      unit: 'záznamov',
      celebTitle: 'Skutočný majster evidencie! 🏅',
      celebMsg: () => '30 detailne zaznamenaných výdavkov. Vaša disciplína je obdivuhodná.',
    },
    de: {
      title: 'SpotOn Tracking-Veteran (30 Einträge)',
      desc: '30+ Ausgaben erfasst für umfassende Verhaltensanalysen.',
      unit: 'Einträge',
      celebTitle: 'Wahrer Tracking-Veteran! 🏅',
      celebMsg: () => '30 detaillierte Transaktionen erfasst. Herausragende Selbstdisziplin!',
    },
    es: {
      title: 'Veterano de SpotOn (30 registros)',
      desc: 'Registraste 30+ compras para un análisis exhaustivo de tus hábitos.',
      unit: 'registros',
      celebTitle: '¡Auténtico veterano del registro! 🏅',
      celebMsg: () => '30 compras detalladas registradas. ¡Tu autodisciplina es ejemplar!',
    },
  },
};

export function calculateMilestones(
  purchases: Purchase[],
  settings: AppSettings,
  customLang?: Language
): MilestonesCalculationResult {
  const lang: Language = customLang || settings.language || 'en';
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Separate purchases by category
  const tobaccoPurchases = purchases
    .filter((p) => p.category === 'tobacco')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const alcoholPurchases = purchases
    .filter((p) => p.category === 'alcohol')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Earliest recorded purchase timestamp
  const allSortedDates = purchases
    .map((p) => new Date(p.date).getTime())
    .sort((a, b) => a - b);
  const oldestDate = allSortedDates.length > 0 ? new Date(allSortedDates[0]) : now;
  const daysSinceFirstLog = Math.max(
    0,
    Math.floor((now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  // 1. Current Tobacco-Free Days
  let tobaccoDays = 0;
  if (tobaccoPurchases.length === 0) {
    tobaccoDays = purchases.length > 0 ? Math.max(1, daysSinceFirstLog) : 0;
  } else {
    const latestTobacco = new Date(tobaccoPurchases[0].date);
    const diffMs = now.getTime() - latestTobacco.getTime();
    tobaccoDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  // 2. Current Alcohol-Free Days
  let alcoholDays = 0;
  if (alcoholPurchases.length === 0) {
    alcoholDays = purchases.length > 0 ? Math.max(1, daysSinceFirstLog) : 0;
  } else {
    const latestAlcohol = new Date(alcoholPurchases[0].date);
    const diffMs = now.getTime() - latestAlcohol.getTime();
    alcoholDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  // 3. Historical Streaks
  const calcMaxStreakDays = (catPurchases: Purchase[]): number => {
    if (catPurchases.length === 0) return tobaccoDays;
    const sortedAsc = [...catPurchases].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let maxStreak = 0;
    for (let i = 0; i < sortedAsc.length - 1; i++) {
      const gap = Math.floor(
        (new Date(sortedAsc[i + 1].date).getTime() - new Date(sortedAsc[i].date).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (gap > maxStreak) maxStreak = gap;
    }
    const openStreak = Math.floor(
      (now.getTime() - new Date(sortedAsc[sortedAsc.length - 1].date).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return Math.max(maxStreak, openStreak);
  };

  const bestTobaccoStreak = Math.max(tobaccoDays, calcMaxStreakDays(tobaccoPurchases));
  const bestAlcoholStreak = Math.max(alcoholDays, calcMaxStreakDays(alcoholPurchases));

  // 4. Monthly Budget Performance
  const monthlyTotals: Record<string, number> = {};
  purchases.forEach((p) => {
    const d = new Date(p.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyTotals[key] = (monthlyTotals[key] || 0) + p.totalPrice;
  });

  const monthlyBudget = settings.monthlyBudget || 120;
  let underBudgetStreakMonths = 0;
  let totalSavings = 0;
  let pastMonthsUnderBudgetCount = 0;

  for (let m = 1; m <= 12; m++) {
    const pastDate = new Date(currentYear, currentMonth - m, 1);
    const key = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}`;
    const spend = monthlyTotals[key];

    if (spend !== undefined) {
      if (spend <= monthlyBudget) {
        pastMonthsUnderBudgetCount += 1;
        totalSavings += Math.max(0, monthlyBudget - spend);
        if (underBudgetStreakMonths === m - 1) {
          underBudgetStreakMonths += 1;
        }
      }
    } else if (allSortedDates.length > 0 && pastDate.getTime() >= oldestDate.getTime()) {
      pastMonthsUnderBudgetCount += 1;
      totalSavings += monthlyBudget;
      if (underBudgetStreakMonths === m - 1) {
        underBudgetStreakMonths += 1;
      }
    }
  }

  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const currentMonthSpend = monthlyTotals[currentMonthKey] || 0;
  const isCurrentMonthUnder = currentMonthSpend <= monthlyBudget;

  if (isCurrentMonthUnder && (underBudgetStreakMonths > 0 || purchases.length > 0)) {
    underBudgetStreakMonths = Math.max(underBudgetStreakMonths, 1);
  }

  const getI18n = (id: string) => {
    const entry = MILESTONES_I18N[id] || MILESTONES_I18N.tobacco_3_days;
    return entry[lang] || entry.en;
  };

  // Define All Milestones with localized text
  const rawMilestones: Milestone[] = [
    // --- TOBACCO MILESTONES ---
    {
      id: 'tobacco_3_days',
      title: getI18n('tobacco_3_days').title,
      description: getI18n('tobacco_3_days').desc,
      category: 'streaks',
      subType: 'tobacco',
      tier: 'bronze',
      target: 3,
      current: bestTobaccoStreak,
      unit: getI18n('tobacco_3_days').unit,
      isUnlocked: bestTobaccoStreak >= 3,
      iconName: 'Flame',
      celebrationTitle: getI18n('tobacco_3_days').celebTitle,
      celebrationMessage: getI18n('tobacco_3_days').celebMsg(settings.currencySymbol, monthlyBudget),
      rewardPoints: 50,
    },
    {
      id: 'tobacco_7_days',
      title: getI18n('tobacco_7_days').title,
      description: getI18n('tobacco_7_days').desc,
      category: 'streaks',
      subType: 'tobacco',
      tier: 'gold',
      target: 7,
      current: bestTobaccoStreak,
      unit: getI18n('tobacco_7_days').unit,
      isUnlocked: bestTobaccoStreak >= 7,
      iconName: 'Flame',
      celebrationTitle: getI18n('tobacco_7_days').celebTitle,
      celebrationMessage: getI18n('tobacco_7_days').celebMsg(settings.currencySymbol, monthlyBudget),
      rewardPoints: 150,
    },
    {
      id: 'tobacco_14_days',
      title: getI18n('tobacco_14_days').title,
      description: getI18n('tobacco_14_days').desc,
      category: 'streaks',
      subType: 'tobacco',
      tier: 'gold',
      target: 14,
      current: bestTobaccoStreak,
      unit: getI18n('tobacco_14_days').unit,
      isUnlocked: bestTobaccoStreak >= 14,
      iconName: 'Flame',
      celebrationTitle: getI18n('tobacco_14_days').celebTitle,
      celebrationMessage: getI18n('tobacco_14_days').celebMsg(settings.currencySymbol, monthlyBudget),
      rewardPoints: 300,
    },
    {
      id: 'tobacco_30_days',
      title: getI18n('tobacco_30_days').title,
      description: getI18n('tobacco_30_days').desc,
      category: 'streaks',
      subType: 'tobacco',
      tier: 'diamond',
      target: 30,
      current: bestTobaccoStreak,
      unit: getI18n('tobacco_30_days').unit,
      isUnlocked: bestTobaccoStreak >= 30,
      iconName: 'Sparkles',
      celebrationTitle: getI18n('tobacco_30_days').celebTitle,
      celebrationMessage: getI18n('tobacco_30_days').celebMsg(settings.currencySymbol, monthlyBudget),
      rewardPoints: 600,
    },

    // --- ALCOHOL MILESTONES ---
    {
      id: 'alcohol_3_days',
      title: getI18n('alcohol_3_days').title,
      description: getI18n('alcohol_3_days').desc,
      category: 'streaks',
      subType: 'alcohol',
      tier: 'bronze',
      target: 3,
      current: bestAlcoholStreak,
      unit: getI18n('alcohol_3_days').unit,
      isUnlocked: bestAlcoholStreak >= 3,
      iconName: 'Wine',
      celebrationTitle: getI18n('alcohol_3_days').celebTitle,
      celebrationMessage: getI18n('alcohol_3_days').celebMsg(settings.currencySymbol, monthlyBudget),
      rewardPoints: 50,
    },
    {
      id: 'alcohol_7_days',
      title: getI18n('alcohol_7_days').title,
      description: getI18n('alcohol_7_days').desc,
      category: 'streaks',
      subType: 'alcohol',
      tier: 'gold',
      target: 7,
      current: bestAlcoholStreak,
      unit: getI18n('alcohol_7_days').unit,
      isUnlocked: bestAlcoholStreak >= 7,
      iconName: 'Wine',
      celebrationTitle: getI18n('alcohol_7_days').celebTitle,
      celebrationMessage: getI18n('alcohol_7_days').celebMsg(settings.currencySymbol, monthlyBudget),
      rewardPoints: 150,
    },
    {
      id: 'alcohol_30_days',
      title: getI18n('alcohol_30_days').title,
      description: getI18n('alcohol_30_days').desc,
      category: 'streaks',
      subType: 'alcohol',
      tier: 'diamond',
      target: 30,
      current: bestAlcoholStreak,
      unit: getI18n('alcohol_30_days').unit,
      isUnlocked: bestAlcoholStreak >= 30,
      iconName: 'Sparkles',
      celebrationTitle: getI18n('alcohol_30_days').celebTitle,
      celebrationMessage: getI18n('alcohol_30_days').celebMsg(settings.currencySymbol, monthlyBudget),
      rewardPoints: 600,
    },

    // --- BUDGET & FINANCIAL DISCIPLINE MILESTONES ---
    {
      id: 'budget_1_month',
      title: getI18n('budget_1_month').title,
      description: getI18n('budget_1_month').desc,
      category: 'budget',
      subType: 'budget',
      tier: 'silver',
      target: 1,
      current: Math.max(underBudgetStreakMonths, pastMonthsUnderBudgetCount > 0 ? 1 : 0),
      unit: getI18n('budget_1_month').unit,
      isUnlocked: underBudgetStreakMonths >= 1 || pastMonthsUnderBudgetCount >= 1,
      iconName: 'ShieldCheck',
      celebrationTitle: getI18n('budget_1_month').celebTitle,
      celebrationMessage: getI18n('budget_1_month').celebMsg(settings.currencySymbol, monthlyBudget),
      rewardPoints: 100,
    },
    {
      id: 'budget_3_months',
      title: getI18n('budget_3_months').title,
      description: getI18n('budget_3_months').desc,
      category: 'budget',
      subType: 'budget',
      tier: 'gold',
      target: 3,
      current: underBudgetStreakMonths,
      unit: getI18n('budget_3_months').unit,
      isUnlocked: underBudgetStreakMonths >= 3,
      iconName: 'Target',
      celebrationTitle: getI18n('budget_3_months').celebTitle,
      celebrationMessage: getI18n('budget_3_months').celebMsg(settings.currencySymbol, monthlyBudget),
      rewardPoints: 350,
    },
    {
      id: 'budget_6_months',
      title: getI18n('budget_6_months').title,
      description: getI18n('budget_6_months').desc,
      category: 'budget',
      subType: 'budget',
      tier: 'diamond',
      target: 6,
      current: underBudgetStreakMonths,
      unit: getI18n('budget_6_months').unit,
      isUnlocked: underBudgetStreakMonths >= 6,
      iconName: 'Crown',
      celebrationTitle: getI18n('budget_6_months').celebTitle,
      celebrationMessage: getI18n('budget_6_months').celebMsg(settings.currencySymbol, monthlyBudget),
      rewardPoints: 750,
    },
    {
      id: 'savings_100',
      title: getI18n('savings_100').title,
      description: getI18n('savings_100').desc,
      category: 'budget',
      subType: 'budget',
      tier: 'gold',
      target: 100,
      current: Math.round(totalSavings),
      unit: settings.currencySymbol,
      isUnlocked: totalSavings >= 100,
      iconName: 'Wallet',
      celebrationTitle: getI18n('savings_100').celebTitle,
      celebrationMessage: getI18n('savings_100').celebMsg(settings.currencySymbol, monthlyBudget),
      rewardPoints: 200,
    },

    // --- TRACKING & HABIT BUILDER MILESTONES ---
    {
      id: 'first_log',
      title: getI18n('first_log').title,
      description: getI18n('first_log').desc,
      category: 'tracking',
      subType: 'general',
      tier: 'bronze',
      target: 1,
      current: purchases.length >= 1 ? 1 : 0,
      unit: getI18n('first_log').unit,
      isUnlocked: purchases.length >= 1,
      iconName: 'CheckCircle2',
      celebrationTitle: getI18n('first_log').celebTitle,
      celebrationMessage: getI18n('first_log').celebMsg(settings.currencySymbol, monthlyBudget),
      rewardPoints: 25,
    },
    {
      id: 'log_10_entries',
      title: getI18n('log_10_entries').title,
      description: getI18n('log_10_entries').desc,
      category: 'tracking',
      subType: 'general',
      tier: 'silver',
      target: 10,
      current: purchases.length,
      unit: getI18n('log_10_entries').unit,
      isUnlocked: purchases.length >= 10,
      iconName: 'TrendingUp',
      celebrationTitle: getI18n('log_10_entries').celebTitle,
      celebrationMessage: getI18n('log_10_entries').celebMsg(settings.currencySymbol, monthlyBudget),
      rewardPoints: 100,
    },
    {
      id: 'log_30_entries',
      title: getI18n('log_30_entries').title,
      description: getI18n('log_30_entries').desc,
      category: 'tracking',
      subType: 'general',
      tier: 'diamond',
      target: 30,
      current: purchases.length,
      unit: getI18n('log_30_entries').unit,
      isUnlocked: purchases.length >= 30,
      iconName: 'Award',
      celebrationTitle: getI18n('log_30_entries').celebTitle,
      celebrationMessage: getI18n('log_30_entries').celebMsg(settings.currencySymbol, monthlyBudget),
      rewardPoints: 300,
    },
  ];

  const unlockedCount = rawMilestones.filter((m) => m.isUnlocked).length;
  const totalPoints = rawMilestones
    .filter((m) => m.isUnlocked)
    .reduce((acc, m) => acc + m.rewardPoints, 0);
  const maxPoints = rawMilestones.reduce((acc, m) => acc + m.rewardPoints, 0);

  return {
    milestones: rawMilestones,
    unlockedCount,
    totalCount: rawMilestones.length,
    totalPoints,
    maxPoints,
    streakSummary: {
      tobaccoDays,
      alcoholDays,
      underBudgetStreakMonths,
      totalSavings,
    },
  };
}


import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, Camera, Wine, Flame, MapPin, Sparkles, Check, Trash2, Zap } from 'lucide-react';
import { useSpotOn } from '../../context/SpotOnContext';
import { Category, Place, Purchase } from '../../types';
import { PLACES_LIST } from '../../data/defaultPresets';
import { formatCurrency } from '../../utils/formatters';
import { ReceiptScannerModal } from './ReceiptScannerModal';

export const AddPurchaseModal: React.FC = () => {
  const { isAddModalOpen, closeAddModal, editingPurchase, addPurchase, updatePurchase, deletePurchase, presets, settings, purchases, t } = useSpotOn();

  // Form State
  const [category, setCategory] = useState<Category>('alcohol');
  const [subcategory, setSubcategory] = useState<string>('Beer');
  const [priceInput, setPriceInput] = useState<string>('2.50');
  const [quantity, setQuantity] = useState<number>(1);
  const [place, setPlace] = useState<Place>('Bar');
  const [note, setNote] = useState<string>('');
  const [dateTime, setDateTime] = useState<string>(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const getPlaceLabel = (p: string) => {
    switch (p) {
      case 'home': return t('placeHome');
      case 'bar': return t('placeBar');
      case 'store': return t('placeStore');
      case 'social': return t('placeSocial');
      case 'restaurant': return t('placeRestaurant');
      case 'party': return t('placeParty');
      default: return p;
    }
  };

  // Sync state when editing or opening
  useEffect(() => {
    if (editingPurchase) {
      setCategory(editingPurchase.category);
      setSubcategory(editingPurchase.subcategory);
      setPriceInput(editingPurchase.price.toString());
      setQuantity(editingPurchase.quantity);
      setPlace(editingPurchase.place);
      setNote(editingPurchase.note || '');
      setDateTime(editingPurchase.date.slice(0, 16));
    } else {
      // Default reset for new entry
      setCategory('alcohol');
      setSubcategory('Beer');
      setPriceInput('2.50');
      setQuantity(1);
      setPlace('Bar');
      setNote('');
      const now = new Date();
      setDateTime(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    }
  }, [editingPurchase, isAddModalOpen]);

  // When category changes, auto-adjust default subcategory if untouched
  const handleCategoryChange = (newCat: Category) => {
    setCategory(newCat);
    const matchingPreset = presets.find((p) => p.category === newCat);
    if (matchingPreset) {
      setSubcategory(matchingPreset.name);
      setPriceInput(matchingPreset.defaultPrice.toFixed(2));
      setPlace(matchingPreset.place);
    }
  };

  const handleSelectPreset = (pName: string, pPrice: number, pPlace: Place) => {
    setSubcategory(pName);
    setPriceInput(pPrice.toFixed(2));
    setPlace(pPlace);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(priceInput);
    if (isNaN(numPrice) || numPrice < 0) {
      return;
    }

    const safeQty = Math.max(1, quantity);
    const total = Number((numPrice * safeQty).toFixed(2));

    if (editingPurchase) {
      updatePurchase(editingPurchase.id, {
        category,
        subcategory: subcategory.trim() || (category === 'alcohol' ? 'Alcohol item' : 'Tobacco item'),
        price: numPrice,
        quantity: safeQty,
        totalPrice: total,
        place,
        date: dateTime,
        note: note.trim() || undefined,
      });
    } else {
      addPurchase({
        category,
        subcategory: subcategory.trim() || (category === 'alcohol' ? 'Alcohol item' : 'Tobacco item'),
        price: numPrice,
        quantity: safeQty,
        totalPrice: total,
        place,
        date: dateTime,
        note: note.trim() || undefined,
      });
    }

    closeAddModal();
  };

  const handleDelete = () => {
    if (editingPurchase) {
      deletePurchase(editingPurchase.id);
      closeAddModal();
    }
  };

  // Filtered presets for active category
  const activePresets = presets.filter((p) => p.category === category);

  // Dynamic Quick Add amounts based on common standards ($10, $20, $50) and recent purchase history
  const quickAmounts = useMemo(() => {
    const defaultAmounts = [5, 10, 20, 50];

    // Extract recent purchases (prefer current category, or all)
    const categoryPurchases = purchases.filter((p) => p.category === category);
    const pool = (categoryPurchases.length >= 3 ? categoryPurchases : purchases)
      .slice(0, 20)
      .map((p) => Number(p.price))
      .filter((p) => !isNaN(p) && p > 0);

    // Frequency analysis
    const freq: Record<number, number> = {};
    pool.forEach((val) => {
      freq[val] = (freq[val] || 0) + 1;
    });

    const frequentRecent = Object.keys(freq)
      .map(Number)
      .sort((a, b) => freq[b] - freq[a])
      .slice(0, 3);

    // Merge and sort
    const combined = Array.from(new Set([...defaultAmounts, ...frequentRecent]))
      .filter((val) => val > 0 && val <= 300)
      .sort((a, b) => a - b);

    return combined.slice(0, 6);
  }, [purchases, category]);

  const calculatedTotal = (parseFloat(priceInput) || 0) * Math.max(1, quantity);

  if (!isAddModalOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="pt-6 px-6 pb-2 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingPurchase ? t('editPurchase') : t('addPurchase')}
              </h2>

              <div className="flex items-center gap-1">
                {editingPurchase && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-full transition"
                    title={t('deleteEntry')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  aria-label={t('close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-4 space-y-4 flex-1">
              {/* 1. Category Switch */}
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex">
                <button
                  type="button"
                  onClick={() => handleCategoryChange('alcohol')}
                  className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${
                    category === 'alcohol'
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Wine className="w-4 h-4" />
                  {t('categoryAlcohol')}
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('tobacco')}
                  className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${
                    category === 'tobacco'
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  {t('categoryTobacco')}
                </button>
              </div>

              {/* 2. Preset Items Carousel */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('quickPresets')}</p>
                  <span className="text-[10px] text-slate-400">{t('tapToFill')}</span>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
                  {activePresets.map((preset) => {
                    const isSelected = subcategory === preset.name;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset.name, preset.defaultPrice, preset.place)}
                        className={`flex-shrink-0 w-24 p-3 rounded-2xl text-center cursor-pointer transition border ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                        }`}
                      >
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{preset.name}</p>
                        <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                          {formatCurrency(preset.defaultPrice, settings.currencySymbol)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Description Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('itemDescription')}</label>
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder={t('itemDescriptionPlaceholder')}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-2.5 px-4 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* 4. Price & Quantity Stepper */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('price')}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      {settings.currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-2.5 pl-8 pr-3 font-bold text-base focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('quantity')}</label>
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl shadow-xs text-lg font-bold active:scale-95 transition"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-base text-slate-900 dark:text-white">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl shadow-xs text-lg font-bold active:scale-95 transition"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Add Amounts */}
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('quickAddAmounts')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{t('commonAndRecent')}</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {quickAmounts.map((amt) => {
                    const isSelected = Math.abs((parseFloat(priceInput) || 0) - amt) < 0.001;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setPriceInput(amt % 1 === 0 ? amt.toString() : amt.toFixed(2))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-300'
                        }`}
                      >
                        {formatCurrency(amt, settings.currencySymbol)}
                      </button>
                    );
                  })}

                  {/* Increment shortcuts (+5, +10) */}
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseFloat(priceInput) || 0;
                        const next = Math.max(0, current + 5);
                        setPriceInput(next % 1 === 0 ? next.toString() : next.toFixed(2));
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:text-blue-600 dark:hover:text-blue-300 hover:border-blue-300 active:scale-95 transition"
                      title="Add 5 to price"
                    >
                      +{settings.currencySymbol}5
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseFloat(priceInput) || 0;
                        const next = Math.max(0, current + 10);
                        setPriceInput(next % 1 === 0 ? next.toString() : next.toFixed(2));
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:text-blue-600 dark:hover:text-blue-300 hover:border-blue-300 active:scale-95 transition"
                      title="Add 10 to price"
                    >
                      +{settings.currencySymbol}10
                    </button>
                  </div>
                </div>
              </div>

              {/* Total Calculation Badge */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t('totalCalculation', {
                    qty: quantity,
                    price: formatCurrency(parseFloat(priceInput) || 0, settings.currencySymbol),
                  })}
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {formatCurrency(calculatedTotal, settings.currencySymbol)}
                </span>
              </div>

              {/* 5. Place Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('locationPlace')}</label>
                <div className="flex flex-wrap gap-1.5">
                  {PLACES_LIST.map((p) => {
                    const isSelected = place === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlace(p)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {getPlaceLabel(p)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Date & Time */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('dateTime')}</label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-2.5 px-4 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* 7. Note (optional) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('noteOptional')}</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('notePlaceholder')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-2.5 px-4 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Scan receipt button */}
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="w-full py-3 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition"
              >
                <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                {t('scanReceipt')}
              </button>

              {/* Save Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-2xl font-bold text-base shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                {editingPurchase ? t('saveChanges') : t('savePurchase')}
              </button>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Receipt Scanner Modal */}
      <ReceiptScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onExtracted={(extracted) => {
          setCategory(extracted.category);
          setSubcategory(extracted.subcategory);
          setPriceInput(extracted.price.toFixed(2));
          setQuantity(extracted.quantity);
          setPlace(extracted.place);
          if (extracted.note) setNote(extracted.note);
        }}
      />
    </>
  );
};


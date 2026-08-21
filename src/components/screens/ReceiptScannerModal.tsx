import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, X, Check, Sparkles, ReceiptText, ArrowRight } from 'lucide-react';
import { Category, Place } from '../../types';
import { useSpotOn } from '../../context/SpotOnContext';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtracted: (data: {
    category: Category;
    subcategory: string;
    price: number;
    quantity: number;
    place: Place;
    note?: string;
  }) => void;
}

const DEMO_RECEIPTS = [
  {
    id: 'demo-1',
    title: 'The Local Tavern',
    category: 'alcohol' as Category,
    subcategory: 'Craft Pint & Cider',
    price: 6.20,
    quantity: 2,
    place: 'Bar' as Place,
    note: 'Friday Happy Hour',
    preview: '2x IPA Craft Draft ... €12.40\nTax incl. Bar Tab #402',
  },
  {
    id: 'demo-2',
    title: 'Corner Mart Shop',
    category: 'tobacco' as Category,
    subcategory: 'Cigarettes Pack',
    price: 8.50,
    quantity: 1,
    place: 'Shop' as Place,
    note: 'Convenience store',
    preview: '1x Gold 20s Pack ... €8.50\nCashier 04 - Receipt 8991',
  },
  {
    id: 'demo-3',
    title: 'Vinoteca Wine Cellar',
    category: 'alcohol' as Category,
    subcategory: 'Red Wine Bottle',
    price: 14.50,
    quantity: 1,
    place: 'Shop' as Place,
    note: 'Weekend dinner',
    preview: '1x Rioja Reserva 750ml ... €14.50\nSubtotal: €14.50',
  },
];

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({ isOpen, onClose, onExtracted }) => {
  const { t, settings } = useSpotOn();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedFile, setScannedFile] = useState<string | null>(null);

  const handleSelectSample = (sample: typeof DEMO_RECEIPTS[0]) => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      onExtracted({
        category: sample.category,
        subcategory: sample.subcategory,
        price: sample.price,
        quantity: sample.quantity,
        place: sample.place,
        note: sample.note,
      });
      onClose();
    }, 600);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setScannedFile(reader.result as string);
        setIsScanning(true);
        // Simulate OCR parsing
        setTimeout(() => {
          setIsScanning(false);
          onExtracted({
            category: 'alcohol',
            subcategory: 'Bar tab item',
            price: 5.50,
            quantity: 1,
            place: 'Bar',
            note: `Scanned from ${file.name}`,
          });
          onClose();
        }, 1000);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <ReceiptText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{t('receiptScannerTitle')}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('receiptScannerSubtitle')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isScanning ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t('analyzingReceipt')}
              </p>
              <p className="text-xs text-slate-400">{t('extractingReceiptDetails')}</p>
            </div>
          ) : (
            <>
              {/* Photo & Upload Area */}
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition bg-slate-50/50 dark:bg-slate-850">
                <input
                  type="file"
                  accept="image/*"
                  id="receipt-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="receipt-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white block">
                      {t('takePhotoOrUpload')}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('takePhotoOrUploadDesc')}
                    </span>
                  </div>
                </label>
              </div>

              {/* Sample Receipts for 1-Tap Testing */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t('testWithSampleReceipt')}
                </span>
                <div className="space-y-1.5">
                  {DEMO_RECEIPTS.map((demo) => (
                    <button
                      key={demo.id}
                      onClick={() => handleSelectSample(demo)}
                      className="w-full text-left p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-slate-800/60 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900 dark:text-white">
                            {demo.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {demo.category === 'alcohol' ? t('alcohol') : t('tobacco')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {demo.subcategory} · {settings.currencySymbol}{(demo.price * demo.quantity).toFixed(2)}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

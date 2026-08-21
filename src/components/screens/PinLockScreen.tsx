import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Delete, ShieldCheck, KeyRound } from 'lucide-react';
import { useSpotOn } from '../../context/SpotOnContext';

export const PinLockScreen: React.FC = () => {
  const { unlockWithPin, settings, t } = useSpotOn();
  const [pin, setPin] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setHasError(false);

      if (nextPin.length === 4) {
        setTimeout(() => {
          const success = unlockWithPin(nextPin);
          if (!success) {
            setHasError(true);
            setPin('');
          }
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setHasError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xs flex flex-col items-center space-y-6"
      >
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shadow-md">
          <Lock className="w-7 h-7" />
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold tracking-tight">{t('spotOnLocked')}</h2>
          <p className="text-xs text-slate-400">{t('enterPasscode')}</p>
        </div>

        {/* Pin Dots */}
        <div className={`flex items-center gap-4 py-2 ${hasError ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-blue-500 scale-110 shadow-sm shadow-blue-500/50'
                    : 'bg-slate-700 border border-slate-600'
                } ${hasError ? 'bg-rose-500' : ''}`}
              />
            );
          })}
        </div>

        {hasError && (
          <p className="text-xs font-semibold text-rose-400">
            {t('pinIncorrectWithDefault', { pin: settings.pinCode || '1234' })}
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleNumberClick(digit)}
              className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-xl font-semibold transition flex items-center justify-center border border-slate-700/60"
            >
              {digit}
            </button>
          ))}

          {/* Bottom row */}
          <div className="h-14" />
          <button
            type="button"
            onClick={() => handleNumberClick('0')}
            className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-xl font-semibold transition flex items-center justify-center border border-slate-700/60"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-400 hover:text-white transition flex items-center justify-center border border-slate-700/60"
            aria-label="Delete"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

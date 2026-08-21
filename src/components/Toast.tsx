import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSpotOn } from '../context/SpotOnContext';
import { CheckCircle2, RotateCcw, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useSpotOn();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      hideToast();
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, hideToast]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-24 left-0 right-0 z-50 pointer-events-none flex justify-center px-4"
        >
          <div className="pointer-events-auto max-w-sm w-full bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-slate-700/50 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2.5 truncate">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate font-medium">{toast.message}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action?.onClick();
                    hideToast();
                  }}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  {toast.action.label}
                </button>
              )}
              <button
                onClick={hideToast}
                className="text-slate-400 hover:text-slate-200 p-0.5"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

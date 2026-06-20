'use client';

import { useToastStore } from '@/store/toast-store';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border backdrop-blur-md overflow-hidden relative group
              ${t.type === 'success' ? 'bg-white border-emerald-100' : 
                t.type === 'error' ? 'bg-white border-red-100' : 
                'bg-white border-blue-100'}`}
          >
            {/* Subtle background glow */}
            <div className={`absolute inset-0 opacity-[0.03] 
              ${t.type === 'success' ? 'bg-emerald-500' : 
                t.type === 'error' ? 'bg-red-500' : 
                'bg-blue-500'}`} 
            />

            <div className="shrink-0 mt-0.5 relative z-10">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
            </div>

            <div className="flex-1 relative z-10">
              <h4 className="text-sm font-semibold text-gray-900 leading-tight mb-1">{t.title}</h4>
              {t.message && <p className="text-sm text-gray-500 leading-relaxed">{t.message}</p>}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100/50 relative z-10 opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

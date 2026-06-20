'use client';

import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />
      
      <div className="bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-300 p-5">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-gray-500 text-[15px] mb-6">
            {message}
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 px-5 py-2.5 rounded-full font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-300 active:scale-95"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className="flex-1 px-5 py-2.5 rounded-full font-medium text-white bg-red-500 hover:bg-red-600 shadow-[0_8px_20px_rgba(239,68,68,0.25)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

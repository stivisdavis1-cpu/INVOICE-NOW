'use client';

import { Info } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export function AlertModal({ isOpen, title, message, onClose }: AlertModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.1)] w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-300 p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
            <Info className="w-7 h-7 text-primary" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-gray-500 text-[15px] mb-8">
            {message}
          </p>

          <button
            onClick={onClose}
            className="w-full px-5 py-3 rounded-full font-medium text-white bg-primary hover:bg-primary/90 shadow-[0_8px_20px_rgba(45,139,111,0.25)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  );
}

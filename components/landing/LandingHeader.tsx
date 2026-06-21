'use client';

import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { LogIn, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="#features" className="hover:text-primary transition-colors duration-300">Fonctionnalités</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors duration-300">Tarifs</Link>
            <Link href="#testimonials" className="hover:text-primary transition-colors duration-300">Témoignages</Link>
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-primary transition-colors duration-300">
            Se connecter
          </Link>
          <Link href="/login" className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-full hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(45,139,111,0.25)] active:scale-[0.98] transition-all duration-300 ease-out">
            Commencer gratuitement <LogIn className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2 text-slate-600 hover:text-primary transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-slate-100 shadow-lg p-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-4 text-base font-medium text-slate-600">
            <Link href="#features" onClick={() => setIsMenuOpen(false)} className="hover:text-primary p-2">Fonctionnalités</Link>
            <Link href="#pricing" onClick={() => setIsMenuOpen(false)} className="hover:text-primary p-2">Tarifs</Link>
            <Link href="#testimonials" onClick={() => setIsMenuOpen(false)} className="hover:text-primary p-2">Témoignages</Link>
          </nav>
          <div className="h-px bg-slate-100 my-2" />
          <div className="flex flex-col gap-3">
            <Link href="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center p-3 text-base font-semibold text-slate-700 hover:text-primary border border-slate-200 rounded-xl">
              Se connecter
            </Link>
            <Link href="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center gap-2 p-3 bg-primary text-white text-base font-bold rounded-xl">
              Commencer gratuitement <LogIn className="w-5 h-5 ml-1" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

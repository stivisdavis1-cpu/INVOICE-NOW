import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-slate-50 z-0" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3 z-0" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/50 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3 z-0" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-slate-100 text-sm font-medium text-slate-600 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          La nouvelle version est disponible
        </div>
        
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          Facturez simplement. <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
            Encaissez rapidement.
          </span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Le logiciel de facturation conçu pour les PME et indépendants exigeants. 
          Générez des devis, suivez vos paiements et pilotez votre trésorerie sur une seule plateforme ultra-rapide.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
          <Link href="/login" className="w-full sm:w-auto flex items-center justify-center px-8 py-4 bg-primary text-white text-lg font-bold rounded-full hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(45,139,111,0.25)] active:scale-[0.98] transition-all duration-300">
            Créer mon compte gratuit
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <Link href="#features" className="w-full sm:w-auto flex items-center justify-center px-8 py-4 bg-white text-slate-700 text-lg font-bold rounded-full hover:-translate-y-1 hover:shadow-sm border border-slate-200 active:scale-[0.98] transition-all duration-300">
            Découvrir les fonctionnalités
          </Link>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500 animate-in fade-in duration-1000 delay-500">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Sans engagement</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Essai de 14 jours</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Support 7j/7</div>
        </div>
      </div>
    </section>
  );
}

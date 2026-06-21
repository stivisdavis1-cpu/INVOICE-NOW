import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CallToAction() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="bg-primary rounded-[32px] p-12 lg:p-20 text-center relative overflow-hidden shadow-[0_20px_40px_rgba(45,139,111,0.2)]">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-300/20 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3" />

          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">
            Prêt à professionnaliser <br className="hidden sm:block" /> votre facturation ?
          </h2>
          <p className="text-primary-light text-lg md:text-xl mb-10 max-w-2xl mx-auto relative z-10">
            Rejoignez-nous aujourd'hui et générez votre première facture en moins de 2 minutes. C'est gratuit pour essayer.
          </p>
          
          <Link href="/login" className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary text-lg font-bold rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg relative z-10 group">
            Créer mon compte
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}

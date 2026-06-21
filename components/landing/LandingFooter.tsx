import { Logo } from '@/components/ui/logo';
import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 mb-16">
          <div className="flex flex-col items-center md:items-start max-w-sm">
            <div className="mb-6"><Logo /></div>
            <p className="text-slate-500 text-center md:text-left leading-relaxed">
              La solution de facturation pensée pour les professionnels exigeants. Sécurisé, rapide et beau.
            </p>
          </div>
          
          <div className="flex gap-16 text-center md:text-left">
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Produit</h4>
              <ul className="space-y-3">
                <li><Link href="#features" className="text-slate-500 hover:text-primary transition-colors">Fonctionnalités</Link></li>
                <li><Link href="#pricing" className="text-slate-500 hover:text-primary transition-colors">Tarifs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Support</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-slate-500 hover:text-primary transition-colors">Contact</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-primary transition-colors">Aide</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} INVOICE NOW. Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-primary transition-colors">Conditions Générales</Link>
            <Link href="#" className="hover:text-primary transition-colors">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

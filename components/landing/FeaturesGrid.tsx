import { FileText, Calculator, ShieldCheck, Mail, Zap, Building2 } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: "Éditeur intelligent",
    description: "Créez vos documents en un éclair avec notre éditeur WYSIWYG pensé pour la rapidité. Brouillons, sous-totaux, remises."
  },
  {
    icon: Calculator,
    title: "Calculs automatiques",
    description: "Fini les erreurs de TVA. Saisissez vos montants, l'application s'occupe de tous les calculs HT et TTC pour vous."
  },
  {
    icon: ShieldCheck,
    title: "Workflows de validation",
    description: "Définissez des étapes de validation (Manager, Comptable) avant l'envoi de vos factures au client."
  },
  {
    icon: Building2,
    title: "Multi-entreprises",
    description: "Vous avez plusieurs sociétés ? Gérez-les toutes depuis une interface unique avec des environnements totalement étanches."
  },
  {
    icon: Mail,
    title: "Relances automatisées",
    description: "Configurez des alertes automatiques pour vos factures en retard et ne laissez plus dormir votre argent."
  },
  {
    icon: Zap,
    title: "Export Word pro",
    description: "Importez votre propre template Word (.docx), le système le remplit automatiquement avec un design parfait."
  }
];

export function FeaturesGrid() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            Tout ce dont vous avez besoin, <br className="hidden sm:block" />
            <span className="text-primary">sans la complexité.</span>
          </h2>
          <p className="text-lg text-slate-500">
            Une suite complète d'outils pensés pour vous faire gagner du temps au quotidien, avec une interface claire et douce.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="group bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-2 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] transition-all duration-300 ease-out"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary transition-colors duration-300">
                <feature.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

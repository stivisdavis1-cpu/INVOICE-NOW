import React from 'react';

export function TestimonialsSection() {
  const testimonials = [
    { name: "Amadou D.", role: "Gérant d'agence", content: "Plus que 2 minutes pour faire une facture." },
    { name: "Sophie T.", role: "Freelance", content: "Les relances m'ont sauvé la vie !" },
    { name: "Moussa F.", role: "Directeur Général", content: "Le workflow de validation est parfait." },
    { name: "Claire L.", role: "Consultante", content: "Très simple et intuitif." },
    { name: "Jean-Paul M.", role: "Artisan", content: "Mes clients adorent le design de mes devis." },
    { name: "Fatou K.", role: "E-commerçante", content: "Je gagne un temps fou tous les mois." },
    { name: "Paul B.", role: "Architecte", content: "La gestion multi-entreprises est géniale." },
    { name: "Marie C.", role: "Graphiste", content: "L'interface est vraiment magnifique." },
    { name: "Alioune S.", role: "Prestataire", content: "Factures toujours envoyées à temps." },
    { name: "Julien R.", role: "Développeur", content: "L'export Word est une fonctionnalité tueuse." },
    { name: "Aminata N.", role: "Formatrice", content: "Je ne perds plus mes proformas." },
    { name: "Thomas V.", role: "Vidéaste", content: "Clair, net et très professionnel." },
    { name: "Ibrahima T.", role: "Comptable", content: "Les exports Excel me facilitent la vie." },
    { name: "Sarah B.", role: "Coach Sportif", content: "Je gère tout depuis mon téléphone." },
    { name: "Antoine D.", role: "Restaurateur", content: "Parfait pour mes besoins quotidiens." },
    { name: "Ousmane C.", role: "Livreur", content: "Encaissement plus rapide de mes clients." },
    { name: "Hélène F.", role: "Avocate", content: "Sécurisé et très confidentiel." },
    { name: "Karim G.", role: "Plombier", content: "Mes devis sont signés deux fois plus vite." },
    { name: "Lucie M.", role: "Décoratrice", content: "Le suivi visuel est très agréable." },
    { name: "David K.", role: "Mécanicien", content: "Moins de paperasse, plus de temps." }
  ];

  const TestimonialCard = ({ testimonial }: { testimonial: any }) => (
    <div className="w-[300px] shrink-0 bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between mx-3 transition-transform hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">
        "{testimonial.content}"
      </p>
      <div>
        <h4 className="font-bold text-slate-900 text-sm">{testimonial.name}</h4>
        <span className="text-xs text-slate-500">{testimonial.role}</span>
      </div>
    </div>
  );

  return (
    <section id="testimonials" className="py-24 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            Ils gèrent leur facturation avec le sourire
          </h2>
          <p className="text-lg text-slate-500">
            Des milliers de professionnels ont déjà divisé par 3 le temps passé sur leurs papiers.
          </p>
        </div>
      </div>

      <div className="relative flex flex-col gap-6 w-full">
        {/* Gradients to fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

        {/* Row 1: Scroll Left with all 20 testimonials */}
        <div className="flex w-max animate-scroll-left">
          {[...testimonials, ...testimonials].map((testimonial, idx) => (
            <TestimonialCard key={idx} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState } from 'react';
import { HelpCircle, Mail, MessageSquare, FileText, ChevronDown, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: "Comment créer une nouvelle facture ?",
    answer: "Pour créer une facture, rendez-vous dans l'onglet 'Factures' depuis le menu principal, puis cliquez sur le bouton 'Créer une facture' en haut à droite. Remplissez ensuite le formulaire avec le client, les dates et les lignes d'articles."
  },
  {
    question: "Comment puis-je enregistrer le paiement d'un client ?",
    answer: "Naviguez vers les paramètres ou directement sur la vue de la facture concernée. Vous pourrez y ajouter un paiement avec son montant, sa date, la méthode (ex: Virement, Mobile Money) et sa référence de transaction."
  },
  {
    question: "Est-ce que le système calcule la TVA automatiquement ?",
    answer: "Oui ! Le système calcule par défaut une TVA à 18% sur tous les articles ajoutés. Ce taux peut être modifié dans la section 'Paramètres' > 'Préférences de Facturation'."
  },
  {
    question: "Que se passe-t-il si je supprime un client ?",
    answer: "La suppression d'un client est une action irréversible. Pour protéger l'intégrité de vos données comptables, un modal de confirmation vous demandera toujours votre validation avant l'effacement définitif."
  },
  {
    question: "Comment exporter mes données financières ?",
    answer: "La fonctionnalité d'export (Excel/PDF) est en cours de déploiement et sera disponible très prochainement dans la vue 'Rapports'."
  }
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl">
      {/* Header Corporate */}
      <div>
        <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">Centre d'Assistance</h1>
        <p className="text-gray-500 mt-1">Trouvez des réponses rapides ou contactez notre équipe de support technique.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Main FAQ Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Questions Fréquentes (FAQ)
            </h2>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <div 
                    key={index} 
                    className="border border-gray-100 rounded-xl overflow-hidden transition-all duration-300"
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 text-left transition-colors",
                        isOpen ? "bg-gray-50/80" : "hover:bg-gray-50/50 bg-white"
                      )}
                    >
                      <span className="font-semibold text-gray-900 text-[15px]">{faq.question}</span>
                      <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform duration-300", isOpen && "rotate-180")} />
                    </button>
                    <div 
                      className={cn(
                        "overflow-hidden transition-all duration-300 ease-in-out",
                        isOpen ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
                      )}
                    >
                      <div className="p-4 pt-2 text-gray-600 text-[14px] bg-gray-50/80 leading-relaxed">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                PREMIUM
              </span>
              Abonnements & Règles Générales
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-[16px] font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Différences des abonnements</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Mode Gratuit */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <h4 className="font-bold text-slate-700 mb-2">Mode Gratuit</h4>
                    <p className="text-xs text-slate-500 mb-3 font-medium">Pour démarrer simplement</p>
                    <ul className="text-[13px] text-slate-600 space-y-2">
                      <li className="flex items-start gap-1.5"><span className="text-slate-400 mt-0.5">•</span> Facturation très basique (PDF standard)</li>
                      <li className="flex items-start gap-1.5"><span className="text-slate-400 mt-0.5">•</span> Pas de création de Proformas</li>
                      <li className="flex items-start gap-1.5"><span className="text-slate-400 mt-0.5">•</span> 1 seul utilisateur</li>
                      <li className="flex items-start gap-1.5"><span className="text-slate-400 mt-0.5">•</span> Aucune personnalisation (logo, couleurs par défaut)</li>
                      <li className="flex items-start gap-1.5 text-slate-400 line-through"><span className="mt-0.5">•</span> Export de données</li>
                    </ul>
                  </div>

                  {/* Mode Intermédiaire */}
                  <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-xl relative">
                    <h4 className="font-bold text-blue-700 mb-2">Mode Intermédiaire</h4>
                    <p className="text-xs text-blue-500/70 mb-3 font-medium">Pour les professionnels réguliers</p>
                    <ul className="text-[13px] text-slate-600 space-y-2">
                      <li className="flex items-start gap-1.5"><span className="text-blue-400 mt-0.5">•</span> Factures illimitées & Proformas avancés</li>
                      <li className="flex items-start gap-1.5"><span className="text-blue-400 mt-0.5">•</span> Personnalisation du Thème (Logo, Couleurs)</li>
                      <li className="flex items-start gap-1.5"><span className="text-blue-400 mt-0.5">•</span> Relances et alertes automatiques standards</li>
                      <li className="flex items-start gap-1.5"><span className="text-blue-400 mt-0.5">•</span> Export PDF de qualité professionnelle</li>
                    </ul>
                  </div>

                  {/* Mode Premium */}
                  <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl shadow-[0_4px_15px_rgba(45,139,111,0.05)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-widest">Le Top</div>
                    <h4 className="font-bold text-primary mb-2 flex items-center gap-1.5">Mode Premium <Wand2 className="w-3.5 h-3.5" /></h4>
                    <p className="text-xs text-primary/70 mb-3 font-medium">Sans aucune limite</p>
                    <ul className="text-[13px] text-slate-700 space-y-2">
                      <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">✓</span> Équipe illimitée (Créateur, Manager, etc.)</li>
                      <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">✓</span> Système de Workflows et d'approbations</li>
                      <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">✓</span> Alertes 100% personnalisables avec variables</li>
                      <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">✓</span> Créateur de Modèles Word sur-mesure</li>
                      <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">✓</span> Exports Excel complets</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[16px] font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Règles du Workflow (Premium)</h3>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                  Le système de Workflow permet de bloquer l'envoi d'une facture tant qu'elle n'a pas été approuvée par un Manager ou un Administrateur. 
                  Lorsqu'un <b>Créateur</b> génère une facture soumise à un workflow, celle-ci reste en attente d'approbation. 
                  Seuls les rôles définis dans le workflow peuvent approuver l'étape suivante.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Besoin d'aide supplémentaire ?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Notre équipe d'ingénieurs et de conseillers clientèle est à votre disposition 7j/7.
            </p>
            
            <div className="space-y-4">
              <a href="mailto:support@izifacture.com" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-primary hover:text-white group transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Nous écrire</div>
                  <div className="text-xs text-gray-500 group-hover:text-white/80">support@izifacture.com</div>
                </div>
              </a>

              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-primary hover:text-white group transition-all duration-300 text-left">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Chat en direct</div>
                  <div className="text-xs text-gray-500 group-hover:text-white/80">Temps de réponse: ~5 min</div>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary to-primary-dark p-5 rounded-2xl shadow-lg text-white">
            <FileText className="w-8 h-8 mb-4 text-white/80" />
            <h3 className="text-lg font-bold mb-2">Documentation API</h3>
            <p className="text-white/80 text-sm mb-4 leading-relaxed">
              Intégrez Invoice Now directement dans vos applications via notre API REST sécurisée.
            </p>
            <button className="w-full py-2.5 bg-white text-primary font-semibold rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-95 text-sm">
              Consulter la Doc
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

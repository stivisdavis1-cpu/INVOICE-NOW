# IZI Facture - Documentation Technique & Instructions IA

Ce document sert de référence technique complète pour l'application **IZI Facture**. Il doit être consulté par tout modèle IA (comme moi-même) pour comprendre le contexte global, l'architecture, les fonctionnalités et les règles de design du projet avant d'effectuer des modifications.

## 1. Ce que l'application fait
**IZI Facture** est une application web SaaS de gestion de facturation et de devis (proformas) pensée pour être extrêmement simple, rapide et professionnelle. Elle permet aux utilisateurs de créer, gérer, suivre et exporter des factures et proformas. Depuis sa transition vers une architecture Fullstack, les données sont persistées en temps réel sur une base de données **Supabase** tout en conservant une expérience fluide (Single Page App) via Zustand pour la gestion d'état local et des mises à jour optimistes.

## 2. Fonctionnalités implémentées
* **Tableau de bord (Dashboard)** : KPIs (Revenu total, Factures en attente, Montant dû, MRR), graphiques de flux de trésorerie et d'évolution des factures.
* **Gestion des Factures & Proformas** :
  * Création avec différents types de lignes : Articles normaux, Forfaits (quantité ignorée), Remises, Sections (titres de regroupement), et Sous-totaux.
  * Calcul automatique des sous-totaux, TVA (paramétrable), et totaux TTC.
  * Gestion des statuts de paiement (Brouillon, Envoyée, Partiellement Payée, Payée, En retard).
* **Gestion des Clients** : Carnet d'adresses client pour auto-complétion rapide.
* **Exportation Word (.docx)** :
  * Génération de documents Word via `docxtemplater` et la librairie `docx`.
  * Support de modèles (templates) Word personnalisés importés par l'utilisateur.
  * **Post-processing XML** automatique qui met en gras et grise (couleur `E2E8F0`) les lignes de Sections, et met en gras les lignes de Sous-totaux, quel que soit le modèle utilisé.
* **Exportation Excel** : Exportation des rapports financiers (Fonctionnalité Premium).
* **Paramètres avancés & Architecture SaaS (Multi-Workspace)** :
  * **Gestion Multi-Entreprises** : Un même utilisateur peut appartenir à plusieurs sociétés (Workspaces) avec des rôles différents. La table pivot `company_users` relie les utilisateurs `auth.users` aux `companies`.
  * **Isolation RLS Parfaite** : Absolument TOUTES les tables contenant des données métier (`invoices`, `clients`, `settings`, `payments`, `workflows`, `notifications`) utilisent des politiques Supabase **Row Level Security (RLS)** adossées à la fonction `user_belongs_to_company(company_id)`. Aucune donnée ne peut fuiter d'une entreprise à une autre.
  * Personnalisation de l'entreprise (Nom, NINEA, RCCM, Adresse, Logo).
  * Personnalisation du thème (Couleur principale).
  * **Workflows et Notifications synchronisés** : Les processus d'approbation et le centre de notifications sont persistés en base de données et propagés à tous les collaborateurs de l'entreprise ciblés par les Workflows.
  * Système d'alertes personnalisées avec un système de **Toasts animés** pour un retour UI immédiat.

## 3. Structure des fichiers (Architecture Next.js App Router)
```text
d:\IZI Facture\
├── app/                  # Routes de l'application (Pages & Layouts)
│   ├── invoices/         # Liste et création/édition des factures
│   ├── proformas/        # Liste et création/édition des proformas
│   ├── reports/          # Page des rapports et export Excel
│   ├── settings/         # Paramètres de l'application
│   └── globals.css       # Styles globaux et configuration Tailwind
├── components/           # Composants React réutilisables
│   ├── dashboard/        # Composants spécifiques au tableau de bord (Graphiques)
│   ├── invoices/         # Formulaires de facture, Visionneuse (Preview), Modales de paiement
│   ├── settings/         # Composants de la page paramètres
│   └── ui/               # Composants d'interface (Modales custom, Boutons, Selects, etc.)
├── lib/                  # Fonctions utilitaires et logique métier
│   ├── supabase/         # Configuration du client Supabase et requêtes API (CRUD)
│   ├── utils.ts          # Formatage monétaire, dates, calculs
│   ├── word-generator.ts # Logique d'export Word
│   ├── template-generator.ts # Modèle Word par défaut
│   └── excel-export.ts   # Logique d'export Excel
├── store/                # Gestion de l'état global (Zustand)
│   ├── data-store.ts     # Store principal (Factures, Clients, Synchro Supabase)
│   ├── ui-store.ts       # Store UI (Sidebar, etc.)
│   └── toast-store.ts    # Store pour les notifications Toasts animées
```

## 4. Technologies utilisées
* **Framework Core** : Next.js 14+ (App Router) & React
* **Backend as a Service** : Supabase (PostgreSQL, Auth, RLS)
* **Styling** : Tailwind CSS (Vanilla CSS approach pour les utilitaires)
* **State Management** : Zustand (Synchronisation hybride locale/distante)
* **Animations** : Framer Motion (Pour les Toasts et transitions fluides)
* **Icônes** : Lucide React
* **Manipulation Document** : `docxtemplater`, `pizzip`, et `docx` (pour l'export Word)
* **Export Tableur** : `exceljs` et `file-saver`
* **Graphiques** : Recharts
* **Langage** : TypeScript (Strict typing)

## 5. Décisions de Design (UI/UX "Pro Soft") & Instructions pour l'IA

### 🎨 Règles UI/UX Strictes (À appliquer systématiquement)
1. **Philosophie Globale** :
   * **Aéré et propre** : Beaucoup d'espace blanc (paddings généreux `p-5`, `p-6`, marges).
   * **Doux et premium** : Pas de coins abrupts, pas d'ombres dures, pas d'animations saccadées.
   * **Cohérence** : Réutiliser les classes Tailwind définies. Ne **jamais** utiliser les boîtes de dialogue natives du navigateur (`window.alert` ou `window.confirm`). Utiliser systématiquement les composants personnalisés (`AlertModal`, `ConfirmModal`).

2. **Palette de Couleurs** :
   * **Couleur Primaire** : Vert Forêt `#2D8B6F` (ou dynamique via `themeColor`). Utilisé pour les éléments actifs (`bg-primary`, `text-primary`).
   * **Couleur de Fond** : Gris très clair (`#F8FAFC` ou `bg-slate-50`) pour le fond global.
   * **Cartes & Conteneurs** : Blanc pur (`bg-white`).
   * **Texte** : Gris très foncé (`text-gray-900`) pour les titres, gris moyen (`text-gray-500`) pour les sous-titres et labels.

3. **Formes & Bordures** :
   * **Cartes Principales** : Très arrondies (`rounded-[24px]` ou `rounded-3xl`).
   * **Boutons & Badges** : Forme en "pilule" (`rounded-full`).
   * **Petits conteneurs** (icônes) : Carrés très arrondis (`rounded-2xl`) ou cercles (`rounded-full`).

4. **Ombres & Animations** :
   * **Repos** : Ombre ultra-légère (`shadow-sm` ou `shadow-[0_4px_20px_rgba(0,0,0,0.03)]`).
   * **Survol (Hover) Cartes** : Élévation douce (`hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] transition-all duration-300 ease-out`).
   * **Clic (Active) Boutons** : Écrasement léger (`active:scale-[0.98]`).

### ⚙️ Instructions Techniques pour les futures modifications
1. **Formatage des Données** :
   * Toujours utiliser `formatCFA(montant)` de `lib/utils.ts` pour afficher une devise. Ne jamais écrire "FCFA" en dur à côté d'un chiffre brut.
   * Toujours utiliser `formatDate(date)` pour les dates.
2. **Calculs Financiers** :
   * Ne jamais réécrire la logique de calcul des totaux dans les composants. Toujours utiliser la fonction centralisée `calculateInvoice(lines, metadata)` de `lib/utils.ts`.
3. **Export Word** :
   * Ne pas essayer de modifier le design du tableau Word depuis `docxtemplater` (qui a des limitations sur les balises de lignes). La personnalisation des lignes (Gras, fond gris) se fait via la fonction de "Post-processing XML" (qui utilise `DOMParser` sur `word/document.xml` après le rendu) présente dans `lib/word-generator.ts`.
4. **Responsivité** :
   * Mobile First ajusté. S'assurer que le contenu s'empile en colonnes sur les petits écrans (`flex-col sm:flex-row`).
5. **Composants d'Alerte** :
   * Utiliser `import { AlertModal } from '@/components/ui/alert-modal'` pour les simples messages d'information.
   * Utiliser `import { ConfirmModal } from '@/components/ui/confirm-modal'` pour les actions destructrices (Suppression) avec confirmation.

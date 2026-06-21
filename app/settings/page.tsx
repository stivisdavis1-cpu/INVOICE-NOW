'use client';

import { useState, useEffect } from 'react';
import { Building2, Receipt, Bell, ShieldCheck, Save, FileText, Upload, Users, Plus, Trash2, Wand2, Settings2, Edit, Loader2, Check, X } from 'lucide-react';

import { AlertBuilderModal } from '@/components/settings/alert-builder-modal';
import { CopyTemplateButton } from '@/components/ui/copy-template-button';
import { ConfirmModal } from '@/components/ui/confirm-modal';

const PremiumBadge = () => (
  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0">
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
    Premium
  </span>
);


import { cn } from '@/lib/utils';
import { useDataStore, Settings } from '@/store/data-store';
import { useTranslation } from '@/hooks/use-translation';

const IntermediateBadge = () => (
  <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0">
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    Intermédiaire+
  </span>
);

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const settings = useDataStore((state) => state.settings);
  const updateSettings = useDataStore((state) => state.updateSettings);
  const { t } = useTranslation();
  const [alertToDelete, setAlertToDelete] = useState<string | null>(null);

  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [showGoogleDocs, setShowGoogleDocs] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Sync localSettings when settings load from DB
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Computed plan flags
  const currentPlan = localSettings.plan || (localSettings.isPremium ? 'premium' : 'free');
  const isIntermediateAndUp = currentPlan === 'intermediate' || currentPlan === 'premium';
  const isPremiumOnly = currentPlan === 'premium';

  // Security states
  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' });
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [activeSessions, setActiveSessions] = useState([
    { id: '1', name: 'Chargement...', location: 'Détection en cours...', ip: '...', isCurrent: true, time: 'Actuel' }
  ]);

  useEffect(() => {
    // Parser l'User Agent basique
    const ua = navigator.userAgent;
    let browser = 'Navigateur inconnu';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    let os = 'OS inconnu';
    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'MacOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('like Mac')) os = 'iOS';

    const deviceName = `${os} - ${browser}`;

    // Récupérer l'IP via ipapi.co
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const country = data.country_name || 'Inconnu';
        
        setActiveSessions([
          {
            id: '1',
            name: deviceName,
            location: country,
            ip: data.ip || 'Inconnue',
            isCurrent: true,
            time: 'Actuel'
          }
        ]);
      })
      .catch(() => {
        setActiveSessions([
          {
            id: '1',
            name: deviceName,
            location: 'Localisation indisponible',
            ip: 'IP masquée',
            isCurrent: true,
            time: 'Actuel'
          }
        ]);
      });
  }, []);

  const handlePasswordChange = () => {
    if (!passwordForm.old || !passwordForm.new || !passwordForm.confirm) {
      setPasswordMessage({ type: 'error', text: 'Veuillez remplir tous les champs.' });
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }
    if (passwordForm.new.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères.' });
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      setPasswordMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès !' });
      setPasswordForm({ old: '', new: '', confirm: '' });
      setTimeout(() => setPasswordMessage(null), 3000);
    }, 500);
  };

  const handleRevokeAllSessions = () => {
    setActiveSessions(activeSessions.filter(s => s.isCurrent));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const name = target.name;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setLocalSettings(prev => ({ ...prev, [name]: name === 'defaultTva' ? (Number(value) || 0) : value }));
  };

  const handleSave = () => {
    updateSettings(localSettings);
    // Clear logoPreview so it forces displaying the actual URL from the server
    if (logoPreview) {
      setLogoPreview(null);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const employees = useDataStore((state) => state.employees);
  const activeEmployeeId = useDataStore((state) => state.activeEmployeeId);
  const activeEmployee = employees.find(e => e.id === activeEmployeeId);
  const isAdmin = activeEmployee?.role === 'admin';

  useEffect(() => {
    if (!localSettings.userName && activeEmployee?.name) {
      setLocalSettings(prev => ({ ...prev, userName: activeEmployee.name.replace(/\s*\(.*?\)/g, '') }));
    }
  }, [activeEmployee?.name, localSettings.userName]);
  const workflows = useDataStore((state) => state.workflows);
  const addWorkflow = useDataStore((state) => state.addWorkflow);
  const updateWorkflow = useDataStore((state) => state.updateWorkflow);
  const deleteWorkflow = useDataStore((state) => state.deleteWorkflow);
  const updateEmployeeStatus = useDataStore((state) => state.updateEmployeeStatus);

  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', role: 'creator' as const, password: '' });
  const [pendingRoles, setPendingRoles] = useState<Record<string, 'admin' | 'manager' | 'accountant' | 'creator'>>({});

  // States for Workflow Modals
  const [isNewWfModalOpen, setIsNewWfModalOpen] = useState(false);
  const [newWfData, setNewWfData] = useState({ name: '', documentType: 'both' as const });

  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [stepModalData, setStepModalData] = useState<{
    workflowId: string;
    stepId?: string; // If editing an existing step
    insertIndex?: number; // If inserting at a specific index
    name: string;
    requiredRole: string;
    actionLabel: string;
    allowReject?: boolean;
    rejectLabel?: string;
    allowRequestChanges?: boolean;
    requestChangesLabel?: string;
  }>({ workflowId: '', name: '', requiredRole: 'any', actionLabel: 'Approuver' });

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.email) return;
    addEmployee(newEmployee);
    setNewEmployee({ name: '', email: '', role: 'creator', password: '' });
  };

  const handleCreateWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWfData.name) return;
    addWorkflow({
      name: newWfData.name,
      documentType: newWfData.documentType as any,
      steps: []
    });
    setIsNewWfModalOpen(false);
    setNewWfData({ name: '', documentType: 'both' });
  };

  const handleSaveStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepModalData.name) return;
    
    const wf = workflows.find(w => w.id === stepModalData.workflowId);
    if (!wf) return;

    let newSteps = [...wf.steps];

    if (stepModalData.stepId) {
      // Edit existing
      newSteps = newSteps.map(s => s.id === stepModalData.stepId ? {
        ...s,
        name: stepModalData.name,
        requiredRole: stepModalData.requiredRole as any,
        actionLabel: stepModalData.actionLabel,
        allowReject: stepModalData.allowReject,
        rejectLabel: stepModalData.rejectLabel,
        allowRequestChanges: stepModalData.allowRequestChanges,
        requestChangesLabel: stepModalData.requestChangesLabel
      } : s);
    } else {
      // Add new
      const newStep = {
        id: `STEP-${Date.now()}`,
        name: stepModalData.name,
        requiredRole: stepModalData.requiredRole as any,
        actionLabel: stepModalData.actionLabel,
        allowReject: stepModalData.allowReject,
        rejectLabel: stepModalData.rejectLabel,
        allowRequestChanges: stepModalData.allowRequestChanges,
        requestChangesLabel: stepModalData.requestChangesLabel
      };
      
      if (typeof stepModalData.insertIndex === 'number') {
        newSteps.splice(stepModalData.insertIndex, 0, newStep);
      } else {
        newSteps.push(newStep);
      }
    }

    updateWorkflow(wf.id, { steps: newSteps });
    setIsStepModalOpen(false);
  };

  const handleDeleteStep = (wfId: string, stepId: string) => {
    const wf = workflows.find(w => w.id === wfId);
    if (!wf) return;
    updateWorkflow(wfId, { steps: wf.steps.filter(s => s.id !== stepId) });
  };

  // Modal states for advanced alerts
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);

  let tabs = [
    { id: 'profile', label: t('settings.companyInfo'), icon: Building2 },
    { id: 'billing', label: t('settings.taxAndCurrency'), icon: Receipt },
    { id: 'word-template', label: t('settings.wordTemplate'), icon: FileText },
    { id: 'team', label: 'Équipe & Workflows', icon: Users },
    { id: 'notifications', label: 'Notifications & Alertes', icon: Bell },
    { id: 'security', label: 'Sécurité & Accès', icon: ShieldCheck },
  ];

  if (!isAdmin || !isPremiumOnly) {
    tabs = tabs.filter(t => t.id !== 'team');
  }

  if (currentPlan === 'free') {
    tabs = tabs.filter(t => t.id !== 'word-template' && t.id !== 'notifications');
  }

  return (
    <>
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl">
      {/* Header Corporate */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">{t('settings.title')}</h1>
          <p className="text-gray-500 mt-1">{t('settings.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            const nextPlan: 'free' | 'intermediate' | 'premium' = currentPlan === 'free' ? 'intermediate' : currentPlan === 'intermediate' ? 'premium' : 'free';
            const newSettings = { ...localSettings, plan: nextPlan, isPremium: nextPlan === 'premium' };
            setLocalSettings(newSettings);
            updateSettings(newSettings);

            // Auto-switch to profile if the current tab gets hidden by the new plan
            if (nextPlan !== 'premium' && activeTab === 'team') setActiveTab('profile');
            if (nextPlan === 'free' && (activeTab === 'word-template' || activeTab === 'notifications')) setActiveTab('profile');
          }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border",
            currentPlan === 'premium' 
              ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200" 
              : currentPlan === 'intermediate'
                ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
                : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
          )}
        >
          {currentPlan === 'premium' ? '👑 Mode Premium Actif' 
            : currentPlan === 'intermediate' ? '🚀 Mode Intermédiaire Actif' 
            : '🌱 Mode Gratuit Actif'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-5">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-300 text-left",
                  isActive 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : "text-gray-600 hover:bg-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-400")} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-xl p-5 shadow-sm border border-slate-200 min-h-[400px] flex flex-col">
          
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900">{t('settings.companyInfo')}</h2>
                  <p className="text-gray-500 text-sm mt-1">Ces informations apparaîtront sur toutes vos factures.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{t('settings.userName')}</label>
                    <input
                      type="text"
                      name="userName"
                      value={localSettings.userName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{t('settings.companyName')}</label>
                    <input
                      type="text"
                      name="companyName"
                      value={localSettings.companyName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all duration-300"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <input
                        list="tax-id-labels"
                        name="nineaLabel"
                        value={localSettings.nineaLabel || 'NINEA'}
                        onChange={handleChange}
                        className="text-[13px] font-bold text-gray-900 bg-transparent border-b border-dashed border-gray-300 focus:border-primary outline-none hover:bg-gray-50 px-1 py-0.5 max-w-[200px]"
                        title="Modifiez ce libellé selon votre pays"
                      />
                      <datalist id="tax-id-labels">
                        <option value="NINEA">Sénégal</option>
                        <option value="NIU">Cameroun, Congo</option>
                        <option value="NCC">Côte d'Ivoire</option>
                        <option value="IFU">Bénin, Burkina Faso</option>
                        <option value="NIF">Togo, Guinée, Mali, Niger, Tchad, Gabon, Mauritanie, Madagascar, Burundi, Djibouti, RCA, Comores, Algérie</option>
                        <option value="ID. NAT.">RDC</option>
                        <option value="ICE">Maroc</option>
                        <option value="Matricule Fiscal">Tunisie</option>
                        <option value="TIN">Rwanda, Nigeria, Ghana, Ouganda, Tanzanie, Egypte</option>
                        <option value="PIN">Kenya</option>
                        <option value="VAT Number">Afrique du Sud, UK</option>
                        <option value="SIRET">France</option>
                        <option value="Numéro d'entreprise">Belgique</option>
                        <option value="IDE">Suisse</option>
                        <option value="NE">Canada</option>
                        <option value="EIN">USA</option>
                        <option value="Numéro Fiscal">Générique</option>
                      </datalist>
                    </div>
                    <input
                      type="text"
                      name="ninea"
                      value={localSettings.ninea}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all duration-300"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <input
                        list="company-id-labels"
                        name="rccmLabel"
                        value={localSettings.rccmLabel || 'RCCM'}
                        onChange={handleChange}
                        className="text-[13px] font-bold text-gray-900 bg-transparent border-b border-dashed border-gray-300 focus:border-primary outline-none hover:bg-gray-50 px-1 py-0.5 max-w-[200px]"
                        title="Modifiez ce libellé selon votre pays"
                      />
                      <datalist id="company-id-labels">
                        <option value="RCCM">Espace OHADA (Sénégal, CI, Cameroun, Bénin, Togo, etc.)</option>
                        <option value="RC">Maroc, Algérie, Tunisie, Burundi</option>
                        <option value="RCS">France, Madagascar</option>
                        <option value="Company Code">Rwanda</option>
                        <option value="CIPC Number">Afrique du Sud</option>
                        <option value="RC Number">Nigeria (CAC)</option>
                        <option value="Registration Number">Ghana, Kenya</option>
                        <option value="Numéro BCE">Belgique</option>
                        <option value="CH-ID">Suisse</option>
                        <option value="Numéro de constitution">Canada</option>
                        <option value="State File Number">USA</option>
                        <option value="CRN">UK</option>
                        <option value="Registre de Commerce">Générique</option>
                      </datalist>
                    </div>
                    <input
                      type="text"
                      name="rccm"
                      value={localSettings.rccm}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all duration-300"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{t('settings.address')}</label>
                    <input
                      type="text"
                      name="address"
                      value={localSettings.address}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all duration-300"
                    />
                  </div>
                </div>


                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Personnalisation</h3>
                  <div className="flex items-center gap-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <label className="block text-[13px] font-medium text-gray-700">Couleur Principale</label>
                        <IntermediateBadge />
                      </div>
                      <div className={cn("flex items-center gap-3 transition-opacity", !isIntermediateAndUp && "opacity-50 pointer-events-none")}>
                        <input
                          type="color"
                          name="themeColor"
                          value={localSettings.themeColor || '#0B60B0'}
                          onChange={(e) => {
                            const newSettings = { ...localSettings, themeColor: e.target.value };
                            setLocalSettings(newSettings);
                            updateSettings(newSettings);
                          }}
                          className="w-12 h-12 p-1 bg-white border border-gray-200 rounded-xl cursor-pointer"
                          disabled={!isIntermediateAndUp}
                        />
                        <span className="text-sm text-gray-500 font-mono uppercase">{localSettings.themeColor || '#0B60B0'}</span>
                      </div>
                    </div>
                    
                    {/* Logo Premium */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Logo de l'entreprise</label>
                        <IntermediateBadge />
                      </div>
                      <div className={cn("flex items-center gap-4 transition-opacity", !isIntermediateAndUp && "opacity-50 pointer-events-none")}>
                        <div className="relative group w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                          {isUploadingLogo && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                          {logoPreview || localSettings.logo ? (
                            <img 
                              src={logoPreview || (localSettings.logo + '?cors=1')} 
                              alt="Logo" 
                              className="w-full h-full object-contain p-2"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs text-center px-1">Aucun logo</span>
                          )}
                          <input 
                            type="file" 
                            accept="image/*"
                            disabled={!isIntermediateAndUp || isUploadingLogo}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Afficher immédiatement l'aperçu local
                                const objectUrl = URL.createObjectURL(file);
                                setLogoPreview(objectUrl);
                                setIsUploadingLogo(true);
                                
                                try {
                                  const { uploadFile } = await import('@/lib/supabase/storage');
                                  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                                  const url = await uploadFile('assets', `logos/company-logo-${Date.now()}-${sanitizedFileName}`, file);
                                  if (url) {
                                    const newSettings = { ...localSettings, logo: url };
                                    setLocalSettings(newSettings);
                                  }
                                } catch (error) {
                                  console.error("Erreur upload logo:", error);
                                  setLogoPreview(null);
                                } finally {
                                  setIsUploadingLogo(false);
                                }
                              }
                            }}
                          />
                        </div>
                        {(logoPreview || localSettings.logo) && (
                          <button 
                            type="button"
                            onClick={() => {
                              setLogoPreview(null);
                              const newSettings = { ...localSettings, logo: '' };
                              setLocalSettings(newSettings);
                            }}
                            className="text-xs text-red-500 hover:text-red-700 underline"
                          >
                            Retirer le logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900">Préférences de Facturation</h2>
                  <p className="text-gray-500 text-sm mt-1">Configurez le comportement par défaut de vos documents de vente.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{t('settings.defaultTva')}</label>
                    <input
                      type="number"
                      step="0.1"
                      name="defaultTva"
                      value={localSettings.defaultTva}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{t('settings.currency')}</label>
                    <input
                      list="currency-options"
                      name="currency"
                      value={localSettings.currency}
                      onChange={handleChange}
                      placeholder="ex: FCFA, €, $, MAD, XAF..."
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all duration-300"
                    />
                    <datalist id="currency-options">
                      <option value="FCFA">Franc CFA (XOF / XAF)</option>
                      <option value="€">Euro (EUR)</option>
                      <option value="$">US Dollar (USD)</option>
                      <option value="MAD">Dirham Marocain (MAD)</option>
                      <option value="GNF">Franc Guinéen (GNF)</option>
                      <option value="CDF">Franc Congolais (CDF)</option>
                      <option value="BIF">Franc Burundais (BIF)</option>
                      <option value="RWF">Franc Rwandais (RWF)</option>
                      <option value="KMF">Franc Comorien (KMF)</option>
                      <option value="DJF">Franc Djibouti (DJF)</option>
                      <option value="MGA">Ariary Malgache (MGA)</option>
                      <option value="NGN">Naira (NGN)</option>
                      <option value="GHS">Cedi (GHS)</option>
                      <option value="KES">Shilling Kenyan (KES)</option>
                      <option value="ZAR">Rand (ZAR)</option>
                      <option value="DZD">Dinar Algérien (DZD)</option>
                      <option value="TND">Dinar Tunisien (TND)</option>
                      <option value="EGP">Livre Égyptienne (EGP)</option>
                      <option value="MRU">Ouguiya (MRU)</option>
                      <option value="£">Livre Sterling (GBP)</option>
                      <option value="CAD">Dollar Canadien (CAD)</option>
                      <option value="CHF">Franc Suisse (CHF)</option>
                      <option value="¥">Yen / Yuan</option>
                    </datalist>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{t('settings.footerMentions')}</label>
                    <textarea
                      rows={4}
                      name="footerMentions"
                      value={localSettings.footerMentions}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all duration-300 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'word-template' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-8">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">{t('settings.wordTemplate')}</h2>
                    <PremiumBadge />
                  </div>
                  <p className="text-gray-500 text-sm mt-1">Importez votre propre modèle (.docx) pour générer vos factures avec votre design.</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl mb-8">
                  <h3 className="text-blue-900 font-semibold mb-3">Variables disponibles (à insérer dans votre Word) :</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-blue-800">
                    <div><code className="bg-white/60 px-1.5 py-0.5 rounded font-mono">{"{invoiceId}"}</code> : N° Facture</div>
                    <div><code className="bg-white/60 px-1.5 py-0.5 rounded font-mono">{"{issueDate}"}</code> : Date d'émission</div>
                    <div><code className="bg-white/60 px-1.5 py-0.5 rounded font-mono">{"{dueDate}"}</code> : Date d'échéance</div>
                    <div><code className="bg-white/60 px-1.5 py-0.5 rounded font-mono">{"{clientName}"}</code> : Nom du client</div>
                    <div><code className="bg-white/60 px-1.5 py-0.5 rounded font-mono">{"{clientAddress}"}</code> : Adresse du client</div>
                    <div><code className="bg-white/60 px-1.5 py-0.5 rounded font-mono">{"{subtotal}"}</code> : Sous-total</div>
                    <div><code className="bg-white/60 px-1.5 py-0.5 rounded font-mono">{"{tva}"}</code> : Montant TVA</div>
                    <div><code className="bg-white/60 px-1.5 py-0.5 rounded font-mono">{"{total}"}</code> : Total TTC</div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-blue-200 text-sm text-blue-800">
                    <p className="font-semibold mb-2">Pour la liste des articles :</p>
                    <p><code className="bg-white/60 px-1.5 py-0.5 rounded font-mono">{"{#lines}"}</code> au début de la ligne, puis <code className="bg-white/60 px-1.5 py-0.5 rounded font-mono">{"{description}"}</code>, <code className="bg-white/60 px-1.5 py-0.5 rounded font-mono">{"{quantity}"}</code>, <code className="bg-white/60 px-1.5 py-0.5 rounded font-mono">{"{formattedUnitPrice}"}</code>, <code className="bg-white/60 px-1.5 py-0.5 rounded font-mono">{"{formattedTotal}"}</code>, et enfin <code className="bg-white/60 px-1.5 py-0.5 rounded font-mono">{"{/lines}"}</code> à la fin.</p>
                  </div>
                  
                  <div className="mt-8 border-t border-gray-100 pt-6">
                    <button 
                      onClick={() => setShowGoogleDocs(!showGoogleDocs)}
                      className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors mx-auto"
                    >
                      {showGoogleDocs ? 'Masquer les options avancées (Google Docs)' : 'Afficher les options avancées (Google Docs)'}
                    </button>
                    
                    {showGoogleDocs && (
                      <div className="mt-4 flex flex-col sm:flex-row gap-5 items-center bg-white p-5 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">Utiliser votre propre design Google Docs</h4>
                          <p className="text-gray-500 text-sm leading-relaxed">
                            Ouvrez un modèle gratuit dans la galerie Google, ajoutez vos balises (ex: <code>{`{clientName}`}</code>), puis téléchargez-le au format <strong>Microsoft Word (.docx)</strong> pour l'importer ci-dessous.
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                          <a 
                            href="https://docs.google.com/document/u/0/?ftv=1" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="whitespace-nowrap px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-xl transition-colors text-center"
                          >
                            Ouvrir un doc vierge
                          </a>
                          <CopyTemplateButton />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Upload Modèle Facture */}
                  <div className={cn("border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-primary/50 hover:bg-primary/5 transition-all group relative", !isPremiumOnly && "opacity-50 pointer-events-none")}>
                    <input 
                      type="file" 
                      accept=".docx"
                      disabled={!isPremiumOnly}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const { uploadFile } = await import('@/lib/supabase/storage');
                          const url = await uploadFile('assets', `templates/invoice-template-${Date.now()}.docx`, file);
                          if (url) {
                            const newSettings = { ...localSettings, customWordTemplateInvoice: url };
                            setLocalSettings(newSettings);
                            updateSettings(newSettings);
                          }
                        }
                      }}
                    />
                    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white transition-colors">
                      <Upload className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="text-gray-900 font-semibold mb-1">Modèle Facture (.docx)</h3>
                    <p className="text-gray-500 text-xs mb-4">Glissez-déposez votre fichier .docx ou cliquez.</p>
                    
                    {localSettings.customWordTemplateInvoice && (
                      <div className="mt-4 flex flex-col items-center gap-2 z-20 relative">
                        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                          <FileText className="w-4 h-4" />
                          Modèle Facture chargé
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const newSettings = { ...localSettings, customWordTemplateInvoice: null };
                              setLocalSettings(newSettings);
                              updateSettings(newSettings);
                            }}
                            className="ml-1 hover:bg-green-200 rounded-full p-0.5 transition-colors"
                            title="Supprimer le modèle"
                          >
                            <Trash2 className="w-4 h-4 text-green-700" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upload Modèle Proforma */}
                  <div className={cn("border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-primary/50 hover:bg-primary/5 transition-all group relative", !isPremiumOnly && "opacity-50 pointer-events-none")}>
                    <input 
                      type="file" 
                      accept=".docx"
                      disabled={!isPremiumOnly}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const { uploadFile } = await import('@/lib/supabase/storage');
                          const url = await uploadFile('assets', `templates/proforma-template-${Date.now()}.docx`, file);
                          if (url) {
                            const newSettings = { ...localSettings, customWordTemplateProforma: url };
                            setLocalSettings(newSettings);
                            updateSettings(newSettings);
                          }
                        }
                      }}
                    />
                    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white transition-colors">
                      <Upload className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="text-gray-900 font-semibold mb-1">Modèle Proforma (.docx)</h3>
                    <p className="text-gray-500 text-xs mb-4">Glissez-déposez votre fichier .docx ou cliquez.</p>
                    
                    {localSettings.customWordTemplateProforma && (
                      <div className="mt-4 flex flex-col items-center gap-2 z-20 relative">
                        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                          <FileText className="w-4 h-4" />
                          Modèle Proforma chargé
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const newSettings = { ...localSettings, customWordTemplateProforma: null };
                              setLocalSettings(newSettings);
                              updateSettings(newSettings);
                            }}
                            className="ml-1 hover:bg-green-200 rounded-full p-0.5 transition-colors"
                            title="Supprimer le modèle"
                          >
                            <Trash2 className="w-4 h-4 text-green-700" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900">Équipe & Employés</h2>
                  <p className="text-gray-500 text-sm mt-1">Gérez les membres de votre équipe et leurs rôles dans le workflow.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Liste des employés</h3>
                  <div className="space-y-3">
                    {employees.filter(e => e.status !== 'pending' && e.status !== 'rejected').map(emp => (
                      <div key={emp.id} className="flex items-center justify-between bg-white border border-gray-200 p-4 rounded-xl hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{emp.name.replace(/\s*\(.*?\)/g, '')}</p>
                            <p className="text-sm text-gray-500">{emp.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500 capitalize">{emp.role === 'admin' ? 'Administrateur' : 'Créateur'}</span>
                        </div>
                      </div>
                    ))}
                    {employees.filter(e => e.status !== 'pending' && e.status !== 'rejected').length === 0 && (
                      <p className="text-sm text-gray-500 italic">Aucun employé actif.</p>
                    )}
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-100">
                  <div className={cn("mb-6 relative transition-opacity", !isPremiumOnly && "opacity-50 pointer-events-none")}>
                    <label className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:shadow-md transition-all duration-300">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-gray-900">Activer les processus de validation (Workflows)</h3>
                          <PremiumBadge />
                        </div>
                        <p className="text-gray-500 text-sm mt-1">Permet d&apos;assigner un processus d&apos;approbation optionnel sur vos factures et proformas.</p>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="enableWorkflows" checked={localSettings.enableWorkflows || false} onChange={handleChange} disabled={!isPremiumOnly} className="sr-only peer disabled:cursor-not-allowed" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </div>
                      </div>
                    </label>
                  </div>
                  {localSettings.enableWorkflows && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Modèles de Workflows</h2>
                        <button 
                          onClick={() => setIsNewWfModalOpen(true)}
                          className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                        >
                          + Nouveau modèle
                        </button>
                      </div>
                      
                      <div className="space-y-6">
                        {workflows.map(wf => (
                          <div key={wf.id} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <h3 className="font-bold text-lg text-gray-900">{wf.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  S'applique sur : <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700">{wf.documentType === 'both' ? 'Factures & Proformas' : wf.documentType === 'invoice' ? 'Factures uniquement' : 'Proformas uniquement'}</span>
                                </p>
                              </div>
                              <button onClick={() => deleteWorkflow(wf.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                            
                            <div className="flex flex-col md:flex-row md:flex-wrap items-center md:items-start gap-4 md:gap-2">
                              {wf.steps.map((step, idx) => (
                                <div key={step.id} className="flex flex-col md:flex-row items-center">
                                  <div 
                                    onClick={() => {
                                      setStepModalData({
                                        workflowId: wf.id,
                                        stepId: step.id,
                                        name: step.name,
                                        requiredRole: step.requiredRole,
                                        actionLabel: step.actionLabel,
                                        allowReject: step.allowReject,
                                        rejectLabel: step.rejectLabel,
                                        allowRequestChanges: step.allowRequestChanges,
                                        requestChangesLabel: step.requestChangesLabel
                                      });
                                      setIsStepModalOpen(true);
                                    }}
                                    className="bg-white border-2 border-primary/20 hover:border-primary/50 transition-colors px-5 py-3 rounded-xl w-full md:min-w-[180px] shadow-sm relative group cursor-pointer"
                                  >
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteStep(wf.id, step.id);
                                      }}
                                      className="absolute -top-3 -right-3 w-6 h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      ×
                                    </button>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Étape {idx + 1}</p>
                                    <p className="text-sm font-bold text-gray-900">{step.name}</p>
                                    <div className="mt-2 flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-primary/50"></span>
                                      <p className="text-xs text-gray-600 font-medium">{step.requiredRole === 'any' ? 'N\'importe qui' : (employees.find(e => e.id === step.requiredRole)?.name || step.requiredRole)}</p>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                      <p className="text-[11px] text-gray-400">Action: {step.actionLabel}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col md:flex-row items-center justify-center py-2 md:py-0 md:px-2 relative">
                                    <button 
                                      onClick={() => {
                                        setStepModalData({
                                          workflowId: wf.id,
                                          insertIndex: idx + 1,
                                          name: '',
                                          requiredRole: 'any',
                                          actionLabel: 'Approuver',
                                          allowReject: false,
                                          rejectLabel: 'Refuser',
                                          allowRequestChanges: false,
                                          requestChangesLabel: 'Demander des modifications'
                                        });
                                        setIsStepModalOpen(true);
                                      }}
                                      className="w-6 h-6 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm opacity-0 md:group-hover:opacity-100 absolute md:-mt-10 md:ml-0 z-10"
                                      title="Insérer une étape"
                                    >
                                      +
                                    </button>
                                    {idx < wf.steps.length - 1 && (
                                      <>
                                        <svg className="w-6 h-6 text-gray-300 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                        <svg className="w-6 h-6 text-gray-300 md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                              
                              <button 
                                onClick={() => {
                                  setStepModalData({
                                    workflowId: wf.id,
                                    insertIndex: undefined,
                                    stepId: undefined,
                                    name: '',
                                    requiredRole: 'any',
                                    actionLabel: 'Approuver',
                                    allowReject: false,
                                    rejectLabel: 'Refuser',
                                    allowRequestChanges: false,
                                    requestChangesLabel: 'Demander des modifications'
                                  });
                                  setIsStepModalOpen(true);
                                }}
                                className="h-full border-2 border-dashed border-gray-200 hover:border-primary/50 hover:bg-primary/5 text-gray-500 hover:text-primary transition-colors px-6 py-4 rounded-xl flex items-center gap-2 w-full md:w-auto justify-center"
                              >
                                <Plus className="w-5 h-5" />
                                <span className="font-medium text-sm">Ajouter</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-gray-900">Alertes et Notifications</h2>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">Gérez la manière dont le système communique avec vous et vos clients.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {localSettings.alerts?.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all duration-300 group">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-gray-900 text-[15px]">{alert.name}</p>
                          {!alert.isActive && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase">Inactif</span>
                          )}
                          {alert.type === 'email' && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase">Email</span>}
                          {alert.type === 'in_app' && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-[10px] font-bold uppercase">In-App</span>}
                        </div>
                        <p className="text-gray-500 text-sm mt-0.5">{alert.description || alert.subjectTemplate || 'Alerte personnalisée'}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => {
                            setEditingAlertId(alert.id);
                            setIsAlertModalOpen(true);
                          }}
                          disabled={!isPremiumOnly}
                          className={cn(
                            "p-2 rounded-xl transition-colors",
                            isPremiumOnly 
                              ? "text-slate-400 hover:text-primary bg-slate-50 hover:bg-primary/10"
                              : "text-slate-300 bg-slate-50 opacity-50 pointer-events-none"
                          )}
                          title={isPremiumOnly ? "Modifier l'alerte" : "Premium requis pour modifier"}
                        >
                          <Settings2 className="w-5 h-5" />
                        </button>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={alert.isActive}
                            onChange={(e) => {
                              const newAlerts = localSettings.alerts.map(a => a.id === alert.id ? { ...a, isActive: e.target.checked } : a);
                              const newSettings = { ...localSettings, alerts: newAlerts };
                              setLocalSettings(newSettings);
                              updateSettings(newSettings);
                            }}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary cursor-pointer"></div>
                        </label>
                        {!alert.isSystem && (
                          <button
                            onClick={() => setAlertToDelete(alert.id)}
                            disabled={!isPremiumOnly}
                            className={cn(
                              "p-2 rounded-xl transition-colors ml-2",
                              isPremiumOnly
                                ? "text-red-400 hover:text-red-600 hover:bg-red-50"
                                : "text-slate-300 bg-slate-50 opacity-50 pointer-events-none"
                            )}
                            title={isPremiumOnly ? "Supprimer" : "Premium requis pour supprimer"}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      setEditingAlertId(null);
                      setIsAlertModalOpen(true);
                    }}
                    disabled={!isPremiumOnly}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-xl font-medium transition-all relative",
                      isPremiumOnly 
                        ? "text-slate-500 hover:border-primary/50 hover:text-primary hover:bg-primary/5" 
                        : "opacity-50 pointer-events-none text-slate-400 bg-slate-50"
                    )}
                  >
                    <Plus className="w-5 h-5" />
                    Créer une nouvelle alerte personnalisée
                    {!isPremiumOnly && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2">
                        <PremiumBadge />
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Sécurité & Accès</h2>
                  <p className="text-gray-500 text-sm mt-1">Paramètres de sécurité de votre compte.</p>
                </div>

                {isAdmin && employees.filter(e => e.status === 'pending').length > 0 && (
                  <div className="bg-amber-50/50 p-6 rounded-xl border border-amber-200 shadow-sm space-y-4 mb-6">
                    <h3 className="font-semibold text-amber-600 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      Demandes d'accès en attente
                    </h3>
                    <div className="space-y-3">
                      {employees.filter(e => e.status === 'pending').map(emp => (
                        <div key={emp.id} className="flex items-center justify-between bg-white border border-amber-200 p-4 rounded-xl shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{emp.name.replace(/\s*\(.*?\)/g, '')}</p>
                              <p className="text-sm text-gray-500">Souhaite rejoindre votre entreprise</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <select
                              value={pendingRoles[emp.id] || 'creator'}
                              onChange={(e) => setPendingRoles({ ...pendingRoles, [emp.id]: e.target.value as 'admin' | 'manager' | 'accountant' | 'creator' })}
                              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium"
                            >
                              <option value="creator">Créateur</option>
                              <option value="accountant">Comptable</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Administrateur</option>
                            </select>
                            <button 
                              onClick={() => updateEmployeeStatus(emp.id, 'active', pendingRoles[emp.id] || 'creator')}
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium text-sm shadow-sm"
                            >
                              <Check className="w-4 h-4" />
                              Accepter
                            </button>
                            <button 
                              onClick={() => updateEmployeeStatus(emp.id, 'rejected')}
                              className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium text-sm"
                            >
                              <X className="w-4 h-4" />
                              Refuser
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                  <h3 className="font-semibold text-gray-900">Mot de passe</h3>
                  
                  {passwordMessage && (
                    <div className={cn("p-4 rounded-xl text-sm font-medium", passwordMessage.type === 'error' ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>
                      {passwordMessage.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Ancien mot de passe</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={passwordForm.old}
                        onChange={(e) => setPasswordForm({ ...passwordForm, old: e.target.value })}
                        className="w-full md:w-1/2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all duration-300" 
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={passwordForm.new}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all duration-300" 
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={passwordForm.confirm}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all duration-300" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={handlePasswordChange}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                      Mettre à jour le mot de passe
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-semibold text-gray-900">Double Authentification (2FA)</h3>
                  <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors group">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-gray-900 text-[15px] flex items-center gap-2">
                        Authentification à deux facteurs
                        <ShieldCheck className="w-4 h-4 text-primary" />
                      </p>
                      <p className="text-gray-500 text-sm mt-0.5">Ajoute une couche de sécurité supplémentaire lors de la connexion.</p>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="twoFactorEnabled"
                        checked={localSettings.twoFactorEnabled || false}
                        onChange={handleChange}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                  </label>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-semibold text-gray-900 flex justify-between items-center">
                    Sessions Actives
                    {activeSessions.length > 1 && (
                      <button 
                        onClick={handleRevokeAllSessions}
                        className="text-sm font-medium text-red-500 hover:text-red-700 hover:underline"
                      >
                        Déconnecter les autres appareils
                      </button>
                    )}
                  </h3>
                  <div className="space-y-3">
                    {activeSessions.map((session) => (
                      <div key={session.id} className={cn("flex items-center justify-between p-3 border rounded-lg", session.isCurrent ? "border-green-200 bg-green-50/50" : "border-slate-100")}>
                        <div>
                          <p className="font-semibold text-sm text-slate-900">
                            {session.name}
                            {session.isCurrent && <span className="ml-2 text-[10px] text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded uppercase tracking-wider">Actuel</span>}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">{session.location} • {session.isCurrent ? `IP: ${session.ip}` : session.time}</p>
                        </div>
                      </div>
                    ))}
                    {activeSessions.length === 1 && (
                      <p className="text-sm text-slate-500 text-center py-4">
                        Aucune autre session active.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="mt-8 pt-8 border-t border-gray-100 flex justify-end items-center gap-4">
            {isSaved && (
              <span className="text-green-600 text-sm font-medium animate-in fade-in slide-in-from-right-2">
                Modifications enregistrées !
              </span>
            )}
            <button 
              onClick={handleSave}
              disabled={isSaved || isUploadingLogo}
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-full font-medium transition-all duration-300 hover:shadow-[0_8px_20px_rgba(45,139,111,0.25)] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploadingLogo ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Upload...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {t('common.save')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* New Workflow Modal */}
      {isNewWfModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-5 w-full max-w-md shadow-lg border border-slate-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Nouveau Workflow</h3>
            <form onSubmit={handleCreateWorkflow} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du workflow</label>
                <input 
                  type="text" 
                  value={newWfData.name}
                  onChange={(e) => setNewWfData({ ...newWfData, name: e.target.value })}
                  placeholder="Ex: Validation Achat > 1000€"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appliquer sur</label>
                <select 
                  value={newWfData.documentType}
                  onChange={(e) => setNewWfData({ ...newWfData, documentType: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none"
                >
                  <option value="both">Factures et Proformas</option>
                  <option value="invoice">Factures uniquement</option>
                  <option value="proforma">Proformas uniquement</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsNewWfModalOpen(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium">
                  Annuler
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium shadow-md hover:shadow-lg">
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit/Add Step Modal */}
      {isStepModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-5 w-full max-w-md shadow-lg border border-slate-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {stepModalData.stepId ? 'Modifier l\'étape' : 'Ajouter une étape'}
            </h3>
            <form onSubmit={handleSaveStep} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'étape</label>
                <input 
                  type="text" 
                  value={stepModalData.name}
                  onChange={(e) => setStepModalData({ ...stepModalData, name: e.target.value })}
                  placeholder="Ex: Validation N+1"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Utilisateur Requis</label>
                <select 
                  value={stepModalData.requiredRole}
                  onChange={(e) => setStepModalData({ ...stepModalData, requiredRole: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none"
                >
                  <option value="any">N'importe qui</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Libellé du bouton d'action</label>
                <input 
                  type="text" 
                  value={stepModalData.actionLabel}
                  onChange={(e) => setStepModalData({ ...stepModalData, actionLabel: e.target.value })}
                  placeholder="Ex: Approuver"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none"
                  required
                />
              </div>
              <div className="pt-2 border-t border-gray-100 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={stepModalData.allowReject || false}
                    onChange={(e) => setStepModalData({ ...stepModalData, allowReject: e.target.checked })}
                    className="w-4 h-4 text-primary bg-gray-50 border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Autoriser le rejet (retour à l'état Brouillon)</span>
                </label>
                {stepModalData.allowReject && (
                  <div className="pl-7">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Libellé du bouton de rejet</label>
                    <input 
                      type="text" 
                      value={stepModalData.rejectLabel || 'Refuser'}
                      onChange={(e) => setStepModalData({ ...stepModalData, rejectLabel: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                      required
                    />
                  </div>
                )}

                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={stepModalData.allowRequestChanges || false}
                    onChange={(e) => setStepModalData({ ...stepModalData, allowRequestChanges: e.target.checked })}
                    className="w-4 h-4 text-primary bg-gray-50 border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Autoriser la demande de modifications</span>
                </label>
                {stepModalData.allowRequestChanges && (
                  <div className="pl-7">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Libellé du bouton de demande</label>
                    <input 
                      type="text" 
                      value={stepModalData.requestChangesLabel || 'Demander des modifications'}
                      onChange={(e) => setStepModalData({ ...stepModalData, requestChangesLabel: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                      required
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsStepModalOpen(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium">
                  Annuler
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium shadow-md hover:shadow-lg">
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <AlertBuilderModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        initialAlert={editingAlertId ? localSettings.alerts?.find(a => a.id === editingAlertId) : null}
        onSave={(alert) => {
          let newAlerts;
          if (editingAlertId) {
            newAlerts = localSettings.alerts.map(a => a.id === editingAlertId ? alert : a);
          } else {
            newAlerts = [...(localSettings.alerts || []), alert];
          }
          const newSettings = { ...localSettings, alerts: newAlerts };
          setLocalSettings(newSettings);
          updateSettings(newSettings);
          setIsAlertModalOpen(false);
        }}
      />
    </>
  );
}

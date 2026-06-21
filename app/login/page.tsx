'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, Mail, Lock, Loader2, ArrowRight, CheckCircle2, Receipt, FileText, PieChart } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

function LoginForm() {
  const searchParams = useSearchParams()
  const initialPlan = searchParams.get('plan') || 'gratuit'
  
  const [isSignUp, setIsSignUp] = useState(searchParams.has('plan')) // Auto-open signup if plan is selected
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{title: string, description: string, action?: string} | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const getFriendlyErrorMessage = (err: any) => {
    const msg = typeof err?.message === 'string' ? err.message : JSON.stringify(err);
    
    if (msg?.includes('AuthRetryableFetchError') || msg?.includes('Failed to fetch')) {
      return {
        title: "Connexion au serveur impossible",
        description: "Nous n'arrivons pas à joindre la base de données de manière sécurisée.",
        action: "Vérifiez votre connexion internet ou réessayez dans quelques instants."
      };
    }
    if (msg?.includes('Invalid login credentials')) {
      return {
        title: "Identifiants incorrects",
        description: "L'adresse email ou le mot de passe que vous avez saisi ne correspond à aucun compte.",
        action: "Veuillez vérifier vos identifiants et réessayer."
      };
    }
    if (msg?.includes('User already registered')) {
      return {
        title: "Compte déjà existant",
        description: "Un utilisateur utilise déjà cette adresse email sur la plateforme.",
        action: "Cliquez sur \"Se connecter\" plus bas pour accéder à votre espace."
      };
    }
    if (msg?.includes('Password should be at least')) {
      return {
        title: "Mot de passe trop court",
        description: "Pour la sécurité de votre entreprise, votre mot de passe doit être plus long.",
        action: "Utilisez un mot de passe contenant au moins 6 caractères."
      };
    }
    if (msg?.includes('Email not confirmed')) {
      return {
        title: "Adresse email non confirmée",
        description: "Par mesure de sécurité, vous devez d'abord confirmer votre compte.",
        action: "Vérifiez votre boîte mail (et vos spams) et cliquez sur le lien de confirmation."
      };
    }
    
    if (msg?.includes('{}') || msg === '{}') {
      return {
        title: "Erreur d'initialisation",
        description: "Votre espace de travail n'a pas pu être créé correctement.",
        action: "Veuillez rafraîchir la page et réessayer l'inscription."
      };
    }
    
    return {
      title: "Une erreur inattendue est survenue",
      description: "Le système a rencontré un problème lors du traitement de votre demande.",
      action: `Détail technique: ${msg.substring(0, 150)}`
    };
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(null)
    setError(null)

    console.log("Supabase URL is:", process.env.NEXT_PUBLIC_SUPABASE_URL);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
            selected_plan: initialPlan,
          }
        }
      })

      if (error) {
        console.error("Signup error:", error)
        setError(getFriendlyErrorMessage(error))
      } else {
        setSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.')
        setIsSignUp(false)
      }
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Login error:", error)
      setError(getFriendlyErrorMessage(error))
      setLoading(false)
      return
    }

    router.refresh()
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* LEFT SIDE - SHOWCASE (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden flex-col justify-between p-12">
        {/* Background Gradients & Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#1e3a30] to-primary opacity-90 z-0" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay z-0" />
        
        {/* Decorative Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/30 blur-[120px] z-0" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#1e3a30]/60 blur-[100px] z-0" />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center bg-white/95 w-fit px-5 py-2.5 rounded-2xl shadow-xl backdrop-blur-sm">
          <Logo />
        </div>

        {/* Center Content - Glassmorphic Feature Showcase */}
        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-[1.15] mb-6">
            Gérez votre facturation <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-primary-light">
              comme un pro.
            </span>
          </h1>
          <p className="text-slate-300 text-lg mb-10 leading-relaxed max-w-md">
            Générez des factures et devis professionnels en quelques secondes, suivez vos paiements et pilotez votre trésorerie sur une plateforme centralisée et sécurisée.
          </p>

          <div className="space-y-4">
            {[
              { icon: Receipt, title: "Création instantanée", desc: "Factures et proformas avec calculs automatiques de TVA." },
              { icon: Building2, title: "Multi-Entreprises", desc: "Gérez tous vos business depuis un compte unique." },
              { icon: FileText, title: "Exports Word & Excel", desc: "Des documents générés à l'image de votre marque." }
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md transition-all hover:bg-white/10 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                  <feature.icon className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 text-slate-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Rejoignez des centaines d'entrepreneurs sereins.
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-md">
          <div className="mb-10 flex flex-col items-center lg:items-start">
            <div className="lg:hidden mb-8">
              <Logo />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight text-center lg:text-left w-full">
              {isSignUp ? 'Créer un compte' : 'Bienvenue'}
            </h2>
            <p className="text-gray-500 text-lg text-center lg:text-left">
              {isSignUp 
                ? 'Créez votre espace de facturation en quelques secondes.' 
                : 'Connectez-vous pour accéder à votre espace de gestion.'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm p-4 rounded-2xl border border-red-100/50 flex gap-4 transition-all duration-300 animate-in slide-in-from-top-2">
                <div className="w-8 h-8 shrink-0 bg-red-100/80 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold text-lg">!</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-red-900 font-semibold text-sm">{error.title}</h4>
                  <p className="text-red-700/90 text-sm leading-relaxed">{error.description}</p>
                  {error.action && (
                    <p className="text-red-800 font-medium text-xs mt-1.5 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" /> {error.action}
                    </p>
                  )}
                </div>
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-sm border border-emerald-100 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
                <p className="leading-relaxed">{success}</p>
              </div>
            )}

            {isSignUp && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Nom de l'entreprise</label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                      placeholder="Ma Société SAS"
                      required={isSignUp}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Votre nom complet</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                      placeholder="Jean Dupont"
                      required={isSignUp}
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Email professionnel</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                  placeholder="nom@entreprise.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700">Mot de passe</label>
                {!isSignUp && (
                  <button type="button" className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                    Oublié ?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary text-white py-4 rounded-2xl font-bold transition-all shadow-[0_8px_20px_rgba(45,139,111,0.25)] hover:shadow-[0_12px_25px_rgba(45,139,111,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group text-lg"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Créer mon compte' : 'Se connecter'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
            <div className="text-center mt-8">
              <span className="text-gray-500">
                {isSignUp ? 'Déjà un compte ?' : "Pas encore de compte ?"}
              </span>
              {' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError(null)
                  setSuccess(null)
                }}
                className="text-primary hover:text-primary-dark font-bold hover:underline transition-all"
              >
                {isSignUp ? 'Se connecter' : "S'inscrire"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center bg-white"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
      <LoginForm />
    </Suspense>
  )
}

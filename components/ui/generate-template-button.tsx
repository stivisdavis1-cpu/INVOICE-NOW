'use client';

import { useState } from 'react';
import { Wand2, Check, Loader2 } from 'lucide-react';
import { generateProTemplateAsBase64 } from '@/lib/template-generator';

interface GenerateTemplateButtonProps {
  onGenerated: (base64: string) => void;
  type: 'FACTURE' | 'PROFORMA';
}

export function GenerateTemplateButton({ onGenerated, type }: GenerateTemplateButtonProps) {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const base64 = await generateProTemplateAsBase64(type);
      onGenerated(base64);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch (error) {
      console.error("Failed to generate template", error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={generating}
      className="flex items-center justify-center gap-2 px-4 py-2.5 mt-4 bg-primary/10 hover:bg-primary hover:text-white text-primary text-sm font-semibold rounded-xl transition-all w-full group-hover:shadow"
    >
      {generating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : done ? (
        <Check className="w-4 h-4" />
      ) : (
        <Wand2 className="w-4 h-4" />
      )}
      {generating ? "Génération..." : done ? "Modèle enregistré !" : `Générer un modèle ${type === 'FACTURE' ? 'Facture' : 'Proforma'}`}
    </button>
  );
}

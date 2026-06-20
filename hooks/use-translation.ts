import { useI18nStore } from '@/store/i18n-store';
import fr from '@/lib/i18n/fr.json';
import en from '@/lib/i18n/en.json';

const dictionaries: Record<string, any> = {
  fr,
  en
};

export const useTranslation = () => {
  const { language, setLanguage } = useI18nStore();
  const dict = dictionaries[language];

  // Fonction t pour accéder aux clés imbriquées (ex: 'common.save')
  const t = (key: string, variables?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value = dict;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Retourne la clé si non trouvée
      }
    }

    if (typeof value !== 'string') return key;

    // Remplacement des variables {var}
    if (variables) {
      let result = value;
      for (const [k, v] of Object.entries(variables)) {
        result = result.replace(new RegExp(`{${k}}`, 'g'), String(v));
      }
      return result;
    }

    return value;
  };

  return { t, language, setLanguage };
};

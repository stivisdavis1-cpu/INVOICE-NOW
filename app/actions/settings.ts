'use server';

import { createClient } from '@/lib/supabase/server';

export async function updateSettingsAction(companyId: string, updates: any) {
  const supabase = await createClient();

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Non autorisé: veuillez vous reconnecter.');
  }

  const { userName, ...rest } = updates;

  // 1. Update Profile if needed
  if (userName !== undefined) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: userName })
      .eq('id', user.id);
      
    if (profileError) console.error("Failed to update profile", profileError);
  }

  if (Object.keys(rest).length === 0) return null;

  const settingsUpdates: any = {};
  
  // 2. Update Company if needed
  if (rest.companyName !== undefined) {
    settingsUpdates.company_name = rest.companyName;
    const { error: companyError } = await supabase
      .from('companies')
      .update({ name: rest.companyName })
      .eq('id', companyId);
      
    if (companyError) console.error("Failed to update company name", companyError);
  }

  // 3. Map settings fields
  if (rest.ninea !== undefined) settingsUpdates.ninea = rest.ninea;
  if (rest.rccm !== undefined) settingsUpdates.rccm = rest.rccm;
  if (rest.address !== undefined) settingsUpdates.address = rest.address;
  if (rest.defaultTva !== undefined) settingsUpdates.default_tva = rest.defaultTva;
  if (rest.currency !== undefined) settingsUpdates.currency = rest.currency;
  if (rest.footerMentions !== undefined) settingsUpdates.footer_mentions = rest.footerMentions;
  if (rest.customWordTemplateInvoice !== undefined) settingsUpdates.custom_word_template_invoice = rest.customWordTemplateInvoice;
  if (rest.customWordTemplateProforma !== undefined) settingsUpdates.custom_word_template_proforma = rest.customWordTemplateProforma;
  if (rest.autoReminder !== undefined) settingsUpdates.auto_reminder = rest.autoReminder;
  if (rest.lateAlert !== undefined) settingsUpdates.late_alert = rest.lateAlert;
  if (rest.monthlyReport !== undefined) settingsUpdates.monthly_report = rest.monthlyReport;
  if (rest.enableWorkflows !== undefined) settingsUpdates.enable_workflows = rest.enableWorkflows;
  if (rest.themeColor !== undefined) settingsUpdates.theme_color = rest.themeColor;
  if (rest.logo !== undefined) settingsUpdates.logo = rest.logo;

  if (Object.keys(settingsUpdates).length === 0) return null;

  // 4. Update or Insert Settings
  try {
    const { data: existing, error: existingError } = await supabase
      .from('settings')
      .select('id')
      .eq('company_id', companyId)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("existingError:", existingError);
      throw new Error(`Erreur lors de la lecture des paramètres existants: ${existingError.message}`);
    }

    if (existing) {
      const { data, error } = await supabase
        .from('settings')
        .update(settingsUpdates)
        .eq('id', existing.id)
        .select()
        .single();
        
      if (error) {
        console.error("updateError:", error);
        throw new Error(`Erreur lors de la mise à jour des paramètres: ${error.message}`);
      }
      return data;
    } else {
      const { data, error } = await supabase
        .from('settings')
        .insert({ ...settingsUpdates, company_id: companyId })
        .select()
        .single();
        
      if (error) {
        console.error("insertError:", error);
        throw new Error(`Erreur lors de l'insertion des paramètres: ${error.message}`);
      }
      return data;
    }
  } catch (err: any) {
    console.error("Global Server Action Error:", err);
    throw err;
  }
}

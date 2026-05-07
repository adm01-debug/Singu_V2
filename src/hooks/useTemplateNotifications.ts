import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from "@/lib/logger";

export interface TemplateNotificationSettings {
  enabled: boolean;
  minSuccessRate: number;
  minUsages: number;
  discProfiles: ('D' | 'I' | 'S' | 'C')[];
}

const DEFAULT_SETTINGS: TemplateNotificationSettings = {
  enabled: true,
  minSuccessRate: 70,
  minUsages: 3,
  discProfiles: ['D', 'I', 'S', 'C'],
};

export function useTemplateNotifications() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<TemplateNotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      const preferences = profile?.preferences as Record<string, unknown> | null;
      if (preferences?.templateNotifications) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...(preferences.templateNotifications as Partial<TemplateNotificationSettings>),
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error loading notification settings:', { error: msg });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<TemplateNotificationSettings>) => {
    if (!user) return false;

    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      // Get current preferences
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const currentPreferences = (profile?.preferences as Record<string, unknown>) || {};

      // Update with new template notification settings
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          preferences: {
            ...currentPreferences,
            templateNotifications: updatedSettings,
          },
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error updating notification settings:', { error: msg });
      return false;
    }
  };

  const checkForHighPerformers = useCallback(async () => {
    if (!user || !settings.enabled) return null;

    try {
      const { data, error } = await supabase.functions.invoke('template-success-notifications', {
        body: { userId: user.id },
      });

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error('Error checking for high performers:', error);
      return null;
    }
  }, [user, settings.enabled]);

  return {
    settings,
    loading,
    updateSettings,
    checkForHighPerformers,
  };
}

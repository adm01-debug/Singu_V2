import { logger } from "@/lib/logger";

/**
 * Type-safe tab utilities for Radix UI Tabs
 */

/**
 * Creates a type-safe tab change handler
 * This avoids the need for 'as any' type casts in tab components
 */
export function createTabHandler<T extends string>(
  setter: (value: T) => void,
  validValues?: readonly T[]
): (value: string) => void {
  return (value: string) => {
    if (validValues && !validValues.includes(value as T)) {
      logger.warn(`Invalid tab value: ${value}`);
      return;
    }
    setter(value as T);
  };
}

/**
 * Period filter type for analytics
 */
export type PeriodFilter = '7d' | '30d' | '90d' | '365d' | 'all';

export const PERIOD_FILTER_VALUES: readonly PeriodFilter[] = ['7d', '30d', '90d', '365d', 'all'];

export function createPeriodFilterHandler(
  setter: (value: PeriodFilter) => void
): (value: string) => void {
  return createTabHandler(setter, PERIOD_FILTER_VALUES);
}

/**
 * Generic tab type for emotional intelligence panel
 */
export type EITabType = 'overview' | 'pillars' | 'sales' | 'evolution';

export const EI_TAB_VALUES: readonly EITabType[] = ['overview', 'pillars', 'sales', 'evolution'];

export function createEITabHandler(
  setter: (value: EITabType) => void
): (value: string) => void {
  return createTabHandler(setter, EI_TAB_VALUES);
}

/**
 * Generic tab type for trigger analytics
 */
export type TriggerAnalyticsTab = 'overview' | 'disc' | 'triggers';

export const TRIGGER_ANALYTICS_TAB_VALUES: readonly TriggerAnalyticsTab[] = ['overview', 'disc', 'triggers'];

export function createTriggerAnalyticsTabHandler(
  setter: (value: TriggerAnalyticsTab) => void
): (value: string) => void {
  return createTabHandler(setter, TRIGGER_ANALYTICS_TAB_VALUES);
}

/**
 * Focus type for metaprogram templates
 */
export type FocusType = 'motivation' | 'reference' | 'sorting';

export const FOCUS_TYPE_VALUES: readonly FocusType[] = ['motivation', 'reference', 'sorting'];

export function createFocusTypeHandler(
  setter: (value: FocusType) => void
): (value: string) => void {
  return createTabHandler(setter, FOCUS_TYPE_VALUES);
}

/**
 * Trigger category tab type
 */
export type TriggerCategoryTab = 'all' | 'urgency' | 'social_proof' | 'scarcity' | 'authority' | 'reciprocity' | 'commitment' | 'liking';

export const TRIGGER_CATEGORY_VALUES: readonly TriggerCategoryTab[] = [
  'all', 'urgency', 'social_proof', 'scarcity', 'authority', 'reciprocity', 'commitment', 'liking'
];

export function createTriggerCategoryHandler(
  setter: (value: TriggerCategoryTab) => void
): (value: string) => void {
  return createTabHandler(setter, TRIGGER_CATEGORY_VALUES);
}

/**
 * EI Tab type with history
 */
export type EITabWithHistory = 'overview' | 'pillars' | 'sales' | 'history';

export const EI_TAB_WITH_HISTORY_VALUES: readonly EITabWithHistory[] = ['overview', 'pillars', 'sales', 'history'];

export function createEITabWithHistoryHandler(
  setter: (value: EITabWithHistory) => void
): (value: string) => void {
  return createTabHandler(setter, EI_TAB_WITH_HISTORY_VALUES);
}

/**
 * Focus type for metaprogram templates (with working style)
 */
export type MetaprogramFocusType = 'motivation' | 'reference' | 'working';

export const METAPROGRAM_FOCUS_VALUES: readonly MetaprogramFocusType[] = ['motivation', 'reference', 'working'];

export function createMetaprogramFocusHandler(
  setter: (value: MetaprogramFocusType) => void
): (value: string) => void {
  return createTabHandler(setter, METAPROGRAM_FOCUS_VALUES);
}

/**
 * Trigger category tab type with tips
 */
export type TriggerCategoryWithTipsTab = TriggerCategoryTab | 'tips';

export const TRIGGER_CATEGORY_WITH_TIPS_VALUES: readonly string[] = [
  ...TRIGGER_CATEGORY_VALUES, 'tips'
];

export function createTriggerCategoryWithTipsHandler(
  setter: (value: TriggerCategoryWithTipsTab) => void
): (value: string) => void {
  return createTabHandler(setter, TRIGGER_CATEGORY_WITH_TIPS_VALUES as readonly TriggerCategoryWithTipsTab[]);
}

import { useState, useCallback, useMemo } from 'react';
import { ValuesMap, ClientValue, DecisionCriterion, ValueCategory } from '@/types/nlp-advanced';
import { VALUE_CATEGORY_INFO } from '@/data/nlpAdvancedData';
import { Contact } from '@/types';
import { getMetaprogramProfile } from '@/lib/contact-utils';

interface Interaction {
  id: string;
  content?: string;
  transcription?: string;
}

export function useClientValues(contact: Contact, interactions: Interaction[]) {
  const [analyzing] = useState(false);

  const detectValues = useCallback((text: string): { category: ValueCategory; matches: string[] }[] => {
    const lowerText = text.toLowerCase();
    const detected: { category: ValueCategory; matches: string[] }[] = [];

    (Object.entries(VALUE_CATEGORY_INFO) as [ValueCategory, typeof VALUE_CATEGORY_INFO[ValueCategory]][]).forEach(
      ([category, info]) => {
        const matches = info.keywords.filter(keyword => lowerText.includes(keyword.toLowerCase()));
        if (matches.length > 0) {
          detected.push({ category, matches });
        }
      }
    );

    return detected;
  }, []);

  const valuesMap = useMemo((): ValuesMap => {
    // Initialize with proper typing
    const valueScores = (Object.keys(VALUE_CATEGORY_INFO) as ValueCategory[]).reduce(
      (acc, cat) => {
        acc[cat] = { count: 0, phrases: [] };
        return acc;
      },
      {} as Record<ValueCategory, { count: number; phrases: string[] }>
    );

    // Analyze all interactions
    interactions.forEach(interaction => {
      const text = interaction.content || interaction.transcription || '';
      if (!text) return;

      const detected = detectValues(text);
      detected.forEach(({ category, matches }) => {
        valueScores[category].count += matches.length;
        valueScores[category].phrases.push(...matches);
      });
    });

    // Convert to ClientValue array and sort by importance
    const coreValues: ClientValue[] = (Object.entries(valueScores) as [ValueCategory, { count: number; phrases: string[] }][])
      .filter(([_, data]) => data.count > 0)
      .map(([category, data]) => ({
        id: `value-${category}`,
        category,
        name: VALUE_CATEGORY_INFO[category].name,
        importance: Math.min(10, Math.round(data.count * 2)),
        detectedPhrases: [...new Set(data.phrases)],
        frequency: data.count,
        lastMentioned: new Date().toISOString()
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 6);

    // Generate decision criteria from values
    const decisionCriteria: DecisionCriterion[] = coreValues.slice(0, 4).map((value, index) => ({
      id: `criteria-${value.category}`,
      name: VALUE_CATEGORY_INFO[value.category].name,
      priority: index + 1,
      type: index === 0 ? 'must_have' : index < 3 ? 'nice_to_have' : 'nice_to_have',
      detectedFrom: value.detectedPhrases.join(', '),
      howToAddress: VALUE_CATEGORY_INFO[value.category].benefitFraming
    }));

    // Generate value hierarchy
    const valueHierarchy = coreValues.map(v => VALUE_CATEGORY_INFO[v.category].name);

    // Generate benefit alignment suggestions
    const benefitAlignment = coreValues.slice(0, 4).map(value => ({
      value: VALUE_CATEGORY_INFO[value.category].name,
      benefit: `Benefício alinhado a ${VALUE_CATEGORY_INFO[value.category].name.toLowerCase()}`,
      template: `${contact.firstName}, ${VALUE_CATEGORY_INFO[value.category].benefitFraming.replace('...', ' [seu benefício específico]')}`
    }));

    const motivationalDrivers = coreValues
      .filter(v => ['growth', 'achievement', 'recognition', 'freedom', 'innovation'].includes(v.category))
      .map(v => `${VALUE_CATEGORY_INFO[v.category].icon} ${VALUE_CATEGORY_INFO[v.category].name}`);

    const fearDrivers = coreValues
      .filter(v => ['security', 'control', 'tradition', 'balance'].includes(v.category))
      .map(v => `${VALUE_CATEGORY_INFO[v.category].icon} Perder ${VALUE_CATEGORY_INFO[v.category].name.toLowerCase()}`);

    return {
      coreValues,
      decisionCriteria,
      valueHierarchy,
      benefitAlignment,
      motivationalDrivers: motivationalDrivers.length > 0 ? motivationalDrivers : ['🎯 Crescimento', '🏆 Resultados'],
      fearDrivers: fearDrivers.length > 0 ? fearDrivers : ['🛡️ Perder oportunidade', '⏰ Ficar para trás']
    };
  }, [contact, interactions, detectValues]);

  return {
    valuesMap,
    analyzing,
    VALUE_CATEGORY_INFO
  };
}

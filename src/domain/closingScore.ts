 import { Contact, ContactBehavior } from '@/types';
 
 export const EMOTIONAL_SCORES: Record<string, number> = {
   'entusiasmado': 100, 'empolgado': 95, 'interessado': 85, 'positivo': 80,
   'curioso': 75, 'neutro': 50, 'cauteloso': 40, 'hesitante': 35,
   'preocupado': 30, 'cético': 25, 'resistente': 20, 'negativo': 15, 'frustrado': 10
 };
 
 export const DISC_CLOSING_FACTORS: Record<string, { speed: number; style: string }> = {
   'D': { speed: 0.9, style: 'Direto e rápido' },
   'I': { speed: 0.7, style: 'Entusiasmado' },
   'S': { speed: 0.5, style: 'Cauteloso' },
   'C': { speed: 0.4, style: 'Analítico' }
 };
 
 export function calculateEngagementScore(recentInteractionCount: number, daysSinceLastContact: number): number {
   const recencyScore = daysSinceLastContact <= 3 ? 50
     : daysSinceLastContact <= 7 ? 45
     : daysSinceLastContact <= 14 ? 35
     : daysSinceLastContact <= 21 ? 25
     : daysSinceLastContact <= 30 ? 15
     : 5;
   const frequencyScore = Math.min(50, recentInteractionCount * 10);
   return recencyScore + frequencyScore;
 }
 
 export function getSentimentScore(sentiment: string | null): number {
   const map: Record<string, number> = { 'positive': 85, 'neutral': 50, 'negative': 20 };
   return map[sentiment || 'neutral'] || 50;
 }
 
 export function calculateObjectionScore(unresolvedCount: number): number {
   if (unresolvedCount <= 0) return 80;
   return Math.max(20, 80 - (unresolvedCount * 15));
 }
 
 export function calculateValuesScore(importantValuesCount: number): number {
   return Math.min(100, 40 + (importantValuesCount * 15));
 }
 
 export function calculateDISCScore(discProfile: string | null): number {
   const factor = DISC_CLOSING_FACTORS[discProfile ?? ''];
   if (!factor) return 50;
   return 60 + (factor.speed * 40);
 }
 
 export function getProbability(score: number): 'high' | 'medium' | 'low' | 'very_low' {
   if (score >= 75) return 'high';
   if (score >= 55) return 'medium';
   if (score >= 35) return 'low';
   return 'very_low';
 }
 
 export function calculateConfidence(dataPoints: boolean[]): number {
   return Math.round((dataPoints.filter(Boolean).length / dataPoints.length) * 100);
 }
 
 export function calculateWeightedScore(factors: { score: number; weight: number }[]): number {
   return Math.round(factors.reduce((sum, f) => sum + (f.score * f.weight), 0));
 }
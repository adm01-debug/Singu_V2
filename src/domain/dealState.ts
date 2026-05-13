 import { z } from "zod";
 import { uuidSchema } from "./validationSchemas";
 
 /**
  * Pure domain logic for deal state transitions and forecasting.
  */
 
 export const dealStageSchema = z.enum([
   "lead",
   "prospect",
   "qualified",
   "proposal",
   "negotiation",
   "customer",
   "ed",
 ]);
 
 export type DealStage = z.infer<typeof dealStageSchema>;
 
 export const forecastConfidenceSchema = z.object({
   stage: dealStageSchema,
   daysInStage: z.number().min(0),
   interactionCount: z.number().min(0),
   sentimentScore: z.number().min(0).max(100),
   amount: z.number().min(0),
 });
 
 export type ForecastConfidenceInput = z.infer<typeof forecastConfidenceSchema>;
 
 export interface ForecastConfidenceResult {
   confidence: number; // 0-100
   expectedValue: number;
   riskLevel: "low" | "medium" | "high";
   recommendation: string;
 }
 
 /**
  * Calculates confidence based on stage, time, activity, and sentiment.
  */
 export function computeForecastConfidence(input: ForecastConfidenceInput): ForecastConfidenceResult {
   let baseConfidence = 0;
 
   // 1. Stage baseline
   const stageWeights: Record<DealStage, number> = {
     lead: 10,
     prospect: 20,
     qualified: 40,
     proposal: 60,
     negotiation: 80,
     customer: 100,
     ed: 0,
   };
   baseConfidence = stageWeights[input.stage];
 
   // 2. Activity bonus (up to +15)
   const activityBonus = Math.min(input.interactionCount * 2, 15);
   
   // 3. Sentiment factor (modifies total by ±10%)
   const sentimentFactor = (input.sentimentScore - 50) / 500; // -0.1 to +0.1
 
   // 4. Stagnation penalty (over 30 days in stage)
   const stagnationPenalty = input.daysInStage > 30 ? Math.min((input.daysInStage - 30) / 2, 20) : 0;
 
   let finalConfidence = baseConfidence + activityBonus - stagnationPenalty;
   finalConfidence = finalConfidence * (1 + sentimentFactor);
   finalConfidence = Math.max(0, Math.min(100, Math.round(finalConfidence)));
 
   const expectedValue = (input.amount * finalConfidence) / 100;
   
   let riskLevel: "low" | "medium" | "high" = "high";
   if (finalConfidence > 70) riskLevel = "low";
   else if (finalConfidence > 40) riskLevel = "medium";
 
   let recommendation = "Inicie mais atividades para aquecer o lead.";
   if (finalConfidence > 80) recommendation = "Foco total no fechamento.";
   else if (input.daysInStage > 45) recommendation = "Alerta de estagnação: considere uma oferta agressiva ou revisão de estratégia.";
   else if (input.sentimentScore < 40) recommendation = "Sentimento negativo detectado: agende uma conversa de alinhamento.";
 
   return {
     confidence: finalConfidence,
     expectedValue,
     riskLevel,
     recommendation,
   };
 }
 
 /**
  * Validates if a transition between stages is business-compliant.
  */
 export function isValidStageTransition(from: DealStage, to: DealStage): boolean {
   // Cannot move out of final stages unless it's an admin correction (handled elsewhere)
   if (from === "customer" || from === "ed") return false;
   
   // Standard flow: lead -> prospect -> qualified -> proposal -> negotiation -> customer/ed
   const order: DealStage[] = ["lead", "prospect", "qualified", "proposal", "negotiation", "customer", "ed"];
   const fromIdx = order.indexOf(from);
   const toIdx = order.indexOf(to);
   
   // Can always go to 'ed' (Lost)
   if (to === "ed") return true;
   
   // Can jump forward, but usually not backward in a healthy pipeline
   // We allow 1 step backward for "negotiation -> proposal" but not further
   if (toIdx < fromIdx) {
     if (from === "negotiation" && to === "proposal") return true;
     return false;
   }
 
   return true;
 }
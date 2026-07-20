import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from "@/lib/logger";

export interface PurchasePattern {
  contactId: string;
  contactName: string;
  averageCycleDays: number;
  lastPurchaseDate: string;
  nextPredictedPurchase: string;
  daysSinceLastPurchase: number;
  daysUntilPredictedPurchase: number;
  purchaseFrequency: 'high' | 'medium' | 'low';
  totalPurchases: number;
  totalAmount: number;
  preferredProducts: string[];
  preferredCategories: string[];
  seasonalPattern?: string;
  isOverdue: boolean;
  confidence: number;
}

export interface CategoryPattern {
  category: string;
  totalPurchases: number;
  totalAmount: number;
  averageAmount: number;
  topContacts: { contactId: string; contactName: string; count: number }[];
}

export interface PurchasePrediction {
  contactId: string;
  contactName: string;
  predictedDate: string;
  confidence: number;
  suggestedProducts: string[];
  reason: string;
}

export function usePurchasePatterns() {
  const { user } = useAuth();
  const [patterns, setPatterns] = useState<PurchasePattern[]>([]);
  const [categoryPatterns, setCategoryPatterns] = useState<CategoryPattern[]>([]);
  const [predictions, setPredictions] = useState<PurchasePrediction[]>([]);
  const [loading, setLoading] = useState(true);

  const analyzePurchasePatterns = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch all purchase history with contact info
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchase_history')
        .select(`
          *,
          contacts:contact_id (
            id,
            first_name,
            last_name
          )
        `)
        .order('purchase_date', { ascending: false })
        .limit(1000);

      if (purchaseError) throw purchaseError;

      // Group purchases by contact
      type PurchaseRow = NonNullable<typeof purchases>[number];
      const purchasesByContact = new Map<string, PurchaseRow[]>();
      purchases?.forEach(purchase => {
        const contactId = purchase.contact_id;
        if (!purchasesByContact.has(contactId)) {
          purchasesByContact.set(contactId, []);
        }
        purchasesByContact.get(contactId)?.push(purchase);
      });

      // Analyze patterns for each contact
      const contactPatterns: PurchasePattern[] = [];
      
      purchasesByContact.forEach((contactPurchases, contactId) => {
        if (contactPurchases.length < 1) return;

        const contact = contactPurchases[0].contacts;
        if (!contact) return;

        const contactName = `${contact.first_name} ${contact.last_name}`;
        
        // Sort by date
        contactPurchases.sort((a, b) => 
          new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime()
        );

        // Calculate average cycle
        let totalCycleDays = 0;
        let cycleCount = 0;
        
        for (let i = 0; i < contactPurchases.length - 1; i++) {
          const current = new Date(contactPurchases[i].purchase_date);
          const next = new Date(contactPurchases[i + 1].purchase_date);
          const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays > 0 && diffDays < 365) {
            totalCycleDays += diffDays;
            cycleCount++;
          }
        }

        const averageCycleDays = cycleCount > 0 ? Math.round(totalCycleDays / cycleCount) : 30;
        const lastPurchaseDate = contactPurchases[0].purchase_date;
        const daysSinceLastPurchase = Math.floor(
          (new Date().getTime() - new Date(lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Predict next purchase
        const predictedDate = new Date(lastPurchaseDate);
        predictedDate.setDate(predictedDate.getDate() + averageCycleDays);
        
        const daysUntilPredictedPurchase = Math.floor(
          (predictedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        // Calculate total amount and find preferred products
        const totalAmount = contactPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        const productCounts = new Map<string, number>();
        const categoryCounts = new Map<string, number>();
        
        contactPurchases.forEach(p => {
          productCounts.set(p.product_name, (productCounts.get(p.product_name) || 0) + 1);
          if (p.product_category) {
            categoryCounts.set(p.product_category, (categoryCounts.get(p.product_category) || 0) + 1);
          }
        });

        const preferredProducts = Array.from(productCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([product]) => product);

        const preferredCategories = Array.from(categoryCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([category]) => category);

        // Determine purchase frequency
        const purchaseFrequency = 
          averageCycleDays <= 30 ? 'high' :
          averageCycleDays <= 90 ? 'medium' : 'low';

        // Calculate confidence based on data quality
        const confidence = Math.min(
          95,
          50 + (contactPurchases.length * 5) + (cycleCount * 10)
        );

        // Detect seasonal patterns
        const monthCounts = new Map<number, number>();
        contactPurchases.forEach(p => {
          const month = new Date(p.purchase_date).getMonth();
          monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
        });
        
        let seasonalPattern: string | undefined;
        const sortedMonths = Array.from(monthCounts.entries()).sort((a, b) => b[1] - a[1]);
        if (sortedMonths.length > 0 && sortedMonths[0][1] >= contactPurchases.length / 4) {
          const peakMonth = sortedMonths[0][0];
          const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
          seasonalPattern = `Pico em ${monthNames[peakMonth]}`;
        }

        contactPatterns.push({
          contactId,
          contactName,
          averageCycleDays,
          lastPurchaseDate,
          nextPredictedPurchase: predictedDate.toISOString(),
          daysSinceLastPurchase,
          daysUntilPredictedPurchase,
          purchaseFrequency,
          totalPurchases: contactPurchases.length,
          totalAmount,
          preferredProducts,
          preferredCategories,
          seasonalPattern,
          isOverdue: daysUntilPredictedPurchase < 0,
          confidence
        });
      });

      // Sort by upcoming purchases (overdue first, then closest)
      contactPatterns.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return a.daysUntilPredictedPurchase - b.daysUntilPredictedPurchase;
      });

      setPatterns(contactPatterns);

      // Analyze category patterns
      const categoryMap = new Map<string, { 
        totalPurchases: number; 
        totalAmount: number; 
        contacts: Map<string, { name: string; count: number }> 
      }>();

      purchases?.forEach(purchase => {
        const category = purchase.product_category || 'Sem categoria';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { totalPurchases: 0, totalAmount: 0, contacts: new Map() });
        }
        const catData = categoryMap.get(category)!;
        catData.totalPurchases++;
        catData.totalAmount += purchase.amount || 0;
        
        const contact = purchase.contacts;
        if (contact) {
          const contactName = `${contact.first_name} ${contact.last_name}`;
          const existing = catData.contacts.get(purchase.contact_id);
          if (existing) {
            existing.count++;
          } else {
            catData.contacts.set(purchase.contact_id, { name: contactName, count: 1 });
          }
        }
      });

      const categories: CategoryPattern[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        totalPurchases: data.totalPurchases,
        totalAmount: data.totalAmount,
        averageAmount: data.totalPurchases > 0 ? data.totalAmount / data.totalPurchases : 0,
        topContacts: Array.from(data.contacts.entries())
          .map(([contactId, { name, count }]) => ({ contactId, contactName: name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      }));

      setCategoryPatterns(categories);

      // Generate predictions for upcoming opportunities
      const upcomingPredictions: PurchasePrediction[] = contactPatterns
        .filter(p => p.daysUntilPredictedPurchase <= 14) // Next 2 weeks
        .map(p => ({
          contactId: p.contactId,
          contactName: p.contactName,
          predictedDate: p.nextPredictedPurchase,
          confidence: p.confidence,
          suggestedProducts: p.preferredProducts,
          reason: p.isOverdue 
            ? `Compra atrasada há ${Math.abs(p.daysUntilPredictedPurchase)} dias`
            : `Baseado em ciclo médio de ${p.averageCycleDays} dias`
        }));

      setPredictions(upcomingPredictions);

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error analyzing purchase patterns:', { error: msg });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    analyzePurchasePatterns();
  }, [analyzePurchasePatterns]);

  // Summary stats
  const stats = useMemo(() => {
    const overdue = patterns.filter(p => p.isOverdue).length;
    const upcomingWeek = patterns.filter(p => !p.isOverdue && p.daysUntilPredictedPurchase <= 7).length;
    const highFrequency = patterns.filter(p => p.purchaseFrequency === 'high').length;
    const totalRevenue = patterns.reduce((sum, p) => sum + p.totalAmount, 0);

    return {
      overdue,
      upcomingWeek,
      highFrequency,
      totalRevenue,
      totalContacts: patterns.length
    };
  }, [patterns]);

  return {
    patterns,
    categoryPatterns,
    predictions,
    stats,
    loading,
    refresh: analyzePurchasePatterns
  };
}

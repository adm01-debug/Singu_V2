import { useMemo } from 'react';
import { useInteractions } from '@/hooks/useInteractions';
import { getHours, getDay } from 'date-fns';

export interface TimeSlot {
  hour: number;
  dayOfWeek: number;
  dayName: string;
  hourLabel: string;
  responseRate: number;
  averageResponseTime: number; // in hours
  interactionCount: number;
  positiveRate: number;
}

export interface ContactTimeAnalysis {
  contactId: string;
  bestDays: { day: string; score: number }[];
  bestHours: { hour: string; score: number }[];
  bestTimeSlots: TimeSlot[];
  worstTimeSlots: TimeSlot[];
  overallPattern: string;
  recommendation: string;
}

const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function useBestTimeToContact(contactId?: string) {
  const { interactions, loading } = useInteractions(contactId);

  const analysis = useMemo(() => {
    if (loading || interactions.length === 0) return null;

    // Group interactions by time slots
    const timeSlotData: Map<string, {
      count: number;
      positiveCount: number;
      totalResponseTime: number;
      responseCount: number;
    }> = new Map();

    interactions.forEach(interaction => {
      const date = new Date(interaction.created_at);
      const hour = getHours(date);
      const dayOfWeek = getDay(date);
      const key = `${dayOfWeek}-${hour}`;

      const existing = timeSlotData.get(key) || {
        count: 0,
        positiveCount: 0,
        totalResponseTime: 0,
        responseCount: 0
      };

      existing.count++;
      if (interaction.sentiment === 'positive') {
        existing.positiveCount++;
      }
      if (interaction.response_time) {
        existing.totalResponseTime += interaction.response_time;
        existing.responseCount++;
      }

      timeSlotData.set(key, existing);
    });

    // Convert to TimeSlot array and calculate scores
    const timeSlots: TimeSlot[] = [];
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 8; hour <= 20; hour++) { // Business hours
        const key = `${day}-${hour}`;
        const data = timeSlotData.get(key);
        
        if (data && data.count > 0) {
          const responseRate = data.responseCount / data.count;
          const averageResponseTime = data.responseCount > 0 
            ? data.totalResponseTime / data.responseCount 
            : 0;
          const positiveRate = data.positiveCount / data.count;

          timeSlots.push({
            hour,
            dayOfWeek: day,
            dayName: dayNames[day],
            hourLabel: `${hour.toString().padStart(2, '0')}:00`,
            responseRate,
            averageResponseTime,
            interactionCount: data.count,
            positiveRate
          });
        }
      }
    }

    // Calculate best time slots (by positive rate and response rate)
    const scoredSlots = timeSlots.map(slot => ({
      ...slot,
      score: (slot.positiveRate * 0.6 + slot.responseRate * 0.4) * Math.log(slot.interactionCount + 1)
    })).sort((a, b) => b.score - a.score);

    const bestTimeSlots = scoredSlots.slice(0, 5);
    const worstTimeSlots = scoredSlots.slice(-3).reverse();

    // Aggregate by day
    const dayScores = dayNames.map((dayName, index) => {
      const daySlots = timeSlots.filter(s => s.dayOfWeek === index);
      const avgScore = daySlots.length > 0
        ? daySlots.reduce((acc, s) => acc + s.positiveRate, 0) / daySlots.length
        : 0;
      return { day: dayName, score: Math.round(avgScore * 100) };
    }).sort((a, b) => b.score - a.score);

    // Aggregate by hour
    const hourScores: Map<number, { total: number; count: number }> = new Map();
    timeSlots.forEach(slot => {
      const existing = hourScores.get(slot.hour) || { total: 0, count: 0 };
      existing.total += slot.positiveRate;
      existing.count++;
      hourScores.set(slot.hour, existing);
    });

    const bestHours = Array.from(hourScores.entries())
      .map(([hour, data]) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        score: Math.round((data.total / data.count) * 100)
      }))
      .sort((a, b) => b.score - a.score);

    // Generate pattern description
    let overallPattern = '';
    if (bestTimeSlots.length > 0) {
      const topDay = bestTimeSlots[0].dayName;
      const topHour = bestTimeSlots[0].hourLabel;
      overallPattern = `Melhor engajamento ${topDay} às ${topHour}`;
    } else {
      overallPattern = 'Dados insuficientes para análise';
    }

    // Generate recommendation
    let recommendation = '';
    if (bestTimeSlots.length >= 3) {
      const morningSlots = bestTimeSlots.filter(s => s.hour < 12).length;
      const afternoonSlots = bestTimeSlots.filter(s => s.hour >= 12 && s.hour < 17).length;
      
      if (morningSlots > afternoonSlots) {
        recommendation = 'Este contato responde melhor pela manhã. Priorize ligações antes do almoço.';
      } else if (afternoonSlots > morningSlots) {
        recommendation = 'Este contato está mais receptivo à tarde. Agende reuniões após 14h.';
      } else {
        recommendation = 'Horários flexíveis funcionam bem com este contato.';
      }
    } else {
      recommendation = 'Continue coletando dados para refinar a análise.';
    }

    return {
      contactId: contactId || 'all',
      bestDays: dayScores.slice(0, 3),
      bestHours: bestHours.slice(0, 3),
      bestTimeSlots,
      worstTimeSlots,
      overallPattern,
      recommendation
    } as ContactTimeAnalysis;
  }, [interactions, loading, contactId]);

  // Global analysis (all contacts)
  const globalPatterns = useMemo(() => {
    if (loading || interactions.length === 0) return null;

    // Aggregate patterns across all interactions
    const hourCounts: number[] = new Array(24).fill(0);
    const dayCounts: number[] = new Array(7).fill(0);
    const hourPositive: number[] = new Array(24).fill(0);
    const dayPositive: number[] = new Array(7).fill(0);

    interactions.forEach(interaction => {
      const date = new Date(interaction.created_at);
      const hour = getHours(date);
      const day = getDay(date);
      
      hourCounts[hour]++;
      dayCounts[day]++;
      
      if (interaction.sentiment === 'positive') {
        hourPositive[hour]++;
        dayPositive[day]++;
      }
    });

    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    const peakDay = dayCounts.indexOf(Math.max(...dayCounts));
    
    const bestHourByPositive = hourPositive.map((p, i) => 
      hourCounts[i] > 0 ? p / hourCounts[i] : 0
    );
    const optimalHour = bestHourByPositive.indexOf(Math.max(...bestHourByPositive));

    return {
      peakActivityHour: `${peakHour.toString().padStart(2, '0')}:00`,
      peakActivityDay: dayNames[peakDay],
      optimalContactHour: `${optimalHour.toString().padStart(2, '0')}:00`,
      hourlyDistribution: hourCounts,
      dailyDistribution: dayCounts.map((count, i) => ({
        day: dayNames[i],
        count,
        positiveRate: count > 0 ? Math.round((dayPositive[i] / count) * 100) : 0
      }))
    };
  }, [interactions, loading]);

  return {
    analysis,
    globalPatterns,
    loading
  };
}

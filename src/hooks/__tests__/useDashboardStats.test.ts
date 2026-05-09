import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDashboardStats } from '../useDashboardStats';
import { subDays, startOfWeek, endOfWeek } from 'date-fns';

describe('useDashboardStats', () => {
  const mockContacts: any[] = [
    { id: '1', first_name: 'John', last_name: 'Doe', relationship_score: 80, created_at: new Date().toISOString() },
    { id: '2', first_name: 'Jane', last_name: 'Smith', relationship_score: 90, created_at: new Date().toISOString() },
  ];

  const mockCompanies: any[] = [
    { id: 'c1', name: 'Acme Corp', created_at: new Date().toISOString() },
  ];

  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });

  const mockInteractions: any[] = [
    { id: 'i1', contact_id: '1', type: 'call', title: 'Call with John', created_at: now.toISOString() },
    { id: 'i2', contact_id: '2', type: 'email', title: 'Email to Jane', created_at: subDays(now, 1).toISOString() },
  ];

  it('should return loading state initially', () => {
    const { result } = renderHook(() => useDashboardStats({ contacts: [], companies: [], interactions: [], loading: true }));
    expect(result.current.loading).toBe(true);
    expect(result.current.totalContacts).toBe(0);
  });

  it('should calculate basic stats correctly', () => {
    const { result } = renderHook(() => useDashboardStats({ 
      contacts: mockContacts, 
      companies: mockCompanies, 
      interactions: mockInteractions, 
      loading: false 
    }));

    expect(result.current.loading).toBe(false);
    expect(result.current.totalContacts).toBe(2);
    expect(result.current.totalCompanies).toBe(1);
    expect(result.current.averageScore).toBe(85); // (80 + 90) / 2
  });

  it('should identify top contacts', () => {
    const { result } = renderHook(() => useDashboardStats({ 
      contacts: mockContacts, 
      companies: mockCompanies, 
      interactions: mockInteractions, 
      loading: false 
    }));

    expect(result.current.topContacts).toHaveLength(2);
    expect(result.current.topContacts[0].firstName).toBe('Jane'); // Higher score
    expect(result.current.topContacts[0].relationshipScore).toBe(90);
  });

  it('should filter out technical names from top contacts', () => {
    const technicalContacts = [
      ...mockContacts,
      { id: '3', first_name: 'Whatsapp', last_name: '1234567890', relationship_score: 100, created_at: new Date().toISOString() },
      { id: '4', first_name: 'Unknown', last_name: 'Contact', relationship_score: 95, created_at: new Date().toISOString() },
    ];

    const { result } = renderHook(() => useDashboardStats({ 
      contacts: technicalContacts, 
      companies: mockCompanies, 
      interactions: mockInteractions, 
      loading: false 
    }));

    // Should only have John and Jane
    expect(result.current.topContacts.find(c => c.firstName === 'Whatsapp')).toBeUndefined();
    expect(result.current.topContacts.find(c => c.firstName === 'Unknown')).toBeUndefined();
  });

  it('should format recent activities correctly', () => {
    const { result } = renderHook(() => useDashboardStats({ 
      contacts: mockContacts, 
      companies: mockCompanies, 
      interactions: mockInteractions, 
      loading: false 
    }));

    expect(result.current.recentActivities).toHaveLength(2);
    expect(result.current.recentActivities[0].entityName).toBe('John Doe');
    expect(result.current.recentActivities[0].type).toBe('call');
  });
});

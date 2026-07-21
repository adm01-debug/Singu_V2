import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from "@/lib/logger";

export interface GraphNode {
  id: string;
  name: string;
  type: 'contact' | 'company' | 'you';
  val: number; // Node size
  color: string;
  relationshipScore?: number;
  role?: string;
  industry?: string;
  interactionCount?: number;
  avatar?: string;
  // These are added by the force graph library
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  value: number; // Link strength
  type: 'works_at' | 'interacted' | 'connected';
  interactionCount?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface NetworkStats {
  totalNodes: number;
  totalLinks: number;
  avgConnections: number;
  topInfluencers: Array<{ id: string; name: string; connections: number }>;
  clusters: number;
}

const NODE_COLORS = {
  you: '#3b82f6', // blue
  company: '#8b5cf6', // purple
  contact_high: '#22c55e', // green - high relationship
  contact_medium: '#eab308', // yellow - medium relationship
  contact_low: '#ef4444', // red - low relationship
};

export function useNetworkGraph() {
  const { user } = useAuth();
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const fetchGraphData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // All 3 queries are independent — fetch in parallel
      const [
        { data: companies, error: companiesError },
        { data: contacts, error: contactsError },
        { data: interactions, error: interactionsError },
      ] = await Promise.all([
        supabase.from('companies').select('id, name, industry, logo_url').limit(500),
        supabase.from('contacts').select('id, first_name, last_name, company_id, relationship_score, role, avatar_url').limit(1000),
        supabase.from('interactions').select('id, contact_id, company_id, created_at').limit(5000),
      ]);

      if (companiesError) throw companiesError;
      if (contactsError) throw contactsError;
      if (interactionsError) throw interactionsError;

      // Count interactions per contact
      const contactInteractions = new Map<string, number>();

      interactions?.forEach(interaction => {
        const count = contactInteractions.get(interaction.contact_id) || 0;
        contactInteractions.set(interaction.contact_id, count + 1);
      });

      // Build nodes
      const nodes: GraphNode[] = [];
      
      // Add "You" node (central node)
      nodes.push({
        id: 'you',
        name: 'Você',
        type: 'you',
        val: 25,
        color: NODE_COLORS.you,
      });

      // Add company nodes
      companies?.forEach(company => {
        nodes.push({
          id: `company-${company.id}`,
          name: company.name,
          type: 'company',
          val: 15,
          color: NODE_COLORS.company,
          industry: company.industry || undefined,
        });
      });

      // Add contact nodes
      contacts?.forEach(contact => {
        const score = contact.relationship_score || 50;
        const interactionCount = contactInteractions.get(contact.id) || 0;
        
        let color = NODE_COLORS.contact_low;
        if (score >= 70) color = NODE_COLORS.contact_high;
        else if (score >= 40) color = NODE_COLORS.contact_medium;

        nodes.push({
          id: `contact-${contact.id}`,
          name: `${contact.first_name} ${contact.last_name}`,
          type: 'contact',
          val: 8 + Math.min(interactionCount * 2, 12), // Size based on interactions
          color,
          relationshipScore: score,
          role: contact.role || undefined,
          interactionCount,
          avatar: contact.avatar_url || undefined,
        });
      });

      // Build links
      const links: GraphLink[] = [];

      // Links from You to contacts (based on interactions)
      contacts?.forEach(contact => {
        const interactionCount = contactInteractions.get(contact.id) || 0;
        if (interactionCount > 0) {
          links.push({
            source: 'you',
            target: `contact-${contact.id}`,
            value: Math.min(1 + interactionCount * 0.5, 5),
            type: 'interacted',
            interactionCount,
          });
        }
      });

      // Links from contacts to companies
      contacts?.forEach(contact => {
        if (contact.company_id) {
          links.push({
            source: `contact-${contact.id}`,
            target: `company-${contact.company_id}`,
            value: 2,
            type: 'works_at',
          });
        }
      });

      // Links between contacts in the same company (indicates potential connection)
      const contactsByCompany = new Map<string, string[]>();
      contacts?.forEach(contact => {
        if (contact.company_id) {
          const existing = contactsByCompany.get(contact.company_id) || [];
          existing.push(contact.id);
          contactsByCompany.set(contact.company_id, existing);
        }
      });

      contactsByCompany.forEach((contactIds) => {
        if (contactIds.length > 1) {
          for (let i = 0; i < contactIds.length; i++) {
            for (let j = i + 1; j < contactIds.length; j++) {
              links.push({
                source: `contact-${contactIds[i]}`,
                target: `contact-${contactIds[j]}`,
                value: 1,
                type: 'connected',
              });
            }
          }
        }
      });

      setGraphData({ nodes, links });
    } catch (err) {
      logger.error('Error fetching graph data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  const stats = useMemo<NetworkStats>(() => {
    const { nodes, links } = graphData;
    
    // Count connections per node
    const connectionCount = new Map<string, number>();
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as GraphNode).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as GraphNode).id;
      
      connectionCount.set(sourceId, (connectionCount.get(sourceId) || 0) + 1);
      connectionCount.set(targetId, (connectionCount.get(targetId) || 0) + 1);
    });

    // Find top influencers (most connected contacts)
    const contactNodes = nodes.filter(n => n.type === 'contact');
    const topInfluencers = contactNodes
      .map(node => ({
        id: node.id,
        name: node.name,
        connections: connectionCount.get(node.id) || 0,
      }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 5);

    // Estimate clusters (companies with contacts)
    const companyNodes = nodes.filter(n => n.type === 'company');
    const clusters = companyNodes.filter(company => 
      links.some(link => {
        const targetId = typeof link.target === 'string' ? link.target : (link.target as GraphNode).id;
        return targetId === company.id;
      })
    ).length;

    return {
      totalNodes: nodes.length,
      totalLinks: links.length,
      avgConnections: nodes.length > 0 
        ? Math.round((links.length * 2) / nodes.length * 10) / 10 
        : 0,
      topInfluencers,
      clusters: Math.max(clusters, 1),
    };
  }, [graphData]);

  return {
    graphData,
    loading,
    error,
    selectedNode,
    setSelectedNode,
    stats,
    refetch: fetchGraphData,
  };
}
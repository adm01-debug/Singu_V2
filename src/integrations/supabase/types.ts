export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      abm_account_plans: {
        Row: {
          account_id: string
          created_at: string
          end_date: string | null
          goal: string | null
          id: string
          key_stakeholders: Json
          milestones: Json
          objectives: Json
          start_date: string | null
          status: string
          strategies: Json
          target_revenue: number | null
          template_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          end_date?: string | null
          goal?: string | null
          id?: string
          key_stakeholders?: Json
          milestones?: Json
          objectives?: Json
          start_date?: string | null
          status?: string
          strategies?: Json
          target_revenue?: number | null
          template_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          end_date?: string | null
          goal?: string | null
          id?: string
          key_stakeholders?: Json
          milestones?: Json
          objectives?: Json
          start_date?: string | null
          status?: string
          strategies?: Json
          target_revenue?: number | null
          template_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "abm_account_plans_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "abm_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      abm_accounts: {
        Row: {
          account_score: number
          assigned_to: string | null
          company_name: string
          created_at: string
          external_company_id: string
          id: string
          last_scored_at: string | null
          notes: string | null
          parent_account_id: string | null
          score_breakdown: Json
          status: string
          target_revenue: number | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_score?: number
          assigned_to?: string | null
          company_name: string
          created_at?: string
          external_company_id: string
          id?: string
          last_scored_at?: string | null
          notes?: string | null
          parent_account_id?: string | null
          score_breakdown?: Json
          status?: string
          target_revenue?: number | null
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_score?: number
          assigned_to?: string | null
          company_name?: string
          created_at?: string
          external_company_id?: string
          id?: string
          last_scored_at?: string | null
          notes?: string | null
          parent_account_id?: string | null
          score_breakdown?: Json
          status?: string
          target_revenue?: number | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "abm_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "abm_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      abm_buying_committee: {
        Row: {
          account_id: string
          committee_role: string
          contact_email: string | null
          contact_name: string
          contact_role: string | null
          created_at: string
          engagement_score: number
          external_contact_id: string | null
          id: string
          influence_level: number
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          committee_role: string
          contact_email?: string | null
          contact_name: string
          contact_role?: string | null
          created_at?: string
          engagement_score?: number
          external_contact_id?: string | null
          id?: string
          influence_level?: number
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          committee_role?: string
          contact_email?: string | null
          contact_name?: string
          contact_role?: string | null
          created_at?: string
          engagement_score?: number
          external_contact_id?: string | null
          id?: string
          influence_level?: number
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "abm_buying_committee_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "abm_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      abm_campaigns: {
        Row: {
          budget: number | null
          campaign_type: string
          channels: string[]
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          metrics: Json
          name: string
          start_date: string | null
          status: string
          target_account_ids: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: number | null
          campaign_type: string
          channels?: string[]
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          metrics?: Json
          name: string
          start_date?: string | null
          status?: string
          target_account_ids?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: number | null
          campaign_type?: string
          channels?: string[]
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          metrics?: Json
          name?: string
          start_date?: string | null
          status?: string
          target_account_ids?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      abm_whitespace_opportunities: {
        Row: {
          account_id: string
          confidence: number
          created_at: string
          estimated_value: number | null
          id: string
          identified_at: string
          opportunity_type: string
          product_category: string
          rationale: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          confidence?: number
          created_at?: string
          estimated_value?: number | null
          id?: string
          identified_at?: string
          opportunity_type: string
          product_category: string
          rationale?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          confidence?: number
          created_at?: string
          estimated_value?: number | null
          id?: string
          identified_at?: string
          opportunity_type?: string
          product_category?: string
          rationale?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "abm_whitespace_opportunities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "abm_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      access_blocked_log: {
        Row: {
          city: string | null
          country_code: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          reason: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          reason: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          reason?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      access_security_settings: {
        Row: {
          created_at: string | null
          enable_device_detection: boolean | null
          enable_geo_blocking: boolean | null
          enable_ip_restriction: boolean | null
          id: string
          max_sessions: number | null
          notify_new_device: boolean | null
          session_timeout_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enable_device_detection?: boolean | null
          enable_geo_blocking?: boolean | null
          enable_ip_restriction?: boolean | null
          id?: string
          max_sessions?: number | null
          notify_new_device?: boolean | null
          session_timeout_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enable_device_detection?: boolean | null
          enable_geo_blocking?: boolean | null
          enable_ip_restriction?: boolean | null
          id?: string
          max_sessions?: number | null
          notify_new_device?: boolean | null
          session_timeout_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          created_at: string
          description: string | null
          entity_id: string
          entity_name: string | null
          entity_type: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entity_id: string
          entity_name?: string | null
          entity_type: string
          id?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entity_id?: string
          entity_name?: string | null
          entity_type?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          thread_id: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          thread_id: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          thread_id?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_threads: {
        Row: {
          archived: boolean
          context_entity_id: string | null
          context_entity_type: string | null
          created_at: string
          id: string
          last_message_at: string
          pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          context_entity_id?: string | null
          context_entity_type?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          context_entity_id?: string | null
          context_entity_type?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_recommendation_audit_logs: {
        Row: {
          contact_id: string
          created_at: string | null
          data_used: Json | null
          id: string
          reasons: string[]
          recommendation_type: string
          score: number
          user_action: string | null
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          data_used?: Json | null
          id?: string
          reasons?: string[]
          recommendation_type: string
          score: number
          user_action?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          data_used?: Json | null
          id?: string
          reasons?: string[]
          recommendation_type?: string
          score?: number
          user_action?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendation_audit_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendation_logs: {
        Row: {
          action_timestamp: string | null
          contact_id: string
          created_at: string | null
          id: string
          input_data_snapshot: Json
          recommendation_reasons: Json
          recommendation_score: number
          user_action: string | null
          user_id: string
        }
        Insert: {
          action_timestamp?: string | null
          contact_id: string
          created_at?: string | null
          id?: string
          input_data_snapshot: Json
          recommendation_reasons: Json
          recommendation_score: number
          user_action?: string | null
          user_id: string
        }
        Update: {
          action_timestamp?: string | null
          contact_id?: string
          created_at?: string | null
          id?: string
          input_data_snapshot?: Json
          recommendation_reasons?: Json
          recommendation_score?: number
          user_action?: string | null
          user_id?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          action_url: string | null
          contact_id: string | null
          created_at: string
          description: string | null
          dismissed: boolean | null
          expires_at: string | null
          id: string
          priority: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          dismissed?: boolean | null
          expires_at?: string | null
          id?: string
          priority?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          dismissed?: boolean | null
          expires_at?: string | null
          id?: string
          priority?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      applied_objection_responses: {
        Row: {
          applied_at: string
          category: string | null
          created_at: string
          id: string
          interaction_id: string | null
          note: string | null
          objection: string
          response_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          category?: string | null
          created_at?: string
          id?: string
          interaction_id?: string | null
          note?: string | null
          objection: string
          response_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string
          category?: string | null
          created_at?: string
          id?: string
          interaction_id?: string | null
          note?: string | null
          objection?: string
          response_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      attribution_models_cache: {
        Row: {
          allocations: Json
          computed_at: string
          deal_id: string
          id: string
          model: string
          total_value: number
          user_id: string
        }
        Insert: {
          allocations?: Json
          computed_at?: string
          deal_id: string
          id?: string
          model: string
          total_value?: number
          user_id: string
        }
        Update: {
          allocations?: Json
          computed_at?: string
          deal_id?: string
          id?: string
          model?: string
          total_value?: number
          user_id?: string
        }
        Relationships: []
      }
      attribution_touchpoints: {
        Row: {
          campaign: string | null
          contact_id: string | null
          content: string | null
          created_at: string
          deal_id: string | null
          id: string
          medium: string | null
          metadata: Json
          occurred_at: string
          page_url: string | null
          source: string | null
          term: string | null
          touchpoint_type: string
          user_id: string
          value_attributed: number
        }
        Insert: {
          campaign?: string | null
          contact_id?: string | null
          content?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          medium?: string | null
          metadata?: Json
          occurred_at?: string
          page_url?: string | null
          source?: string | null
          term?: string | null
          touchpoint_type: string
          user_id: string
          value_attributed?: number
        }
        Update: {
          campaign?: string | null
          contact_id?: string | null
          content?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          medium?: string | null
          metadata?: Json
          occurred_at?: string
          page_url?: string | null
          source?: string | null
          term?: string | null
          touchpoint_type?: string
          user_id?: string
          value_attributed?: number
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          new_data: Json | null
          old_data: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          actions_executed: Json
          error_message: string | null
          executed_at: string
          id: string
          rule_id: string
          success: boolean
          trigger_entity_id: string
          trigger_entity_type: string
          user_id: string
        }
        Insert: {
          actions_executed?: Json
          error_message?: string | null
          executed_at?: string
          id?: string
          rule_id: string
          success?: boolean
          trigger_entity_id: string
          trigger_entity_type: string
          user_id: string
        }
        Update: {
          actions_executed?: Json
          error_message?: string | null
          executed_at?: string
          id?: string
          rule_id?: string
          success?: boolean
          trigger_entity_id?: string
          trigger_entity_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          description: string | null
          execution_count: number
          id: string
          is_active: boolean
          last_error: string | null
          last_executed_at: string | null
          name: string
          trigger_config: Json
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          description?: string | null
          execution_count?: number
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_executed_at?: string | null
          name: string
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          description?: string | null
          execution_count?: number
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_executed_at?: string | null
          name?: string
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      battle_cards: {
        Row: {
          active: boolean
          competitor_logo_url: string | null
          competitor_name: string
          created_at: string
          id: string
          landmines: string[]
          last_updated_by: string | null
          our_strengths: Json
          pricing_comparison: string | null
          proof_points: Json
          summary: string | null
          their_strengths: Json
          updated_at: string
          user_id: string
          version: number
          weaknesses: Json
          win_themes: string[]
        }
        Insert: {
          active?: boolean
          competitor_logo_url?: string | null
          competitor_name: string
          created_at?: string
          id?: string
          landmines?: string[]
          last_updated_by?: string | null
          our_strengths?: Json
          pricing_comparison?: string | null
          proof_points?: Json
          summary?: string | null
          their_strengths?: Json
          updated_at?: string
          user_id: string
          version?: number
          weaknesses?: Json
          win_themes?: string[]
        }
        Update: {
          active?: boolean
          competitor_logo_url?: string | null
          competitor_name?: string
          created_at?: string
          id?: string
          landmines?: string[]
          last_updated_by?: string | null
          our_strengths?: Json
          pricing_comparison?: string | null
          proof_points?: Json
          summary?: string | null
          their_strengths?: Json
          updated_at?: string
          user_id?: string
          version?: number
          weaknesses?: Json
          win_themes?: string[]
        }
        Relationships: []
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          contact_id: string
          created_at: string
          email: string
          id: string
          opened_at: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          contact_id: string
          created_at?: string
          email: string
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          contact_id?: string
          created_at?: string
          email?: string
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      canned_responses: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          shortcut: string | null
          title: string
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          shortcut?: string | null
          title: string
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          shortcut?: string | null
          title?: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      churn_risk_scores: {
        Row: {
          analyzed_at: string
          contact_id: string
          created_at: string
          days_since_last_interaction: number | null
          expires_at: string
          id: string
          recommendations: string[] | null
          risk_factors: Json
          risk_level: string
          risk_score: number
          score_trend: string | null
          sentiment_trend: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analyzed_at?: string
          contact_id: string
          created_at?: string
          days_since_last_interaction?: number | null
          expires_at?: string
          id?: string
          recommendations?: string[] | null
          risk_factors?: Json
          risk_level?: string
          risk_score?: number
          score_trend?: string | null
          sentiment_trend?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analyzed_at?: string
          contact_id?: string
          created_at?: string
          days_since_last_interaction?: number | null
          expires_at?: string
          id?: string
          recommendations?: string[] | null
          risk_factors?: Json
          risk_level?: string
          risk_score?: number
          score_trend?: string | null
          sentiment_trend?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "churn_risk_scores_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      city_whitelist: {
        Row: {
          city: string
          country_code: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          state: string | null
          user_id: string
        }
        Insert: {
          city: string
          country_code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          state?: string | null
          user_id: string
        }
        Update: {
          city?: string
          country_code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          state?: string | null
          user_id?: string
        }
        Relationships: []
      }
      client_values: {
        Row: {
          category: string
          contact_id: string
          created_at: string
          detected_phrases: string[] | null
          frequency: number | null
          id: string
          importance: number | null
          last_mentioned: string | null
          updated_at: string
          user_id: string
          value_name: string
        }
        Insert: {
          category: string
          contact_id: string
          created_at?: string
          detected_phrases?: string[] | null
          frequency?: number | null
          id?: string
          importance?: number | null
          last_mentioned?: string | null
          updated_at?: string
          user_id: string
          value_name: string
        }
        Update: {
          category?: string
          contact_id?: string
          created_at?: string
          detected_phrases?: string[] | null
          frequency?: number | null
          id?: string
          importance?: number | null
          last_mentioned?: string | null
          updated_at?: string
          user_id?: string
          value_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_values_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_scorecards: {
        Row: {
          active: boolean
          created_at: string
          criteria: Json
          description: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          criteria?: Json
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          criteria?: Json
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cognitive_bias_history: {
        Row: {
          analyzed_at: string
          category_distribution: Json | null
          contact_id: string
          created_at: string
          detected_biases: Json
          dominant_biases: string[] | null
          id: string
          interaction_id: string | null
          profile_summary: string | null
          resistances: string[] | null
          sales_strategies: Json | null
          user_id: string
          vulnerabilities: string[] | null
        }
        Insert: {
          analyzed_at?: string
          category_distribution?: Json | null
          contact_id: string
          created_at?: string
          detected_biases: Json
          dominant_biases?: string[] | null
          id?: string
          interaction_id?: string | null
          profile_summary?: string | null
          resistances?: string[] | null
          sales_strategies?: Json | null
          user_id: string
          vulnerabilities?: string[] | null
        }
        Update: {
          analyzed_at?: string
          category_distribution?: Json | null
          contact_id?: string
          created_at?: string
          detected_biases?: Json
          dominant_biases?: string[] | null
          id?: string
          interaction_id?: string | null
          profile_summary?: string | null
          resistances?: string[] | null
          sales_strategies?: Json | null
          user_id?: string
          vulnerabilities?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "cognitive_bias_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cognitive_bias_history_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_preferences: {
        Row: {
          avoid_days: string[] | null
          contact_frequency: string | null
          contact_id: string
          created_at: string
          id: string
          notes: string | null
          preferred_channel: string
          preferred_days: string[] | null
          preferred_time_end: string | null
          preferred_time_start: string | null
          response_rate_by_channel: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avoid_days?: string[] | null
          contact_frequency?: string | null
          contact_id: string
          created_at?: string
          id?: string
          notes?: string | null
          preferred_channel?: string
          preferred_days?: string[] | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          response_rate_by_channel?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avoid_days?: string[] | null
          contact_frequency?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          preferred_channel?: string
          preferred_days?: string[] | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          response_rate_by_channel?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_preferences_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          annual_revenue: string | null
          bitrix_company_id: number | null
          capital_social: number | null
          central_id: string | null
          challenges: string[] | null
          city: string | null
          cnpj: string | null
          cnpj_base: string | null
          competitors: string[] | null
          confederacao_id: string | null
          cores_marca: string | null
          created_at: string
          data_fundacao: string | null
          email: string | null
          employee_count: string | null
          extra_data_rf: Json | null
          facebook: string | null
          financial_health: string | null
          grupo_economico: string | null
          grupo_economico_id: string | null
          id: string
          industry: string | null
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          instagram: string | null
          is_carrier: boolean | null
          is_customer: boolean | null
          is_matriz: boolean | null
          is_supplier: boolean | null
          lat: number | null
          linkedin: string | null
          lng: number | null
          logo_url: string | null
          matriz_id: string | null
          name: string
          natureza_juridica: string | null
          natureza_juridica_desc: string | null
          nicho_cliente: string | null
          nome_crm: string | null
          nome_fantasia: string | null
          notes: string | null
          numero_cooperativa: string | null
          phone: string | null
          porte_rf: string | null
          ramo_atividade: string | null
          razao_social: string | null
          search_vector: unknown
          singular_id: string | null
          situacao_rf: string | null
          situacao_rf_data: string | null
          state: string | null
          status: string | null
          tags: string[] | null
          tiktok: string | null
          tipo_cooperativa: string | null
          twitter: string | null
          updated_at: string
          user_id: string
          version: number
          website: string | null
          youtube: string | null
        }
        Insert: {
          address?: string | null
          annual_revenue?: string | null
          bitrix_company_id?: number | null
          capital_social?: number | null
          central_id?: string | null
          challenges?: string[] | null
          city?: string | null
          cnpj?: string | null
          cnpj_base?: string | null
          competitors?: string[] | null
          confederacao_id?: string | null
          cores_marca?: string | null
          created_at?: string
          data_fundacao?: string | null
          email?: string | null
          employee_count?: string | null
          extra_data_rf?: Json | null
          facebook?: string | null
          financial_health?: string | null
          grupo_economico?: string | null
          grupo_economico_id?: string | null
          id?: string
          industry?: string | null
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          instagram?: string | null
          is_carrier?: boolean | null
          is_customer?: boolean | null
          is_matriz?: boolean | null
          is_supplier?: boolean | null
          lat?: number | null
          linkedin?: string | null
          lng?: number | null
          logo_url?: string | null
          matriz_id?: string | null
          name: string
          natureza_juridica?: string | null
          natureza_juridica_desc?: string | null
          nicho_cliente?: string | null
          nome_crm?: string | null
          nome_fantasia?: string | null
          notes?: string | null
          numero_cooperativa?: string | null
          phone?: string | null
          porte_rf?: string | null
          ramo_atividade?: string | null
          razao_social?: string | null
          search_vector?: unknown
          singular_id?: string | null
          situacao_rf?: string | null
          situacao_rf_data?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          tiktok?: string | null
          tipo_cooperativa?: string | null
          twitter?: string | null
          updated_at?: string
          user_id: string
          version?: number
          website?: string | null
          youtube?: string | null
        }
        Update: {
          address?: string | null
          annual_revenue?: string | null
          bitrix_company_id?: number | null
          capital_social?: number | null
          central_id?: string | null
          challenges?: string[] | null
          city?: string | null
          cnpj?: string | null
          cnpj_base?: string | null
          competitors?: string[] | null
          confederacao_id?: string | null
          cores_marca?: string | null
          created_at?: string
          data_fundacao?: string | null
          email?: string | null
          employee_count?: string | null
          extra_data_rf?: Json | null
          facebook?: string | null
          financial_health?: string | null
          grupo_economico?: string | null
          grupo_economico_id?: string | null
          id?: string
          industry?: string | null
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          instagram?: string | null
          is_carrier?: boolean | null
          is_customer?: boolean | null
          is_matriz?: boolean | null
          is_supplier?: boolean | null
          lat?: number | null
          linkedin?: string | null
          lng?: number | null
          logo_url?: string | null
          matriz_id?: string | null
          name?: string
          natureza_juridica?: string | null
          natureza_juridica_desc?: string | null
          nicho_cliente?: string | null
          nome_crm?: string | null
          nome_fantasia?: string | null
          notes?: string | null
          numero_cooperativa?: string | null
          phone?: string | null
          porte_rf?: string | null
          ramo_atividade?: string | null
          razao_social?: string | null
          search_vector?: unknown
          singular_id?: string | null
          situacao_rf?: string | null
          situacao_rf_data?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          tiktok?: string | null
          tipo_cooperativa?: string | null
          twitter?: string | null
          updated_at?: string
          user_id?: string
          version?: number
          website?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      compatibility_alerts: {
        Row: {
          alert_type: string
          compatibility_score: number
          contact_id: string | null
          created_at: string
          description: string | null
          dismissed: boolean | null
          expires_at: string | null
          id: string
          threshold: number
          title: string
          user_id: string
        }
        Insert: {
          alert_type?: string
          compatibility_score: number
          contact_id?: string | null
          created_at?: string
          description?: string | null
          dismissed?: boolean | null
          expires_at?: string | null
          id?: string
          threshold: number
          title: string
          user_id: string
        }
        Update: {
          alert_type?: string
          compatibility_score?: number
          contact_id?: string | null
          created_at?: string
          description?: string | null
          dismissed?: boolean | null
          expires_at?: string | null
          id?: string
          threshold?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compatibility_alerts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      compatibility_settings: {
        Row: {
          alert_only_important: boolean | null
          alert_threshold: number
          created_at: string
          email_notifications: boolean | null
          id: string
          important_min_relationship_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_only_important?: boolean | null
          alert_threshold?: number
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          important_min_relationship_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_only_important?: boolean | null
          alert_threshold?: number
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          important_min_relationship_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      competitors: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          notes: string | null
          strengths: string[] | null
          typical_price_range: string | null
          updated_at: string
          user_id: string
          weaknesses: string[] | null
          website: string | null
          win_rate_against: number | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          strengths?: string[] | null
          typical_price_range?: string | null
          updated_at?: string
          user_id: string
          weaknesses?: string[] | null
          website?: string | null
          win_rate_against?: number | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          strengths?: string[] | null
          typical_price_range?: string | null
          updated_at?: string
          user_id?: string
          weaknesses?: string[] | null
          website?: string | null
          win_rate_against?: number | null
        }
        Relationships: []
      }
      connection_anomalies: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          anomaly_type: string
          confidence: number | null
          connection_id: string | null
          created_at: string
          detected_at: string
          explanation: string
          id: string
          metrics: Json
          model_used: string | null
          severity: string
          webhook_id: string | null
          window_end: string
          window_start: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          anomaly_type: string
          confidence?: number | null
          connection_id?: string | null
          created_at?: string
          detected_at?: string
          explanation: string
          id?: string
          metrics?: Json
          model_used?: string | null
          severity?: string
          webhook_id?: string | null
          window_end: string
          window_start: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          anomaly_type?: string
          confidence?: number | null
          connection_id?: string | null
          created_at?: string
          detected_at?: string
          explanation?: string
          id?: string
          metrics?: Json
          model_used?: string | null
          severity?: string
          webhook_id?: string | null
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_anomalies_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connection_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_anomalies_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "incoming_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_configs: {
        Row: {
          config: Json
          connection_type: string
          created_at: string
          created_by: string
          description: string | null
          discovered_at: string | null
          discovered_schema: Json | null
          encrypted_config: string | null
          encryption_version: number
          id: string
          is_active: boolean
          last_test_latency_ms: number | null
          last_test_message: string | null
          last_test_status: string | null
          last_tested_at: string | null
          name: string
          secret_refs: Json
          updated_at: string
        }
        Insert: {
          config?: Json
          connection_type: string
          created_at?: string
          created_by: string
          description?: string | null
          discovered_at?: string | null
          discovered_schema?: Json | null
          encrypted_config?: string | null
          encryption_version?: number
          id?: string
          is_active?: boolean
          last_test_latency_ms?: number | null
          last_test_message?: string | null
          last_test_status?: string | null
          last_tested_at?: string | null
          name: string
          secret_refs?: Json
          updated_at?: string
        }
        Update: {
          config?: Json
          connection_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          discovered_at?: string | null
          discovered_schema?: Json | null
          encrypted_config?: string | null
          encryption_version?: number
          id?: string
          is_active?: boolean
          last_test_latency_ms?: number | null
          last_test_message?: string | null
          last_test_status?: string | null
          last_tested_at?: string | null
          name?: string
          secret_refs?: Json
          updated_at?: string
        }
        Relationships: []
      }
      connection_quotas: {
        Row: {
          alert_sent_80: boolean
          calls_limit: number
          calls_used: number
          created_at: string
          id: string
          overage_blocked: boolean
          period_start: string
          updated_at: string
          webhook_id: string
        }
        Insert: {
          alert_sent_80?: boolean
          calls_limit?: number
          calls_used?: number
          created_at?: string
          id?: string
          overage_blocked?: boolean
          period_start?: string
          updated_at?: string
          webhook_id: string
        }
        Update: {
          alert_sent_80?: boolean
          calls_limit?: number
          calls_used?: number
          created_at?: string
          id?: string
          overage_blocked?: boolean
          period_start?: string
          updated_at?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_quotas_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "incoming_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_test_logs: {
        Row: {
          connection_id: string
          created_at: string
          details: Json | null
          id: string
          latency_ms: number | null
          message: string | null
          status: string
          tested_by: string | null
        }
        Insert: {
          connection_id: string
          created_at?: string
          details?: Json | null
          id?: string
          latency_ms?: number | null
          message?: string | null
          status: string
          tested_by?: string | null
        }
        Update: {
          connection_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          latency_ms?: number | null
          message?: string | null
          status?: string
          tested_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_test_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connection_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_cadence: {
        Row: {
          auto_remind: boolean | null
          cadence_days: number
          contact_id: string
          created_at: string
          id: string
          last_contact_at: string | null
          next_contact_due: string | null
          notes: string | null
          priority: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_remind?: boolean | null
          cadence_days?: number
          contact_id: string
          created_at?: string
          id?: string
          last_contact_at?: string | null
          next_contact_due?: string | null
          notes?: string | null
          priority?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_remind?: boolean | null
          cadence_days?: number
          contact_id?: string
          created_at?: string
          id?: string
          last_contact_at?: string | null
          next_contact_due?: string | null
          notes?: string | null
          priority?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_cadence_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_next_actions: {
        Row: {
          action: string
          channel: string
          contact_id: string
          created_at: string
          expected_outcome: string | null
          generated_at: string
          id: string
          model: string | null
          reason: string
          signals_snapshot: Json
          suggested_script: string | null
          updated_at: string
          urgency: string
          user_id: string
        }
        Insert: {
          action: string
          channel: string
          contact_id: string
          created_at?: string
          expected_outcome?: string | null
          generated_at?: string
          id?: string
          model?: string | null
          reason: string
          signals_snapshot?: Json
          suggested_script?: string | null
          updated_at?: string
          urgency?: string
          user_id: string
        }
        Update: {
          action?: string
          channel?: string
          contact_id?: string
          created_at?: string
          expected_outcome?: string | null
          generated_at?: string
          id?: string
          model?: string | null
          reason?: string
          signals_snapshot?: Json
          suggested_script?: string | null
          updated_at?: string
          urgency?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_next_actions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_preferences: {
        Row: {
          avoid_days: string[] | null
          avoid_times: string[] | null
          communication_tips: string | null
          contact_id: string
          created_at: string
          id: string
          personal_notes: string | null
          preferred_channel: string | null
          preferred_days: string[] | null
          preferred_times: string[] | null
          restrictions: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avoid_days?: string[] | null
          avoid_times?: string[] | null
          communication_tips?: string | null
          contact_id: string
          created_at?: string
          id?: string
          personal_notes?: string | null
          preferred_channel?: string | null
          preferred_days?: string[] | null
          preferred_times?: string[] | null
          restrictions?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avoid_days?: string[] | null
          avoid_times?: string[] | null
          communication_tips?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          personal_notes?: string | null
          preferred_channel?: string | null
          preferred_days?: string[] | null
          preferred_times?: string[] | null
          restrictions?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_preferences_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_relatives: {
        Row: {
          age: number | null
          birthday: string | null
          company: string | null
          contact_id: string
          created_at: string
          email: string | null
          id: string
          is_decision_influencer: boolean | null
          name: string
          notes: string | null
          occupation: string | null
          phone: string | null
          relationship_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          birthday?: string | null
          company?: string | null
          contact_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_decision_influencer?: boolean | null
          name: string
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          relationship_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          birthday?: string | null
          company?: string | null
          contact_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_decision_influencer?: boolean | null
          name?: string
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          relationship_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_time_analysis: {
        Row: {
          avg_response_time_minutes: number | null
          contact_id: string
          day_of_week: number
          hour_of_day: number
          id: string
          last_updated: string
          success_count: number | null
          total_attempts: number | null
          user_id: string
        }
        Insert: {
          avg_response_time_minutes?: number | null
          contact_id: string
          day_of_week: number
          hour_of_day: number
          id?: string
          last_updated?: string
          success_count?: number | null
          total_attempts?: number | null
          user_id: string
        }
        Update: {
          avg_response_time_minutes?: number | null
          contact_id?: string
          day_of_week?: number
          hour_of_day?: number
          id?: string
          last_updated?: string
          success_count?: number | null
          total_attempts?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_time_analysis_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          avatar_url: string | null
          behavior: Json | null
          birthday: string | null
          company_id: string | null
          created_at: string
          email: string | null
          family_info: string | null
          first_name: string
          hobbies: string[] | null
          id: string
          instagram: string | null
          interests: string[] | null
          last_name: string
          life_events: Json | null
          linkedin: string | null
          notes: string | null
          personal_notes: string | null
          phone: string | null
          relationship_score: number | null
          relationship_stage: string | null
          role: string | null
          role_title: string | null
          sentiment: string | null
          tags: string[] | null
          twitter: string | null
          updated_at: string
          user_id: string
          version: number
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          behavior?: Json | null
          birthday?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          family_info?: string | null
          first_name: string
          hobbies?: string[] | null
          id?: string
          instagram?: string | null
          interests?: string[] | null
          last_name: string
          life_events?: Json | null
          linkedin?: string | null
          notes?: string | null
          personal_notes?: string | null
          phone?: string | null
          relationship_score?: number | null
          relationship_stage?: string | null
          role?: string | null
          role_title?: string | null
          sentiment?: string | null
          tags?: string[] | null
          twitter?: string | null
          updated_at?: string
          user_id: string
          version?: number
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          behavior?: Json | null
          birthday?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          family_info?: string | null
          first_name?: string
          hobbies?: string[] | null
          id?: string
          instagram?: string | null
          interests?: string[] | null
          last_name?: string
          life_events?: Json | null
          linkedin?: string | null
          notes?: string | null
          personal_notes?: string | null
          phone?: string | null
          relationship_score?: number | null
          relationship_stage?: string | null
          role?: string | null
          role_title?: string | null
          sentiment?: string | null
          tags?: string[] | null
          twitter?: string | null
          updated_at?: string
          user_id?: string
          version?: number
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_analyses: {
        Row: {
          action_items: Json
          analyzed_at: string
          coaching_score: number | null
          coaching_tips: string[]
          contact_id: string | null
          created_at: string
          deal_id: string | null
          duration_seconds: number | null
          id: string
          interaction_id: string
          key_moments: Json
          longest_monologue_seconds: number | null
          model_used: string | null
          next_best_action: string | null
          objections: Json
          questions_asked: number | null
          sentiment_overall: string | null
          sentiment_timeline: Json
          talk_ratio_customer: number | null
          talk_ratio_rep: number | null
          topics: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          action_items?: Json
          analyzed_at?: string
          coaching_score?: number | null
          coaching_tips?: string[]
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          duration_seconds?: number | null
          id?: string
          interaction_id: string
          key_moments?: Json
          longest_monologue_seconds?: number | null
          model_used?: string | null
          next_best_action?: string | null
          objections?: Json
          questions_asked?: number | null
          sentiment_overall?: string | null
          sentiment_timeline?: Json
          talk_ratio_customer?: number | null
          talk_ratio_rep?: number | null
          topics?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          action_items?: Json
          analyzed_at?: string
          coaching_score?: number | null
          coaching_tips?: string[]
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          duration_seconds?: number | null
          id?: string
          interaction_id?: string
          key_moments?: Json
          longest_monologue_seconds?: number | null
          model_used?: string | null
          next_best_action?: string | null
          objections?: Json
          questions_asked?: number | null
          sentiment_overall?: string | null
          sentiment_timeline?: Json
          talk_ratio_customer?: number | null
          talk_ratio_rep?: number | null
          topics?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_analyses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_analyses_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_topics_catalog: {
        Row: {
          active: boolean
          category: string
          created_at: string
          id: string
          keywords: string[]
          label: string
          sort_order: number
          topic_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          id?: string
          keywords?: string[]
          label: string
          sort_order?: number
          topic_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          keywords?: string[]
          label?: string
          sort_order?: number
          topic_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversational_search_cache: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          model: string | null
          query_hash: string
          query_text: string
          response: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          model?: string | null
          query_hash: string
          query_text: string
          response: Json
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          model?: string | null
          query_hash?: string
          query_text?: string
          response?: Json
          user_id?: string
        }
        Relationships: []
      }
      cs_accounts: {
        Row: {
          account_name: string
          arr: number
          company_id: string | null
          contact_id: string | null
          contract_start: string | null
          created_at: string
          csm_owner_id: string | null
          health_score: number
          health_trend: string | null
          id: string
          last_health_recalc_at: string | null
          lifecycle_stage: string
          notes: string | null
          renewal_date: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          arr?: number
          company_id?: string | null
          contact_id?: string | null
          contract_start?: string | null
          created_at?: string
          csm_owner_id?: string | null
          health_score?: number
          health_trend?: string | null
          id?: string
          last_health_recalc_at?: string | null
          lifecycle_stage?: string
          notes?: string | null
          renewal_date?: string | null
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          arr?: number
          company_id?: string | null
          contact_id?: string | null
          contract_start?: string | null
          created_at?: string
          csm_owner_id?: string | null
          health_score?: number
          health_trend?: string | null
          id?: string
          last_health_recalc_at?: string | null
          lifecycle_stage?: string
          notes?: string | null
          renewal_date?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cs_accounts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_health_signals: {
        Row: {
          account_id: string
          captured_at: string
          created_at: string
          id: string
          metadata: Json
          score: number
          signal_type: string
          source: string | null
          user_id: string
          weight: number
        }
        Insert: {
          account_id: string
          captured_at?: string
          created_at?: string
          id?: string
          metadata?: Json
          score?: number
          signal_type: string
          source?: string | null
          user_id: string
          weight?: number
        }
        Update: {
          account_id?: string
          captured_at?: string
          created_at?: string
          id?: string
          metadata?: Json
          score?: number
          signal_type?: string
          source?: string | null
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "cs_health_signals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cs_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_nps_responses: {
        Row: {
          account_id: string
          category: string
          comment: string | null
          contact_id: string | null
          created_at: string
          id: string
          score: number
          surveyed_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          category: string
          comment?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          score: number
          surveyed_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          category?: string
          comment?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          score?: number
          surveyed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_nps_responses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cs_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cs_nps_responses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_qbrs: {
        Row: {
          account_id: string
          agenda: Json
          attendees: Json
          completed_at: string | null
          created_at: string
          id: string
          next_steps: Json
          notes: string | null
          outcomes: Json
          scheduled_at: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          agenda?: Json
          attendees?: Json
          completed_at?: string | null
          created_at?: string
          id?: string
          next_steps?: Json
          notes?: string | null
          outcomes?: Json
          scheduled_at: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          agenda?: Json
          attendees?: Json
          completed_at?: string | null
          created_at?: string
          id?: string
          next_steps?: Json
          notes?: string | null
          outcomes?: Json
          scheduled_at?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_qbrs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cs_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_renewals: {
        Row: {
          account_id: string
          actual_arr: number | null
          closed_at: string | null
          created_at: string
          forecasted_arr: number
          id: string
          notes: string | null
          renewal_date: string
          risk_level: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          actual_arr?: number | null
          closed_at?: string | null
          created_at?: string
          forecasted_arr?: number
          id?: string
          notes?: string | null
          renewal_date: string
          risk_level?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          actual_arr?: number | null
          closed_at?: string | null
          created_at?: string
          forecasted_arr?: number
          id?: string
          notes?: string | null
          renewal_date?: string
          risk_level?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_renewals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cs_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      csat_surveys: {
        Row: {
          answered_at: string | null
          channel: string | null
          contact_id: string
          created_at: string
          expires_at: string | null
          feedback: string | null
          id: string
          interaction_id: string | null
          public_token: string
          score: number | null
          sent_at: string | null
          status: string
          ticket_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          channel?: string | null
          contact_id: string
          created_at?: string
          expires_at?: string | null
          feedback?: string | null
          id?: string
          interaction_id?: string | null
          public_token?: string
          score?: number | null
          sent_at?: string | null
          status?: string
          ticket_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answered_at?: string | null
          channel?: string | null
          contact_id?: string
          created_at?: string
          expires_at?: string | null
          feedback?: string | null
          id?: string
          interaction_id?: string | null
          public_token?: string
          score?: number | null
          sent_at?: string | null
          status?: string
          ticket_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "csat_surveys_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csat_surveys_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csat_surveys_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_values: {
        Row: {
          created_at: string
          custom_field_id: string
          entity_id: string
          id: string
          updated_at: string
          user_id: string
          value: string | null
        }
        Insert: {
          created_at?: string
          custom_field_id: string
          entity_id: string
          id?: string
          updated_at?: string
          user_id: string
          value?: string | null
        }
        Update: {
          created_at?: string
          custom_field_id?: string
          entity_id?: string
          id?: string
          updated_at?: string
          user_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_custom_field_id_fkey"
            columns: ["custom_field_id"]
            isOneToOne: false
            referencedRelation: "custom_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          created_at: string
          display_order: number | null
          entity_type: string
          field_label: string
          field_name: string
          field_options: Json | null
          field_type: string
          id: string
          is_required: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          entity_type: string
          field_label: string
          field_name: string
          field_options?: Json | null
          field_type: string
          id?: string
          is_required?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          entity_type?: string
          field_label?: string
          field_name?: string
          field_options?: Json | null
          field_type?: string
          id?: string
          is_required?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deal_forecasts: {
        Row: {
          ai_rationale: string | null
          analyzed_at: string | null
          category: string
          company_id: string | null
          confidence_score: number
          contact_id: string | null
          created_at: string
          deal_id: string
          deal_name: string | null
          forecasted_amount: number
          forecasted_close_date: string | null
          health_score: number
          id: string
          last_activity_at: string | null
          notes: string | null
          period_id: string
          risk_factors: Json
          slip_count: number
          stage: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_rationale?: string | null
          analyzed_at?: string | null
          category?: string
          company_id?: string | null
          confidence_score?: number
          contact_id?: string | null
          created_at?: string
          deal_id: string
          deal_name?: string | null
          forecasted_amount?: number
          forecasted_close_date?: string | null
          health_score?: number
          id?: string
          last_activity_at?: string | null
          notes?: string | null
          period_id: string
          risk_factors?: Json
          slip_count?: number
          stage?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_rationale?: string | null
          analyzed_at?: string | null
          category?: string
          company_id?: string | null
          confidence_score?: number
          contact_id?: string | null
          created_at?: string
          deal_id?: string
          deal_name?: string | null
          forecasted_amount?: number
          forecasted_close_date?: string | null
          health_score?: number
          id?: string
          last_activity_at?: string | null
          notes?: string | null
          period_id?: string
          risk_factors?: Json
          slip_count?: number
          stage?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_forecasts_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "forecast_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_room_activities: {
        Row: {
          activity_type: string
          actor_label: string | null
          actor_side: string
          created_at: string
          id: string
          payload: Json
          room_id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          actor_label?: string | null
          actor_side: string
          created_at?: string
          id?: string
          payload?: Json
          room_id: string
          user_id: string
        }
        Update: {
          activity_type?: string
          actor_label?: string | null
          actor_side?: string
          created_at?: string
          id?: string
          payload?: Json
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_room_activities_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "deal_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_room_comments: {
        Row: {
          author_label: string | null
          author_side: string
          body: string
          created_at: string
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          author_label?: string | null
          author_side: string
          body: string
          created_at?: string
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          author_label?: string | null
          author_side?: string
          body?: string
          created_at?: string
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_room_comments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "deal_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_room_documents: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          last_viewed_at: string | null
          room_id: string
          title: string
          uploaded_by_side: string
          user_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          last_viewed_at?: string | null
          room_id: string
          title: string
          uploaded_by_side?: string
          user_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          last_viewed_at?: string | null
          room_id?: string
          title?: string
          uploaded_by_side?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "deal_room_documents_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "deal_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_room_milestones: {
        Row: {
          completed_at: string | null
          completed_by_side: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          owner_side: string
          room_id: string
          sort_order: number
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_by_side?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner_side?: string
          room_id: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_by_side?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner_side?: string
          room_id?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_room_milestones_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "deal_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_room_stakeholders: {
        Row: {
          contact_id: string | null
          created_at: string
          email: string | null
          engagement_score: number
          id: string
          influence: string
          name: string
          notes: string | null
          role_title: string | null
          room_id: string
          side: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          email?: string | null
          engagement_score?: number
          id?: string
          influence?: string
          name: string
          notes?: string | null
          role_title?: string | null
          room_id: string
          side: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          email?: string | null
          engagement_score?: number
          id?: string
          influence?: string
          name?: string
          notes?: string | null
          role_title?: string | null
          room_id?: string
          side?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_room_stakeholders_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "deal_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_rooms: {
        Row: {
          buyer_view_count: number
          company_id: string | null
          created_at: string
          deal_id: string | null
          deal_name: string | null
          deal_value: number | null
          description: string | null
          health_analyzed_at: string | null
          health_recommendations: Json
          health_score: number | null
          id: string
          last_buyer_view_at: string | null
          share_enabled: boolean
          share_token: string
          status: string
          target_close_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          buyer_view_count?: number
          company_id?: string | null
          created_at?: string
          deal_id?: string | null
          deal_name?: string | null
          deal_value?: number | null
          description?: string | null
          health_analyzed_at?: string | null
          health_recommendations?: Json
          health_score?: number | null
          id?: string
          last_buyer_view_at?: string | null
          share_enabled?: boolean
          share_token?: string
          status?: string
          target_close_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          buyer_view_count?: number
          company_id?: string | null
          created_at?: string
          deal_id?: string | null
          deal_name?: string | null
          deal_value?: number | null
          description?: string | null
          health_analyzed_at?: string | null
          health_recommendations?: Json
          health_score?: number | null
          id?: string
          last_buyer_view_at?: string | null
          share_enabled?: boolean
          share_token?: string
          status?: string
          target_close_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      decision_criteria: {
        Row: {
          contact_id: string
          created_at: string
          criteria_type: string
          detected_from: string | null
          how_to_address: string | null
          id: string
          name: string
          priority: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          criteria_type: string
          detected_from?: string | null
          how_to_address?: string | null
          id?: string
          name: string
          priority?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          criteria_type?: string
          detected_from?: string | null
          how_to_address?: string | null
          id?: string
          name?: string
          priority?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_criteria_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      device_login_notifications: {
        Row: {
          created_at: string | null
          device_id: string | null
          id: string
          ip_address: string | null
          is_read: boolean | null
          location: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          ip_address?: string | null
          is_read?: boolean | null
          location?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          ip_address?: string | null
          is_read?: boolean | null
          location?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_login_notifications_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "user_known_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      disc_analysis_history: {
        Row: {
          analysis_notes: string | null
          analysis_source: string
          analyzed_at: string
          analyzed_text: string | null
          behavior_indicators: Json | null
          blend_profile: string | null
          confidence: number
          conscientiousness_score: number
          contact_id: string
          created_at: string
          detected_keywords: Json | null
          detected_phrases: Json | null
          dominance_score: number
          id: string
          influence_score: number
          interaction_id: string | null
          primary_profile: string
          profile_summary: string | null
          secondary_profile: string | null
          steadiness_score: number
          stress_primary: string | null
          stress_secondary: string | null
          user_id: string
        }
        Insert: {
          analysis_notes?: string | null
          analysis_source?: string
          analyzed_at?: string
          analyzed_text?: string | null
          behavior_indicators?: Json | null
          blend_profile?: string | null
          confidence?: number
          conscientiousness_score?: number
          contact_id: string
          created_at?: string
          detected_keywords?: Json | null
          detected_phrases?: Json | null
          dominance_score?: number
          id?: string
          influence_score?: number
          interaction_id?: string | null
          primary_profile: string
          profile_summary?: string | null
          secondary_profile?: string | null
          steadiness_score?: number
          stress_primary?: string | null
          stress_secondary?: string | null
          user_id: string
        }
        Update: {
          analysis_notes?: string | null
          analysis_source?: string
          analyzed_at?: string
          analyzed_text?: string | null
          behavior_indicators?: Json | null
          blend_profile?: string | null
          confidence?: number
          conscientiousness_score?: number
          contact_id?: string
          created_at?: string
          detected_keywords?: Json | null
          detected_phrases?: Json | null
          dominance_score?: number
          id?: string
          influence_score?: number
          interaction_id?: string | null
          primary_profile?: string
          profile_summary?: string | null
          secondary_profile?: string | null
          steadiness_score?: number
          stress_primary?: string | null
          stress_secondary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disc_analysis_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disc_analysis_history_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      disc_communication_logs: {
        Row: {
          adaptation_tips_shown: Json | null
          approach_adapted: boolean
          communication_outcome: string | null
          contact_disc_profile: string
          contact_id: string
          created_at: string
          effectiveness_rating: number | null
          id: string
          interaction_id: string | null
          outcome_notes: string | null
          tips_followed: Json | null
          user_id: string
        }
        Insert: {
          adaptation_tips_shown?: Json | null
          approach_adapted?: boolean
          communication_outcome?: string | null
          contact_disc_profile: string
          contact_id: string
          created_at?: string
          effectiveness_rating?: number | null
          id?: string
          interaction_id?: string | null
          outcome_notes?: string | null
          tips_followed?: Json | null
          user_id: string
        }
        Update: {
          adaptation_tips_shown?: Json | null
          approach_adapted?: boolean
          communication_outcome?: string | null
          contact_disc_profile?: string
          contact_id?: string
          created_at?: string
          effectiveness_rating?: number | null
          id?: string
          interaction_id?: string | null
          outcome_notes?: string | null
          tips_followed?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disc_communication_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disc_communication_logs_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      disc_conversion_metrics: {
        Row: {
          average_compatibility_score: number | null
          average_deal_size: number | null
          average_relationship_score: number | null
          average_sales_cycle_days: number | null
          blend_profile: string | null
          conversion_rate: number | null
          converted_count: number
          created_at: string
          disc_profile: string
          id: string
          lost_count: number
          period_end: string
          period_start: string
          total_contacts: number
          total_opportunities: number
          updated_at: string
          user_id: string
        }
        Insert: {
          average_compatibility_score?: number | null
          average_deal_size?: number | null
          average_relationship_score?: number | null
          average_sales_cycle_days?: number | null
          blend_profile?: string | null
          conversion_rate?: number | null
          converted_count?: number
          created_at?: string
          disc_profile: string
          id?: string
          lost_count?: number
          period_end: string
          period_start: string
          total_contacts?: number
          total_opportunities?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          average_compatibility_score?: number | null
          average_deal_size?: number | null
          average_relationship_score?: number | null
          average_sales_cycle_days?: number | null
          blend_profile?: string | null
          conversion_rate?: number | null
          converted_count?: number
          created_at?: string
          disc_profile?: string
          id?: string
          lost_count?: number
          period_end?: string
          period_start?: string
          total_contacts?: number
          total_opportunities?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      disc_profile_config: {
        Row: {
          avoid_words: Json
          closing_techniques: Json
          color_scheme: Json
          communication_style: Json
          compatibility_matrix: Json
          core_drive: string
          core_fear: string
          created_at: string
          decision_making_style: string
          detailed_description: string
          detection_keywords: Json
          follow_up_approach: Json
          icon: string | null
          id: string
          ideal_environment: string
          name: string
          objection_handling: Json
          opening_strategies: Json
          power_words: Json
          preferred_pace: string
          presentation_tips: Json
          profile_type: string
          short_description: string
          typical_phrases: Json
          under_pressure: string
          updated_at: string
        }
        Insert: {
          avoid_words?: Json
          closing_techniques?: Json
          color_scheme?: Json
          communication_style?: Json
          compatibility_matrix?: Json
          core_drive: string
          core_fear: string
          created_at?: string
          decision_making_style: string
          detailed_description: string
          detection_keywords?: Json
          follow_up_approach?: Json
          icon?: string | null
          id?: string
          ideal_environment: string
          name: string
          objection_handling?: Json
          opening_strategies?: Json
          power_words?: Json
          preferred_pace: string
          presentation_tips?: Json
          profile_type: string
          short_description: string
          typical_phrases?: Json
          under_pressure: string
          updated_at?: string
        }
        Update: {
          avoid_words?: Json
          closing_techniques?: Json
          color_scheme?: Json
          communication_style?: Json
          compatibility_matrix?: Json
          core_drive?: string
          core_fear?: string
          created_at?: string
          decision_making_style?: string
          detailed_description?: string
          detection_keywords?: Json
          follow_up_approach?: Json
          icon?: string | null
          id?: string
          ideal_environment?: string
          name?: string
          objection_handling?: Json
          opening_strategies?: Json
          power_words?: Json
          preferred_pace?: string
          presentation_tips?: Json
          profile_type?: string
          short_description?: string
          typical_phrases?: Json
          under_pressure?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_signatures: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          declined_at: string | null
          declined_reason: string | null
          document_id: string | null
          expires_at: string | null
          id: string
          merge_data: Json
          rendered_html: string
          signature_image: string | null
          signature_token: string
          signature_typed: string | null
          signed_at: string | null
          signed_ip: string | null
          signed_user_agent: string | null
          signer_email: string
          signer_name: string
          status: string
          template_id: string | null
          updated_at: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          declined_at?: string | null
          declined_reason?: string | null
          document_id?: string | null
          expires_at?: string | null
          id?: string
          merge_data?: Json
          rendered_html: string
          signature_image?: string | null
          signature_token?: string
          signature_typed?: string | null
          signed_at?: string | null
          signed_ip?: string | null
          signed_user_agent?: string | null
          signer_email: string
          signer_name: string
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          declined_at?: string | null
          declined_reason?: string | null
          document_id?: string | null
          expires_at?: string | null
          id?: string
          merge_data?: Json
          rendered_html?: string
          signature_image?: string | null
          signature_token?: string
          signature_typed?: string | null
          signed_at?: string | null
          signed_ip?: string | null
          signed_user_agent?: string | null
          signer_email?: string
          signer_name?: string
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_signatures_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_signatures_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_signatures_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          category: string | null
          content_html: string
          created_at: string
          description: string | null
          document_type: string
          id: string
          is_active: boolean
          merge_fields: Json
          name: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          category?: string | null
          content_html: string
          created_at?: string
          description?: string | null
          document_type?: string
          id?: string
          is_active?: boolean
          merge_fields?: Json
          name: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          category?: string | null
          content_html?: string
          created_at?: string
          description?: string | null
          document_type?: string
          id?: string
          is_active?: boolean
          merge_fields?: Json
          name?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      document_views: {
        Row: {
          created_at: string
          document_id: string | null
          duration_seconds: number | null
          id: string
          signature_id: string | null
          viewer_email: string | null
          viewer_ip: string | null
          viewer_user_agent: string | null
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          duration_seconds?: number | null
          id?: string
          signature_id?: string | null
          viewer_email?: string | null
          viewer_ip?: string | null
          viewer_user_agent?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string | null
          duration_seconds?: number | null
          id?: string
          signature_id?: string | null
          viewer_email?: string | null
          viewer_ip?: string | null
          viewer_user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_views_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "document_signatures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_views_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "document_signatures_public"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          document_type: string
          entity_id: string
          entity_type: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          name: string
          status: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type?: string
          entity_id: string
          entity_type: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          name: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: string
          entity_id?: string
          entity_type?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          name?: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          content_html: string | null
          content_text: string | null
          created_at: string
          id: string
          name: string
          scheduled_at: string | null
          segment_filter: Json | null
          sent_at: string | null
          status: string
          subject: string
          tags: string[] | null
          total_bounced: number | null
          total_clicked: number | null
          total_opened: number | null
          total_recipients: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_html?: string | null
          content_text?: string | null
          created_at?: string
          id?: string
          name: string
          scheduled_at?: string | null
          segment_filter?: Json | null
          sent_at?: string | null
          status?: string
          subject: string
          tags?: string[] | null
          total_bounced?: number | null
          total_clicked?: number | null
          total_opened?: number | null
          total_recipients?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_html?: string | null
          content_text?: string | null
          created_at?: string
          id?: string
          name?: string
          scheduled_at?: string | null
          segment_filter?: Json | null
          sent_at?: string | null
          status?: string
          subject?: string
          tags?: string[] | null
          total_bounced?: number | null
          total_clicked?: number | null
          total_opened?: number | null
          total_recipients?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_finder_results: {
        Row: {
          best_confidence: number
          best_email: string | null
          candidates: Json
          contact_id: string | null
          created_at: string
          domain: string
          first_name: string | null
          found_at: string
          full_name: string
          id: string
          last_name: string | null
          sources: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          best_confidence?: number
          best_email?: string | null
          candidates?: Json
          contact_id?: string | null
          created_at?: string
          domain: string
          first_name?: string | null
          found_at?: string
          full_name: string
          id?: string
          last_name?: string | null
          sources?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          best_confidence?: number
          best_email?: string | null
          candidates?: Json
          contact_id?: string | null
          created_at?: string
          domain?: string
          first_name?: string | null
          found_at?: string
          full_name?: string
          id?: string
          last_name?: string | null
          sources?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_finder_results_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_thread_summaries: {
        Row: {
          action_items: Json
          created_at: string
          generated_by_model: string
          id: string
          interaction_ids: string[]
          key_points: string[]
          next_steps: string[]
          sentiment: string | null
          summary: string
          thread_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_items?: Json
          created_at?: string
          generated_by_model?: string
          id?: string
          interaction_ids?: string[]
          key_points?: string[]
          next_steps?: string[]
          sentiment?: string | null
          summary: string
          thread_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_items?: Json
          created_at?: string
          generated_by_model?: string
          id?: string
          interaction_ids?: string[]
          key_points?: string[]
          next_steps?: string[]
          sentiment?: string | null
          summary?: string
          thread_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_verifications: {
        Row: {
          contact_id: string | null
          created_at: string
          disposable: boolean
          email: string
          free_provider: boolean
          id: string
          mx_found: boolean
          provider: string
          raw: Json
          reasons: string[]
          role_account: boolean
          score: number
          smtp_check: boolean
          status: string
          updated_at: string
          user_id: string
          verified_at: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          disposable?: boolean
          email: string
          free_provider?: boolean
          id?: string
          mx_found?: boolean
          provider?: string
          raw?: Json
          reasons?: string[]
          role_account?: boolean
          score?: number
          smtp_check?: boolean
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          disposable?: boolean
          email?: string
          free_provider?: boolean
          id?: string
          mx_found?: boolean
          provider?: string
          raw?: Json
          reasons?: string[]
          role_account?: boolean
          score?: number
          smtp_check?: boolean
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_verifications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      emotional_anchors: {
        Row: {
          anchor_type: string
          contact_id: string
          context: string | null
          created_at: string
          detected_at: string
          emotional_state: string
          id: string
          strength: number | null
          trigger_word: string
          user_id: string
        }
        Insert: {
          anchor_type: string
          contact_id: string
          context?: string | null
          created_at?: string
          detected_at?: string
          emotional_state: string
          id?: string
          strength?: number | null
          trigger_word: string
          user_id: string
        }
        Update: {
          anchor_type?: string
          contact_id?: string
          context?: string | null
          created_at?: string
          detected_at?: string
          emotional_state?: string
          id?: string
          strength?: number | null
          trigger_word?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotional_anchors_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      emotional_states_history: {
        Row: {
          confidence: number | null
          contact_id: string
          context: string | null
          created_at: string
          emotional_state: string
          id: string
          interaction_id: string | null
          trigger: string | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          contact_id: string
          context?: string | null
          created_at?: string
          emotional_state: string
          id?: string
          interaction_id?: string | null
          trigger?: string | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          contact_id?: string
          context?: string | null
          created_at?: string
          emotional_state?: string
          id?: string
          interaction_id?: string | null
          trigger?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotional_states_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emotional_states_history_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      eq_analysis_history: {
        Row: {
          analyzed_at: string
          areas_for_growth: string[] | null
          communication_style: Json | null
          confidence: number | null
          contact_id: string
          created_at: string
          id: string
          indicators: Json | null
          interaction_id: string | null
          overall_level: string
          overall_score: number
          pillar_scores: Json
          profile_summary: string | null
          sales_implications: Json | null
          strengths: string[] | null
          user_id: string
        }
        Insert: {
          analyzed_at?: string
          areas_for_growth?: string[] | null
          communication_style?: Json | null
          confidence?: number | null
          contact_id: string
          created_at?: string
          id?: string
          indicators?: Json | null
          interaction_id?: string | null
          overall_level: string
          overall_score: number
          pillar_scores: Json
          profile_summary?: string | null
          sales_implications?: Json | null
          strengths?: string[] | null
          user_id: string
        }
        Update: {
          analyzed_at?: string
          areas_for_growth?: string[] | null
          communication_style?: Json | null
          confidence?: number | null
          contact_id?: string
          created_at?: string
          id?: string
          indicators?: Json | null
          interaction_id?: string | null
          overall_level?: string
          overall_score?: number
          pillar_scores?: Json
          profile_summary?: string | null
          sales_implications?: Json | null
          strengths?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eq_analysis_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eq_analysis_history_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          message: string
          severity: Database["public"]["Enums"]["error_severity"]
          stack: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          message: string
          severity?: Database["public"]["Enums"]["error_severity"]
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          message?: string
          severity?: Database["public"]["Enums"]["error_severity"]
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      favorite_templates: {
        Row: {
          created_at: string
          id: string
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          template_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          template_id?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          name: string
          roles: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          name: string
          roles?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          name?: string
          roles?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      ficha360_conversation_summaries: {
        Row: {
          contact_id: string
          created_at: string
          filters_hash: string
          filters_summary: Json
          id: string
          interaction_ids: string[]
          interactions_analyzed: number
          model: string
          summary: Json
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          filters_hash: string
          filters_summary?: Json
          id?: string
          interaction_ids: string[]
          interactions_analyzed?: number
          model: string
          summary: Json
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          filters_hash?: string
          filters_summary?: Json
          id?: string
          interaction_ids?: string[]
          interactions_analyzed?: number
          model?: string
          summary?: Json
          user_id?: string
        }
        Relationships: []
      }
      follow_up_approvals: {
        Row: {
          approved_at: string | null
          channel: string
          contact_id: string
          content: string
          created_at: string | null
          id: string
          scheduled_for: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          channel: string
          contact_id: string
          content: string
          created_at?: string | null
          id?: string
          scheduled_for?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          channel?: string
          contact_id?: string
          content?: string
          created_at?: string | null
          id?: string
          scheduled_for?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      forecast_categories_history: {
        Row: {
          changed_at: string
          changed_by: string
          deal_forecast_id: string
          from_category: string | null
          id: string
          reason: string | null
          to_category: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string
          deal_forecast_id: string
          from_category?: string | null
          id?: string
          reason?: string | null
          to_category: string
          user_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          deal_forecast_id?: string
          from_category?: string | null
          id?: string
          reason?: string | null
          to_category?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forecast_categories_history_deal_forecast_id_fkey"
            columns: ["deal_forecast_id"]
            isOneToOne: false
            referencedRelation: "deal_forecasts"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_periods: {
        Row: {
          actual_won_amount: number
          closed_at: string | null
          created_at: string
          id: string
          notes: string | null
          period_end: string
          period_start: string
          period_type: string
          quota_amount: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_won_amount?: number
          closed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          period_type: string
          quota_amount?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_won_amount?: number
          closed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          period_type?: string
          quota_amount?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      forecast_quota_settings: {
        Row: {
          created_at: string
          default_monthly_quota: number
          default_quarterly_quota: number
          health_weight_activity: number
          health_weight_engagement: number
          health_weight_relationship: number
          health_weight_stage_age: number
          id: string
          inactivity_threshold_days: number
          slip_threshold_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_monthly_quota?: number
          default_quarterly_quota?: number
          health_weight_activity?: number
          health_weight_engagement?: number
          health_weight_relationship?: number
          health_weight_stage_age?: number
          id?: string
          inactivity_threshold_days?: number
          slip_threshold_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_monthly_quota?: number
          default_quarterly_quota?: number
          health_weight_activity?: number
          health_weight_engagement?: number
          health_weight_relationship?: number
          health_weight_stage_age?: number
          id?: string
          inactivity_threshold_days?: number
          slip_threshold_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      forecast_snapshots: {
        Row: {
          best_case_total: number
          commit_total: number
          created_at: string
          deal_count: number
          id: string
          period_id: string
          pipeline_total: number
          snapshot_data: Json
          snapshot_date: string
          user_id: string
          weighted_total: number
        }
        Insert: {
          best_case_total?: number
          commit_total?: number
          created_at?: string
          deal_count?: number
          id?: string
          period_id: string
          pipeline_total?: number
          snapshot_data?: Json
          snapshot_date?: string
          user_id: string
          weighted_total?: number
        }
        Update: {
          best_case_total?: number
          commit_total?: number
          created_at?: string
          deal_count?: number
          id?: string
          period_id?: string
          pipeline_total?: number
          snapshot_data?: Json
          snapshot_date?: string
          user_id?: string
          weighted_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "forecast_snapshots_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "forecast_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          contact_id: string | null
          created_at: string
          data: Json
          form_id: string
          id: string
          ip_hash: string | null
          page_url: string | null
          routed_to: string | null
          user_agent: string | null
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          data?: Json
          form_id: string
          id?: string
          ip_hash?: string | null
          page_url?: string | null
          routed_to?: string | null
          user_agent?: string | null
          user_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          data?: Json
          form_id?: string
          id?: string
          ip_hash?: string | null
          page_url?: string | null
          routed_to?: string | null
          user_agent?: string | null
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms_public"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          created_at: string
          description: string | null
          fields: Json
          id: string
          is_published: boolean
          name: string
          nurturing_workflow_id: string | null
          redirect_url: string | null
          routing_rules: Json
          slug: string
          submission_count: number
          success_message: string | null
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          is_published?: boolean
          name: string
          nurturing_workflow_id?: string | null
          redirect_url?: string | null
          routing_rules?: Json
          slug: string
          submission_count?: number
          success_message?: string | null
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          is_published?: boolean
          name?: string
          nurturing_workflow_id?: string | null
          redirect_url?: string | null
          routing_rules?: Json
          slug?: string
          submission_count?: number
          success_message?: string | null
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      geo_allowed_countries: {
        Row: {
          country_code: string
          country_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          user_id: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          user_id: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      handoff_requests: {
        Row: {
          accepted_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          expired_at: string | null
          from_member_id: string
          handoff_reason: string | null
          id: string
          notes: string | null
          qualification_data: Json
          rejected_at: string | null
          rejection_reason: string | null
          sla_hours: number
          status: string
          to_member_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          expired_at?: string | null
          from_member_id: string
          handoff_reason?: string | null
          id?: string
          notes?: string | null
          qualification_data?: Json
          rejected_at?: string | null
          rejection_reason?: string | null
          sla_hours?: number
          status?: string
          to_member_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          expired_at?: string | null
          from_member_id?: string
          handoff_reason?: string | null
          id?: string
          notes?: string | null
          qualification_data?: Json
          rejected_at?: string | null
          rejection_reason?: string | null
          sla_hours?: number
          status?: string
          to_member_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "handoff_requests_from_member_id_fkey"
            columns: ["from_member_id"]
            isOneToOne: false
            referencedRelation: "sales_team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_requests_to_member_id_fkey"
            columns: ["to_member_id"]
            isOneToOne: false
            referencedRelation: "sales_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      health_alert_settings: {
        Row: {
          check_frequency_hours: number | null
          created_at: string
          critical_threshold: number | null
          email_address: string | null
          email_notifications: boolean | null
          id: string
          notify_on_critical: boolean | null
          notify_on_warning: boolean | null
          push_notifications: boolean | null
          updated_at: string
          user_id: string
          warning_threshold: number | null
        }
        Insert: {
          check_frequency_hours?: number | null
          created_at?: string
          critical_threshold?: number | null
          email_address?: string | null
          email_notifications?: boolean | null
          id?: string
          notify_on_critical?: boolean | null
          notify_on_warning?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string
          user_id: string
          warning_threshold?: number | null
        }
        Update: {
          check_frequency_hours?: number | null
          created_at?: string
          critical_threshold?: number | null
          email_address?: string | null
          email_notifications?: boolean | null
          id?: string
          notify_on_critical?: boolean | null
          notify_on_warning?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string
          user_id?: string
          warning_threshold?: number | null
        }
        Relationships: []
      }
      health_alerts: {
        Row: {
          alert_type: string
          contact_id: string
          created_at: string
          description: string | null
          dismissed: boolean | null
          factors: Json | null
          health_score: number
          id: string
          notified_via: string[] | null
          previous_score: number | null
          title: string
          user_id: string
        }
        Insert: {
          alert_type?: string
          contact_id: string
          created_at?: string
          description?: string | null
          dismissed?: boolean | null
          factors?: Json | null
          health_score: number
          id?: string
          notified_via?: string[] | null
          previous_score?: number | null
          title: string
          user_id: string
        }
        Update: {
          alert_type?: string
          contact_id?: string
          created_at?: string
          description?: string | null
          dismissed?: boolean | null
          factors?: Json | null
          health_score?: number
          id?: string
          notified_via?: string[] | null
          previous_score?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_alerts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      hidden_objections: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          indicator: string
          interaction_id: string | null
          objection_type: string
          possible_real_objection: string | null
          probability: number | null
          resolution_templates: string[] | null
          resolved: boolean | null
          resolved_at: string | null
          severity: string
          suggested_probe: string | null
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          indicator: string
          interaction_id?: string | null
          objection_type: string
          possible_real_objection?: string | null
          probability?: number | null
          resolution_templates?: string[] | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity: string
          suggested_probe?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          indicator?: string
          interaction_id?: string | null
          objection_type?: string
          possible_real_objection?: string | null
          probability?: number | null
          resolution_templates?: string[] | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string
          suggested_probe?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hidden_objections_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hidden_objections_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      incoming_webhook_dlq: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          max_attempts: number
          next_retry_at: string
          payload: Json
          resolved_at: string | null
          source_ip: string | null
          status: string
          updated_at: string
          user_agent: string | null
          webhook_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          next_retry_at?: string
          payload?: Json
          resolved_at?: string | null
          source_ip?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          webhook_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          next_retry_at?: string
          payload?: Json
          resolved_at?: string | null
          source_ip?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incoming_webhook_dlq_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "incoming_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      incoming_webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          http_status: number | null
          id: string
          latency_ms: number | null
          payload: Json | null
          response: Json | null
          source_ip: string | null
          status: string
          user_agent: string | null
          webhook_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          latency_ms?: number | null
          payload?: Json | null
          response?: Json | null
          source_ip?: string | null
          status: string
          user_agent?: string | null
          webhook_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          latency_ms?: number | null
          payload?: Json | null
          response?: Json | null
          source_ip?: string | null
          status?: string
          user_agent?: string | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incoming_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "incoming_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      incoming_webhooks: {
        Row: {
          allowed_origins: string[] | null
          created_at: string
          created_by: string
          description: string | null
          field_mapping: Json
          id: string
          is_active: boolean
          last_called_at: string | null
          name: string
          replay_window_seconds: number
          require_signature: boolean
          target_entity: string
          token: string
          total_calls: number
          total_errors: number
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          allowed_origins?: string[] | null
          created_at?: string
          created_by: string
          description?: string | null
          field_mapping?: Json
          id?: string
          is_active?: boolean
          last_called_at?: string | null
          name: string
          replay_window_seconds?: number
          require_signature?: boolean
          target_entity: string
          token: string
          total_calls?: number
          total_errors?: number
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          allowed_origins?: string[] | null
          created_at?: string
          created_by?: string
          description?: string | null
          field_mapping?: Json
          id?: string
          is_active?: boolean
          last_called_at?: string | null
          name?: string
          replay_window_seconds?: number
          require_signature?: boolean
          target_entity?: string
          token?: string
          total_calls?: number
          total_errors?: number
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      insights: {
        Row: {
          action_suggestion: string | null
          actionable: boolean | null
          category: string
          confidence: number | null
          contact_id: string
          created_at: string
          description: string | null
          dismissed: boolean | null
          expires_at: string | null
          id: string
          source: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_suggestion?: string | null
          actionable?: boolean | null
          category: string
          confidence?: number | null
          contact_id: string
          created_at?: string
          description?: string | null
          dismissed?: boolean | null
          expires_at?: string | null
          id?: string
          source?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_suggestion?: string | null
          actionable?: boolean | null
          category?: string
          confidence?: number | null
          contact_id?: string
          created_at?: string
          description?: string | null
          dismissed?: boolean | null
          expires_at?: string | null
          id?: string
          source?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      intent_scores: {
        Row: {
          computed_at: string
          created_at: string
          id: string
          intent_score: number
          scope: string
          scope_id: string
          score_trend: string
          signal_count_30d: number
          top_signals: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          computed_at?: string
          created_at?: string
          id?: string
          intent_score?: number
          scope: string
          scope_id: string
          score_trend?: string
          signal_count_30d?: number
          top_signals?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          computed_at?: string
          created_at?: string
          id?: string
          intent_score?: number
          scope?: string
          scope_id?: string
          score_trend?: string
          signal_count_30d?: number
          top_signals?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      intent_signals: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          external_company_id: string | null
          id: string
          occurred_at: string
          signal_source: string | null
          signal_type: string
          signal_value: Json
          user_id: string
          weight: number
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          external_company_id?: string | null
          id?: string
          occurred_at?: string
          signal_source?: string | null
          signal_type: string
          signal_value?: Json
          user_id: string
          weight?: number
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          external_company_id?: string | null
          id?: string
          occurred_at?: string
          signal_source?: string | null
          signal_type?: string
          signal_value?: Json
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "intent_signals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intent_signals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      intent_tracking_pixels: {
        Row: {
          active: boolean
          created_at: string
          domain: string
          id: string
          label: string | null
          last_signal_at: string | null
          pixel_key: string
          signal_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          domain: string
          id?: string
          label?: string | null
          last_signal_at?: string | null
          pixel_key: string
          signal_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          domain?: string
          id?: string
          label?: string | null
          last_signal_at?: string | null
          pixel_key?: string
          signal_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interactions: {
        Row: {
          attachments: string[] | null
          audio_url: string | null
          company_id: string | null
          contact_id: string
          content: string | null
          created_at: string
          duration: number | null
          emotion_analysis: Json | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          initiated_by: string | null
          key_insights: string[] | null
          response_time: number | null
          sentiment: string | null
          tags: string[] | null
          title: string
          transcription: string | null
          type: string
          user_id: string
        }
        Insert: {
          attachments?: string[] | null
          audio_url?: string | null
          company_id?: string | null
          contact_id: string
          content?: string | null
          created_at?: string
          duration?: number | null
          emotion_analysis?: Json | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          initiated_by?: string | null
          key_insights?: string[] | null
          response_time?: number | null
          sentiment?: string | null
          tags?: string[] | null
          title: string
          transcription?: string | null
          type: string
          user_id: string
        }
        Update: {
          attachments?: string[] | null
          audio_url?: string | null
          company_id?: string | null
          contact_id?: string
          content?: string | null
          created_at?: string
          duration?: number | null
          emotion_analysis?: Json | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          initiated_by?: string | null
          key_insights?: string[] | null
          response_time?: number | null
          sentiment?: string | null
          tags?: string[] | null
          title?: string
          transcription?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_whitelist: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string
          is_active: boolean | null
          label: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address: string
          is_active?: boolean | null
          label?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean | null
          label?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      knowledge_base_articles: {
        Row: {
          category: string
          content: string
          created_at: string
          helpful_count: number | null
          id: string
          is_published: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          views_count: number | null
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          views_count?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number | null
        }
        Relationships: []
      }
      landing_page_submissions: {
        Row: {
          created_at: string
          data: Json
          email: string | null
          id: string
          ip_address: string | null
          landing_page_id: string
          name: string | null
          phone: string | null
          user_agent: string | null
          user_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          email?: string | null
          id?: string
          ip_address?: string | null
          landing_page_id: string
          name?: string | null
          phone?: string | null
          user_agent?: string | null
          user_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          email?: string | null
          id?: string
          ip_address?: string | null
          landing_page_id?: string
          name?: string | null
          phone?: string | null
          user_agent?: string | null
          user_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_submissions_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_page_submissions_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages_public"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          blocks: Json
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          redirect_url: string | null
          slug: string
          submission_count: number
          theme: Json
          title: string
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          blocks?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          redirect_url?: string | null
          slug: string
          submission_count?: number
          theme?: Json
          title: string
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          blocks?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          redirect_url?: string | null
          slug?: string
          submission_count?: number
          theme?: Json
          title?: string
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      lead_assignments: {
        Row: {
          assigned_by: string | null
          assigned_to: string
          assignment_type: string
          company_id: string | null
          contact_id: string | null
          created_at: string
          first_contact_at: string | null
          id: string
          notes: string | null
          previous_owner: string | null
          routing_rule_id: string | null
          sla_deadline: string | null
          sla_met: boolean | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_to: string
          assignment_type?: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          first_contact_at?: string | null
          id?: string
          notes?: string | null
          previous_owner?: string | null
          routing_rule_id?: string | null
          sla_deadline?: string | null
          sla_met?: boolean | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string
          assignment_type?: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          first_contact_at?: string | null
          id?: string
          notes?: string | null
          previous_owner?: string | null
          routing_rule_id?: string | null
          sla_deadline?: string | null
          sla_met?: boolean | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "sales_team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_previous_owner_fkey"
            columns: ["previous_owner"]
            isOneToOne: false
            referencedRelation: "sales_team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_routing_rule_id_fkey"
            columns: ["routing_rule_id"]
            isOneToOne: false
            referencedRelation: "lead_routing_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_magnet_downloads: {
        Row: {
          contact_id: string | null
          downloaded_at: string
          email: string | null
          id: string
          magnet_id: string
          name: string | null
          user_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          contact_id?: string | null
          downloaded_at?: string
          email?: string | null
          id?: string
          magnet_id: string
          name?: string | null
          user_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          contact_id?: string | null
          downloaded_at?: string
          email?: string | null
          id?: string
          magnet_id?: string
          name?: string | null
          user_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_magnet_downloads_magnet_id_fkey"
            columns: ["magnet_id"]
            isOneToOne: false
            referencedRelation: "lead_magnets"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_magnets: {
        Row: {
          created_at: string
          description: string | null
          download_count: number
          external_url: string | null
          file_path: string | null
          form_id: string | null
          gated: boolean
          id: string
          is_published: boolean
          slug: string
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          download_count?: number
          external_url?: string | null
          file_path?: string | null
          form_id?: string | null
          gated?: boolean
          id?: string
          is_published?: boolean
          slug: string
          thumbnail_url?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          download_count?: number
          external_url?: string | null
          file_path?: string | null
          form_id?: string | null
          gated?: boolean
          id?: string
          is_published?: boolean
          slug?: string
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_magnets_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_magnets_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms_public"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_routing_rules: {
        Row: {
          conditions: Json
          created_at: string
          description: string | null
          fallback_rule_id: string | null
          id: string
          is_active: boolean
          name: string
          priority: number
          role_filter: string
          rule_type: string
          team_pool: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conditions?: Json
          created_at?: string
          description?: string | null
          fallback_rule_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          role_filter?: string
          rule_type?: string
          team_pool?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conditions?: Json
          created_at?: string
          description?: string | null
          fallback_rule_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          role_filter?: string
          rule_type?: string
          team_pool?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_routing_rules_fallback_rule_id_fkey"
            columns: ["fallback_rule_id"]
            isOneToOne: false
            referencedRelation: "lead_routing_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_score_config: {
        Row: {
          auto_recalculate: boolean
          created_at: string
          grade_thresholds: Json
          id: string
          recalculate_interval_hours: number
          updated_at: string
          user_id: string
          weight_engagement: number
          weight_fit: number
          weight_intent: number
          weight_relationship: number
        }
        Insert: {
          auto_recalculate?: boolean
          created_at?: string
          grade_thresholds?: Json
          id?: string
          recalculate_interval_hours?: number
          updated_at?: string
          user_id: string
          weight_engagement?: number
          weight_fit?: number
          weight_intent?: number
          weight_relationship?: number
        }
        Update: {
          auto_recalculate?: boolean
          created_at?: string
          grade_thresholds?: Json
          id?: string
          recalculate_interval_hours?: number
          updated_at?: string
          user_id?: string
          weight_engagement?: number
          weight_fit?: number
          weight_intent?: number
          weight_relationship?: number
        }
        Relationships: []
      }
      lead_score_history: {
        Row: {
          breakdown: Json
          contact_id: string
          engagement_score: number
          fit_score: number
          grade: string
          id: string
          intent_score: number
          recorded_at: string
          relationship_score: number
          total_score: number
          user_id: string
        }
        Insert: {
          breakdown?: Json
          contact_id: string
          engagement_score?: number
          fit_score?: number
          grade: string
          id?: string
          intent_score?: number
          recorded_at?: string
          relationship_score?: number
          total_score: number
          user_id: string
        }
        Update: {
          breakdown?: Json
          contact_id?: string
          engagement_score?: number
          fit_score?: number
          grade?: string
          id?: string
          intent_score?: number
          recorded_at?: string
          relationship_score?: number
          total_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_score_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_score_recompute_queue: {
        Row: {
          contact_id: string
          enqueued_at: string
          id: string
          processed_at: string | null
          reason: string
          user_id: string
        }
        Insert: {
          contact_id: string
          enqueued_at?: string
          id?: string
          processed_at?: string | null
          reason?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          enqueued_at?: string
          id?: string
          processed_at?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_score_rules: {
        Row: {
          active: boolean
          created_at: string
          decay_days: number
          dimension: string
          id: string
          signal_key: string
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          decay_days?: number
          dimension: string
          id?: string
          signal_key: string
          updated_at?: string
          user_id: string
          weight?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          decay_days?: number
          dimension?: string
          id?: string
          signal_key?: string
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      lead_score_threshold_automations: {
        Row: {
          action_config: Json
          action_type: string
          active: boolean
          cooldown_hours: number
          created_at: string
          description: string | null
          fired_count: number
          grade_target: string | null
          id: string
          last_fired_at: string | null
          name: string
          score_target: number | null
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          active?: boolean
          cooldown_hours?: number
          created_at?: string
          description?: string | null
          fired_count?: number
          grade_target?: string | null
          id?: string
          last_fired_at?: string | null
          name: string
          score_target?: number | null
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          active?: boolean
          cooldown_hours?: number
          created_at?: string
          description?: string | null
          fired_count?: number
          grade_target?: string | null
          id?: string
          last_fired_at?: string | null
          name?: string
          score_target?: number | null
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_score_threshold_log: {
        Row: {
          action_result: Json
          automation_id: string
          contact_id: string
          fired_at: string
          from_grade: string | null
          from_score: number | null
          id: string
          success: boolean
          to_grade: string | null
          to_score: number | null
          user_id: string
        }
        Insert: {
          action_result?: Json
          automation_id: string
          contact_id: string
          fired_at?: string
          from_grade?: string | null
          from_score?: number | null
          id?: string
          success?: boolean
          to_grade?: string | null
          to_score?: number | null
          user_id: string
        }
        Update: {
          action_result?: Json
          automation_id?: string
          contact_id?: string
          fired_at?: string
          from_grade?: string | null
          from_score?: number | null
          id?: string
          success?: boolean
          to_grade?: string | null
          to_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_score_threshold_log_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "lead_score_threshold_automations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_score_thresholds: {
        Row: {
          created_at: string
          grade: string
          id: string
          min_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          grade: string
          id?: string
          min_score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          grade?: string
          id?: string
          min_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_scores: {
        Row: {
          computed_at: string
          contact_id: string
          created_at: string
          decay_applied_at: string
          engagement_score: number
          fit_score: number
          grade: string
          id: string
          intent_score: number
          last_calculated_at: string
          previous_score: number | null
          relationship_score: number
          score_change: number | null
          score_factors: Json
          total_score: number
          updated_at: string
          user_id: string
          weight_engagement: number
          weight_fit: number
          weight_intent: number
          weight_relationship: number
        }
        Insert: {
          computed_at?: string
          contact_id: string
          created_at?: string
          decay_applied_at?: string
          engagement_score?: number
          fit_score?: number
          grade?: string
          id?: string
          intent_score?: number
          last_calculated_at?: string
          previous_score?: number | null
          relationship_score?: number
          score_change?: number | null
          score_factors?: Json
          total_score?: number
          updated_at?: string
          user_id: string
          weight_engagement?: number
          weight_fit?: number
          weight_intent?: number
          weight_relationship?: number
        }
        Update: {
          computed_at?: string
          contact_id?: string
          created_at?: string
          decay_applied_at?: string
          engagement_score?: number
          fit_score?: number
          grade?: string
          id?: string
          intent_score?: number
          last_calculated_at?: string
          previous_score?: number | null
          relationship_score?: number
          score_change?: number | null
          score_factors?: Json
          total_score?: number
          updated_at?: string
          user_id?: string
          weight_engagement?: number
          weight_fit?: number
          weight_intent?: number
          weight_relationship?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_scores_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      life_events: {
        Row: {
          contact_id: string
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          last_reminded_at: string | null
          recurring: boolean | null
          reminder_days_before: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          description?: string | null
          event_date: string
          event_type: string
          id?: string
          last_reminded_at?: string | null
          recurring?: boolean | null
          reminder_days_before?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          last_reminded_at?: string | null
          recurring?: boolean | null
          reminder_days_before?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          blocked_reason: string | null
          created_at: string | null
          email: string
          id: string
          ip_address: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked_reason?: string | null
          created_at?: string | null
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked_reason?: string | null
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      lux_intelligence: {
        Row: {
          ai_report: string | null
          ai_summary: string | null
          audience_analysis: Json | null
          completed_at: string | null
          created_at: string
          entity_id: string
          entity_type: string
          error_message: string | null
          fields_updated: Json | null
          fiscal_data: Json | null
          id: string
          n8n_execution_id: string | null
          personal_profile: Json | null
          request_type: string
          social_analysis: Json | null
          social_profiles: Json | null
          stakeholders: Json | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_report?: string | null
          ai_summary?: string | null
          audience_analysis?: Json | null
          completed_at?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          error_message?: string | null
          fields_updated?: Json | null
          fiscal_data?: Json | null
          id?: string
          n8n_execution_id?: string | null
          personal_profile?: Json | null
          request_type?: string
          social_analysis?: Json | null
          social_profiles?: Json | null
          stakeholders?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_report?: string | null
          ai_summary?: string | null
          audience_analysis?: Json | null
          completed_at?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          fields_updated?: Json | null
          fiscal_data?: Json | null
          id?: string
          n8n_execution_id?: string | null
          personal_profile?: Json | null
          request_type?: string
          social_analysis?: Json | null
          social_profiles?: Json | null
          stakeholders?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lux_webhook_config: {
        Row: {
          created_at: string | null
          entity_type: string
          headers: Json | null
          id: string
          is_active: boolean | null
          last_test_at: string | null
          last_test_status: string | null
          max_retries: number | null
          timeout_ms: number | null
          updated_at: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          entity_type: string
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_test_at?: string | null
          last_test_status?: string | null
          max_retries?: number | null
          timeout_ms?: number | null
          updated_at?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          entity_type?: string
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_test_at?: string | null
          last_test_status?: string | null
          max_retries?: number | null
          timeout_ms?: number | null
          updated_at?: string | null
          webhook_url?: string
        }
        Relationships: []
      }
      mcp_tool_calls: {
        Row: {
          arguments_summary: Json
          connection_id: string | null
          created_at: string
          error_message: string | null
          id: string
          latency_ms: number | null
          status: string
          tool_name: string
        }
        Insert: {
          arguments_summary?: Json
          connection_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          status: string
          tool_name: string
        }
        Update: {
          arguments_summary?: Json
          connection_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          status?: string
          tool_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_tool_calls_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connection_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_summaries: {
        Row: {
          action_items: Json | null
          created_at: string
          duration_minutes: number | null
          generated_by_model: string | null
          id: string
          interaction_id: string
          key_decisions: string[] | null
          next_steps: string[] | null
          participants: string[] | null
          sentiment_overview: string | null
          summary: string
          topics: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_items?: Json | null
          created_at?: string
          duration_minutes?: number | null
          generated_by_model?: string | null
          id?: string
          interaction_id: string
          key_decisions?: string[] | null
          next_steps?: string[] | null
          participants?: string[] | null
          sentiment_overview?: string | null
          summary: string
          topics?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_items?: Json | null
          created_at?: string
          duration_minutes?: number | null
          generated_by_model?: string | null
          id?: string
          interaction_id?: string
          key_decisions?: string[] | null
          next_steps?: string[] | null
          participants?: string[] | null
          sentiment_overview?: string | null
          summary?: string
          topics?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_summaries_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      metaprogram_analysis: {
        Row: {
          analyzed_text: string | null
          away_from_score: number | null
          away_from_words: string[] | null
          contact_id: string
          created_at: string
          external_score: number | null
          external_words: string[] | null
          id: string
          interaction_id: string | null
          internal_score: number | null
          internal_words: string[] | null
          options_score: number | null
          options_words: string[] | null
          procedures_score: number | null
          procedures_words: string[] | null
          toward_score: number | null
          toward_words: string[] | null
          user_id: string
        }
        Insert: {
          analyzed_text?: string | null
          away_from_score?: number | null
          away_from_words?: string[] | null
          contact_id: string
          created_at?: string
          external_score?: number | null
          external_words?: string[] | null
          id?: string
          interaction_id?: string | null
          internal_score?: number | null
          internal_words?: string[] | null
          options_score?: number | null
          options_words?: string[] | null
          procedures_score?: number | null
          procedures_words?: string[] | null
          toward_score?: number | null
          toward_words?: string[] | null
          user_id: string
        }
        Update: {
          analyzed_text?: string | null
          away_from_score?: number | null
          away_from_words?: string[] | null
          contact_id?: string
          created_at?: string
          external_score?: number | null
          external_words?: string[] | null
          id?: string
          interaction_id?: string | null
          internal_score?: number | null
          internal_words?: string[] | null
          options_score?: number | null
          options_words?: string[] | null
          procedures_score?: number | null
          procedures_words?: string[] | null
          toward_score?: number | null
          toward_words?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      mql_classifications: {
        Row: {
          contact_id: string
          created_at: string
          criteria_id: string | null
          handoff_assignment_id: string | null
          handoff_at: string | null
          handoff_to: string | null
          id: string
          notes: string | null
          qualified_at: string
          reason: string | null
          score_snapshot: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          criteria_id?: string | null
          handoff_assignment_id?: string | null
          handoff_at?: string | null
          handoff_to?: string | null
          id?: string
          notes?: string | null
          qualified_at?: string
          reason?: string | null
          score_snapshot?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          criteria_id?: string | null
          handoff_assignment_id?: string | null
          handoff_at?: string | null
          handoff_to?: string | null
          id?: string
          notes?: string | null
          qualified_at?: string
          reason?: string | null
          score_snapshot?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mql_classifications_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "mql_criteria"
            referencedColumns: ["id"]
          },
        ]
      }
      mql_criteria: {
        Row: {
          auto_handoff: boolean
          conditions: Json
          created_at: string
          description: string | null
          handoff_to_role: string
          id: string
          is_active: boolean
          name: string
          priority: number
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_handoff?: boolean
          conditions?: Json
          created_at?: string
          description?: string | null
          handoff_to_role?: string
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_handoff?: boolean
          conditions?: Json
          created_at?: string
          description?: string | null
          handoff_to_role?: string
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          digest_mode: string
          enabled_channels: string[]
          min_urgency_email: string
          min_urgency_push: string
          quiet_hours_end: number
          quiet_hours_start: number
          updated_at: string
          user_id: string
          weekend_silence: boolean
        }
        Insert: {
          created_at?: string
          digest_mode?: string
          enabled_channels?: string[]
          min_urgency_email?: string
          min_urgency_push?: string
          quiet_hours_end?: number
          quiet_hours_start?: number
          updated_at?: string
          user_id: string
          weekend_silence?: boolean
        }
        Update: {
          created_at?: string
          digest_mode?: string
          enabled_channels?: string[]
          min_urgency_email?: string
          min_urgency_push?: string
          quiet_hours_end?: number
          quiet_hours_start?: number
          updated_at?: string
          user_id?: string
          weekend_silence?: boolean
        }
        Relationships: []
      }
      nurturing_enrollments: {
        Row: {
          completed_at: string | null
          contact_id: string
          created_at: string
          current_step: number | null
          enrolled_at: string
          id: string
          next_action_at: string | null
          status: string | null
          user_id: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          contact_id: string
          created_at?: string
          current_step?: number | null
          enrolled_at?: string
          id?: string
          next_action_at?: string | null
          status?: string | null
          user_id: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string
          created_at?: string
          current_step?: number | null
          enrolled_at?: string
          id?: string
          next_action_at?: string | null
          status?: string | null
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nurturing_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurturing_enrollments_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "nurturing_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      nurturing_executions: {
        Row: {
          completed_at: string | null
          contact_id: string
          context: Json
          created_at: string
          current_step: number
          error_message: string | null
          id: string
          last_action_at: string | null
          next_action_at: string | null
          started_at: string
          status: string
          updated_at: string
          user_id: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          contact_id: string
          context?: Json
          created_at?: string
          current_step?: number
          error_message?: string | null
          id?: string
          last_action_at?: string | null
          next_action_at?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string
          context?: Json
          created_at?: string
          current_step?: number
          error_message?: string | null
          id?: string
          last_action_at?: string | null
          next_action_at?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nurturing_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "nurturing_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      nurturing_workflows: {
        Row: {
          completed_count: number | null
          created_at: string
          description: string | null
          enrolled_count: number | null
          id: string
          is_active: boolean | null
          name: string
          steps: Json | null
          trigger_config: Json | null
          trigger_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_count?: number | null
          created_at?: string
          description?: string | null
          enrolled_count?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          steps?: Json | null
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_count?: number | null
          created_at?: string
          description?: string | null
          enrolled_count?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          steps?: Json | null
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      objection_example_feedback: {
        Row: {
          category: string | null
          created_at: string
          id: string
          interaction_id: string
          is_useful: boolean
          objection: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          interaction_id: string
          is_useful?: boolean
          objection: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          interaction_id?: string
          is_useful?: boolean
          objection?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offer_suggestions: {
        Row: {
          confidence_score: number | null
          contact_id: string
          created_at: string
          expires_at: string | null
          id: string
          offer_category: string | null
          offer_name: string
          presented_at: string | null
          reason: string
          result: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          contact_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          offer_category?: string | null
          offer_name: string
          presented_at?: string | null
          reason: string
          result?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          contact_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          offer_category?: string | null
          offer_name?: string
          presented_at?: string | null
          reason?: string
          result?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_suggestions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_requests: {
        Row: {
          approved_by: string | null
          created_at: string | null
          email: string
          id: string
          reason: string | null
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          email: string
          id?: string
          reason?: string | null
          resolved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          email?: string
          id?: string
          reason?: string | null
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      people_intelligence_events: {
        Row: {
          confidence: number
          contact_id: string
          created_at: string
          detected_at: string
          event_type: string
          field_name: string | null
          id: string
          metadata: Json
          new_value: string | null
          old_value: string | null
          source: string
          user_id: string
        }
        Insert: {
          confidence?: number
          contact_id: string
          created_at?: string
          detected_at?: string
          event_type: string
          field_name?: string | null
          id?: string
          metadata?: Json
          new_value?: string | null
          old_value?: string | null
          source?: string
          user_id: string
        }
        Update: {
          confidence?: number
          contact_id?: string
          created_at?: string
          detected_at?: string
          event_type?: string
          field_name?: string | null
          id?: string
          metadata?: Json
          new_value?: string | null
          old_value?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_intelligence_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          module: string
          name: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          module: string
          name: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          module?: string
          name?: string
        }
        Relationships: []
      }
      phone_validations: {
        Row: {
          carrier: string | null
          contact_id: string | null
          country: string | null
          country_code: string | null
          created_at: string
          id: string
          is_active: boolean | null
          line_type: string | null
          phone_e164: string | null
          phone_input: string
          provider: string
          raw: Json
          reasons: string[]
          status: string
          updated_at: string
          user_id: string
          validated_at: string
        }
        Insert: {
          carrier?: string | null
          contact_id?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          line_type?: string | null
          phone_e164?: string | null
          phone_input: string
          provider?: string
          raw?: Json
          reasons?: string[]
          status?: string
          updated_at?: string
          user_id: string
          validated_at?: string
        }
        Update: {
          carrier?: string | null
          contact_id?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          line_type?: string | null
          phone_e164?: string | null
          phone_input?: string
          provider?: string
          raw?: Json
          reasons?: string[]
          status?: string
          updated_at?: string
          user_id?: string
          validated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_validations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_usage_log: {
        Row: {
          action: string
          battle_card_id: string | null
          contact_id: string | null
          context: Json | null
          deal_id: string | null
          id: string
          opened_at: string
          playbook_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          battle_card_id?: string | null
          contact_id?: string | null
          context?: Json | null
          deal_id?: string | null
          id?: string
          opened_at?: string
          playbook_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          battle_card_id?: string | null
          contact_id?: string | null
          context?: Json | null
          deal_id?: string | null
          id?: string
          opened_at?: string
          playbook_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_usage_log_battle_card_id_fkey"
            columns: ["battle_card_id"]
            isOneToOne: false
            referencedRelation: "battle_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_usage_log_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "sales_playbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          nlp_profile: Json | null
          phone: string | null
          preferences: Json | null
          role_title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          nlp_profile?: Json | null
          phone?: string | null
          preferences?: Json | null
          role_title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          nlp_profile?: Json | null
          phone?: string | null
          preferences?: Json | null
          role_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proximo_passo_feedback: {
        Row: {
          channel_used: string | null
          contact_id: string
          created_at: string
          executed_at: string
          id: string
          notes: string | null
          outcome: Database["public"]["Enums"]["passo_outcome"]
          passo_id: string
          user_id: string
        }
        Insert: {
          channel_used?: string | null
          contact_id: string
          created_at?: string
          executed_at?: string
          id?: string
          notes?: string | null
          outcome: Database["public"]["Enums"]["passo_outcome"]
          passo_id: string
          user_id: string
        }
        Update: {
          channel_used?: string | null
          contact_id?: string
          created_at?: string
          executed_at?: string
          id?: string
          notes?: string | null
          outcome?: Database["public"]["Enums"]["passo_outcome"]
          passo_id?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_history: {
        Row: {
          amount: number | null
          contact_id: string
          created_at: string
          cycle_months: number | null
          id: string
          notes: string | null
          product_category: string | null
          product_name: string
          purchase_date: string
          renewal_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          contact_id: string
          created_at?: string
          cycle_months?: number | null
          id?: string
          notes?: string | null
          product_category?: string | null
          product_name: string
          purchase_date?: string
          renewal_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          contact_id?: string
          created_at?: string
          cycle_months?: number | null
          id?: string
          notes?: string | null
          product_category?: string | null
          product_name?: string
          purchase_date?: string
          renewal_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      query_telemetry: {
        Row: {
          count_mode: string | null
          created_at: string
          duration_ms: number
          error_message: string | null
          id: string
          operation: string
          query_limit: number | null
          query_offset: number | null
          record_count: number | null
          rpc_name: string | null
          severity: string
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          count_mode?: string | null
          created_at?: string
          duration_ms?: number
          error_message?: string | null
          id?: string
          operation: string
          query_limit?: number | null
          query_offset?: number | null
          record_count?: number | null
          rpc_name?: string | null
          severity?: string
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          count_mode?: string | null
          created_at?: string
          duration_ms?: number
          error_message?: string | null
          id?: string
          operation?: string
          query_limit?: number | null
          query_offset?: number | null
          record_count?: number | null
          rpc_name?: string | null
          severity?: string
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      redistribution_log: {
        Row: {
          auto_triggered: boolean
          company_id: string | null
          contact_id: string | null
          created_at: string
          from_member_id: string | null
          id: string
          inactivity_days: number | null
          notes: string | null
          reason: string
          to_member_id: string | null
          user_id: string
        }
        Insert: {
          auto_triggered?: boolean
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          from_member_id?: string | null
          id?: string
          inactivity_days?: number | null
          notes?: string | null
          reason?: string
          to_member_id?: string | null
          user_id: string
        }
        Update: {
          auto_triggered?: boolean
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          from_member_id?: string | null
          id?: string
          inactivity_days?: number | null
          notes?: string | null
          reason?: string
          to_member_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redistribution_log_from_member_id_fkey"
            columns: ["from_member_id"]
            isOneToOne: false
            referencedRelation: "sales_team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redistribution_log_to_member_id_fkey"
            columns: ["to_member_id"]
            isOneToOne: false
            referencedRelation: "sales_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      revops_alerts: {
        Row: {
          created_at: string
          current_value: number | null
          dismissed: boolean
          expected_value: number | null
          id: string
          message: string
          metric_key: string
          period: string | null
          severity: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          dismissed?: boolean
          expected_value?: number | null
          id?: string
          message: string
          metric_key: string
          period?: string | null
          severity: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          dismissed?: boolean
          expected_value?: number | null
          id?: string
          message?: string
          metric_key?: string
          period?: string | null
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      revops_benchmarks: {
        Row: {
          created_at: string
          critical_threshold: number
          description: string | null
          id: string
          metric_key: string
          target_value: number
          updated_at: string
          user_id: string
          warning_threshold: number
        }
        Insert: {
          created_at?: string
          critical_threshold?: number
          description?: string | null
          id?: string
          metric_key: string
          target_value: number
          updated_at?: string
          user_id: string
          warning_threshold?: number
        }
        Update: {
          created_at?: string
          critical_threshold?: number
          description?: string | null
          id?: string
          metric_key?: string
          target_value?: number
          updated_at?: string
          user_id?: string
          warning_threshold?: number
        }
        Relationships: []
      }
      revops_snapshots: {
        Row: {
          avg_velocity_days: number | null
          captured_at: string
          conversion_rate: number | null
          count: number
          created_at: string
          funnel_stage: string
          id: string
          period: string
          total_value: number | null
          user_id: string
        }
        Insert: {
          avg_velocity_days?: number | null
          captured_at?: string
          conversion_rate?: number | null
          count?: number
          created_at?: string
          funnel_stage: string
          id?: string
          period: string
          total_value?: number | null
          user_id: string
        }
        Update: {
          avg_velocity_days?: number | null
          captured_at?: string
          conversion_rate?: number | null
          count?: number
          created_at?: string
          funnel_stage?: string
          id?: string
          period?: string
          total_value?: number | null
          user_id?: string
        }
        Relationships: []
      }
      rfm_analysis: {
        Row: {
          analyzed_at: string
          average_order_value: number | null
          churn_probability: number | null
          communication_priority: string | null
          contact_id: string
          created_at: string
          days_since_last_interaction: number | null
          days_since_last_purchase: number | null
          frequency_score: number
          frequency_trend: string | null
          id: string
          monetary_score: number
          monetary_trend: string | null
          overall_trend: string | null
          predicted_lifetime_value: number | null
          predicted_next_purchase_date: string | null
          recency_score: number
          recency_trend: string | null
          recommended_actions: Json | null
          recommended_offers: Json | null
          rfm_score: number | null
          segment: string
          segment_color: string | null
          segment_description: string | null
          total_interactions: number | null
          total_monetary_value: number | null
          total_purchases: number | null
          total_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analyzed_at?: string
          average_order_value?: number | null
          churn_probability?: number | null
          communication_priority?: string | null
          contact_id: string
          created_at?: string
          days_since_last_interaction?: number | null
          days_since_last_purchase?: number | null
          frequency_score: number
          frequency_trend?: string | null
          id?: string
          monetary_score: number
          monetary_trend?: string | null
          overall_trend?: string | null
          predicted_lifetime_value?: number | null
          predicted_next_purchase_date?: string | null
          recency_score: number
          recency_trend?: string | null
          recommended_actions?: Json | null
          recommended_offers?: Json | null
          rfm_score?: number | null
          segment: string
          segment_color?: string | null
          segment_description?: string | null
          total_interactions?: number | null
          total_monetary_value?: number | null
          total_purchases?: number | null
          total_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analyzed_at?: string
          average_order_value?: number | null
          churn_probability?: number | null
          communication_priority?: string | null
          contact_id?: string
          created_at?: string
          days_since_last_interaction?: number | null
          days_since_last_purchase?: number | null
          frequency_score?: number
          frequency_trend?: string | null
          id?: string
          monetary_score?: number
          monetary_trend?: string | null
          overall_trend?: string | null
          predicted_lifetime_value?: number | null
          predicted_next_purchase_date?: string | null
          recency_score?: number
          recency_trend?: string | null
          recommended_actions?: Json | null
          recommended_offers?: Json | null
          rfm_score?: number | null
          segment?: string
          segment_color?: string | null
          segment_description?: string | null
          total_interactions?: number | null
          total_monetary_value?: number | null
          total_purchases?: number | null
          total_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfm_analysis_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      rfm_history: {
        Row: {
          contact_id: string
          created_at: string
          frequency_score: number
          id: string
          monetary_score: number
          recency_score: number
          recorded_at: string
          segment: string
          total_monetary_value: number | null
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          frequency_score: number
          id?: string
          monetary_score: number
          recency_score: number
          recorded_at?: string
          segment: string
          total_monetary_value?: number | null
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          frequency_score?: number
          id?: string
          monetary_score?: number
          recency_score?: number
          recorded_at?: string
          segment?: string
          total_monetary_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfm_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      rfm_metrics: {
        Row: {
          about_to_sleep_count: number | null
          at_risk_count: number | null
          average_monetary_value: number | null
          average_rfm_score: number | null
          cant_lose_count: number | null
          champions_count: number | null
          created_at: string
          hibernating_count: number | null
          id: string
          lost_count: number | null
          loyal_count: number | null
          needing_attention_count: number | null
          period_end: string
          period_start: string
          period_type: string
          potential_loyalist_count: number | null
          promising_count: number | null
          recent_customers_count: number | null
          segment_transitions: Json | null
          total_contacts_analyzed: number | null
          total_revenue: number | null
          user_id: string
        }
        Insert: {
          about_to_sleep_count?: number | null
          at_risk_count?: number | null
          average_monetary_value?: number | null
          average_rfm_score?: number | null
          cant_lose_count?: number | null
          champions_count?: number | null
          created_at?: string
          hibernating_count?: number | null
          id?: string
          lost_count?: number | null
          loyal_count?: number | null
          needing_attention_count?: number | null
          period_end: string
          period_start: string
          period_type: string
          potential_loyalist_count?: number | null
          promising_count?: number | null
          recent_customers_count?: number | null
          segment_transitions?: Json | null
          total_contacts_analyzed?: number | null
          total_revenue?: number | null
          user_id: string
        }
        Update: {
          about_to_sleep_count?: number | null
          at_risk_count?: number | null
          average_monetary_value?: number | null
          average_rfm_score?: number | null
          cant_lose_count?: number | null
          champions_count?: number | null
          created_at?: string
          hibernating_count?: number | null
          id?: string
          lost_count?: number | null
          loyal_count?: number | null
          needing_attention_count?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          potential_loyalist_count?: number | null
          promising_count?: number | null
          recent_customers_count?: number | null
          segment_transitions?: Json | null
          total_contacts_analyzed?: number | null
          total_revenue?: number | null
          user_id?: string
        }
        Relationships: []
      }
      rfm_segment_config: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          email_template: string | null
          frequency_max: number
          frequency_min: number
          icon: string | null
          id: string
          monetary_max: number
          monetary_min: number
          priority: number | null
          recency_max: number
          recency_min: number
          recommended_actions: Json | null
          segment_key: string
          segment_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          email_template?: string | null
          frequency_max?: number
          frequency_min?: number
          icon?: string | null
          id?: string
          monetary_max?: number
          monetary_min?: number
          priority?: number | null
          recency_max?: number
          recency_min?: number
          recommended_actions?: Json | null
          segment_key: string
          segment_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          email_template?: string | null
          frequency_max?: number
          frequency_min?: number
          icon?: string | null
          id?: string
          monetary_max?: number
          monetary_min?: number
          priority?: number | null
          recency_max?: number
          recency_min?: number
          recommended_actions?: Json | null
          segment_key?: string
          segment_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_playbooks: {
        Row: {
          active: boolean
          content: Json
          created_at: string
          description: string | null
          id: string
          industry_target: string | null
          name: string
          persona_target: string | null
          scenario: string
          stage_target: string | null
          tags: string[]
          updated_at: string
          usage_count: number
          user_id: string
          version: number
        }
        Insert: {
          active?: boolean
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          industry_target?: string | null
          name: string
          persona_target?: string | null
          scenario: string
          stage_target?: string | null
          tags?: string[]
          updated_at?: string
          usage_count?: number
          user_id: string
          version?: number
        }
        Update: {
          active?: boolean
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          industry_target?: string | null
          name?: string
          persona_target?: string | null
          scenario?: string
          stage_target?: string | null
          tags?: string[]
          updated_at?: string
          usage_count?: number
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      sales_team_members: {
        Row: {
          created_at: string
          current_lead_count: number
          email: string | null
          id: string
          is_active: boolean
          last_assigned_at: string | null
          leads_today: number
          leads_today_reset_at: string | null
          manager_id: string | null
          max_leads_day: number
          max_leads_total: number
          name: string
          profile_user_id: string | null
          role: string
          specializations: string[] | null
          territories: string[] | null
          updated_at: string
          user_id: string
          vacation_end: string | null
          vacation_start: string | null
          weight: number
        }
        Insert: {
          created_at?: string
          current_lead_count?: number
          email?: string | null
          id?: string
          is_active?: boolean
          last_assigned_at?: string | null
          leads_today?: number
          leads_today_reset_at?: string | null
          manager_id?: string | null
          max_leads_day?: number
          max_leads_total?: number
          name: string
          profile_user_id?: string | null
          role?: string
          specializations?: string[] | null
          territories?: string[] | null
          updated_at?: string
          user_id: string
          vacation_end?: string | null
          vacation_start?: string | null
          weight?: number
        }
        Update: {
          created_at?: string
          current_lead_count?: number
          email?: string | null
          id?: string
          is_active?: boolean
          last_assigned_at?: string | null
          leads_today?: number
          leads_today_reset_at?: string | null
          manager_id?: string | null
          max_leads_day?: number
          max_leads_total?: number
          name?: string
          profile_user_id?: string | null
          role?: string
          specializations?: string[] | null
          territories?: string[] | null
          updated_at?: string
          user_id?: string
          vacation_end?: string | null
          vacation_start?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_team_members_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "sales_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_drift_alerts: {
        Row: {
          created_at: string | null
          entity_name: string
          entity_type: string
          error_message: string | null
          error_type: string
          id: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_name: string
          entity_type: string
          error_message?: string | null
          error_type: string
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_name?: string
          entity_type?: string
          error_message?: string | null
          error_type?: string
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      score_history: {
        Row: {
          calculated_at: string
          contact_id: string
          created_at: string
          factors: Json | null
          id: string
          metadata: Json | null
          previous_value: number | null
          score_type: string
          score_value: number
          user_id: string
        }
        Insert: {
          calculated_at?: string
          contact_id: string
          created_at?: string
          factors?: Json | null
          id?: string
          metadata?: Json | null
          previous_value?: number | null
          score_type: string
          score_value: number
          user_id: string
        }
        Update: {
          calculated_at?: string
          contact_id?: string
          created_at?: string
          factors?: Json | null
          id?: string
          metadata?: Json | null
          previous_value?: number | null
          score_type?: string
          score_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      search_products_cache: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          external_id: string | null
          id: string
          image_url: string | null
          metadata: Json | null
          name: string
          price: number | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name: string
          price?: number | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name?: string
          price?: number | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      secret_rotation_log: {
        Row: {
          created_at: string
          id: string
          is_automatic: boolean | null
          new_hash: string | null
          old_hash: string | null
          reason: string | null
          rotated_at: string
          rotated_by: string | null
          secret_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_automatic?: boolean | null
          new_hash?: string | null
          old_hash?: string | null
          reason?: string | null
          rotated_at?: string
          rotated_by?: string | null
          secret_name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_automatic?: boolean | null
          new_hash?: string | null
          old_hash?: string | null
          reason?: string | null
          rotated_at?: string
          rotated_by?: string | null
          secret_name?: string
        }
        Relationships: []
      }
      semantic_search_cache: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          query_hash: string
          query_text: string
          results: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          query_hash: string
          query_text: string
          results?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          query_hash?: string
          query_text?: string
          results?: Json
          user_id?: string
        }
        Relationships: []
      }
      sentiment_annotations: {
        Row: {
          category: string
          contact_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          title: string
          updated_at: string
          week_start: string
        }
        Insert: {
          category: string
          contact_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          week_start: string
        }
        Update: {
          category?: string
          contact_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "sentiment_annotations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_enrollments: {
        Row: {
          completed_at: string | null
          contact_id: string
          created_at: string
          current_step: number
          enrolled_at: string
          id: string
          last_event_at: string | null
          last_step_executed_at: string | null
          last_step_sent_at: string | null
          next_action_at: string | null
          replied_at: string | null
          sequence_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          contact_id: string
          created_at?: string
          current_step?: number
          enrolled_at?: string
          id?: string
          last_event_at?: string | null
          last_step_executed_at?: string | null
          last_step_sent_at?: string | null
          next_action_at?: string | null
          replied_at?: string | null
          sequence_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string
          created_at?: string
          current_step?: number
          enrolled_at?: string
          id?: string
          last_event_at?: string | null
          last_step_executed_at?: string | null
          last_step_sent_at?: string | null
          next_action_at?: string | null
          replied_at?: string | null
          sequence_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequence_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_events: {
        Row: {
          contact_id: string
          created_at: string
          enrollment_id: string
          event_type: string
          id: string
          metadata: Json | null
          sequence_id: string
          step_order: number | null
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          enrollment_id: string
          event_type: string
          id?: string
          metadata?: Json | null
          sequence_id: string
          step_order?: number | null
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          enrollment_id?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          sequence_id?: string
          step_order?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequence_events_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "sequence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_events_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_send_log: {
        Row: {
          channel: string
          clicked_at: string | null
          contact_id: string
          created_at: string
          enrollment_id: string
          error_message: string | null
          id: string
          message_id: string | null
          opened_at: string | null
          sent_at: string
          sequence_id: string
          status: string
          step_id: string
          step_order: number
          tracking_token: string | null
          user_id: string
        }
        Insert: {
          channel: string
          clicked_at?: string | null
          contact_id: string
          created_at?: string
          enrollment_id: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          opened_at?: string | null
          sent_at?: string
          sequence_id: string
          status?: string
          step_id: string
          step_order: number
          tracking_token?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          clicked_at?: string | null
          contact_id?: string
          created_at?: string
          enrollment_id?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          opened_at?: string | null
          sent_at?: string
          sequence_id?: string
          status?: string
          step_id?: string
          step_order?: number
          tracking_token?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequence_send_log_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "sequence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_send_log_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_send_log_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "sequence_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_steps: {
        Row: {
          branch_on_no_step: number | null
          branch_on_yes_step: number | null
          channel: string
          condition_type: string
          condition_wait_hours: number
          created_at: string
          delay_days: number
          delay_hours: number
          id: string
          message_template: string | null
          notes: string | null
          sequence_id: string
          step_order: number
          subject: string | null
          updated_at: string
        }
        Insert: {
          branch_on_no_step?: number | null
          branch_on_yes_step?: number | null
          channel: string
          condition_type?: string
          condition_wait_hours?: number
          created_at?: string
          delay_days?: number
          delay_hours?: number
          id?: string
          message_template?: string | null
          notes?: string | null
          sequence_id: string
          step_order?: number
          subject?: string | null
          updated_at?: string
        }
        Update: {
          branch_on_no_step?: number | null
          branch_on_yes_step?: number | null
          channel?: string
          condition_type?: string
          condition_wait_hours?: number
          created_at?: string
          delay_days?: number
          delay_hours?: number
          id?: string
          message_template?: string | null
          notes?: string | null
          sequence_id?: string
          step_order?: number
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      sequences: {
        Row: {
          created_at: string
          description: string | null
          id: string
          max_enrollments: number | null
          name: string
          pause_on_meeting: boolean
          pause_on_reply: boolean
          status: string
          total_completed: number
          total_enrolled: number
          total_replied: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          max_enrollments?: number | null
          name: string
          pause_on_meeting?: boolean
          pause_on_reply?: boolean
          status?: string
          total_completed?: number
          total_enrolled?: number
          total_replied?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          max_enrollments?: number | null
          name?: string
          pause_on_meeting?: boolean
          pause_on_reply?: boolean
          status?: string
          total_completed?: number
          total_enrolled?: number
          total_replied?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      smart_notifications: {
        Row: {
          action_url: string | null
          body: string | null
          bundle_count: number
          bundle_key: string | null
          clicked_at: string | null
          created_at: string
          decided_channel: string
          decision_reason: string | null
          delivered_at: string | null
          dismissed_at: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          payload: Json
          scheduled_for: string
          snoozed_until: string | null
          status: string
          title: string
          urgency: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          bundle_count?: number
          bundle_key?: string | null
          clicked_at?: string | null
          created_at?: string
          decided_channel?: string
          decision_reason?: string | null
          delivered_at?: string | null
          dismissed_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          payload?: Json
          scheduled_for?: string
          snoozed_until?: string | null
          status?: string
          title: string
          urgency?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          bundle_count?: number
          bundle_key?: string | null
          clicked_at?: string | null
          created_at?: string
          decided_channel?: string
          decision_reason?: string | null
          delivered_at?: string | null
          dismissed_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          payload?: Json
          scheduled_for?: string
          snoozed_until?: string | null
          status?: string
          title?: string
          urgency?: string
          user_id?: string
        }
        Relationships: []
      }
      sms_campaign_recipients: {
        Row: {
          campaign_id: string
          contact_id: string
          cost_cents: number | null
          created_at: string
          delivered_at: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          phone: string
          provider_message_id: string | null
          replied_at: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          contact_id: string
          cost_cents?: number | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          phone: string
          provider_message_id?: string | null
          replied_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          contact_id?: string
          cost_cents?: number | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          phone?: string
          provider_message_id?: string | null
          replied_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sms_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_campaign_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_campaigns: {
        Row: {
          cost_estimate_cents: number
          created_at: string
          id: string
          message: string
          name: string
          scheduled_at: string | null
          segment_filter: Json
          sender_id: string | null
          sent_at: string | null
          status: string
          total_delivered: number
          total_failed: number
          total_opt_outs: number
          total_recipients: number
          total_replies: number
          total_sent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_estimate_cents?: number
          created_at?: string
          id?: string
          message: string
          name: string
          scheduled_at?: string | null
          segment_filter?: Json
          sender_id?: string | null
          sent_at?: string | null
          status?: string
          total_delivered?: number
          total_failed?: number
          total_opt_outs?: number
          total_recipients?: number
          total_replies?: number
          total_sent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_estimate_cents?: number
          created_at?: string
          id?: string
          message?: string
          name?: string
          scheduled_at?: string | null
          segment_filter?: Json
          sender_id?: string | null
          sent_at?: string | null
          status?: string
          total_delivered?: number
          total_failed?: number
          total_opt_outs?: number
          total_recipients?: number
          total_replies?: number
          total_sent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sms_opt_outs: {
        Row: {
          contact_id: string | null
          id: string
          opted_out_at: string
          phone: string
          reason: string | null
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          id?: string
          opted_out_at?: string
          phone: string
          reason?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string | null
          id?: string
          opted_out_at?: string
          phone?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_opt_outs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_templates: {
        Row: {
          body: string
          category: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          usage_count: number
          user_id: string
          variables: Json
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          usage_count?: number
          user_id: string
          variables?: Json
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
          variables?: Json
        }
        Relationships: []
      }
      social_behavior_analysis: {
        Row: {
          active_days: string[] | null
          active_hours: Json | null
          analysis_date: string
          communication_style: Json | null
          confidence: number | null
          contact_id: string
          created_at: string
          executive_summary: string | null
          hashtags: string[] | null
          id: string
          influence_level: string | null
          influence_score: number | null
          interests: string[] | null
          keywords: string[] | null
          overall_sentiment: string | null
          personality_traits: Json | null
          sales_insights: Json | null
          sentiment_score: number | null
          topics: string[] | null
          user_id: string
          valuable_connections: Json | null
        }
        Insert: {
          active_days?: string[] | null
          active_hours?: Json | null
          analysis_date?: string
          communication_style?: Json | null
          confidence?: number | null
          contact_id: string
          created_at?: string
          executive_summary?: string | null
          hashtags?: string[] | null
          id?: string
          influence_level?: string | null
          influence_score?: number | null
          interests?: string[] | null
          keywords?: string[] | null
          overall_sentiment?: string | null
          personality_traits?: Json | null
          sales_insights?: Json | null
          sentiment_score?: number | null
          topics?: string[] | null
          user_id: string
          valuable_connections?: Json | null
        }
        Update: {
          active_days?: string[] | null
          active_hours?: Json | null
          analysis_date?: string
          communication_style?: Json | null
          confidence?: number | null
          contact_id?: string
          created_at?: string
          executive_summary?: string | null
          hashtags?: string[] | null
          id?: string
          influence_level?: string | null
          influence_score?: number | null
          interests?: string[] | null
          keywords?: string[] | null
          overall_sentiment?: string | null
          personality_traits?: Json | null
          sales_insights?: Json | null
          sentiment_score?: number | null
          topics?: string[] | null
          user_id?: string
          valuable_connections?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "social_behavior_analysis_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_life_events: {
        Row: {
          confidence: number | null
          contact_id: string
          created_at: string
          dismissed: boolean | null
          event_date: string | null
          event_description: string | null
          event_title: string
          event_type: string
          id: string
          metadata: Json | null
          new_value: string | null
          notified: boolean | null
          platform: string
          previous_value: string | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          contact_id: string
          created_at?: string
          dismissed?: boolean | null
          event_date?: string | null
          event_description?: string | null
          event_title: string
          event_type: string
          id?: string
          metadata?: Json | null
          new_value?: string | null
          notified?: boolean | null
          platform: string
          previous_value?: string | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          contact_id?: string
          created_at?: string
          dismissed?: boolean | null
          event_date?: string | null
          event_description?: string | null
          event_title?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          new_value?: string | null
          notified?: boolean | null
          platform?: string
          previous_value?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_life_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_profiles: {
        Row: {
          certifications: string[] | null
          connections_count: number | null
          contact_id: string
          cover_image_url: string | null
          created_at: string
          current_company: string | null
          current_position: string | null
          education: Json | null
          engagement_metrics: Json | null
          experience: Json | null
          followers_count: number | null
          following_count: number | null
          headline: string | null
          id: string
          last_scraped_at: string
          location: string | null
          platform: string
          profile_data: Json | null
          profile_image_url: string | null
          profile_url: string | null
          recent_posts: Json | null
          skills: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          certifications?: string[] | null
          connections_count?: number | null
          contact_id: string
          cover_image_url?: string | null
          created_at?: string
          current_company?: string | null
          current_position?: string | null
          education?: Json | null
          engagement_metrics?: Json | null
          experience?: Json | null
          followers_count?: number | null
          following_count?: number | null
          headline?: string | null
          id?: string
          last_scraped_at?: string
          location?: string | null
          platform: string
          profile_data?: Json | null
          profile_image_url?: string | null
          profile_url?: string | null
          recent_posts?: Json | null
          skills?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          certifications?: string[] | null
          connections_count?: number | null
          contact_id?: string
          cover_image_url?: string | null
          created_at?: string
          current_company?: string | null
          current_position?: string | null
          education?: Json | null
          engagement_metrics?: Json | null
          experience?: Json | null
          followers_count?: number | null
          following_count?: number | null
          headline?: string | null
          id?: string
          last_scraped_at?: string
          location?: string | null
          platform?: string
          profile_data?: Json | null
          profile_image_url?: string | null
          profile_url?: string | null
          recent_posts?: Json | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_profiles_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_scraping_schedule: {
        Row: {
          consecutive_failures: number | null
          contact_id: string
          created_at: string
          enabled: boolean | null
          frequency_days: number | null
          id: string
          last_error: string | null
          last_run_at: string | null
          next_run_at: string | null
          platform: string
          priority: string | null
          profile_url: string
          updated_at: string
          user_id: string
        }
        Insert: {
          consecutive_failures?: number | null
          contact_id: string
          created_at?: string
          enabled?: boolean | null
          frequency_days?: number | null
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          next_run_at?: string | null
          platform: string
          priority?: string | null
          profile_url: string
          updated_at?: string
          user_id: string
        }
        Update: {
          consecutive_failures?: number | null
          contact_id?: string
          created_at?: string
          enabled?: boolean | null
          frequency_days?: number | null
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          next_run_at?: string | null
          platform?: string
          priority?: string | null
          profile_url?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_scraping_schedule_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      stakeholder_alerts: {
        Row: {
          alert_type: string
          company_id: string | null
          contact_id: string | null
          created_at: string
          current_value: Json | null
          description: string | null
          dismissed: boolean | null
          dismissed_at: string | null
          id: string
          previous_value: Json | null
          recommended_action: string | null
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          alert_type: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          current_value?: Json | null
          description?: string | null
          dismissed?: boolean | null
          dismissed_at?: string | null
          id?: string
          previous_value?: Json | null
          recommended_action?: string | null
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          alert_type?: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          current_value?: Json | null
          description?: string | null
          dismissed?: boolean | null
          dismissed_at?: string | null
          id?: string
          previous_value?: Json | null
          recommended_action?: string | null
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stakeholder_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakeholder_alerts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          description: string | null
          first_response_at: string | null
          id: string
          priority: string
          resolved_at: string | null
          sla_deadline: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          first_response_at?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          first_response_at?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "sales_team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      system_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          consumed_pct: number
          created_at: string
          id: string
          message: string
          metadata: Json
          severity: string
          threshold_pct: number
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          consumed_pct: number
          created_at?: string
          id?: string
          message: string
          metadata?: Json
          severity: string
          threshold_pct: number
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          consumed_pct?: number
          created_at?: string
          id?: string
          message?: string
          metadata?: Json
          severity?: string
          threshold_pct?: number
        }
        Relationships: []
      }
      system_health_snapshots: {
        Row: {
          components: Json
          created_at: string
          id: string
          status: string
          timestamp: string
          total_latency_ms: number | null
        }
        Insert: {
          components?: Json
          created_at?: string
          id?: string
          status: string
          timestamp?: string
          total_latency_ms?: number | null
        }
        Update: {
          components?: Json
          created_at?: string
          id?: string
          status?: string
          timestamp?: string
          total_latency_ms?: number | null
        }
        Relationships: []
      }
      ticket_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_internal: boolean | null
          ticket_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          ticket_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      trigger_ab_tests: {
        Row: {
          completed_at: string | null
          confidence: number | null
          contact_id: string | null
          created_at: string
          disc_profile: string | null
          id: string
          is_active: boolean | null
          name: string
          started_at: string
          updated_at: string
          user_id: string
          variant_a_avg_rating: number | null
          variant_a_conversions: number | null
          variant_a_template: string | null
          variant_a_trigger: string
          variant_a_uses: number | null
          variant_b_avg_rating: number | null
          variant_b_conversions: number | null
          variant_b_template: string | null
          variant_b_trigger: string
          variant_b_uses: number | null
          winner: string | null
        }
        Insert: {
          completed_at?: string | null
          confidence?: number | null
          contact_id?: string | null
          created_at?: string
          disc_profile?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          started_at?: string
          updated_at?: string
          user_id: string
          variant_a_avg_rating?: number | null
          variant_a_conversions?: number | null
          variant_a_template?: string | null
          variant_a_trigger: string
          variant_a_uses?: number | null
          variant_b_avg_rating?: number | null
          variant_b_conversions?: number | null
          variant_b_template?: string | null
          variant_b_trigger: string
          variant_b_uses?: number | null
          winner?: string | null
        }
        Update: {
          completed_at?: string | null
          confidence?: number | null
          contact_id?: string | null
          created_at?: string
          disc_profile?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          started_at?: string
          updated_at?: string
          user_id?: string
          variant_a_avg_rating?: number | null
          variant_a_conversions?: number | null
          variant_a_template?: string | null
          variant_a_trigger?: string
          variant_a_uses?: number | null
          variant_b_avg_rating?: number | null
          variant_b_conversions?: number | null
          variant_b_template?: string | null
          variant_b_trigger?: string
          variant_b_uses?: number | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trigger_ab_tests_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      trigger_bundles: {
        Row: {
          created_at: string
          disc_profiles: string[] | null
          id: string
          is_system_bundle: boolean | null
          metaprograms: string[] | null
          name: string
          neural_path: Json | null
          scenario: string
          sequence_timing: Json | null
          success_rate: number | null
          total_uses: number | null
          triggers: string[]
          updated_at: string
          user_id: string
          vak_profiles: string[] | null
        }
        Insert: {
          created_at?: string
          disc_profiles?: string[] | null
          id?: string
          is_system_bundle?: boolean | null
          metaprograms?: string[] | null
          name: string
          neural_path?: Json | null
          scenario: string
          sequence_timing?: Json | null
          success_rate?: number | null
          total_uses?: number | null
          triggers: string[]
          updated_at?: string
          user_id: string
          vak_profiles?: string[] | null
        }
        Update: {
          created_at?: string
          disc_profiles?: string[] | null
          id?: string
          is_system_bundle?: boolean | null
          metaprograms?: string[] | null
          name?: string
          neural_path?: Json | null
          scenario?: string
          sequence_timing?: Json | null
          success_rate?: number | null
          total_uses?: number | null
          triggers?: string[]
          updated_at?: string
          user_id?: string
          vak_profiles?: string[] | null
        }
        Relationships: []
      }
      trigger_channel_effectiveness: {
        Row: {
          channel: string
          contact_id: string | null
          created_at: string
          effectiveness_score: number | null
          id: string
          last_used_at: string | null
          successes: number | null
          trigger_type: string
          updated_at: string
          user_id: string
          uses: number | null
        }
        Insert: {
          channel: string
          contact_id?: string | null
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          last_used_at?: string | null
          successes?: number | null
          trigger_type: string
          updated_at?: string
          user_id: string
          uses?: number | null
        }
        Update: {
          channel?: string
          contact_id?: string | null
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          last_used_at?: string | null
          successes?: number | null
          trigger_type?: string
          updated_at?: string
          user_id?: string
          uses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trigger_channel_effectiveness_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      trigger_intensity_history: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          intensity_level: number
          interaction_id: string | null
          notes: string | null
          result: string | null
          trigger_type: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          intensity_level: number
          interaction_id?: string | null
          notes?: string | null
          result?: string | null
          trigger_type: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          intensity_level?: number
          interaction_id?: string | null
          notes?: string | null
          result?: string | null
          trigger_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trigger_intensity_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trigger_intensity_history_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      trigger_usage_history: {
        Row: {
          channel: string | null
          contact_id: string
          context: string | null
          created_at: string
          effectiveness_rating: number | null
          id: string
          notes: string | null
          result: string | null
          scenario: string | null
          template_id: string | null
          template_title: string | null
          trigger_type: string
          used_at: string
          user_id: string
        }
        Insert: {
          channel?: string | null
          contact_id: string
          context?: string | null
          created_at?: string
          effectiveness_rating?: number | null
          id?: string
          notes?: string | null
          result?: string | null
          scenario?: string | null
          template_id?: string | null
          template_title?: string | null
          trigger_type: string
          used_at?: string
          user_id: string
        }
        Update: {
          channel?: string | null
          contact_id?: string
          context?: string | null
          created_at?: string
          effectiveness_rating?: number | null
          id?: string
          notes?: string | null
          result?: string | null
          scenario?: string | null
          template_id?: string | null
          template_title?: string | null
          trigger_type?: string
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_known_devices: {
        Row: {
          browser: string | null
          created_at: string | null
          device_fingerprint: string
          device_name: string | null
          id: string
          is_trusted: boolean | null
          last_used_at: string | null
          os: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_fingerprint: string
          device_name?: string | null
          id?: string
          is_trusted?: boolean | null
          last_used_at?: string | null
          os?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_fingerprint?: string
          device_name?: string | null
          id?: string
          is_trusted?: boolean | null
          last_used_at?: string | null
          os?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_ui_preferences: {
        Row: {
          created_at: string
          id: string
          preferences: Json
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferences?: Json
          scope: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferences?: Json
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vak_analysis_history: {
        Row: {
          analyzed_text: string | null
          auditory_score: number | null
          auditory_words: string[] | null
          contact_id: string
          created_at: string
          digital_score: number | null
          digital_words: string[] | null
          id: string
          interaction_id: string | null
          kinesthetic_score: number | null
          kinesthetic_words: string[] | null
          user_id: string
          visual_score: number | null
          visual_words: string[] | null
        }
        Insert: {
          analyzed_text?: string | null
          auditory_score?: number | null
          auditory_words?: string[] | null
          contact_id: string
          created_at?: string
          digital_score?: number | null
          digital_words?: string[] | null
          id?: string
          interaction_id?: string | null
          kinesthetic_score?: number | null
          kinesthetic_words?: string[] | null
          user_id: string
          visual_score?: number | null
          visual_words?: string[] | null
        }
        Update: {
          analyzed_text?: string | null
          auditory_score?: number | null
          auditory_words?: string[] | null
          contact_id?: string
          created_at?: string
          digital_score?: number | null
          digital_words?: string[] | null
          id?: string
          interaction_id?: string | null
          kinesthetic_score?: number | null
          kinesthetic_words?: string[] | null
          user_id?: string
          visual_score?: number | null
          visual_words?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "vak_analysis_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vak_analysis_history_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_queue: {
        Row: {
          attempts: number
          contact_id: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["validation_kind"]
          last_error: string | null
          processed_at: string | null
          status: Database["public"]["Enums"]["validation_queue_status"]
          user_id: string
          value: string
        }
        Insert: {
          attempts?: number
          contact_id?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["validation_kind"]
          last_error?: string | null
          processed_at?: string | null
          status?: Database["public"]["Enums"]["validation_queue_status"]
          user_id: string
          value: string
        }
        Update: {
          attempts?: number
          contact_id?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["validation_kind"]
          last_error?: string | null
          processed_at?: string | null
          status?: Database["public"]["Enums"]["validation_queue_status"]
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      visit_checkins: {
        Row: {
          address: string | null
          check_in_at: string
          check_out_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          latitude: number
          longitude: number
          notes: string | null
          photo_url: string | null
          user_id: string
          visit_type: string | null
        }
        Insert: {
          address?: string | null
          check_in_at?: string
          check_out_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          latitude: number
          longitude: number
          notes?: string | null
          photo_url?: string | null
          user_id: string
          visit_type?: string | null
        }
        Update: {
          address?: string | null
          check_in_at?: string
          check_out_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          latitude?: number
          longitude?: number
          notes?: string | null
          photo_url?: string | null
          user_id?: string
          visit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_checkins_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_checkins_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      webauthn_credentials: {
        Row: {
          created_at: string | null
          credential_id: string
          id: string
          label: string | null
          last_used_at: string | null
          public_key: string
          sign_count: number | null
          transports: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credential_id: string
          id?: string
          label?: string | null
          last_used_at?: string | null
          public_key: string
          sign_count?: number | null
          transports?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credential_id?: string
          id?: string
          label?: string | null
          last_used_at?: string | null
          public_key?: string
          sign_count?: number | null
          transports?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      weekly_report_settings: {
        Row: {
          created_at: string
          email_address: string | null
          enabled: boolean | null
          id: string
          include_at_risk_clients: boolean | null
          include_health_alerts: boolean | null
          include_performance_metrics: boolean | null
          include_portfolio_summary: boolean | null
          include_recommendations: boolean | null
          include_upcoming_dates: boolean | null
          last_sent_at: string | null
          send_day: string | null
          send_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_address?: string | null
          enabled?: boolean | null
          id?: string
          include_at_risk_clients?: boolean | null
          include_health_alerts?: boolean | null
          include_performance_metrics?: boolean | null
          include_portfolio_summary?: boolean | null
          include_recommendations?: boolean | null
          include_upcoming_dates?: boolean | null
          last_sent_at?: string | null
          send_day?: string | null
          send_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_address?: string | null
          enabled?: boolean | null
          id?: string
          include_at_risk_clients?: boolean | null
          include_health_alerts?: boolean | null
          include_performance_metrics?: boolean | null
          include_portfolio_summary?: boolean | null
          include_recommendations?: boolean | null
          include_upcoming_dates?: boolean | null
          last_sent_at?: string | null
          send_day?: string | null
          send_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          created_at: string
          id: string
          report_data: Json
          sent_via: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          report_data: Json
          sent_via?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          report_data?: Json
          sent_via?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_ingestion_logs: {
        Row: {
          contact_id: string | null
          created_at: string
          details: Json | null
          event_type: string
          id: string
          message_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          message_id?: string | null
          status: string
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          message_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_ingestion_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          auto_read_messages: boolean | null
          auto_reply_enabled: boolean | null
          auto_reply_message: string | null
          created_at: string
          display_name: string | null
          id: string
          instance_name: string
          last_connected_at: string | null
          phone_number: string | null
          profile_pic_url: string | null
          settings: Json | null
          status: string | null
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          auto_read_messages?: boolean | null
          auto_reply_enabled?: boolean | null
          auto_reply_message?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          instance_name: string
          last_connected_at?: string | null
          phone_number?: string | null
          profile_pic_url?: string | null
          settings?: Json | null
          status?: string | null
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          auto_read_messages?: boolean | null
          auto_reply_enabled?: boolean | null
          auto_reply_message?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          instance_name?: string
          last_connected_at?: string | null
          phone_number?: string | null
          profile_pic_url?: string | null
          settings?: Json | null
          status?: string | null
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      whatsapp_kpis: {
        Row: {
          avg_response_time_seconds: number | null
          created_at: string
          delivery_rate: number | null
          id: string
          instance_name: string
          messages_delivered: number | null
          messages_read: number | null
          messages_received: number | null
          messages_sent: number | null
          period_end: string
          period_start: string
          read_rate: number | null
          unique_contacts: number | null
          user_id: string
        }
        Insert: {
          avg_response_time_seconds?: number | null
          created_at?: string
          delivery_rate?: number | null
          id?: string
          instance_name: string
          messages_delivered?: number | null
          messages_read?: number | null
          messages_received?: number | null
          messages_sent?: number | null
          period_end: string
          period_start: string
          read_rate?: number | null
          unique_contacts?: number | null
          user_id: string
        }
        Update: {
          avg_response_time_seconds?: number | null
          created_at?: string
          delivery_rate?: number | null
          id?: string
          instance_name?: string
          messages_delivered?: number | null
          messages_read?: number | null
          messages_received?: number | null
          messages_sent?: number | null
          period_end?: string
          period_start?: string
          read_rate?: number | null
          unique_contacts?: number | null
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          contact_id: string | null
          content: string | null
          created_at: string
          delivered_at: string | null
          from_me: boolean
          id: string
          instance_name: string
          media_mimetype: string | null
          media_url: string | null
          message_id: string | null
          message_type: string
          metadata: Json | null
          played_at: string | null
          quoted_message_id: string | null
          read_at: string | null
          remote_jid: string
          sender_name: string | null
          status: string | null
          timestamp: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          content?: string | null
          created_at?: string
          delivered_at?: string | null
          from_me?: boolean
          id?: string
          instance_name: string
          media_mimetype?: string | null
          media_url?: string | null
          message_id?: string | null
          message_type?: string
          metadata?: Json | null
          played_at?: string | null
          quoted_message_id?: string | null
          read_at?: string | null
          remote_jid: string
          sender_name?: string | null
          status?: string | null
          timestamp?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string | null
          content?: string | null
          created_at?: string
          delivered_at?: string | null
          from_me?: boolean
          id?: string
          instance_name?: string
          media_mimetype?: string | null
          media_url?: string | null
          message_id?: string | null
          message_type?: string
          metadata?: Json | null
          played_at?: string | null
          quoted_message_id?: string | null
          read_at?: string | null
          remote_jid?: string
          sender_name?: string | null
          status?: string | null
          timestamp?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_transcriptions: {
        Row: {
          confidence: number | null
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          provider: string | null
          whatsapp_message_id: string
        }
        Insert: {
          confidence?: number | null
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          whatsapp_message_id: string
        }
        Update: {
          confidence?: number | null
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          whatsapp_message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_transcriptions_whatsapp_message_id_fkey"
            columns: ["whatsapp_message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      win_loss_insights: {
        Row: {
          created_at: string
          description: string
          generated_at: string
          id: string
          insight_type: string
          period_end: string
          period_start: string
          severity: string
          supporting_data: Json | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          generated_at?: string
          id?: string
          insight_type: string
          period_end: string
          period_start: string
          severity?: string
          supporting_data?: Json | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          generated_at?: string
          id?: string
          insight_type?: string
          period_end?: string
          period_start?: string
          severity?: string
          supporting_data?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      win_loss_reasons: {
        Row: {
          active: boolean
          category: string
          created_at: string
          id: string
          label: string
          outcome_type: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          id?: string
          label: string
          outcome_type?: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          label?: string
          outcome_type?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      win_loss_records: {
        Row: {
          competitor_id: string | null
          created_at: string
          deal_id: string
          deal_value: number | null
          decision_maker_contact_id: string | null
          id: string
          lessons_learned: string | null
          notes: string | null
          outcome: string
          primary_reason_id: string | null
          recorded_at: string
          sales_cycle_days: number | null
          secondary_reasons: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          competitor_id?: string | null
          created_at?: string
          deal_id: string
          deal_value?: number | null
          decision_maker_contact_id?: string | null
          id?: string
          lessons_learned?: string | null
          notes?: string | null
          outcome: string
          primary_reason_id?: string | null
          recorded_at?: string
          sales_cycle_days?: number | null
          secondary_reasons?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          competitor_id?: string | null
          created_at?: string
          deal_id?: string
          deal_value?: number | null
          decision_maker_contact_id?: string | null
          id?: string
          lessons_learned?: string | null
          notes?: string | null
          outcome?: string
          primary_reason_id?: string | null
          recorded_at?: string
          sales_cycle_days?: number | null
          secondary_reasons?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "win_loss_records_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "win_loss_records_primary_reason_id_fkey"
            columns: ["primary_reason_id"]
            isOneToOne: false
            referencedRelation: "win_loss_reasons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      csat_surveys_public: {
        Row: {
          channel: string | null
          expires_at: string | null
          id: string | null
          public_token: string | null
          score: number | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          channel?: string | null
          expires_at?: string | null
          id?: string | null
          public_token?: string | null
          score?: number | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          channel?: string | null
          expires_at?: string | null
          id?: string | null
          public_token?: string | null
          score?: number | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      document_signatures_public: {
        Row: {
          expires_at: string | null
          id: string | null
          rendered_html: string | null
          signature_token: string | null
          signed_at: string | null
          signer_email: string | null
          signer_name: string | null
          status: string | null
          viewed_at: string | null
        }
        Insert: {
          expires_at?: string | null
          id?: string | null
          rendered_html?: string | null
          signature_token?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string | null
          status?: string | null
          viewed_at?: string | null
        }
        Update: {
          expires_at?: string | null
          id?: string | null
          rendered_html?: string | null
          signature_token?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string | null
          status?: string | null
          viewed_at?: string | null
        }
        Relationships: []
      }
      forms_public: {
        Row: {
          description: string | null
          fields: Json | null
          id: string | null
          name: string | null
          redirect_url: string | null
          slug: string | null
          success_message: string | null
        }
        Insert: {
          description?: string | null
          fields?: Json | null
          id?: string | null
          name?: string | null
          redirect_url?: string | null
          slug?: string | null
          success_message?: string | null
        }
        Update: {
          description?: string | null
          fields?: Json | null
          id?: string | null
          name?: string | null
          redirect_url?: string | null
          slug?: string | null
          success_message?: string | null
        }
        Relationships: []
      }
      landing_pages_public: {
        Row: {
          blocks: Json | null
          description: string | null
          id: string | null
          redirect_url: string | null
          slug: string | null
          theme: Json | null
          title: string | null
        }
        Insert: {
          blocks?: Json | null
          description?: string | null
          id?: string | null
          redirect_url?: string | null
          slug?: string | null
          theme?: Json | null
          title?: string | null
        }
        Update: {
          blocks?: Json | null
          description?: string | null
          id?: string | null
          redirect_url?: string | null
          slug?: string | null
          theme?: Json | null
          title?: string | null
        }
        Relationships: []
      }
      push_subscriptions_safe: {
        Row: {
          created_at: string | null
          endpoint: string | null
          id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint?: string | null
          id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string | null
          id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _connection_encryption_key: { Args: never; Returns: string }
      buyer_add_comment: {
        Args: { _body: string; _label?: string; _token: string }
        Returns: string
      }
      buyer_toggle_milestone: {
        Args: {
          _done: boolean
          _label?: string
          _milestone_id: string
          _token: string
        }
        Returns: boolean
      }
      cleanup_old_health_snapshots: { Args: never; Returns: number }
      compute_account_health: { Args: { _account_id: string }; Returns: Json }
      compute_attribution: {
        Args: { _deal_id: string; _deal_value?: number; _model?: string }
        Returns: Json
      }
      compute_revops_kpis: {
        Args: { _period_end: string; _period_start: string; _user_id: string }
        Returns: Json
      }
      cs_renewal_pipeline: {
        Args: { _days_ahead?: number; _user_id: string }
        Returns: Json
      }
      decrypt_connection_config: {
        Args: { p_encrypted: string }
        Returns: Json
      }
      dismiss_revops_alert: { Args: { _alert_id: string }; Returns: boolean }
      encrypt_connection_config: { Args: { p_config: Json }; Returns: string }
      enqueue_smart_notification: {
        Args: {
          _action_url?: string
          _body?: string
          _bundle_key?: string
          _entity_id?: string
          _entity_type?: string
          _event_type: string
          _payload?: Json
          _title: string
          _urgency?: string
        }
        Returns: string
      }
      enroll_contact_in_workflow: {
        Args: { _contact_id: string; _workflow_id: string }
        Returns: string
      }
      evaluate_mql: { Args: { _contact_id: string }; Returns: Json }
      execute_readonly_query: { Args: { query_text: string }; Returns: Json }
      get_buyer_document_path: {
        Args: { _document_id: string; _token: string }
        Returns: string
      }
      get_connection_metrics: {
        Args: { _connection_id: string }
        Returns: {
          failures: number
          p50: number
          p95: number
          p99: number
          success_rate: number
          total_calls: number
        }[]
      }
      get_deal_room_by_token: { Args: { _token: string }; Returns: Json }
      get_team_member_ids: {
        Args: { _manager_user_id: string }
        Returns: string[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      immutable_unaccent: { Args: { "": string }; Returns: string }
      increment_form_view: { Args: { _slug: string }; Returns: undefined }
      increment_magnet_view: { Args: { _slug: string }; Returns: undefined }
      increment_webhook_quota: { Args: { _webhook_id: string }; Returns: Json }
      record_buyer_view: {
        Args: { _label?: string; _token: string }
        Returns: boolean
      }
      reset_daily_lead_counts: { Args: never; Returns: number }
      search_companies_semantic: {
        Args: {
          p_limit?: number
          p_min_similarity?: number
          p_query: string
          p_user_id: string
        }
        Returns: {
          city: string
          id: string
          industry: string
          name: string
          similarity: number
          state: string
        }[]
      }
      search_companies_unaccent: {
        Args: { p_limit?: number; p_query: string; p_user_id: string }
        Returns: {
          city: string
          id: string
          industry: string
          name: string
          state: string
        }[]
      }
      search_contacts_semantic: {
        Args: {
          p_limit?: number
          p_min_similarity?: number
          p_query: string
          p_user_id: string
        }
        Returns: {
          company_id: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
          role_title: string
          similarity: number
        }[]
      }
      search_contacts_unaccent: {
        Args: { p_limit?: number; p_query: string; p_user_id: string }
        Returns: {
          company_id: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
          role_title: string
        }[]
      }
      search_interactions_semantic: {
        Args: {
          p_limit?: number
          p_min_similarity?: number
          p_query: string
          p_user_id: string
        }
        Returns: {
          contact_id: string
          created_at: string
          id: string
          similarity: number
          title: string
          type: string
        }[]
      }
      search_interactions_unaccent: {
        Args: { p_limit?: number; p_query: string; p_user_id: string }
        Returns: {
          contact_id: string
          created_at: string
          id: string
          title: string
          type: string
        }[]
      }
      search_products_semantic: {
        Args: {
          p_limit?: number
          p_min_similarity?: number
          p_query: string
          p_user_id: string
        }
        Returns: {
          category: string
          description: string
          external_id: string
          id: string
          image_url: string
          metadata: Json
          name: string
          price: number
          similarity: number
          tags: string[]
        }[]
      }
      seed_conversation_topics: {
        Args: { _user_id: string }
        Returns: undefined
      }
      seed_deal_room: {
        Args: {
          _company_id: string
          _deal_id: string
          _deal_name: string
          _title: string
          _user_id: string
        }
        Returns: string
      }
      seed_forecast_period: {
        Args: { _type: string; _user_id: string }
        Returns: string
      }
      seed_lead_score_defaults: {
        Args: { _user_id: string }
        Returns: undefined
      }
      seed_playbook_defaults: { Args: { _user_id: string }; Returns: undefined }
      seed_win_loss_defaults: { Args: { _user_id: string }; Returns: undefined }
      submit_public_form: {
        Args: {
          _data: Json
          _page_url?: string
          _slug: string
          _user_agent?: string
          _utms?: Json
        }
        Returns: Json
      }
      track_magnet_download: {
        Args: { _email: string; _name?: string; _slug: string; _utms?: Json }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      error_severity: "info" | "warning" | "error" | "critical"
      passo_outcome:
        | "respondeu_positivo"
        | "respondeu_neutro"
        | "nao_respondeu"
        | "nao_atendeu"
        | "pulou"
      validation_kind: "email" | "phone"
      validation_queue_status: "pending" | "processing" | "done" | "error"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      error_severity: ["info", "warning", "error", "critical"],
      passo_outcome: [
        "respondeu_positivo",
        "respondeu_neutro",
        "nao_respondeu",
        "nao_atendeu",
        "pulou",
      ],
      validation_kind: ["email", "phone"],
      validation_queue_status: ["pending", "processing", "done", "error"],
    },
  },
} as const

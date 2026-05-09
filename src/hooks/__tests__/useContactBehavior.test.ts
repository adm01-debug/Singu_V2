import { expect, test, describe, beforeAll } from "vitest";
import { supabase } from "@/integrations/supabase/client";

// This is a regression test for behavioral data consistency and audit logging
describe("Behavioral Data Integration Tests", () => {
  const testContactId = "00000000-0000-0000-0000-000000000001"; // Assume a seed or specific test contact

  test("should enforce range constraints on contact_behavior", async () => {
    // Try to update with invalid confidence
    const { error } = await supabase
      .from("contact_behavior")
      .upsert({ 
        contact_id: testContactId, 
        disc_confidence: 150 // Invalid (> 100)
      });
    
    expect(error).toBeDefined();
    expect(error?.message).toContain("disc_confidence_range");
  });

  test("should detect gaps via RPC", async () => {
    const { data, error } = await supabase.rpc("get_contact_behavior_gaps", {
      p_contact_id: testContactId
    });

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  test("should log changes to audit table", async () => {
    // Perform a valid update
    await supabase
      .from("contact_behavior")
      .upsert({ 
        contact_id: testContactId, 
        disc_primary: 'D',
        disc_confidence: 85
      });

    // Check if audit log exists
    const { data, error } = await supabase
      .from("crm_relationship_audit_logs")
      .select("*")
      .eq("contact_id", testContactId)
      .order("created_at", { ascending: false })
      .limit(1);

    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThan(0);
  });

  test("should enforce MBTI pattern constraint", async () => {
    const { error } = await supabase
      .from("contact_personality")
      .upsert({ 
        contact_id: testContactId, 
        mbti_type: 'INVALID' // Should fail regex
      });
    
    expect(error).toBeDefined();
  });

  test("should store and retrieve NLP metaprograms", async () => {
    const { error } = await supabase
      .from("contact_metaprograms")
      .upsert({ 
        contact_id: testContactId, 
        toward_score: 80,
        away_from_score: 20
      });
    
    expect(error).toBeNull();

    const { data } = await supabase
      .from("contact_metaprograms")
      .select("*")
      .eq("contact_id", testContactId)
      .single();

    expect(data.toward_score).toBe(80);
  });

  test("should handle life events and triggers", async () => {
    const { error } = await supabase
      .from("life_events")
      .insert({ 
        contact_id: testContactId, 
        event_type: 'birthday',
        title: 'Aniversário de Teste',
        event_date: new Date().toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id
      });
    
    expect(error).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import {
  contactFormSchema,
  companyFormSchema,
  interactionFormSchema,
  uuidSchema,
  emailSchema,
  phoneSchema,
  cnpjSchema,
   urlSchema,
 } from "@/domain/validationSchemas";

// ─── UUID ───
describe("uuidSchema", () => {
  it("accepts valid UUID", () => {
    expect(uuidSchema.safeParse("550e8400-e29b-41d4-a716-446655440000").success).toBe(true);
  });
  it("rejects invalid UUID", () => {
    expect(uuidSchema.safeParse("not-a-uuid").success).toBe(false);
  });
  it("rejects empty string", () => {
    expect(uuidSchema.safeParse("").success).toBe(false);
  });
});

// ─── Email ───
describe("emailSchema", () => {
  it("accepts valid email", () => {
    const r = emailSchema.safeParse("test@example.com");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("test@example.com");
  });
  it("trims and lowercases valid email", () => {
    const r = emailSchema.safeParse("test@example.com");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("test@example.com");
  });
  it("accepts empty string", () => {
    expect(emailSchema.safeParse("").success).toBe(true);
  });
  it("accepts null", () => {
    expect(emailSchema.safeParse(null).success).toBe(true);
  });
  it("rejects invalid email", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });
});

// ─── Phone ───
describe("phoneSchema", () => {
  it("accepts valid phone", () => {
    expect(phoneSchema.safeParse("+55 (11) 99999-9999").success).toBe(true);
  });
  it("rejects letters", () => {
    expect(phoneSchema.safeParse("abc123").success).toBe(false);
  });
  it("accepts null", () => {
    expect(phoneSchema.safeParse(null).success).toBe(true);
  });
});

// ─── CNPJ ───
describe("cnpjSchema", () => {
  it("accepts formatted CNPJ", () => {
    expect(cnpjSchema.safeParse("12.345.678/0001-99").success).toBe(true);
  });
  it("accepts raw 14 digits", () => {
    expect(cnpjSchema.safeParse("12345678000199").success).toBe(true);
  });
  it("rejects partial CNPJ", () => {
    expect(cnpjSchema.safeParse("1234567800").success).toBe(false);
  });
  it("accepts empty string", () => {
    expect(cnpjSchema.safeParse("").success).toBe(true);
  });
});

// ─── URL ───
describe("urlSchema", () => {
  it("accepts valid URL", () => {
    expect(urlSchema.safeParse("https://example.com").success).toBe(true);
  });
  it("rejects invalid URL", () => {
    expect(urlSchema.safeParse("not a url").success).toBe(false);
  });
  it("accepts null", () => {
    expect(urlSchema.safeParse(null).success).toBe(true);
  });
});

// ─── Contact Form ───
describe("contactFormSchema", () => {
  const validContact = {
    first_name: "João",
    last_name: "Silva",
    email: "joao@test.com",
    phone: "+55 11 99999-9999",
  };

  it("validates a complete contact", () => {
    expect(contactFormSchema.safeParse(validContact).success).toBe(true);
  });

  it("requires first_name", () => {
    const r = contactFormSchema.safeParse({ ...validContact, first_name: "" });
    expect(r.success).toBe(false);
  });

  it("requires last_name", () => {
    const r = contactFormSchema.safeParse({ ...validContact, last_name: "" });
    expect(r.success).toBe(false);
  });

  it("trims names", () => {
    const r = contactFormSchema.safeParse({ ...validContact, first_name: "  João  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.first_name).toBe("João");
  });

  it("accepts optional fields as null", () => {
    const r = contactFormSchema.safeParse({
      first_name: "João",
      last_name: "Silva",
      email: null,
      phone: null,
      notes: null,
    });
    expect(r.success).toBe(true);
  });

  it("rejects name exceeding 100 chars", () => {
    const r = contactFormSchema.safeParse({ ...validContact, first_name: "A".repeat(101) });
    expect(r.success).toBe(false);
  });

  it("validates relationship_stage enum", () => {
    expect(contactFormSchema.safeParse({ ...validContact, relationship_stage: "lead" }).success).toBe(true);
    expect(contactFormSchema.safeParse({ ...validContact, relationship_stage: "invalid" }).success).toBe(false);
  });

  it("limits tags array to 20", () => {
    const tags = Array.from({ length: 21 }, (_, i) => `tag-${i}`);
    expect(contactFormSchema.safeParse({ ...validContact, tags }).success).toBe(false);
  });
});

// ─── Company Form ───
describe("companyFormSchema", () => {
  const validCompany = { name: "Acme Corp" };

  it("validates minimal company", () => {
    expect(companyFormSchema.safeParse(validCompany).success).toBe(true);
  });

  it("requires name", () => {
    expect(companyFormSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("validates CNPJ format", () => {
    expect(companyFormSchema.safeParse({ ...validCompany, cnpj: "12.345.678/0001-99" }).success).toBe(true);
    expect(companyFormSchema.safeParse({ ...validCompany, cnpj: "invalid" }).success).toBe(false);
  });

  it("accepts boolean classification fields", () => {
    const r = companyFormSchema.safeParse({
      ...validCompany,
      is_customer: true,
      is_supplier: false,
      is_carrier: null,
    });
    expect(r.success).toBe(true);
  });

  it("validates capital_social as positive number", () => {
    expect(companyFormSchema.safeParse({ ...validCompany, capital_social: 100000 }).success).toBe(true);
    expect(companyFormSchema.safeParse({ ...validCompany, capital_social: -1 }).success).toBe(false);
  });
});

// ─── Interaction Form ───
describe("interactionFormSchema", () => {
  const validInteraction = {
    title: "Reunião de alinhamento",
    type: "meeting",
    contact_id: "550e8400-e29b-41d4-a716-446655440000",
  };

  it("validates a complete interaction", () => {
    expect(interactionFormSchema.safeParse(validInteraction).success).toBe(true);
  });

  it("requires title", () => {
    expect(interactionFormSchema.safeParse({ ...validInteraction, title: "" }).success).toBe(false);
  });

  it("requires valid contact_id UUID", () => {
    expect(interactionFormSchema.safeParse({ ...validInteraction, contact_id: "not-uuid" }).success).toBe(false);
  });

  it("validates sentiment enum", () => {
    expect(interactionFormSchema.safeParse({ ...validInteraction, sentiment: "positive" }).success).toBe(true);
    expect(interactionFormSchema.safeParse({ ...validInteraction, sentiment: "invalid" }).success).toBe(false);
  });

  it("limits content to 50000 chars", () => {
    const r = interactionFormSchema.safeParse({ ...validInteraction, content: "A".repeat(50001) });
    expect(r.success).toBe(false);
  });
});

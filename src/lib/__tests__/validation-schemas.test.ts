 import { describe, it, expect } from "vitest";
 import { emailSchema, phoneSchema, contactFormSchema } from "@/domain/validationSchemas";
 
 describe("Validation Schemas Excellence", () => {
   describe("emailSchema", () => {
     it("should validate a valid email", () => {
       const result = emailSchema.safeParse("test@example.com");
       expect(result.success).toBe(true);
     });
 
     it("should normalize email to lowercase and trimmed", () => {
       const result = emailSchema.parse("  TEST@EXAMPLE.COM  ");
       expect(result).toBe("test@example.com");
     });
 
     it("should allow empty or null emails", () => {
       expect(emailSchema.safeParse("").success).toBe(true);
       expect(emailSchema.safeParse(null).success).toBe(true);
     });
 
     it("should fail on invalid email format", () => {
       const result = emailSchema.safeParse("invalid-email");
       expect(result.success).toBe(false);
     });
   });
 
   describe("phoneSchema", () => {
     it("should validate valid phone formats", () => {
       expect(phoneSchema.safeParse("+55 (11) 98888-7777").success).toBe(true);
       expect(phoneSchema.safeParse("1234567890").success).toBe(true);
     });
 
     it("should fail on non-phone characters", () => {
       expect(phoneSchema.safeParse("abc-123-def").success).toBe(false);
     });
   });
 
   describe("contactFormSchema", () => {
     it("should validate a complete valid contact", () => {
       const validContact = {
         first_name: "John",
         last_name: "Doe",
         email: "john.doe@example.com",
         phone: "11999999999",
         linkedin: "https://linkedin.com/in/johndoe",
       };
       const result = contactFormSchema.safeParse(validContact);
       expect(result.success).toBe(true);
     });
 
     it("should require first and last name", () => {
       const result = contactFormSchema.safeParse({ first_name: "", last_name: "" });
       expect(result.success).toBe(false);
     });
   });
 });

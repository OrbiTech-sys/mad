import { describe, expect, it } from "vitest";
import { BRANCHES } from "@/data/branches";
import { evaluateDelivery } from "../delivery";
import { buildDemoLocations } from "../demoLocations";
import { createCheckoutSchema, normalizePkMobile } from "../validation";

describe("normalizePkMobile", () => {
  it.each([
    ["0300 1234567", "03001234567"],
    ["0300-1234567", "03001234567"],
    ["03001234567", "03001234567"],
    ["+92 300 1234567", "03001234567"],
    ["+923001234567", "03001234567"],
    ["923001234567", "03001234567"],
    ["00923451234567", "03451234567"],
    ["3001234567", "03001234567"],
    ["(0321) 123 4567", "03211234567"],
  ])("accepts %s", (input, expected) => {
    expect(normalizePkMobile(input)).toBe(expected);
  });

  it.each([
    [""],
    ["0300123456"], // too short
    ["030012345678"], // too long
    ["04001234567"], // not a mobile prefix
    ["0355 1234567"], // 35x is not allocated
    ["042 35761234"], // Lahore landline
    ["abcdefghijk"],
    ["+1 202 555 0143"],
  ])("rejects %j", (input) => {
    expect(normalizePkMobile(input)).toBeNull();
  });
});

describe("checkout schema", () => {
  const valid = {
    fullName: "Ayesha Khan",
    phone: "0300 1234567",
    email: "",
    address: "House 12, Street 4, Block D2, Johar Town",
    instructions: "",
  };

  it("accepts a valid delivery order", () => {
    expect(createCheckoutSchema("delivery").safeParse(valid).success).toBe(true);
  });

  it("requires an address for delivery but not for pickup", () => {
    const noAddress = { ...valid, address: "" };
    expect(createCheckoutSchema("delivery").safeParse(noAddress).success).toBe(false);
    expect(createCheckoutSchema("pickup").safeParse(noAddress).success).toBe(true);
  });

  it("rejects short addresses for delivery", () => {
    expect(createCheckoutSchema("delivery").safeParse({ ...valid, address: "Johar" }).success).toBe(false);
  });

  it("requires name and a valid Pakistani mobile number", () => {
    const schema = createCheckoutSchema("pickup");
    expect(schema.safeParse({ ...valid, fullName: "" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, fullName: "A" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, phone: "" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, phone: "12345" }).success).toBe(false);
  });

  it("treats email as optional but validates it when present", () => {
    const schema = createCheckoutSchema("pickup");
    expect(schema.safeParse({ ...valid, email: "" }).success).toBe(true);
    expect(schema.safeParse({ ...valid, email: "ayesha@example.com" }).success).toBe(true);
    expect(schema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("limits the length of instructions", () => {
    expect(createCheckoutSchema("pickup").safeParse({ ...valid, instructions: "x".repeat(301) }).success).toBe(false);
  });
});

describe("demo locations (derived from the real branch coordinates)", () => {
  const scenarios = buildDemoLocations(BRANCHES);

  it("covers inside, overlap, both edges and far-away", () => {
    expect(scenarios.map((s) => s.id)).toEqual(["inside-first", "overlap", "edge-in", "edge-out", "far"]);
  });

  it.each(scenarios.map((s) => [s.label, s] as const))("%s behaves as labelled", (_label, scenario) => {
    const ev = evaluateDelivery(scenario.coords, BRANCHES);
    expect(ev.status).toBe(scenario.expect);
    if (scenario.id === "overlap") expect(ev.eligible.length).toBeGreaterThanOrEqual(2);
    if (scenario.id === "edge-in") expect(ev.eligible).toHaveLength(1);
  });

  it("returns nothing when no branch has verified coordinates", () => {
    expect(buildDemoLocations([])).toEqual([]);
  });
});

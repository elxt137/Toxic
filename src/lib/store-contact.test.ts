import { afterEach, describe, expect, it, vi } from "vitest";
import { getWhatsappNumber } from "./store-contact";

afterEach(() => vi.unstubAllEnvs());
describe("RC2 commercial contact", () => {
  it("uses RC2's international mobile number by default", () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", "");
    expect(getWhatsappNumber()).toBe("5492984252129");
  });
  it("allows an explicit deployment override", () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", "5491100000000");
    expect(getWhatsappNumber()).toBe("5491100000000");
  });
});

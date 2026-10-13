import { describe, expect, it } from "vitest";
import { checkPassword, MIN_PASSWORD } from "@/lib/password";

describe("checkPassword", () => {
  it("exige o tamanho mínimo", () => {
    expect(checkPassword("curta1!").problem).toMatch(String(MIN_PASSWORD));
  });
  it("recusa senhas comuns e repetidas", () => {
    expect(checkPassword("1234567890").problem).toMatch(/comum/);
    expect(checkPassword("aaaaaaaaaaaa").problem).toMatch(/comum/);
  });
  it("recusa senha que contém o e-mail", () => {
    expect(checkPassword("maria.silva2026!", "maria.silva@x.com").problem).toMatch(/e-mail/);
  });
  it("aceita senha longa e variada com nota alta", () => {
    const r = checkPassword("Cafe-com-leite-2026!", "a@b.com");
    expect(r.problem).toBeNull();
    expect(r.score).toBeGreaterThanOrEqual(3);
  });
  it("nota baixa para senha só aceitável", () => {
    const r = checkPassword("abcdefghij");
    expect(r.score).toBeLessThanOrEqual(1);
  });
});

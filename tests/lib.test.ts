import { describe, expect, it } from "vitest";
import { csvCell, toCSV } from "../src/lib/csv";
import { addMonths, daysLeftInMonth, monthRange } from "../src/lib/dates";
import { parseMoneyInput } from "../src/lib/money";

describe("parseMoneyInput", () => {
  it.each([["1.234,56", 1234.56], ["12,5", 12.5], ["R$ 8", 8], ["12.5", 12.5], ["1.234", 1234], ["0,99", 0.99]])("%s -> %s", (i, o) => expect(parseMoneyInput(i)).toBe(o));
  it.each([[""], ["abc"], ["-"]])("rejeita %j", (i) => expect(parseMoneyInput(i)).toBeNull());
});

describe("csv", () => {
  it("escapa aspas, separador e quebra de linha", () => expect(csvCell('a;"b"')).toBe('"a;""b"""'));
  it("neutraliza injeção de fórmula", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("-5")).toBe("'-5");
    expect(csvCell(-5)).toBe("-5"); // número real não é prefixado
  });
  it("gera BOM e separador ;", () => expect(toCSV(["a", "b"], [[1, "x"]])).toBe("﻿a;b\r\n1;x"));
});

describe("dates", () => {
  it("virada de ano", () => {
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
  });
  it("intervalo do mês inclui fevereiro bissexto", () => expect(monthRange({ year: 2028, month: 2 })).toEqual({ from: "2028-02-01", to: "2028-02-29" }));
  it("dias restantes contam hoje", () => {
    const now = new Date(2026, 9, 25);
    expect(daysLeftInMonth({ year: 2026, month: 10 }, now)).toBe(7);
    expect(daysLeftInMonth({ year: 2026, month: 9 }, now)).toBe(0);
    expect(daysLeftInMonth({ year: 2026, month: 11 }, now)).toBe(30);
  });
});

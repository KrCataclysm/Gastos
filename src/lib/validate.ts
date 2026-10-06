import type { z } from "zod";

/** Valida com Zod e devolve erros por campo no formato { campo: "mensagem" } (primeira mensagem de cada campo). */
export function zodResolverLite<S extends z.ZodType>(schema: S, input: unknown): { data: z.infer<S> | null; errors: Record<string, string> } {
  const r = schema.safeParse(input);
  if (r.success) return { data: r.data, errors: {} };
  const errors: Record<string, string> = {};
  for (const issue of r.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in errors)) errors[key] = issue.message;
  }
  return { data: null, errors };
}

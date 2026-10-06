import { supabase } from "@/lib/supabase";

export interface AcademicProfile {
  institution: string | null;
  course: string | null;
  semester_start: string | null;
  semester_end: string | null;
  monthly_income_goal: number | null;
}

const COLS = "institution,course,semester_start,semester_end,monthly_income_goal";

/** Dados acadêmicos ficam na tabela `profiles` (RLS: só o dono lê/edita a própria linha). */
export async function fetchAcademic(userId: string): Promise<AcademicProfile | null> {
  const { data, error } = await supabase.from("profiles").select(COLS).eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as AcademicProfile | null) ?? null;
}

export async function saveAcademic(userId: string, patch: AcademicProfile): Promise<void> {
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw new Error(error.message);
}

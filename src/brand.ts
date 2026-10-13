/** Identidade do app em um lugar só. Chaves de armazenamento ("gastos:*") e o caminho "/Gastos/" ficam como estão de propósito: mudar quebraria URLs e dados salvos. */
export const BRAND = {
  name: "Prumo",
  tagline: "Suas finanças no prumo.",
  description: "Prumo: controle de receitas e despesas para universitários, com ferramentas de gestão da qualidade (Pareto, Ishikawa).",
} as const;

/** Versão do aviso de privacidade aceito no cadastro. Mude ao alterar o texto de forma relevante. */
export const PRIVACY_VERSION = "2026-10";
/** Canal do controlador para pedidos de titulares (LGPD art. 18). Preencha com um e-mail de contato. */
export const PRIVACY_CONTACT = "";

/** Liga o botão "Excluir minha conta" e as frases do aviso de privacidade sobre ele.
 *  Só mude para true depois de aplicar supabase/migrations/0006_privacy_hardening.sql no banco. */
export const ACCOUNT_DELETION_ENABLED = false;

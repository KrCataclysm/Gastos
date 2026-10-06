# Gastos

Controle de gastos pensado para universitários: lança em 10 segundos, enxerga para onde o dinheiro vai e dispensa a planilha.

**Funciona como app (PWA)** no celular e no computador, com tema claro/escuro. Publicado em <https://krcataclysm.github.io/Gastos/>.

## O que tem

| Área | O que entrega |
|---|---|
| **Início** | Sobra do mês, receitas, despesas, saldo nas contas, quanto dá para gastar por dia, alertas em linguagem simples |
| **Lançamentos** | Despesas, receitas e transferências; busca, filtros, desfazer exclusão, exportar CSV |
| **Análises** | **Pareto** (poucos vitais, 80%), **Ishikawa** (causa e efeito dos gastos), evolução 6 meses, fixos × variáveis, **relatório** para imprimir/PDF |
| **Orçamento** | Limite por categoria e por mês, com progresso; copia do mês anterior |
| **Metas** | Notebook, intercâmbio, formatura: quanto guardar por mês para chegar a tempo |
| **Contas fixas** | Mensalidade, aluguel, assinaturas: o app avisa quando vencem e lança com um toque |
| **Perfil** | Instituição, curso, semestre, meta de renda, troca de senha, backup JSON |

## Stack

Vite 8 · React 19 · TypeScript estrito · React Router · TanStack Query · Zod · Supabase (Auth + Postgres com RLS). Gráficos em SVG próprio (sem biblioteca de charts). CSS com *design tokens*.

```
src/
  domain/    regras puras e testadas (resumo, Pareto, Ishikawa, saldos, recorrências, orçamento)
  data/      acesso ao Supabase (queries e mutations)
  lib/       dinheiro (centavos), datas locais, CSV seguro, validação
  components/ pages/ styles/
tests/       Vitest
supabase/    migrations aplicadas e SQL pendente de revisão
```

## Rodar

```bash
npm ci
cp .env.example .env.local   # já aponta para o projeto Supabase "gastos"
npm run dev                  # http://localhost:5173/Gastos/
npm run typecheck && npm test && npm run build
```

## Segurança

- **RLS em todas as tabelas**: cada linha só é visível/editável por quem tem `user_id = auth.uid()`.
- A chave no front é a **publishable/anon**, pública por desenho. Nunca use `service_role` no front.
- Valores monetários são somados em **centavos inteiros** (sem erro de ponto flutuante).
- Exportação CSV **neutraliza injeção de fórmula** (`=`, `+`, `-`, `@`).
- Sem `dangerouslySetInnerHTML`; **CSP** restrita; service worker nunca cacheia chamadas à API.
- Exclusões são lógicas (`deleted_at`) e há "Desfazer".
- Contas fixas usam *claim* condicional para não lançar em duplicidade (duas abas / duplo clique).

### Configuração manual no painel do Supabase

1. **Authentication › URL Configuration**: Site URL `https://krcataclysm.github.io/Gastos/` e adicione a mesma URL (e `http://localhost:5173/Gastos/`) em *Redirect URLs*. Sem isso, e-mail de confirmação e "esqueci a senha" não voltam para o app.
2. **Authentication › Providers › Email**: ative *Leaked password protection*.
3. Revise e aplique `supabase/pending/hardening_review_before_applying.sql` (menor privilégio, integridade entre tabelas, categorias de universitário para novos usuários).

## Deploy

Push na `main` roda typecheck, testes e build; depois publica `dist/` no GitHub Pages.

# Gastos

Controle de gastos pensado para universitários: lança em segundos, enxerga para onde o dinheiro vai e aplica **ferramentas de Gestão da Qualidade** (Pareto, Ishikawa) às próprias finanças, sem planilha.

App instalável (PWA) que **funciona offline** e sincroniza quando a internet volta. Publicado em <https://krcataclysm.github.io/Gastos/>.

## O que tem

| Área | O que entrega |
|---|---|
| **Início** | Patrimônio, receitas e despesas do mês, taxa de poupança, projeção de fim de mês |
| **Lançamentos** | Despesa, receita e transferência; contas, categorias, tags, contas fixas |
| **Orçamento / Metas** | Limite por categoria e mês; metas com prazo e quanto guardar por mês |
| **Relatórios** | DRE simplificado, evolução, distribuição, **Pareto 80/20** e **diagrama de Ishikawa**, exportação CSV e PDF |
| **Ferramentas** | Pareto manual, Gantt, fluxograma, checklist e quadro (apoio às aulas de qualidade) |
| **Perfil** | Avatar, apelido, dados acadêmicos (instituição, curso, semestre, meta de renda), senha, backup JSON |
| **Configurações** | 7 temas prontos + modo automático, **tema próprio** (cores, fonte, cantos), importar/exportar tema, **acessibilidade** (tamanho, espaçamento, bordas e foco reforçados, alvos maiores, menos animação) e checagem de contraste WCAG |

## Stack

Vite 5 · React 18 · TypeScript estrito · React Router · Supabase (Auth + Postgres com RLS) · IndexedDB (offline-first) · vite-plugin-pwa · Vitest.

```
src/
  lib/        regras puras (calc, analysis: Pareto/Ishikawa, contraste, csv), sync e acesso local
  contexts/   Auth, Data (offline-first + sync), Theme (temas e acessibilidade)
  pages/ components/ styles/
tests/        Vitest: analysis, contraste/temas, csv
supabase/     migrations (aplicadas) e SQL pendente de revisão
design/       fontes do logo e gerador de ícones do PWA
```

## Rodar

```bash
npm ci
cp .env.example .env.local   # URL e chave pública do projeto Supabase
npm run dev                  # http://localhost:5173/Gastos/
npm run typecheck && npm test && npm run build
```

Para regerar os ícones do PWA a partir do logo: `node design/build-icons.mjs` (requer Playwright + Chromium).

## Segurança

- **RLS em todas as tabelas**: cada linha só é visível/editável por quem tem `user_id = auth.uid()`.
- A chave no front-end é a **anon/publishable**, pública por desenho. Nunca use `service_role` no cliente.
- Exportação CSV **neutraliza injeção de fórmula** (`=`, `+`, `-`, `@`) nos textos.
- Chamadas à API nunca são cacheadas pelo service worker (`NetworkOnly`).
- Exclusões são lógicas (`deleted_at`) e sincronizadas.

### Configuração manual no painel do Supabase

1. **Authentication › URL Configuration**: Site URL `https://krcataclysm.github.io/Gastos/` e a mesma URL (e `http://localhost:5173/Gastos/`) em *Redirect URLs*. Sem isso, e-mail de confirmação e "esqueci a senha" não voltam para o app.
2. **Authentication › Providers › Email**: ative *Leaked password protection*. Para uso por uma turma, configure um SMTP próprio (o remetente padrão tem limite baixo de e-mails por hora).
3. Revise e aplique `supabase/pending/hardening_review_before_applying.sql` (menor privilégio, integridade entre tabelas, categorias de universitário para novos usuários).

## Deploy

Push na `main` roda typecheck, testes e build; depois publica `dist/` no GitHub Pages.

import { Check, Copy, RotateCcw, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { SwitchRow } from "../components/Switch";
import { useToast } from "../components/Toast";
import { CardTitle } from "../components/ui";
import { checkContrast } from "../theme/engine";
import { normalizeHex } from "../theme/colors";
import { FONTS, sanitizePalette, type FontKey } from "../theme/prefs";
import { PRESETS, type Palette } from "../theme/presets";
import { resolvePalette } from "../theme/engine";
import { useTheme } from "../theme/ThemeProvider";

type Tab = "aparencia" | "acessibilidade" | "sobre";
const TABS: [Tab, string][] = [["aparencia", "Aparência"], ["acessibilidade", "Acessibilidade"], ["sobre", "Sobre"]];
const SCALES = [0.9, 1, 1.15, 1.3, 1.5];
const COLOR_FIELDS: { key: keyof Omit<Palette, "mode">; label: string }[] = [
  { key: "bg", label: "Fundo" }, { key: "surface", label: "Painéis" }, { key: "surface2", label: "Painéis secundários" }, { key: "text", label: "Texto" }, { key: "muted", label: "Texto secundário" },
  { key: "border", label: "Bordas" }, { key: "accent", label: "Cor de destaque" }, { key: "income", label: "Receitas" }, { key: "expense", label: "Despesas" },
];

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const [text, setText] = useState(value);
  const [prev, setPrev] = useState(value);
  if (prev !== value) { setPrev(value); setText(value); }
  const bad = normalizeHex(text) === null;
  return (
    <div className="field">
      <label>{label}</label>
      <div className="color-row">
        <input type="color" aria-label={`${label}: seletor de cor`} value={value} onChange={(e) => onChange(e.target.value)} />
        <input className="input num" aria-label={`${label}: código hexadecimal`} aria-invalid={bad} value={text} maxLength={7} spellCheck={false} onChange={(e) => { setText(e.target.value); const h = normalizeHex(e.target.value); if (h) onChange(h); }} />
      </div>
    </div>
  );
}

function Appearance() {
  const { prefs, update, reset } = useTheme();
  const toast = useToast();
  const [json, setJson] = useState("");
  const effective = resolvePalette(prefs, matchMedia("(prefers-color-scheme: dark)").matches);
  const custom = prefs.themeId === "custom";
  const checks = checkContrast(effective);
  const failing = checks.filter((c) => !c.ok);

  const setColor = (k: keyof Omit<Palette, "mode">, hex: string) => update((p) => ({ ...p, themeId: "custom", custom: { ...p.custom, [k]: hex } }));
  const startCustom = (from: Palette) => update((p) => ({ ...p, themeId: "custom", custom: from }));

  return (
    <div className="stack">
      <section className="card stack">
        <CardTitle title="Tema" hint="Aplica na hora, só neste aparelho" />
        <div className="preset-grid" role="group" aria-label="Temas prontos">
          <button type="button" className="preset" aria-pressed={prefs.themeId === "auto"} onClick={() => update({ themeId: "auto" })}>
            <span className="sw"><i style={{ background: PRESETS[0]!.palette.surface }} /><i style={{ background: PRESETS[1]!.palette.surface }} /></span>
            <strong>Automático</strong><span className="d">Segue o claro/escuro do aparelho</span>
          </button>
          {PRESETS.map((t) => (
            <button key={t.id} type="button" className="preset" aria-pressed={prefs.themeId === t.id} onClick={() => update({ themeId: t.id })}>
              <span className="sw"><i style={{ background: t.palette.bg }} /><i style={{ background: t.palette.surface }} /><i style={{ background: t.palette.accent }} /><i style={{ background: t.palette.expense }} /></span>
              <strong>{t.name}</strong><span className="d">{t.description}</span>
            </button>
          ))}
          <button type="button" className="preset" aria-pressed={custom} onClick={() => startCustom(effective)}>
            <span className="sw"><i style={{ background: prefs.custom.bg }} /><i style={{ background: prefs.custom.surface }} /><i style={{ background: prefs.custom.accent }} /><i style={{ background: prefs.custom.expense }} /></span>
            <strong>Personalizado</strong><span className="d">Crie o seu, cor por cor</span>
          </button>
        </div>
      </section>

      {custom && (
        <section className="card stack">
          <CardTitle title="Seu tema" hint="Edite e veja o app mudar ao vivo" />
          <div className="form-grid two">
            <div className="field"><span className="lbl">Base</span>
              <div className="seg" role="group" aria-label="Base clara ou escura">
                <button type="button" aria-pressed={prefs.custom.mode === "light"} onClick={() => update((p) => ({ ...p, custom: { ...p.custom, mode: "light" } }))}>Clara</button>
                <button type="button" aria-pressed={prefs.custom.mode === "dark"} onClick={() => update((p) => ({ ...p, custom: { ...p.custom, mode: "dark" } }))}>Escura</button>
              </div></div>
            <div className="field"><label htmlFor="from">Começar de outro tema</label>
              <select id="from" className="input" value="" onChange={(e) => { const t = PRESETS.find((x) => x.id === e.target.value); if (t) startCustom(t.palette); }}>
                <option value="">Escolher…</option>{PRESETS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select></div>
          </div>
          <div className="form-grid two">{COLOR_FIELDS.map((f) => <ColorInput key={f.key} label={f.label} value={prefs.custom[f.key]} onChange={(h) => setColor(f.key, h)} />)}</div>

          <div className="field"><label htmlFor="exp">Compartilhar ou guardar este tema</label>
            <div className="row wrap">
              <button type="button" className="btn sm" onClick={() => { void navigator.clipboard?.writeText(JSON.stringify(prefs.custom)).then(() => toast.show("Tema copiado.")).catch(() => toast.show("Não foi possível copiar.", { kind: "error" })); }}><Copy aria-hidden />Copiar tema</button>
            </div>
            <textarea id="exp" className="input" placeholder='Cole aqui um tema copiado ({"mode":"dark","bg":"#..."}) e toque em Importar' value={json} onChange={(e) => setJson(e.target.value)} />
            <div><button type="button" className="btn sm" disabled={!json.trim()} onClick={() => { try { startCustom(sanitizePalette(JSON.parse(json), prefs.custom)); setJson(""); toast.show("Tema importado."); } catch { toast.show("Tema inválido.", { kind: "error" }); } }}>Importar</button></div>
          </div>
        </section>
      )}

      <section className="card stack">
        <CardTitle title="Legibilidade do tema atual" hint="Critérios WCAG AA" />
        {failing.length > 0 && <div className="banner warn"><TriangleAlert aria-hidden /><div>{failing.length === 1 ? "Um par de cores tem contraste baixo" : `${failing.length} pares de cores têm contraste baixo`}. Isso dificulta a leitura para muita gente.</div></div>}
        <ul className="check-list">{checks.map((c) => <li key={c.label}><span>{c.label}</span><span className={c.ok ? "ok" : "bad"}>{c.ok ? <Check size={14} aria-hidden style={{ verticalAlign: "-2px" }} /> : <TriangleAlert size={14} aria-hidden style={{ verticalAlign: "-2px" }} />} {c.ratio.toFixed(1)}:1 {c.ok ? "" : `(mín. ${c.required}:1)`}</span></li>)}</ul>
      </section>

      <section className="card stack">
        <CardTitle title="Fonte e cantos" />
        <div className="form-grid two">
          <div className="field"><label htmlFor="font">Fonte</label>
            <select id="font" className="input" value={prefs.font} onChange={(e) => update({ font: e.target.value as FontKey })} style={{ fontFamily: FONTS.find((f) => f.key === prefs.font)?.stack }}>
              {FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}{f.note ? ` — ${f.note}` : ""}</option>)}
            </select></div>
          <div className="field"><label htmlFor="rad">Arredondamento dos cantos: {prefs.radius}px</label>
            <input id="rad" type="range" className="range" min={0} max={24} step={1} value={prefs.radius} onChange={(e) => update({ radius: Number(e.target.value) })} /></div>
        </div>
        <p style={{ fontFamily: FONTS.find((f) => f.key === prefs.font)?.stack }}>Pré-visualização: R$ 1.234,56 — Quem gasta com consciência, sobra no fim do mês.</p>
        <div><button type="button" className="btn" onClick={() => { if (confirm("Voltar tema, fonte e acessibilidade ao padrão?")) { reset(); toast.show("Preferências restauradas."); } }}><RotateCcw aria-hidden />Restaurar padrão</button></div>
      </section>
    </div>
  );
}

function Accessibility() {
  const { prefs, update } = useTheme();
  const a = prefs.a11y;
  const set = (patch: Partial<typeof a>) => update((p) => ({ ...p, a11y: { ...p.a11y, ...patch } }));
  const idx = Math.max(0, SCALES.findIndex((s) => s >= a.textScale));
  return (
    <div className="stack">
      <section className="card stack">
        <CardTitle title="Texto" />
        <div className="field"><label htmlFor="scale">Tamanho do texto: {Math.round(a.textScale * 100)}%</label>
          <input id="scale" type="range" className="range" min={0} max={SCALES.length - 1} step={1} value={idx} aria-valuetext={`${Math.round(a.textScale * 100)}%`} onChange={(e) => set({ textScale: SCALES[Number(e.target.value)] ?? 1 })} /></div>
        <SwitchRow title="Fonte de alta legibilidade" description="Atkinson Hyperlegible, desenhada para distinguir bem letras parecidas." checked={prefs.font === "atkinson"} onChange={(v) => update({ font: v ? "atkinson" : "inter" })} />
        <SwitchRow title="Espaçamento de texto ampliado" description="Mais espaço entre linhas, letras e palavras." checked={a.wideSpacing} onChange={(v) => set({ wideSpacing: v })} />
      </section>
      <section className="card stack">
        <CardTitle title="Interface" />
        <SwitchRow title="Alto contraste" description="Aplica o tema de alto contraste (você pode trocar de tema depois)." checked={prefs.themeId.startsWith("contraste")} onChange={(v) => update({ themeId: v ? (document.documentElement.dataset.theme === "dark" ? "contraste-escuro" : "contraste-claro") : "auto" })} />
        <SwitchRow title="Bordas reforçadas" description="Bordas mais escuras para separar melhor painéis e campos." checked={a.strongBorders} onChange={(v) => set({ strongBorders: v })} />
        <SwitchRow title="Foco reforçado" description="Contorno grosso no item selecionado ao navegar pelo teclado." checked={a.strongFocus} onChange={(v) => set({ strongFocus: v })} />
        <SwitchRow title="Botões e campos maiores" description="Áreas de toque de 52 px, mais fáceis de acertar." checked={a.bigTargets} onChange={(v) => set({ bigTargets: v })} />
        <SwitchRow title="Reduzir animações" description="Remove transições. Também é ativado sozinho se o seu aparelho pedir menos movimento." checked={a.reduceMotion} onChange={(v) => set({ reduceMotion: v })} />
      </section>
      <section className="card"><CardTitle title="O que já é padrão no app" />
        <ul style={{ margin: 0, paddingLeft: 18 }} className="muted">
          <li>Navegação completa por teclado e link “Pular para o conteúdo”.</li>
          <li>Compatível com leitores de tela: gráficos têm descrição e tabela de dados.</li>
          <li>Valores nunca dependem só de cor: sempre trazem sinal (+/−) e texto.</li>
          <li>Todos os temas prontos atendem contraste WCAG AA.</li>
        </ul>
      </section>
    </div>
  );
}

function About() {
  return (
    <div className="stack">
      <section className="card stack">
        <CardTitle title="Sobre" />
        <p>Controle de gastos para universitários, com ferramentas de Gestão da Qualidade (Pareto, Ishikawa) aplicadas às suas finanças.</p>
        <p className="muted">Versão 1.0 · Seus dados ficam na sua conta, protegidos por regras de acesso no banco: só você enxerga o que registrou. Tema e acessibilidade ficam salvos neste aparelho.</p>
      </section>
    </div>
  );
}

export function Settings() {
  const [tab, setTab] = useState<Tab>("aparencia");
  return (
    <div className="stack">
      <div className="page-head"><div><h1>Configurações</h1><p className="sub">Deixe o app do seu jeito</p></div></div>
      <div className="tabs" role="tablist" aria-label="Seções">{TABS.map(([k, l]) => <button key={k} role="tab" className="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === "aparencia" && <Appearance />}
      {tab === "acessibilidade" && <Accessibility />}
      {tab === "sobre" && <About />}
    </div>
  );
}

import { useState } from "react";
import { Check, Copy, Pipette, RotateCcw, TriangleAlert } from "lucide-react";
import { ACCENT_PRESETS, FONT_OPTIONS, PRESETS, toPalette, useTheme } from "@/contexts/ThemeContext";
import { ColorInput } from "@/components/ui/ColorInput";
import { SwitchRow } from "@/components/ui/SwitchRow";
import { useToast } from "@/components/ui/Toast";
import { checkContrast } from "@/lib/themeChecks";

type Tab = "aparencia" | "acessibilidade" | "sobre";
const TABS: [Tab, string][] = [["aparencia", "Aparência"], ["acessibilidade", "Acessibilidade"], ["sobre", "Sobre"]];
const SCALES = [0.9, 1, 1.15, 1.3];
const H = { fontSize: 15, fontWeight: 700 } as const;

function Appearance() {
  const { theme, setAccentColor, setFontFamily, setRadius, setBgColor, setPanelColor, setColor, applyPreset, setFollowSystem, importTheme, resetAll } = useTheme();
  const toast = useToast();
  const [json, setJson] = useState("");
  const checks = checkContrast(toPalette(theme));
  const failing = checks.filter((c) => !c.ok);
  const isCustom = !theme.followSystem && theme.presetId === "custom";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card">
        <h3 style={{ ...H, marginBottom: 4 }}>Tema</h3>
        <p className="text-muted" style={{ fontSize: 12.5, marginBottom: 12 }}>Aplica na hora. Fica salvo neste aparelho.</p>
        <div className="preset-grid" role="group" aria-label="Temas prontos">
          <button type="button" className="preset" aria-pressed={theme.followSystem} onClick={setFollowSystem}>
            <span className="sw"><i style={{ background: PRESETS[1]!.palette.panel }} /><i style={{ background: PRESETS[0]!.palette.panel }} /></span>
            <strong>Automático</strong><span className="d">Segue o claro/escuro do aparelho</span>
          </button>
          {PRESETS.map((t) => (
            <button key={t.id} type="button" className="preset" aria-pressed={!theme.followSystem && theme.presetId === t.id} onClick={() => applyPreset(t.id)}>
              <span className="sw"><i style={{ background: t.palette.bg }} /><i style={{ background: t.palette.panel }} /><i style={{ background: t.palette.accent }} /><i style={{ background: t.palette.expense }} /></span>
              <strong>{t.name}</strong><span className="d">{t.description}</span>
            </button>
          ))}
          <div className="preset" aria-label="Personalizado" style={{ borderColor: isCustom ? "var(--color-accent)" : undefined, boxShadow: isCustom ? "0 0 0 3px var(--color-accent-soft)" : undefined }}>
            <span className="sw"><i style={{ background: theme.bgColor }} /><i style={{ background: theme.panelColor }} /><i style={{ background: theme.accentColor }} /><i style={{ background: theme.expenseColor }} /></span>
            <strong>Personalizado{isCustom ? " ✓" : ""}</strong><span className="d">Edite as cores abaixo</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ ...H, marginBottom: 12 }}>Cor de destaque</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {ACCENT_PRESETS.map((c) => (
            <button key={c} onClick={() => setAccentColor(c)} aria-pressed={theme.accentColor === c}
              style={{ width: 34, height: 34, borderRadius: "50%", background: c, border: theme.accentColor === c ? "3px solid var(--color-text)" : "2px solid transparent", cursor: "pointer" }} aria-label={`Cor ${c}`} />
          ))}
          <label className="color-picker" title="Escolher outra cor" aria-label="Cor de destaque personalizada">
            <input type="color" value={theme.accentColor} onChange={(e) => setAccentColor(e.target.value)} />
            <Pipette size={14} className="color-picker__icon" />
          </label>
        </div>
      </div>

      <details className="card">
        <summary style={{ ...H, cursor: "pointer" }}>Cores avançadas (crie o seu tema)</summary>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 14 }}>
          <ColorInput label="Fundo" value={theme.bgColor} onChange={setBgColor} />
          <ColorInput label="Painéis" value={theme.panelColor} onChange={setPanelColor} />
          <ColorInput label="Painéis secundários" value={theme.panelAltColor} onChange={(h) => setColor("panelAltColor", h)} />
          <ColorInput label="Texto" value={theme.fontColor} onChange={(h) => setColor("fontColor", h)} />
          <ColorInput label="Texto secundário" value={theme.mutedColor} onChange={(h) => setColor("mutedColor", h)} />
          <ColorInput label="Bordas" value={theme.borderColor} onChange={(h) => setColor("borderColor", h)} />
          <ColorInput label="Receitas" value={theme.incomeColor} onChange={(h) => setColor("incomeColor", h)} />
          <ColorInput label="Despesas" value={theme.expenseColor} onChange={(h) => setColor("expenseColor", h)} />
        </div>

        <div className="field" style={{ marginTop: 18 }}>
          <label htmlFor="theme-json">Compartilhar ou guardar este tema</label>
          <div><button type="button" className="btn btn--secondary btn--sm" onClick={() => { void navigator.clipboard?.writeText(JSON.stringify({ ...toPalette(theme) })).then(() => toast.show("Tema copiado.", "success")).catch(() => toast.show("Não foi possível copiar.", "error")); }}><Copy size={14} /> Copiar tema</button></div>
          <textarea id="theme-json" className="textarea" placeholder='Cole aqui um tema copiado e toque em Importar' value={json} onChange={(e) => setJson(e.target.value)} />
          <div>
            <button type="button" className="btn btn--secondary btn--sm" disabled={!json.trim()} onClick={() => {
              try {
                const p = JSON.parse(json) as Record<string, string>;
                importTheme({ mode: p.mode, bgColor: p.bg, panelColor: p.panel, panelAltColor: p.panelAlt, fontColor: p.text, mutedColor: p.muted, borderColor: p.border, accentColor: p.accent, incomeColor: p.income, expenseColor: p.expense });
                setJson("");
                toast.show("Tema importado.", "success");
              } catch { toast.show("Tema inválido.", "error"); }
            }}>Importar</button>
          </div>
        </div>
      </details>

      <div className="card">
        <h3 style={{ ...H, marginBottom: 4 }}>Legibilidade do tema atual</h3>
        <p className="text-muted" style={{ fontSize: 12.5, marginBottom: 10 }}>Critérios WCAG AA (contraste de cores).</p>
        {failing.length > 0 && (
          <div className="callout" style={{ background: "var(--color-warning-soft)", marginBottom: 10 }}>
            <TriangleAlert size={16} aria-hidden style={{ flex: "none", marginTop: 2 }} />
            <div>{failing.length === 1 ? "Um par de cores tem contraste baixo" : `${failing.length} pares de cores têm contraste baixo`}. Isso dificulta a leitura para muita gente.</div>
          </div>
        )}
        <ul className="check-list">
          {checks.map((c) => (
            <li key={c.label}>
              <span>{c.label}</span>
              <span className={`mono ${c.ok ? "ok" : "bad"}`}>{c.ok ? <Check size={13} aria-hidden /> : <TriangleAlert size={13} aria-hidden />} {c.ratio.toFixed(1)}:1{c.ok ? "" : ` (mín. ${c.required}:1)`}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3 style={{ ...H, marginBottom: 12 }}>Fonte e cantos</h3>
        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="font">Fonte</label>
          <select id="font" className="select" value={theme.fontFamily} onChange={(e) => setFontFamily(e.target.value as typeof theme.fontFamily)}>
            {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="radius">Arredondamento das bordas ({theme.radius}px)</label>
          <input id="radius" className="range" type="range" min={4} max={28} value={theme.radius} onChange={(e) => setRadius(Number(e.target.value))} />
        </div>
      </div>

      <button type="button" className="btn btn--secondary btn--block" onClick={() => { if (confirm("Voltar tema, fonte e acessibilidade ao padrão?")) { resetAll(); toast.show("Preferências restauradas.", "success"); } }}>
        <RotateCcw size={16} /> Restaurar padrão
      </button>
    </div>
  );
}

function Accessibility() {
  const { theme, setA11y, setFontFamily, applyPreset } = useTheme();
  const a = theme.a11y;
  const highContrast = theme.presetId.startsWith("contraste");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card">
        <h3 style={{ ...H, marginBottom: 12 }}>Tamanho da interface</h3>
        <div className="chips" role="group" aria-label="Tamanho da interface" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SCALES.map((s) => (
            <button key={s} type="button" className={`chip${a.uiScale === s ? " chip--active" : ""}`} aria-pressed={a.uiScale === s} onClick={() => setA11y({ uiScale: s })}>{Math.round(s * 100)}%</button>
          ))}
        </div>
        <p className="text-muted" style={{ fontSize: 12.5, marginTop: 8 }}>Amplia textos e botões. Útil no app instalado, onde não há zoom do navegador.</p>
        <SwitchRow title="Espaçamento de texto ampliado" description="Mais espaço entre linhas, letras e palavras." checked={a.wideSpacing} onChange={(v) => setA11y({ wideSpacing: v })} />
        <SwitchRow title="Fonte de alta legibilidade" description="Atkinson Hyperlegible, desenhada para distinguir bem letras parecidas." checked={theme.fontFamily === "atkinson-hyperlegible"} onChange={(v) => setFontFamily(v ? "atkinson-hyperlegible" : "inter")} />
      </div>

      <div className="card">
        <h3 style={{ ...H, marginBottom: 4 }}>Interface</h3>
        <SwitchRow title="Alto contraste" description="Aplica o tema de alto contraste. Você pode trocar de tema depois." checked={highContrast} onChange={(v) => applyPreset(v ? (theme.mode === "dark" ? "contraste-escuro" : "contraste-claro") : theme.mode === "dark" ? "escuro" : "claro")} />
        <SwitchRow title="Bordas reforçadas" description="Bordas mais escuras para separar melhor painéis e campos." checked={a.strongBorders} onChange={(v) => setA11y({ strongBorders: v })} />
        <SwitchRow title="Foco reforçado" description="Contorno grosso no item selecionado ao navegar pelo teclado." checked={a.strongFocus} onChange={(v) => setA11y({ strongFocus: v })} />
        <SwitchRow title="Botões e campos maiores" description="Áreas de toque de 52 px, mais fáceis de acertar." checked={a.bigTargets} onChange={(v) => setA11y({ bigTargets: v })} />
        <SwitchRow title="Reduzir animações" description="Remove transições. Também é ativado sozinho se o seu aparelho pedir menos movimento." checked={a.reduceMotion} onChange={(v) => setA11y({ reduceMotion: v })} />
      </div>

      <div className="card">
        <h3 style={{ ...H, marginBottom: 8 }}>O que já é padrão no app</h3>
        <ul className="text-muted" style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
          <li>Navegação por teclado e link “Pular para o conteúdo”.</li>
          <li>Gráficos com descrição para leitor de tela e tabela de dados.</li>
          <li>Valores nunca dependem só de cor: sempre trazem sinal e texto.</li>
          <li>Todos os temas prontos atendem contraste WCAG AA.</li>
        </ul>
      </div>
    </div>
  );
}

function About() {
  return (
    <div className="card">
      <h3 style={{ ...H, marginBottom: 8 }}>Sobre</h3>
      <p style={{ fontSize: 14, lineHeight: 1.6 }}>Controle de gastos para universitários, com ferramentas de Gestão da Qualidade (Pareto, Ishikawa) aplicadas às suas finanças.</p>
      <p className="text-muted" style={{ fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>Seus dados ficam na sua conta, protegidos por regras de acesso no banco: só você enxerga o que registrou. O app funciona offline e sincroniza quando a internet volta. Tema e acessibilidade ficam salvos neste aparelho.</p>
    </div>
  );
}

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>("aparencia");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="topbar"><div className="topbar__title">Configurações</div></div>
      <div role="tablist" aria-label="Seções" style={{ display: "flex", gap: 8, overflowX: "auto" }}>
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" className={`chip${tab === k ? " chip--active" : ""}`} aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === "aparencia" && <Appearance />}
      {tab === "acessibilidade" && <Accessibility />}
      {tab === "sobre" && <About />}
    </div>
  );
}
